import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api.service';
import { StorageService } from '../services/storage.service';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';
import { ApiError } from '../types/api.types';

export class AuthStore {
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
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await StorageService.clearAll();
      runInAction(() => {
        this.isAuthenticated = false;
      });
    }
  }

  clearError(): void {
    this.error = null;
  }
}
