export interface MatchPlayer {
  id: string;
  username: string;
  score: number;
  isFrozen?: boolean;
  currentQuestionIndex?: number;
  avatar?: string;
  levelName?: string;
  levelKey?: string;
  levelIndex?: number;
  rating?: number;
}

export interface Question {
  id: string;
  text: string;
  choices: string[];
  correctIndex: number;
}

export interface Match {
  id: string;
  players: MatchPlayer[];
  questions: Question[];
  status: 'pending' | 'active' | 'inprogress' | 'ended';
  winnerId?: string;
}

export interface AnswerResult {
  playerId: string;
  isCorrect: boolean;
  newScore: number;
  questionIndex: number;
}

export interface MatchResult {
  winnerId: string;
  players: MatchPlayer[];
}
