export interface User {
  id: string;
  username: string;
  isPremium?: boolean;
  rank?: number;
  rating?: number;
  avatar?: string;
  wins?: number;
  losses?: number;
  levelName?: string;
  levelKey?: string;
  levelIndex?: number;
  // Optional server-provided helpers to show progress in the UI without requiring
  // an immediate leaderboard refresh after level changes.
  nextRating?: number;
  progressToNextLevel?: number;
}

export interface LeaderboardEntry {
  username: string;
  avatar?: string;
  rank: number;
  rating: number;
  wins: number;
  losses: number;
  levelName?: string;
  levelKey?: string;
  levelIndex?: number;
}
