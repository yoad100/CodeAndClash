export interface User {
  id: string;
  username: string;
  isPremium?: boolean;
  rank?: number;
  rating?: number;
  avatar?: string;
  wins?: number;
  losses?: number;
}

export interface LeaderboardEntry {
  username: string;
  avatar?: string;
  rank: number;
  rating: number;
  wins: number;
  losses: number;
}
