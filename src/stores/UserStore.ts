import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api.service';
import { StorageService } from '../services/storage.service';
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
    });
    void StorageService.setUserData(userData).catch((error) => {
      console.warn('Failed to persist user data to storage:', error);
    });
  }

  async hydrateFromStorage(): Promise<void> {
    try {
      const stored = await StorageService.getUserData();
      if (stored) {
        this.setUser(stored as User);
      }
    } catch (error) {
      console.warn('UserStore hydrateFromStorage failed:', error);
    }
  }

  async fetchUserProfile(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.getUserProfile();
      this.setUser(response.data as User);
      runInAction(() => {
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
      const definedUpdates: Partial<User> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          (definedUpdates as any)[key] = value;
        }
      });

      runInAction(() => {
        this.user = { ...this.user!, ...definedUpdates } as User;
      });

      if (Object.keys(definedUpdates).length > 0) {
        void StorageService.setUserData(this.user)
          .catch((error) => console.warn('Failed to persist partial user update:', error));
      }
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

  /**
   * Computes the rating cutoff of the next higher tier for the current user.
   * Returns undefined when not available (no leaderboard or insufficient info).
   */
  get nextRating(): number | undefined {
    try {
      const leaderboard = this.leaderboard || [];
      const totalPlayers = leaderboard.length;
      if (totalPlayers <= 0) return undefined;

      const breakpoints = buildLevelBreakpoints(totalPlayers);

      // find user's rank
      let rank = typeof this.user?.rank === 'number' ? this.user!.rank : NaN;
      if (!Number.isFinite(rank)) {
        const found = leaderboard.find((e) => e.username === this.user?.username);
        if (found && typeof found.rank === 'number') rank = found.rank;
      }
      if (!Number.isFinite(rank) || rank < 1 || rank > totalPlayers) return undefined;

      const currentTheme = getLevelByRank(rank, totalPlayers, breakpoints);
      const currentIndex = currentTheme.tier;
      // if user already at top tier (index 0), there's no next
      if (currentIndex <= 0) return undefined;

      const nextTierIndex = currentIndex - 1;
      const nextTierLastRank = breakpoints[nextTierIndex];
      // leaderboard is ordered by rank ascending; attempt direct index
      const candidate = leaderboard[nextTierLastRank - 1] || leaderboard.find((e) => e.rank === nextTierLastRank);
      if (candidate && typeof candidate.rating === 'number') return candidate.rating;
      return undefined;
    } catch (err) {
      if (process?.env?.NODE_ENV === 'development') console.warn('UserStore.nextRating compute failed', err);
      return undefined;
    }
  }

  /**
   * Progress fraction [0..1] towards next tier based on current rating and nextRating cutoff.
   * Returns undefined if nextRating is not available.
   */
  get progressToNextLevel(): number | undefined {
    const next = this.nextRating;
    const rating = typeof this.user?.rating === 'number' ? this.user.rating : NaN;
    if (!Number.isFinite(rating) || typeof next !== 'number' || !Number.isFinite(next)) return undefined;
    if (next <= 0) return undefined;
    const progress = Math.max(0, Math.min(1, rating / next));
    return progress;
  }

  /**
   * Whether the user is at the highest level (Master) and therefore maxed.
   */
  get isMaxLevel(): boolean {
    // If no leaderboard we can also infer from user.levelKey
    if (this.user?.levelKey === 'master') return true;
    // If nextRating is undefined but levelKey isn't master, we won't treat as max
    return false;
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
