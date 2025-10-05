import { makeAutoObservable, runInAction } from 'mobx';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  actionLabel?: string;
  action?: (() => void) | null;
}

export class UIStore {
  isLoading = false;
  toasts: Toast[] = [];
  modalVisible = false;
  modalContent: any = null;
  // queued answers modal
  queuedModalVisible = false;

  showQueuedModal(): void {
    this.queuedModalVisible = true;
  }

  hideQueuedModal(): void {
    this.queuedModalVisible = false;
  }
  // connection status for socket: 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
  connectionStatus: 'connected' | 'connecting' | 'reconnecting' | 'disconnected' = 'disconnected';

  constructor() {
    makeAutoObservable(this);
  }

  showLoading(): void {
    this.isLoading = true;
  }

  hideLoading(): void {
    this.isLoading = false;
  }

  showToast(
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 3000,
    actionLabel?: string,
    action?: (() => void) | null,
  ): void {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration, actionLabel, action };
    
    this.toasts.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        runInAction(() => {
          this.toasts = this.toasts.filter((t) => t.id !== id);
        });
      }, duration);
    }
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  showModal(content: any): void {
    this.modalContent = content;
    this.modalVisible = true;
  }

  hideModal(): void {
    this.modalVisible = false;
    this.modalContent = null;
  }

  setConnectionStatus(status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected'): void {
    this.connectionStatus = status;
  }
}
