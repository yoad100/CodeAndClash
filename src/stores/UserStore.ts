import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api.service';
import { User, LeaderboardEntry } from '../types/user.types';
import { buildLevelBreakpoints, getLevelByRank } from '../constants/levels';

export class UserStore {
  rootStore: any = null;
  user: User | null = null;
  leaderboard: LeaderboardEntry[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(userData: User): void {
    runInAction(() => {
      this.user = userData;
      console.log('👤 UserStore: User data set:', userData?.username);
    });
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
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        try {
          await this.rootStore?.authStore?.forceLogout?.('SESSION_EXPIRED');
        } catch (logoutError) {
          console.warn('Failed to force logout after unauthorized profile fetch:', logoutError);
        }
        runInAction(() => {
          this.error = 'Session expired. Please sign in again.';
          this.isLoading = false;
        });
        return;
      }

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
      const users = (response.data?.data || response.data || []) as Array<any>;
      const totalPlayers = Number(response.data?.meta?.totalPlayers) || users.length || this.leaderboard.length;
      const breakpoints = buildLevelBreakpoints(totalPlayers);

      const entries: LeaderboardEntry[] = users.map((u: any, idx: number) => {
        const rank = typeof u.rank === 'number' ? u.rank : idx + 1;
        const levelTheme = getLevelByRank(rank, totalPlayers, breakpoints);
        return {
          username: String(u.username || 'Unknown'),
          avatar: u.avatar || undefined,
          rank,
          rating: typeof u.rating === 'number' ? u.rating : 1000,
          wins: typeof u.wins === 'number' ? u.wins : 0,
          losses: typeof u.losses === 'number' ? u.losses : 0,
          levelName: typeof u.levelName === 'string' ? u.levelName : levelTheme.name,
          levelKey: typeof u.levelKey === 'string' ? u.levelKey : levelTheme.key,
          levelIndex: typeof u.levelIndex === 'number' ? u.levelIndex : levelTheme.tier,
        };
      });
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

  clearUserData(): void {
    runInAction(() => {
      this.user = null;
      this.leaderboard = [];
      this.error = null;
      this.isLoading = false;
    });
  }
}
