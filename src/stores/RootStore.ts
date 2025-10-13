import { AuthStore } from './AuthStore';
import { UserStore } from './UserStore';
import { MatchStore } from './MatchStore';
import { UIStore } from './UIStore';
import { socketService } from '../services/socket.service';

export class RootStore {
  authStore: AuthStore;
  userStore: UserStore;
  matchStore: MatchStore;
  uiStore: UIStore;

  constructor() {
    this.authStore = new AuthStore();
    this.userStore = new UserStore();
    this.matchStore = new MatchStore();
    this.uiStore = new UIStore();
    
    // Set rootStore references
    this.authStore.rootStore = this;
    this.userStore.rootStore = this;
    this.matchStore.rootStore = this;
    socketService.setRootStore(this);
  }

  async initialize(): Promise<void> {
    await this.authStore.checkAuthStatus();
    if (this.authStore.isAuthenticated) {
      await this.userStore.hydrateFromStorage();
      await this.userStore.fetchUserProfile();
      // wire myPlayerId into matchStore for score/identity handling
      if (this.userStore.user && this.userStore.user.id) {
        this.matchStore.myPlayerId = this.userStore.user.id;
      }
    }
  }
}

export const rootStore = new RootStore();
