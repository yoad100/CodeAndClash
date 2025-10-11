import { Platform } from 'react-native';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (globalThis as any).__DEV__ ?? false;

// Get the appropriate base URL for the current platform
const getBaseUrl = () => {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  if (isDev) {
    // In development, use localhost for web/simulator and actual IP for physical devices
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    } else {
      // For mobile devices (iOS/Android), use the computer's IP address
      return 'http://10.100.102.2:3000';
    }
  } else {
    // Production URL - replace with your actual production API URL
    return 'https://your-production-api.com';
  }
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
};

