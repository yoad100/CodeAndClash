import { API_CONFIG } from './api';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (globalThis as any).__DEV__ ?? false;

// Use SOCKET_URL if provided, otherwise fall back to the same host as the API base URL.
// This keeps API and socket endpoints in sync in development and makes device testing easier.
const defaultSocketUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');

export const SOCKET_CONFIG = {
  URL: (process.env.SOCKET_URL || defaultSocketUrl),
  OPTIONS: {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};

