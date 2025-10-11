import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '../config/socket';
import { StorageService } from './storage.service';
// rootStore is injected to avoid require cycles

type Handler = (...args: any[]) => void;

type QueuedSubmit = { matchId: string; questionIndex: number; answerIndex: number };

const QUEUE_KEY = 'cw_offline_queue_v1';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 30s
  private flushInProgress = false;
  private nextReconnectAt: number | null = null;
  private guestId: string | null = null;
  // buffered event handlers so .on() works before socket exists
  private handlers: Map<string, Set<Handler>> = new Map();
  private rootStoreRef: any = null;

  constructor() {
    // nothing for now
  }

  setRootStore(root: any) {
    this.rootStoreRef = root;
  }

  private async ensureGuestId(): Promise<string> {
    if (this.guestId) return this.guestId;
    const KEY = 'cw_guest_id_v1';
    let id = await StorageService.getRawItem(KEY);
    if (!id) {
      id = `g_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      await StorageService.setRawItem(KEY, id);
    }
    this.guestId = id;
    return id;
  }

  private async createSocket(): Promise<Socket> {
    const token = await StorageService.getAccessToken();
    const guestId = await this.ensureGuestId();
    // debug: surface resolved URL and whether we have a token
    try {
      console.debug('[socket] createSocket', { url: SOCKET_CONFIG.URL, hasToken: !!token, guestId });
    } catch (e) {}
    const s = io(SOCKET_CONFIG.URL, {
      ...SOCKET_CONFIG.OPTIONS,
      auth: { token, guestId },
      autoConnect: false,
      transports: ['websocket'],
    });
    // Refresh token on each connect attempt
    (s as any).io.on('reconnect_attempt', async () => {
      try {
        const t = await StorageService.getAccessToken();
        const gid = await this.ensureGuestId();
        (s as any).auth = { token: t, guestId: gid };
      } catch {}
    });
    return s;
  }

  async connect() {
    // avoid multiple parallel connects
    if (this.socket && this.socket.connected) return;

    if (!this.socket) this.socket = await this.createSocket();

    try {
      console.debug('[socket] connect called', { url: SOCKET_CONFIG.URL, hasSocket: !!this.socket });
    } catch (e) {}

    // wire core events
    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('disconnect', this.onDisconnect.bind(this));
    this.socket.on('connect_error', this.onConnectError.bind(this));
    // handle server-emitted logical errors (not transport-level)
    this.socket.on('error', (payload: any) => {
      try {
        const msg = (payload && payload.message) || 'Socket error';
        console.warn('[socket] server error event', payload);
        this.rootStoreRef?.matchStore?.debugPushEvent?.('serverError', payload);
        // Don't show toast for freeze errors - they're handled by UI freeze state
        if (msg !== 'You are frozen') {
          this.rootStoreRef?.uiStore?.showToast?.(msg, 'error');
        }
      } catch (e) {
        // ignore
      }
    });

    // attach any buffered handlers
    for (const [event, set] of this.handlers.entries()) {
      for (const h of set) {
        this.socket.on(event, h);
      }
    }

    // debug: log any incoming events
    try {
      // socket.io-client v4 supports onAny
      (this.socket as any).onAny((event: string, ...args: any[]) => {
        try {
          console.debug('[socket] recv', event, args);
          // also surface in overlay for quick diagnosis (only first arg to reduce noise)
          const first = args && args.length ? args[0] : undefined;
          this.rootStoreRef?.matchStore?.debugPushEvent?.(`evt:${event}`, first);
        } catch (e) {}
      });
    } catch (e) {}

    // start connecting
    this.socket.connect();
  this.rootStoreRef?.uiStore?.setConnectionStatus('connecting');
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.rootStoreRef?.uiStore?.setConnectionStatus?.('disconnected');
  }

  on(event: string, handler: Handler) {
    // buffer handler so it's attached when socket is created
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    // attach immediately if socket exists
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: Handler) {
    if (handler) {
      const set = this.handlers.get(event);
      set?.delete(handler);
      this.socket?.off(event, handler);
      if (set && set.size === 0) this.handlers.delete(event);
    } else {
      this.handlers.delete(event);
      this.socket?.off(event);
    }
  }

  private async onConnect() {
    try { console.debug('[socket] onConnect', { id: this.socket?.id }); } catch (e) {}
    this.reconnectAttempts = 0;
    this.rootStoreRef?.uiStore?.setConnectionStatus('connected');
    const shouldHydrateProfile = !!this.rootStoreRef?.authStore?.isAuthenticated;
    if (shouldHydrateProfile) {
      try {
        await this.rootStoreRef?.userStore?.fetchUserProfile?.();
        if (this.rootStoreRef?.userStore?.user && this.rootStoreRef.userStore.user.id) {
          this.rootStoreRef.matchStore.myPlayerId = this.rootStoreRef.userStore.user.id;
        }
      } catch (e) {
        console.warn('[socket] Failed to refresh profile on connect:', e);
      }
    }

    // flush offline queue
    this.flushQueue().catch((err) => console.error('flushQueue error', err));
  }

  private onDisconnect(reason: string) {
    try { console.warn('[socket] onDisconnect', reason); } catch (e) {}
    this.rootStoreRef?.uiStore?.setConnectionStatus('reconnecting');
    // schedule reconnect with backoff
    this.scheduleReconnect();
  }

  private onConnectError(err: any) {
    console.warn('socket connect_error', err);
    this.rootStoreRef?.uiStore?.setConnectionStatus('reconnecting');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.nextReconnectAt = Date.now() + delay;
    try { console.debug('[socket] scheduleReconnect', { attempts: this.reconnectAttempts, delay }); } catch (e) {}
    setTimeout(() => {
      if (!this.socket) this.createSocket().then((s) => (this.socket = s));
      try {
        this.socket?.connect();
      } catch (e) {
        console.warn('reconnect failed', e);
        this.scheduleReconnect();
      }
    }, delay);
  }

  // Persisted offline queue helpers
  private async readQueue(): Promise<QueuedSubmit[]> {
    try {
      const raw = await StorageService.getRawItem(QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as QueuedSubmit[];
    } catch (e) {
      return [];
    }
  }

  private async writeQueue(queue: QueuedSubmit[]) {
    try {
      await StorageService.setRawItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('writeQueue error', e);
    }
  }

  // Public helper to expose queued count for UI
  async getQueuedCount(): Promise<number> {
    try {
      const queue = await this.readQueue();
      return queue.length;
    } catch (e) {
      return 0;
    }
  }

  // return full queued items
  async getQueuedItems(): Promise<QueuedSubmit[]> {
    try {
      return await this.readQueue();
    } catch (e) {
      return [];
    }
  }

  async removeQueuedItem(index: number): Promise<void> {
    try {
      const q = await this.readQueue();
      if (index >= 0 && index < q.length) {
        q.splice(index, 1);
        await this.writeQueue(q);
      }
    } catch (e) {
      console.warn('removeQueuedItem error', e);
    }
  }

  // Insert item at specific index in the persisted queue (used for undo)
  async insertQueuedItem(item: QueuedSubmit, index: number): Promise<void> {
    try {
      const q = await this.readQueue();
      const idx = Math.min(Math.max(0, index), q.length);
      q.splice(idx, 0, item);
      await this.writeQueue(q);
    } catch (e) {
      console.warn('insertQueuedItem error', e);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await this.writeQueue([]);
    } catch (e) {
      console.warn('clearQueue error', e);
    }
  }

  getNextReconnectInMs(): number | null {
    if (!this.nextReconnectAt) return null;
    return Math.max(0, this.nextReconnectAt - Date.now());
  }

  async submitAnswer(matchId: string, questionIndex: number, answerIndex: number) {
    const payload: QueuedSubmit = { matchId, questionIndex, answerIndex };
    if (!this.socket || !this.socket.connected) {
      // queue it
      const queue = await this.readQueue();
      queue.push(payload);
      await this.writeQueue(queue);
      this.rootStoreRef?.matchStore?.debugPushEvent?.('queuedSubmit', payload);
      this.rootStoreRef?.uiStore?.showToast?.('You are offline — answer queued', 'info');
      return;
    }

    try {
      this.rootStoreRef?.matchStore?.debugPushEvent?.('submitAnswerEmit', payload);
    } catch {}
    this.socket.emit('submitAnswer', payload, (ack: any) => {
      try {
        // feed into matchStore debug overlay if available
        this.rootStoreRef?.matchStore?.debugPushEvent?.('submitAnswerAck', ack);
        
        if (!ack || ack.ok !== true) {
          const msg = (ack && ack.error) || 'Submit failed';
          
          // If server says we're frozen, sync client freeze state
          if (msg === 'You are frozen') {
            console.log('🚨 Server says frozen - requesting freeze state sync');
            this.rootStoreRef?.matchStore?.debugPushEvent?.('freezeRejection', { playerId: this.rootStoreRef?.authStore?.currentUser?.id });
            
            // Request freeze state sync from server
            this.rootStoreRef?.matchStore?.syncFreezeState?.();
          } else {
            this.rootStoreRef?.uiStore?.showToast?.(msg, 'error');
          }
        }
      } catch {}
    });
  }

  private async flushQueue() {
    if (this.flushInProgress) return;
    this.flushInProgress = true;
    try {
      const queue = await this.readQueue();
      if (!queue || queue.length === 0) return;
      for (const item of queue) {
        this.socket?.emit('submitAnswer', item);
        // small delay to avoid flooding
        await new Promise((r) => setTimeout(r, 100));
      }
      // clear queue
      await this.writeQueue([]);
  this.rootStoreRef?.uiStore?.showToast?.('Queued answers sent', 'success');
    } finally {
      this.flushInProgress = false;
    }
  }

  // Other helper emits
  findOpponent(subject?: string) {
    const payload = subject ? { subject } : {};
    this.socket?.emit('findOpponent', payload);
  }

  cancelSearch() {
    this.socket?.emit('cancelSearch');
  }

  leaveMatch() {
    this.socket?.emit('leaveMatch');
  }

  async sendPrivateInvite(username: string, subject?: string) {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected');
    }

    return new Promise<{ inviteId: string; targetUsername: string; subject?: string }>((resolve, reject) => {
      try {
        this.socket?.emit('invitePlayer', { username, subject }, (res: any) => {
          if (res && res.ok) {
            resolve({ inviteId: res.inviteId, targetUsername: res.targetUsername, subject: res.subject });
          } else {
            reject(new Error((res && res.error) || 'Failed to send invite'));
          }
        });
      } catch (err: any) {
        reject(err instanceof Error ? err : new Error('Failed to send invite'));
      }
    });
  }

  async respondToInvite(inviteId: string, accepted: boolean) {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected');
    }

    return new Promise<{ accepted: boolean }>((resolve, reject) => {
      try {
        this.socket?.emit('respondInvite', { inviteId, accepted }, (res: any) => {
          if (res && res.ok) {
            resolve({ accepted: !!res.accepted });
          } else {
            reject(new Error((res && res.error) || 'Failed to respond to invite'));
          }
        });
      } catch (err: any) {
        reject(err instanceof Error ? err : new Error('Failed to respond to invite'));
      }
    });
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();

