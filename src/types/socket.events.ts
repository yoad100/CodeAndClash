// Socket event payload types shared across the app

export interface MatchFoundPayload {
  matchId: string;
  player: { id: string; username: string };
  opponent: { id: string; username: string };
  subject?: string;
}

export interface QuestionStartedPayload {
  matchId?: string; // older servers may omit this; gate logic allows missing
  index: number;
  question: { id: string; text: string; choices: string[] };
}

export interface AnswerResultPayload {
  matchId?: string; // older servers may omit this
  playerId: string;
  correct: boolean;
  freeze: boolean;
  answerIndex: number;
  questionIndex: number;
  unfreezeTime?: number;
}

export interface QuestionEndedPayload {
  matchId?: string; // older servers may omit this
  correctIndex: number;
}

export interface PlayerUnfrozenPayload {
  matchId?: string; // older servers may omit this
  playerId: string;
}

export interface MatchEndedPayload {
  matchId?: string;
  winnerId: string | null;
  players: Array<{ id?: string; userId?: string; username: string; score?: number; isFrozen?: boolean }>;
}
