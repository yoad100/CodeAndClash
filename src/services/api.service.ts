import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api';
import { StorageService } from './storage.service';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<(token: string | null) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await StorageService.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (e) {
            await StorageService.clearAll();
            throw e;
          }
        }
        throw error;
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = await StorageService.getRefreshToken();
    if (!refreshToken) return null;

    if (this.isRefreshing) {
      return new Promise((resolve) => this.refreshQueue.push(resolve));
    }

    this.isRefreshing = true;
    try {
      const resp = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = resp.data;
      await StorageService.setTokens(accessToken, newRefresh);
      this.isRefreshing = false;
      this.refreshQueue.forEach((cb) => cb(accessToken));
      this.refreshQueue = [];
      return accessToken;
    } catch (err) {
      this.isRefreshing = false;
      this.refreshQueue.forEach((cb) => cb(null));
      this.refreshQueue = [];
      throw err;
    }
  }

  get instance() {
    return this.client;
  }

  // High-level API methods
  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async register(username: string, email: string, password: string) {
    return this.client.post('/auth/register', { username, email, password });
  }

  async oauthLogin(provider: string, token: string) {
    return this.client.post(`/auth/oauth/${provider}`, { token });
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getUserProfile() {
    return this.client.get('/users/me');
  }

  async getTopPlayers() {
    return this.client.get('/leaderboard/top?limit=100');
  }
}

export const apiService = new ApiService();

