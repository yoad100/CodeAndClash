import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api.service';
import { User, LeaderboardEntry } from '../types/user.types';

export class UserStore {
  user: User | null = null;
  leaderboard: LeaderboardEntry[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchUserProfile(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.getUserProfile();
      runInAction(() => {
        this.user = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  async fetchLeaderboard(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.getTopPlayers();
      // backend returns { data: users[] } with fields: username, rating, wins, losses, avatar
      const users = (response.data?.data || response.data || []) as Array<any>;
      const entries: LeaderboardEntry[] = users.map((u: any, idx: number) => ({
        username: String(u.username || 'Unknown'),
        avatar: u.avatar || undefined,
        rank: idx + 1,
        rating: typeof u.rating === 'number' ? u.rating : 1000,
        wins: typeof u.wins === 'number' ? u.wins : 0,
        losses: typeof u.losses === 'number' ? u.losses : 0,
      }));
      runInAction(() => {
        this.leaderboard = entries;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  updateUser(updates: Partial<User>): void {
    if (this.user) {
      this.user = { ...this.user, ...updates };
    }
  }

  get isPremium(): boolean {
    return this.user?.isPremium ?? false;
  }

  get userRank(): number {
    return this.user?.rank ?? 0;
  }

  get userRating(): number {
    return this.user?.rating ?? 1000;
  }
}
