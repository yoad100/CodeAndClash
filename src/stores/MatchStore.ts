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
  timeRemaining = 15;
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
  // Track eliminated (wrong) choices per question index to prevent re-choosing
  knownWrongChoices: Record<number, Record<number, true>> = {};
  
  private timerInterval: ReturnType<typeof setInterval> | null = null;

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
    
    if (subject) {
      socketService.findOpponentBySubject(subject);
    } else {
      socketService.findOpponent();
    }
  }

  cancelSearch(): void {
    this.isSearching = false;
    this.searchSubject = null;
    socketService.cancelSearch();
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
    });
  }

  private handleQuestionStarted(payload: QuestionStartedPayload): void {
    // payload: { index, question: { id, text, choices } }
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('handleQuestionStarted:', payload);
    runInAction(() => {
      if (!this.currentMatch) return;
      // ensure questions array exists and push formatted question
      const q = payload.question;
      // convert to frontend Question shape
      const fq = { id: String(q.id), text: q.text, choices: q.choices, correctIndex: -1 };
      // ensure array length
      this.currentMatch.questions[payload.index] = fq as any;
      this.currentMatch.status = 'active';
      this.currentQuestionIndex = payload.index;
      this.timeRemaining = 15;
      
      // Reset frozen state for new question (everyone can answer initially)
      this.frozen = {};
  // Reset eliminated choices for this question
  this.knownWrongChoices[payload.index] = {};
      // Reset per-question submit throttling and transient UI flags
      this.submittingForIndex = null;
      this.lastAnswerResult = null;
      this.opponentWrongAnswer = null;
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('Question started - reset frozen state:', this.frozen);
      
      this.startTimer();
    });
  }

  private handleAnswerResult(payload: AnswerResultPayload): void {
    // backend emits: { playerId, correct, freeze, answerIndex, questionIndex }
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('handleAnswerResult:', payload);
    if (!this.currentMatch) return;
    runInAction(() => {
      // Find player by user ID (from backend) - use myUserId for consistency
      const playerIndex = this.currentMatch!.players.findIndex((p) => p.id === payload.playerId);
      if (playerIndex !== -1) {
        if (payload.correct) {
          this.currentMatch!.players[playerIndex].score = (this.currentMatch!.players[playerIndex].score || 0) + 1;
        }
        // Update my combo streak: only track my own answers
        if (payload.playerId === this.myUserId) {
          if (payload.correct) {
            this.myCombo = (this.myCombo || 0) + 1;
          } else {
            this.myCombo = 0;
          }
        }
        
        // Update Redis-based frozen state
        if (payload.freeze) {
          this.frozen = { ...this.frozen, [payload.playerId]: true };
          if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('Player frozen:', payload.playerId, 'new frozen state:', this.frozen);
        } else {
          const newFrozen = { ...this.frozen };
          delete newFrozen[payload.playerId];
          this.frozen = newFrozen;
          if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('Player unfrozen:', payload.playerId, 'new frozen state:', this.frozen);
        }
        
        // Persistently mark eliminated wrong choices for this question (global for both players)
        if (!payload.correct && typeof payload.answerIndex === 'number' && typeof payload.questionIndex === 'number') {
          const qIdx = payload.questionIndex;
          const map = this.knownWrongChoices[qIdx] || (this.knownWrongChoices[qIdx] = {});
          map[payload.answerIndex] = true;
          // Also briefly show opponent wrong flash for UX
          if (payload.playerId !== this.myUserId) {
            this.opponentWrongAnswer = payload.answerIndex;
            setTimeout(() => {
              runInAction(() => { this.opponentWrongAnswer = null; });
            }, 3000);
          }
        }
        
        // Only show answer result for current question
        if (payload.questionIndex === this.currentQuestionIndex) {
          this.lastAnswerResult = { 
            playerId: payload.playerId, 
            correct: !!payload.correct, 
            questionIndex: payload.questionIndex, 
            answerIndex: payload.answerIndex,
            ts: Date.now() 
          };
          // clear after a short delay for animation cycle
          setTimeout(() => {
            runInAction(() => {
              this.lastAnswerResult = null;
            });
          }, 3000);
        }
      }
    });
  }

  private handleMatchEnded(result: MatchEndedPayload | MatchResult): void {
    this.stopTimer();
    
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

  private handlePlayerUnfrozen(payload: any): void {
    if (!this.currentMatch) return;
    runInAction(() => {
      // Clear frontend frozen map for this player
      const newFrozen = { ...this.frozen };
      delete newFrozen[payload.playerId];
      this.frozen = newFrozen;
      // Also maintain backward-compatibility flag on player model
      const playerIndex = this.currentMatch!.players.findIndex((p) => p.id === payload.playerId);
      if (playerIndex !== -1) this.currentMatch!.players[playerIndex].isFrozen = false;
    });
  }

  submitAnswer(questionIndex: number, answerIndex: number): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('submitAnswer called:', {
      questionIndex,
      answerIndex,
      canSubmitAnswer: this.canSubmitAnswer,
      myPlayerStatus: this.myPlayerStatus,
      currentQuestionIndex: this.currentQuestionIndex,
      matchId: this.currentMatch?.id,
      frozen: this.frozen,
      myUserId: this.myUserId
    });
    
    if (!this.canSubmitAnswer || this.submittingForIndex === questionIndex) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('Cannot submit answer - canSubmitAnswer:', this.canSubmitAnswer);
      return;
    }
    
    const matchId = this.currentMatch?.id || '';
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('Sending submitAnswer to socket service:', { matchId, questionIndex, answerIndex });
    this.submittingForIndex = questionIndex;
    socketService.submitAnswer(matchId, questionIndex, answerIndex);
    // Safety: clear throttling after 2.5s in case ack or result never arrives
    setTimeout(() => {
      if (this.submittingForIndex === questionIndex) this.submittingForIndex = null;
    }, 2500);
    
    // Optimistically update UI - don't freeze since we're using Redis state
    // The server will send back answerResult which will update the proper state
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
    // Stop the local timer - the server is authoritative for question timing
    // Server will emit questionEnded when appropriate and then questionStarted for next question
    this.stopTimer();
    runInAction(() => {
      this.timeRemaining = 0;
      // Don't advance currentQuestionIndex locally - wait for server events
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
    this.currentMatch = null;
    this.currentQuestionIndex = 0;
    this.timeRemaining = 15;
    this.isSearching = false;
    this.searchSubject = null;
  }

  get currentQuestion(): Question | null {
    if (!this.currentMatch || !this.currentMatch.questions) return null;
    return this.currentMatch.questions[this.currentQuestionIndex] || null;
  }

  // Set of disabled choices for the current question (eliminated wrong answers)
  get disabledChoicesForCurrentQuestion(): Set<number> {
    const map = this.knownWrongChoices[this.currentQuestionIndex] || {};
    return new Set(Object.keys(map).map((k) => Number(k)));
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
    return this.rootStore?.authStore?.currentUser?.id || this.myPlayerId;
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
}
