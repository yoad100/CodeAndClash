import { makeAutoObservable, runInAction } from 'mobx';
import { socketService } from '../services/socket.service';
import { Match, Question, AnswerResult, MatchResult, MatchPlayer } from '../types/match.types';
import { AnswerResultPayload, MatchEndedPayload, MatchFoundPayload, PlayerUnfrozenPayload, QuestionEndedPayload, QuestionStartedPayload } from '../types/socket.events';

export class MatchStore {
  rootStore: any; // Will be set after construction
  currentMatch: Match | null = null;
  isSearching = false;
  searchSubject: string | null = null;
  currentQuestionIndex = 0;
  timeRemaining = 30; // 30-second idle timer
  myPlayerId: string | null = null;
  // last answer result for UI animations
  lastAnswerResult: { playerId: string; correct: boolean; questionIndex?: number; answerIndex?: number; ts: number } | null = null;
  // Redis-based frozen state tracking
  frozen: Record<string, boolean> = {};
  // Track opponent's wrong answer choice for highlighting
  opponentWrongAnswer: number | null = null;
  // Combo streak for my consecutive correct answers
  myCombo: number = 0;
  // Debug: keep last few socket events
  debugLastEvents: Array<{ event: string; payload: any; ts: number }> = [];
  // Prevent duplicate taps per question index
  submittingForIndex: number | null = null;
  // Track answered questions to prevent multiple submissions per question
  answeredQuestions: Set<number> = new Set();
  // Track eliminated (wrong) choice indices per question (reactive via Set replacement)
  knownWrongChoices: Map<number, Set<number>> = new Map();
  // Track freeze countdown for UI display (playerId -> seconds remaining)
  freezeCountdowns: Map<string, number> = new Map();
  // Track original freeze duration for progress visuals
  freezeTotalDurations: Map<string, number> = new Map();
  // Flag to prevent double navigation on idle timeout
  private idleTimeoutTriggered = false;
  // Private match invites
  outgoingInvite: {
    inviteId: string;
    targetUsername: string;
    subject?: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'error';
    message?: string;
  } | null = null;
  incomingInvite: {
    inviteId: string;
    fromUsername: string;
    subject?: string;
  } | null = null;
  isSendingInvite = false;
  
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private freezeTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private freezeCountdownIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    makeAutoObservable(this);
    this.setupSocketListeners();
  }

  // Initialize myPlayerId when rootStore is available
  initializePlayerId(): void {
    if (this.rootStore?.authStore?.currentUser?.id) {
      this.myPlayerId = this.rootStore.authStore.currentUser.id;
    }
  }

  private setupSocketListeners(): void {
    socketService.on('matchFound', (p: MatchFoundPayload) => {
      this.debugPushEvent('matchFound', p);
      this.handleMatchFound(p);
    });
    socketService.on('questionStarted', (p: QuestionStartedPayload) => {
      this.debugPushEvent('questionStarted', p);
      if (!this.isPayloadForCurrentMatch(p)) return;
      this.handleQuestionStarted(p);
    });
    socketService.on('questionEnded', (p: QuestionEndedPayload) => {
      this.debugPushEvent('questionEnded', p);
      if (!this.isPayloadForCurrentMatch(p)) return;
      this.handleQuestionEnded(p);
    });
    socketService.on('answerResult', (p: AnswerResultPayload) => {
      this.debugPushEvent('answerResult', p);
      if (!this.isPayloadForCurrentMatch(p)) return;
      this.handleAnswerResult(p);
    });
    socketService.on('matchEnded', (p: MatchEndedPayload) => {
      this.debugPushEvent('matchEnded', p);
      // Some servers may not include matchId here; if present, gate it
      if (p && p.matchId && !this.isPayloadForCurrentMatch(p)) return;
      this.handleMatchEnded(p);
    });
    socketService.on('opponentLeft', (p: any) => {
      // If server ever includes matchId on opponentLeft, gate it
      if (p && p.matchId && !this.isPayloadForCurrentMatch(p)) return;
      this.handleOpponentLeft();
    });
    socketService.on('playerUnfrozen', (p: PlayerUnfrozenPayload) => {
      this.debugPushEvent('playerUnfrozen', p);
      if (!this.isPayloadForCurrentMatch(p)) return;
      this.handlePlayerUnfrozen(p);
    });
    
    socketService.on('freezeStateSync', (p: any) => {
      this.debugPushEvent('freezeStateSync', p);
      if (!this.isPayloadForCurrentMatch(p)) return;
      this.handleFreezeStateSync(p);
    });

    socketService.on('privateInvitePending', (p: any) => {
      this.debugPushEvent('privateInvitePending', p);
      this.handleInvitePending(p);
    });

    socketService.on('privateInviteReceived', (p: any) => {
      this.debugPushEvent('privateInviteReceived', p);
      this.handleInviteReceived(p);
    });

    socketService.on('privateInviteResult', (p: any) => {
      this.debugPushEvent('privateInviteResult', p);
      this.handleInviteResult(p);
    });

    socketService.on('privateInviteError', (p: any) => {
      this.debugPushEvent('privateInviteError', p);
      this.handleInviteError(p);
    });
  }

  // Ensure socket payloads are applied only to the current active match
  private isPayloadForCurrentMatch(p: any): boolean {
    const id = p && (p.matchId || p.matchID);
    if (!this.currentMatch) return false;
    if (!id) return true; // allow pre-existing events without matchId
    return String(id) === String(this.currentMatch.id);
  }

  startSearch(subject?: string): void {
    this.isSearching = true;
    this.searchSubject = subject || null;
    
    socketService.findOpponent(subject || undefined);
  }

  cancelSearch(): void {
    this.isSearching = false;
    this.searchSubject = null;
    socketService.cancelSearch();
  }

  async sendPrivateInvite(username: string, subject?: string): Promise<void> {
    const trimmed = (username || '').trim();
    if (!trimmed) {
      const error = new Error('Username is required');
      throw error;
    }

    this.isSendingInvite = true;
    try {
      const res = await socketService.sendPrivateInvite(trimmed, subject);
      runInAction(() => {
        this.isSendingInvite = false;
        this.outgoingInvite = {
          inviteId: res.inviteId,
          targetUsername: res.targetUsername,
          subject: res.subject,
          status: 'pending',
        };
      });
      this.rootStore?.uiStore?.showToast?.(`Invite sent to ${res.targetUsername}`, 'success');
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Failed to send invite';
      runInAction(() => {
        this.isSendingInvite = false;
      });
      this.rootStore?.uiStore?.showToast?.(message, 'error');
      throw err;
    }
  }

  async respondToInvite(accepted: boolean): Promise<void> {
    const invite = this.incomingInvite;
    if (!invite) return;

    try {
      const res = await socketService.respondToInvite(invite.inviteId, accepted);
      if (accepted && res.accepted) {
        this.rootStore?.uiStore?.showToast?.('Connecting you to the duel…', 'success');
        runInAction(() => {
          this.isSearching = true;
        });
        this.navigateToMatchLobbyWithRetry();
      } else if (!accepted) {
        this.rootStore?.uiStore?.showToast?.('Invite declined', 'info');
      }
      runInAction(() => {
        this.incomingInvite = null;
      });
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Failed to respond to invite';
      this.rootStore?.uiStore?.showToast?.(message, 'error');
      // Only clear invite if we successfully accepted; keep it for retries on decline failure
      if (accepted) {
        runInAction(() => {
          this.incomingInvite = null;
        });
      }
    }
  }

  private handleMatchFound(data: MatchFoundPayload): void {
    runInAction(() => {
      this.isSearching = false;
      // create a minimal currentMatch until questionStarted provides full data
      this.currentMatch = {
        id: data.matchId,
        players: [
          { id: data.player.id || '', username: data.player.username || 'You', score: 0, isFrozen: false },
          { id: data.opponent.id || '', username: data.opponent.username, score: 0, isFrozen: false },
        ],
        questions: [],
        status: 'pending',
      } as any;
      
      // Initialize empty frozen state
      this.frozen = {};
      // Capture my player id from the payload (works for guests too)
      if (data.player?.id) {
        this.myPlayerId = String(data.player.id);
      }

      this.incomingInvite = null;
      if (this.outgoingInvite) {
        this.outgoingInvite = { ...this.outgoingInvite, status: 'accepted' };
      }
      this.searchSubject = data.subject || null;
    });

    this.navigateToMatchLobbyWithRetry();
  }

  private handleQuestionStarted(payload: QuestionStartedPayload): void {
    // payload: { index, question: { id, text, choices } }
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('handleQuestionStarted:', payload);
    runInAction(() => {
      if (!this.currentMatch) {
        console.warn('handleQuestionStarted: no currentMatch');
        return;
      }
      
      // Ensure questions array exists and has enough space
      if (!this.currentMatch.questions) {
        this.currentMatch.questions = [];
      }
      
      // ensure questions array exists and push formatted question
      const q = payload.question;
      // convert to frontend Question shape
      const fq = { id: String(q.id), text: q.text, choices: q.choices, correctIndex: -1 };
      // ensure array length - make sure the array has enough slots
      while (this.currentMatch.questions.length <= payload.index) {
        this.currentMatch.questions.push(null as any);
      }
      this.currentMatch.questions[payload.index] = fq as any;
      this.currentMatch.status = 'active';
      this.currentQuestionIndex = payload.index;
      
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('Question set successfully:', {
          index: payload.index,
          questionText: q.text,
          questionsLength: this.currentMatch.questions.length,
          questionsArray: this.currentMatch.questions,
          currentQuestionIndex: this.currentQuestionIndex,
          questionAtCurrentIndex: this.currentMatch.questions[this.currentQuestionIndex],
          currentQuestion: this.currentQuestion
        });
        
        // Force a small delay to check if MobX reactivity catches up
        setTimeout(() => {
          console.log('currentQuestion after timeout:', this.currentQuestion);
        }, 100);
      }
      this.timeRemaining = 30; // Reset to 30 seconds (idle timer)
      
      // Reset frozen state for new question (everyone can answer initially)
      this.frozen = {};
      // Clear all existing freeze timers and countdowns
      this.freezeTimeouts.forEach(timeout => clearTimeout(timeout));
      this.freezeTimeouts.clear();
  this.freezeCountdownIntervals.forEach(interval => clearInterval(interval));
  this.freezeCountdownIntervals.clear();
    this.freezeCountdowns.clear();
    this.freezeTotalDurations.clear();
    // Reset eliminated choices for this question
  this.knownWrongChoices.set(payload.index, new Set());
      // Reset per-question submit throttling and transient UI flags
      this.submittingForIndex = null;
      this.answeredQuestions.clear(); // Allow answering new question
      this.lastAnswerResult = null;
      this.opponentWrongAnswer = null;
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('Question started - reset frozen state:', this.frozen);
      
      this.startTimer();
    });
  }

  private handleAnswerResult(payload: AnswerResultPayload): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🎯 ANSWER RESULT:', payload);
    if (!this.currentMatch) return;
    const playerId = String(payload.playerId);
    
    runInAction(() => {
      if (payload.correct) {
        this.answeredQuestions.add(payload.questionIndex);
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('✅ Question resolved for index:', payload.questionIndex);
      }
      
      // Update player score
      const playerIndex = this.currentMatch!.players.findIndex((p) => String(p.id) === playerId);
      if (playerIndex !== -1 && payload.correct) {
        this.currentMatch!.players[playerIndex].score = (this.currentMatch!.players[playerIndex].score || 0) + 1;
      }
      
      // Update combo for my answers only
      if (playerId === this.myUserId) {
        this.myCombo = payload.correct ? (this.myCombo || 0) + 1 : 0;
      }
      
      // Reset idle timer on any activity
      this.timeRemaining = 30;
      
      // Handle freeze state - SIMPLIFIED
      if (payload.freeze) {
        // Player gets frozen
        this.frozen[playerId] = true;
        this.startFreezeCountdown(playerId, (payload as any).unfreezeTime);
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('❄️ FROZEN:', playerId);
      } else {
        // Player gets unfrozen
        delete this.frozen[playerId];
        this.clearFreezeCountdown(playerId);
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🔥 UNFROZEN:', playerId);
      }
      
      // Mark wrong answers as eliminated
      if (!payload.correct && typeof payload.answerIndex === 'number') {
        const qIdx = payload.questionIndex;
        const existingSet = this.knownWrongChoices.get(qIdx);
        const nextSet = new Set(existingSet ? Array.from(existingSet) : []);
        if (!nextSet.has(payload.answerIndex)) {
          nextSet.add(payload.answerIndex);
          this.knownWrongChoices.set(qIdx, nextSet);
        }
        
        // Show opponent's wrong choice
        if (playerId !== this.myUserId) {
          this.opponentWrongAnswer = payload.answerIndex;
          setTimeout(() => runInAction(() => { this.opponentWrongAnswer = null; }), 3000);
        }
      }
      
      // Show answer result animation
      if (payload.questionIndex === this.currentQuestionIndex) {
        this.lastAnswerResult = {
          playerId,
          correct: !!payload.correct,
          questionIndex: payload.questionIndex,
          answerIndex: payload.answerIndex,
          ts: Date.now()
        };
        setTimeout(() => runInAction(() => { this.lastAnswerResult = null; }), 3000);
      }
    });
  }

  private handleMatchEnded(result: MatchEndedPayload | MatchResult): void {
    this.stopTimer();
    
    // If idle timeout already triggered, don't show results - go directly home
    if (this.idleTimeoutTriggered) {
      this.idleTimeoutTriggered = false; // Reset flag
      this.resetMatch();
      this.navigateHomeWithRetry();
      return;
    }
    
    // Also check if this is an idle timeout based on the result
    // If no winner and very low scores, likely an idle timeout
    const isIdleTimeout = !result.winnerId && 
      result.players?.every((p: any) => (p.score || 0) === 0);
    
    if (isIdleTimeout) {
      // This is an idle timeout from server - go directly home, no results
      this.resetMatch();
      this.navigateHomeWithRetry();
      return;
    }
    
    runInAction(() => {
      if (this.currentMatch) {
        this.currentMatch.status = 'ended';
        // Normalize winnerId (server may send null)
        const wid = (result as any).winnerId;
        this.currentMatch.winnerId = wid != null && wid !== '' ? String(wid) : undefined;
        // Normalize players array to MatchPlayer shape
        const normPlayers = (result as any).players?.map((p: any) => ({
          id: String(p.id ?? p.userId ?? ''),
          username: String(p.username || ''),
          score: typeof p.score === 'number' ? p.score : 0,
          isFrozen: !!p.isFrozen,
        })) || this.currentMatch.players;
        this.currentMatch.players = normPlayers;
      }
    });

    // Navigate to Results screen for a proper end-of-match UX
    this.navigateToResultsWithRetry();
  }

  // Debug helper - capture last socket events
  debugPushEvent(event: string, payload: any): void {
    runInAction(() => {
      this.debugLastEvents.unshift({ event, payload, ts: Date.now() });
      if (this.debugLastEvents.length > 5) this.debugLastEvents.pop();
    });
  }

  private handleOpponentLeft(): void {
    this.stopTimer();
    runInAction(() => {
      if (this.currentMatch) {
        this.currentMatch.status = 'ended';
        // Set current player as winner (use myUserId)
        this.currentMatch.winnerId = this.myUserId || '';
      }
    });
    // Reset local state and route back to Home per product requirement
    this.resetMatch();
    this.navigateHomeWithRetry();
  }

  // Ensure navigation works even if container isn't ready yet
  private navigateToResultsWithRetry(maxAttempts = 10, delayMs = 300): void {
    let attempts = 0;
    const tryNav = () => {
      attempts++;
      try {
        const { navigationRef } = require('../utils/navigationRef');
        if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
          // Route to Results inside the Home tab's nested stack
          navigationRef.navigate('Main' as any, { screen: 'Home', params: { screen: 'Results' } } as any);
          return; // success
        }
      } catch {}
      if (attempts < maxAttempts) {
        setTimeout(tryNav, delayMs);
      }
    };
    tryNav();
  }

  // Navigate back to Home tab root with retry (handles nested navigator readiness)
  private navigateHomeWithRetry(maxAttempts = 10, delayMs = 300): void {
    let attempts = 0;
    const tryNav = () => {
      attempts++;
      try {
        const { navigationRef } = require('../utils/navigationRef');
        if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
          // Prefer targeting the Home tab's root screen explicitly via the root stack 'Main'
          navigationRef.navigate('Main' as any, { screen: 'Home', params: { screen: 'HomeRoot' } } as any);
          return; // success
        }
      } catch {}
      if (attempts < maxAttempts) {
        setTimeout(tryNav, delayMs);
      }
    };
    tryNav();
  }

  private navigateToMatchLobbyWithRetry(maxAttempts = 10, delayMs = 200): void {
    let attempts = 0;
    const tryNav = () => {
      attempts++;
      try {
        const { navigationRef } = require('../utils/navigationRef');
        if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
          const currentRoute = typeof navigationRef.getCurrentRoute === 'function' ? navigationRef.getCurrentRoute() : null;
          if (currentRoute?.name === 'Match') {
            return;
          }
          navigationRef.navigate('Main' as any, { screen: 'Home', params: { screen: 'MatchLobby' } } as any);
          return;
        }
      } catch {}
      if (attempts < maxAttempts) {
        setTimeout(tryNav, delayMs);
      }
    };
    tryNav();
  }

  private handlePlayerUnfrozen(payload: any): void {
    if (!this.currentMatch) return;
    const playerId = String(payload.playerId);
    
    runInAction(() => {
      delete this.frozen[playerId];
      this.clearFreezeCountdown(playerId);
      
      // Clear submission throttling when player gets unfrozen
      // This allows rapid clicking after unfreeze without being blocked by previous submissions
      if (playerId === this.myUserId && this.submittingForIndex !== null) {
        this.submittingForIndex = null;
      }
      
      // Clear answered questions when unfrozen to allow re-answering
      if (playerId === this.myUserId) {
        this.answeredQuestions.clear();
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🔄 Cleared answered questions - can answer again');
      }
      
      // Update player model
      const playerIndex = this.currentMatch!.players.findIndex((p) => String(p.id) === playerId);
      if (playerIndex !== -1) {
        this.currentMatch!.players[playerIndex].isFrozen = false;
      }
    });
    
    // Grace period: If this is my unfreeze, add a brief window to handle rapid clicks
    if (playerId === this.myUserId) {
      // Force state update and allow immediate submissions for a short window
      setTimeout(() => {
        runInAction(() => {
          // Trigger computed getter recalculation by accessing it
          this.canSubmitAnswer;
        });
      }, 5); // Very short delay to ensure state is consistent
    }
  }

  private handleFreezeStateSync(payload: any): void {
    if (!this.currentMatch) return;
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🔄 FREEZE STATE SYNC:', payload.frozen);
    
    runInAction(() => {
      // Clear current freeze state
      this.frozen = {};
      this.freezeTimeouts.forEach(timeout => clearTimeout(timeout));
      this.freezeTimeouts.clear();
  this.freezeCountdownIntervals.forEach(interval => clearInterval(interval));
  this.freezeCountdownIntervals.clear();
  this.freezeCountdowns.clear();
  this.freezeTotalDurations.clear();
      
      // Apply server freeze state
      const serverFrozen = payload.frozen || {};
      const now = Date.now();
      
      for (const [playerId, freezeTime] of Object.entries(serverFrozen)) {
        const key = String(playerId);
        if (typeof freezeTime === 'number' && freezeTime > now) {
          // Player is still frozen
          this.frozen[key] = true;
          const remainingMs = freezeTime - now;
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          this.freezeCountdowns.set(key, remainingSeconds);
          if (!this.freezeTotalDurations.has(key)) {
            this.freezeTotalDurations.set(key, remainingSeconds);
          }
          this.startFreezeCountdown(key, freezeTime);
          if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🔄 Synced freeze for', key, 'remaining:', remainingSeconds + 's');
        }
      }
    });
  }

  private handleInvitePending(payload: any): void {
    const inviteId = String(payload?.inviteId || '');
    if (!inviteId) return;
    runInAction(() => {
      this.isSendingInvite = false;
      this.outgoingInvite = {
        inviteId,
        targetUsername: payload?.target?.username || this.outgoingInvite?.targetUsername || 'Player',
        subject: payload?.subject,
        status: 'pending',
      };
    });
  }

  private handleInviteReceived(payload: any): void {
    const inviteId = String(payload?.inviteId || '');
    if (!inviteId) return;
    const fromUsername = payload?.from?.username || 'Challenger';
    const subject = payload?.subject;
    runInAction(() => {
      this.incomingInvite = { inviteId, fromUsername, subject };
    });
    this.rootStore?.uiStore?.showToast?.(`${fromUsername} challenged you to a duel!`, 'info');
  }

  private handleInviteResult(payload: any): void {
    if (!payload || !this.outgoingInvite) return;
    const inviteId = String(payload.inviteId || '');
    if (!inviteId || this.outgoingInvite.inviteId !== inviteId) return;

    const accepted = !!payload.accepted;
    const reason: string | undefined = payload.reason;
    const message: string | undefined = payload.message;

    runInAction(() => {
      this.outgoingInvite = {
        ...this.outgoingInvite!,
        status: accepted ? 'accepted' : reason === 'expired' ? 'expired' : 'declined',
        message: message || (accepted ? undefined : reason === 'declined' ? 'Invite declined' : reason === 'expired' ? 'Invite expired' : message),
      };
    });

    if (accepted) {
      this.rootStore?.uiStore?.showToast?.('Invite accepted! Preparing match…', 'success');
    } else if (reason === 'expired') {
      this.rootStore?.uiStore?.showToast?.('Invite expired before it was accepted', 'warning');
    } else {
      this.rootStore?.uiStore?.showToast?.('Invite was declined', 'info');
    }
  }

  private handleInviteError(payload: any): void {
    const message = (payload && (payload.message || payload.error)) || 'Invite failed';
    runInAction(() => {
      this.isSendingInvite = false;
      if (this.outgoingInvite) {
        this.outgoingInvite = {
          ...this.outgoingInvite,
          status: 'error',
          message,
        };
      }
    });
    this.rootStore?.uiStore?.showToast?.(message, 'error');
  }

  submitAnswer(questionIndex: number, answerIndex: number): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🎯 submitAnswer called:', {
      questionIndex,
      answerIndex,
      canSubmitAnswer: this.canSubmitAnswer,
      myPlayerStatus: this.myPlayerStatus,
      currentQuestionIndex: this.currentQuestionIndex,
      matchId: this.currentMatch?.id,
      frozen: this.frozen,
      myUserId: this.myUserId
    });
    
    // Prevent fast-clicking after already answering this question
    if (this.answeredQuestions.has(questionIndex)) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🚫 Already answered question', questionIndex);
      return;
    }
    
    if (!this.canSubmitAnswer || this.submittingForIndex === questionIndex) {
      // Race condition detection: If I'm not frozen but still can't submit,
      // it might be a state update race. Try once more after a tiny delay.
      const myUserId = this.myUserId;
      if (myUserId && !this.frozen[myUserId] && this.submittingForIndex !== questionIndex) {
        setTimeout(() => {
          if (this.canSubmitAnswer && this.submittingForIndex !== questionIndex) {
            this.submitAnswerNow(questionIndex, answerIndex);
          }
        }, 10);
        return;
      }
      
      return;
    }
    
    this.submitAnswerNow(questionIndex, answerIndex);
  }
  
  private submitAnswerNow(questionIndex: number, answerIndex: number): void {
    const matchId = this.currentMatch?.id || '';
    this.submittingForIndex = questionIndex;
    socketService.submitAnswer(matchId, questionIndex, answerIndex);
    
    // Safety: clear throttling after 2.5s in case ack or result never arrives
    setTimeout(() => {
      if (this.submittingForIndex === questionIndex) {
        this.submittingForIndex = null;
      }
    }, 2500);
  }

  // Method to sync freeze state when client/server are out of sync
  syncFreezeState(): void {
    if (this.currentMatch?.id) {
      socketService.emit('getFreezeState', { matchId: this.currentMatch.id });
    }
  }

  private startTimer(): void {
    this.stopTimer();
    
    this.timerInterval = setInterval(() => {
      runInAction(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          this.handleTimeUp();
        }
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeUp(): void {
    // Idle timer reached 0 - go directly to home (no results for idle timeout)
    this.stopTimer();
    this.idleTimeoutTriggered = true;
    
    // Notify server that match should end due to idle timeout
    socketService.emit('idleTimeout', { matchId: this.currentMatch?.id });
    
    runInAction(() => {
      this.timeRemaining = 0;
    });
    
    // Reset match and go directly to home (no results popup for idle timeout)
    this.resetMatch();
    this.navigateHomeWithRetry();
  }

  private startFreezeCountdown(playerId: string, unfreezeTime?: number): void {
    this.clearFreezeCountdown(playerId);

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('⏱️ Starting countdown for:', playerId, {
        myUserId: this.myUserId,
        myPlayerId: this.myPlayerId,
        authUserId: this.rootStore?.authStore?.currentUser?.id,
        isMe: playerId === this.myUserId,
        providedUnfreeze: unfreezeTime
      });
    }

    const now = Date.now();
    const targetMs = typeof unfreezeTime === 'number' && unfreezeTime > now ? unfreezeTime : now + 15000;
    const baseSeconds = Math.ceil((targetMs - now) / 1000);
    const totalSeconds = Math.min(15, Math.max(1, baseSeconds));

    this.freezeCountdowns.set(playerId, totalSeconds);
    if (!this.freezeTotalDurations.has(playerId) || (this.freezeTotalDurations.get(playerId) ?? 0) < totalSeconds) {
      this.freezeTotalDurations.set(playerId, totalSeconds);
    }

    const interval = setInterval(() => {
      runInAction(() => {
        const current = this.freezeCountdowns.get(playerId);
        if (typeof current === 'number') {
          const next = current - 1;
          if (next > 0) {
            this.freezeCountdowns.set(playerId, next);
            if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('⏰', playerId, ':', next);
          } else {
            if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🔓 Auto-unfreeze:', playerId);
            this.unfreezePlayer(playerId);
          }
        } else {
          this.clearFreezeCountdown(playerId);
        }
      });
    }, 1000);

    this.freezeCountdownIntervals.set(playerId, interval);

  const timeoutDuration = totalSeconds * 1000;
  const timeout = setTimeout(() => this.unfreezePlayer(playerId), timeoutDuration);
    this.freezeTimeouts.set(playerId, timeout);
  }

  private clearFreezeCountdown(playerId: string): void {
    // Clear interval
    const interval = this.freezeCountdownIntervals.get(playerId);
    if (interval) {
      clearInterval(interval);
      this.freezeCountdownIntervals.delete(playerId);
    }
    
    // Clear timeout
    const timeout = this.freezeTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.freezeTimeouts.delete(playerId);
    }
    
    // Clear UI countdown
    this.freezeCountdowns.delete(playerId);
    this.freezeTotalDurations.delete(playerId);
  }

  private unfreezePlayer(playerId: string): void {
    runInAction(() => {
      delete this.frozen[playerId];
      this.clearFreezeCountdown(playerId);
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🆓 UNFROZE:', playerId);
    });
  }

  private handleQuestionEnded(payload: any): void {
    // Server notifies when a question ends with the correct answer
    runInAction(() => {
      if (!this.currentMatch || this.currentQuestionIndex < 0) return;
      const correctIndex = typeof payload.correctIndex === 'number' ? payload.correctIndex : -1;
      const currentQ = this.currentMatch.questions[this.currentQuestionIndex];
      if (currentQ) {
        (currentQ as any).correctIndex = correctIndex;
      }
      // Clear throttling on end to be ready for next question
      this.submittingForIndex = null;
      
      // Clear all freeze states when question ends
      this.frozen = {};
      this.freezeTimeouts.forEach(timeout => clearTimeout(timeout));
      this.freezeTimeouts.clear();
  this.freezeCountdownIntervals.forEach(interval => clearInterval(interval));
  this.freezeCountdownIntervals.clear();
  this.freezeCountdowns.clear();
  this.freezeTotalDurations.clear();
  this.knownWrongChoices.delete(this.currentQuestionIndex);
      
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('🏁 Question ended - cleared all freeze states');
    });
  }

  leaveMatch(): void {
    this.stopTimer();
    socketService.leaveMatch();
    runInAction(() => {
      this.currentMatch = null;
      this.currentQuestionIndex = 0;
      this.timeRemaining = 15;
    });
  }

  resetMatch(): void {
    this.stopTimer();
    // Clear all freeze timers
    this.freezeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.freezeTimeouts.clear();
    this.freezeCountdownIntervals.forEach(interval => clearInterval(interval));
    this.freezeCountdownIntervals.clear();
    
    this.currentMatch = null;
    this.currentQuestionIndex = 0;
    this.timeRemaining = 30; // Reset to 30 seconds
  this.frozen = {};
  this.freezeCountdowns.clear();
  this.freezeTotalDurations.clear();
  this.knownWrongChoices.clear();
    this.isSearching = false;
    this.searchSubject = null;
    this.idleTimeoutTriggered = false; // Reset flag
  }

  get currentQuestion(): Question | null {
    if (!this.currentMatch || !this.currentMatch.questions) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('currentQuestion: no match or questions', {
          hasCurrentMatch: !!this.currentMatch,
          hasQuestions: !!this.currentMatch?.questions
        });
      }
      return null;
    }
    const question = this.currentMatch.questions[this.currentQuestionIndex] || null;
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('currentQuestion getter:', {
        currentQuestionIndex: this.currentQuestionIndex,
        questionsLength: this.currentMatch.questions.length,
        questionAtIndex: this.currentMatch.questions[this.currentQuestionIndex],
        question: question
      });
    }
    return question;
  }

  // Set of disabled choices for the current question (eliminated wrong answers)
  get disabledChoicesForCurrentQuestion(): Set<number> {
  const entrySet = this.knownWrongChoices.get(this.currentQuestionIndex);
  return entrySet ? new Set(entrySet) : new Set();
  }

  get myPlayer(): MatchPlayer | null {
    if (!this.currentMatch) return null;
    // Use myUserId to find the current player
    const myUserId = this.myUserId;
    if (!myUserId) return null;
    return this.currentMatch.players.find((p) => p.id === myUserId) || null;
  }

  get opponentPlayer(): MatchPlayer | null {
    if (!this.currentMatch) return null;
    // Use myUserId to find the opponent (the other player)
    const myUserId = this.myUserId;
    if (!myUserId) return null;
    return this.currentMatch.players.find((p) => p.id !== myUserId) || null;
  }

  get myUserId(): string | null {
    // Prioritize myPlayerId since that's what the backend uses in match events
    return this.myPlayerId || this.rootStore?.authStore?.currentUser?.id;
  }

  // Keep compatibility with existing code
  get myCurrentUserId(): string | null {
    return this.myUserId;
  }

  get opponentUserId(): string | null {
    if (!this.currentMatch) return null;
    const myUserId = this.myUserId;
    if (!myUserId) return null;
    const opponent = this.currentMatch.players.find((p) => p.id !== myUserId);
    return opponent?.id || null;
  }

  get canSubmitAnswer(): boolean {
    return this.myPlayerStatus === 'can-answer';
  }

  isAnswerDisabled(questionIndex: number): boolean {
    // Disable if already answered this question (fast-click prevention)
    if (this.answeredQuestions.has(questionIndex)) {
      return true;
    }
    if (this.submittingForIndex === questionIndex) {
      return true;
    }
    // Disable if frozen (but don't block page interaction)  
    return this.myPlayerStatus === 'frozen';
  }

  get isMatchActive(): boolean {
    return this.currentMatch?.status === 'active' || this.currentMatch?.status === 'inprogress';
  }

  get matchWinner(): MatchPlayer | null {
    if (!this.currentMatch?.winnerId) return null;
    return this.currentMatch.players.find((p) => p.id === this.currentMatch?.winnerId) || null;
  }

  // Enhanced UX getters
  get myPlayerStatus(): 'can-answer' | 'frozen' | 'waiting' | 'inactive' {
    if (!this.isMatchActive) return 'inactive';
    const myUserId = this.myUserId;
    if (myUserId && this.frozen[myUserId]) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('myPlayerStatus: frozen (myUserId:', myUserId, 'frozen:', this.frozen, ')');
      return 'frozen';
    }
    // Server is authoritative; if I'm not frozen and match is active, I can answer
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('myPlayerStatus: can-answer (not frozen)');
    return 'can-answer';
  }

  get opponentPlayerStatus(): 'can-answer' | 'frozen' | 'waiting' | 'inactive' {
    if (!this.isMatchActive) return 'inactive';
    const opponentUserId = this.opponentUserId;
    if (opponentUserId && this.frozen[opponentUserId]) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('opponentPlayerStatus: frozen (opponentUserId:', opponentUserId, 'frozen:', this.frozen, ')');
      return 'frozen';
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('opponentPlayerStatus: can-answer (not frozen)');
    return 'can-answer';
  }

  get turnIndicatorMessage(): string {
    if (!this.currentMatch) return 'Waiting...';
    
    // Handle pending status (match found but no question yet)
    if (this.currentMatch.status === 'pending') {
      return 'Match found! Waiting for first question...';
    }
    
    if (!this.isMatchActive) return 'Match not active';
    
    const myStatus = this.myPlayerStatus;
    const opponentStatus = this.opponentPlayerStatus;
    
    // Turn-based logic: only one player can answer at a time
    if (myStatus === 'can-answer' && opponentStatus === 'frozen') {
      return 'Your turn - choose an answer!';
    } else if (myStatus === 'frozen' && opponentStatus === 'can-answer') {
      return 'Opponent\'s turn to answer';
    } else if (myStatus === 'can-answer' && opponentStatus === 'can-answer') {
      return 'First to answer wins the point!';
    } else if (myStatus === 'frozen' && opponentStatus === 'frozen') {
      return 'Waiting for next question';
    } else if (myStatus === 'waiting' && opponentStatus === 'waiting') {
      return 'Waiting for next question';
    } else if (myStatus === 'waiting' && opponentStatus === 'frozen') {
      return 'Waiting for next question';
    } else if (myStatus === 'frozen' && opponentStatus === 'waiting') {
      return 'Waiting for next question';
    } else {
      return 'Waiting...';
    }
  }

  get myFreezeCountdown(): number | null {
    const candidateIds = new Set<string>();
    if (this.myUserId) candidateIds.add(this.myUserId);
    if (this.myPlayerId) candidateIds.add(this.myPlayerId);
    const authId = this.rootStore?.authStore?.currentUser?.id;
    if (authId) candidateIds.add(String(authId));

    for (const id of candidateIds) {
      const seconds = this.freezeCountdowns.get(id);
      if (typeof seconds === 'number') {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('✅ myFreezeCountdown resolved for', id, '=', seconds);
        }
        return seconds;
      }
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('❌ myFreezeCountdown not found for ids:', Array.from(candidateIds), 'keys:', Array.from(this.freezeCountdowns.keys()));
    }

    return null;
  }

  get opponentFreezeCountdown(): number | null {
    const opponentUserId = this.opponentUserId;
    if (!opponentUserId) return null;
    const val = this.freezeCountdowns.get(opponentUserId);
    return typeof val === 'number' ? val : null;
  }

  get myFreezeTotalDuration(): number | null {
    const candidateIds = new Set<string>();
    if (this.myUserId) candidateIds.add(this.myUserId);
    if (this.myPlayerId) candidateIds.add(this.myPlayerId);
    const authId = this.rootStore?.authStore?.currentUser?.id;
    if (authId) candidateIds.add(String(authId));

    for (const id of candidateIds) {
      if (this.freezeTotalDurations.has(id)) {
        return this.freezeTotalDurations.get(id) ?? null;
      }
    }

    return null;
  }
}
