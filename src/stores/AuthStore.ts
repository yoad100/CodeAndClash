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

  private async finalizeLogout(reason?: string): Promise<void> {
    console.log('🔒 Finalizing logout cleanup', reason ? `(${reason})` : '');
    try {
      console.log('🔌 Disconnecting socket...');
      socketService.disconnect();
    } catch (err) {
      console.warn('⚠️ Socket disconnect during logout failed:', err);
    }

    try {
      console.log('🧹 Clearing storage...');
      await StorageService.clearAll();
    } catch (err) {
      console.warn('⚠️ Failed to clear auth storage:', err);
    }

    try {
      console.log('🔄 Clearing user data...');
      this.rootStore?.userStore?.clearUserData?.();
    } catch (err) {
      console.warn('⚠️ Failed to clear user data during logout:', err);
    }

    try {
      console.log('🔄 Resetting match data...');
      this.rootStore?.matchStore?.resetMatch?.();
    } catch (err) {
      console.warn('⚠️ Failed to reset match store during logout:', err);
    }

    console.log('🔄 Setting isAuthenticated to false...');
    runInAction(() => {
      this.isAuthenticated = false;
      this.isLoading = false;
    });
    console.log('✅ Logout process completed');
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

  async register(credentials: RegisterCredentials): Promise<any> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await apiService.register(
        credentials.username,
        credentials.email,
        credentials.password
      );

      // Check if response indicates email verification is required
      if (response.data.emailSent) {
        runInAction(() => {
          this.isLoading = false;
        });
        return response.data; // Return the response for the UI to handle
      }

      // Normal registration flow (when email verification is disabled)
      const { accessToken, refreshToken, user } = response.data;

      await StorageService.setTokens(accessToken, refreshToken);
      await StorageService.setUserData(user);

      runInAction(() => {
        this.isAuthenticated = true;
        this.isLoading = false;
      });

      // After successful registration, set up user data and socket (same as login)
      if (this.rootStore) {
        console.log('🔄 Post-registration setup: connecting socket and updating user data...');
        
        // Update user store immediately with registration data
        if (this.rootStore.userStore) {
          this.rootStore.userStore.setUser(user);
        }
        
        // Connect socket with new token
        console.log('🔌 Connecting socket with new auth...');
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
            console.warn('⚠️ Failed to fetch fresh profile after registration:', profileError);
          }
        }

        // Update match store player ID
        if (this.rootStore.matchStore && user?.id) {
          this.rootStore.matchStore.myPlayerId = user.id;
        }
      }

      return response.data;
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

      // After successful OAuth login, set up user data and socket (same as login/register)
      if (this.rootStore) {
        console.log('🔄 Post-OAuth setup: connecting socket and updating user data...');
        
        // Update user store immediately with OAuth data
        if (this.rootStore.userStore) {
          this.rootStore.userStore.setUser(user);
        }
        
        // Connect socket with new token
        console.log('🔌 Connecting socket with new auth...');
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
            console.warn('⚠️ Failed to fetch fresh profile after OAuth:', profileError);
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

  async logout(): Promise<void> {
    console.log('🔥 AuthStore.logout() called');
    try {
      console.log('📡 Calling API logout...');
      await apiService.logout();
      console.log('✅ API logout successful');
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      await this.finalizeLogout();
    }
  }

  async forceLogout(reason?: string): Promise<void> {
    console.warn('⛔ Force logout triggered', reason ? `(${reason})` : '');
    await this.finalizeLogout(reason);
  }

  clearError(): void {
    this.error = null;
  }
}
