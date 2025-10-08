import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api.service';
import { StorageService } from '../services/storage.service';
import { socketService } from '../services/socket.service';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';
import { ApiError } from '../types/api.types';

export class AuthStore {
  rootStore: any; // Will be set after construction
  isAuthenticated = false;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.checkAuthStatus();
  }

  async checkAuthStatus(): Promise<void> {
    const token = await StorageService.getAccessToken();
    runInAction(() => {
      this.isAuthenticated = !!token;
    });
  }

  async login(credentials: LoginCredentials): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.login(credentials.email, credentials.password);
      const { accessToken, refreshToken, user } = response.data;

      await StorageService.setTokens(accessToken, refreshToken);
      await StorageService.setUserData(user);

      runInAction(() => {
        this.isAuthenticated = true;
        this.isLoading = false;
      });

      // After successful login, reconnect socket and update user store
      if (this.rootStore) {
        console.log('🔄 Post-login setup: reconnecting socket and updating user data...');
        
        // Update user store immediately with login data
        if (this.rootStore.userStore) {
          this.rootStore.userStore.setUser(user);
        }
        
        // Force socket reconnection with new token
        console.log('🔌 Disconnecting and reconnecting socket with new auth...');
        socketService.disconnect();
        // Small delay to ensure clean disconnection
        setTimeout(() => {
          socketService.connect();
        }, 100);
        
        // Fetch fresh profile data in background
        if (this.rootStore.userStore) {
          try {
            await this.rootStore.userStore.fetchUserProfile();
          } catch (profileError) {
            console.warn('⚠️ Failed to fetch fresh profile after login:', profileError);
          }
        }

        // Update match store player ID
        if (this.rootStore.matchStore && user?.id) {
          this.rootStore.matchStore.myPlayerId = user.id;
        }
      }
    } catch (error) {
      const apiError = error as ApiError;
      runInAction(() => {
        this.error = apiError.message;
        this.isLoading = false;
      });
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.register(
        credentials.username,
        credentials.email,
        credentials.password
      );
      const { accessToken, refreshToken, user } = response.data;

      await StorageService.setTokens(accessToken, refreshToken);
      await StorageService.setUserData(user);

      runInAction(() => {
        this.isAuthenticated = true;
        this.isLoading = false;
      });
    } catch (error) {
      const apiError = error as ApiError;
      runInAction(() => {
        this.error = apiError.message;
        this.isLoading = false;
      });
      throw error;
    }
  }

  async oauthLogin(provider: 'google' | 'github', token: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.oauthLogin(provider, token);
      const { accessToken, refreshToken, user } = response.data;

      await StorageService.setTokens(accessToken, refreshToken);
      await StorageService.setUserData(user);

      runInAction(() => {
        this.isAuthenticated = true;
        this.isLoading = false;
      });
    } catch (error) {
      const apiError = error as ApiError;
      runInAction(() => {
        this.error = apiError.message;
        this.isLoading = false;
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('🔥 AuthStore.logout() called');
    try {
      console.log('📡 Calling API logout...');
      await apiService.logout();
      console.log('✅ API logout successful');
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      console.log('🔌 Disconnecting socket...');
      socketService.disconnect();
      
      console.log('🧹 Clearing storage...');
      await StorageService.clearAll();
      
      console.log('🔄 Clearing user data...');
      if (this.rootStore?.userStore?.clearUserData) {
        this.rootStore.userStore.clearUserData();
      }
      
      console.log('🔄 Resetting match data...');
      if (this.rootStore?.matchStore?.resetMatch) {
        this.rootStore.matchStore.resetMatch();
      }
      
      console.log('🔄 Setting isAuthenticated to false...');
      runInAction(() => {
        this.isAuthenticated = false;
      });
      console.log('✅ Logout process completed');
    }
  }

  clearError(): void {
    this.error = null;
  }
}
