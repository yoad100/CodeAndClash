import AsyncStorage from '@react-native-async-storage/async-storage';
let SecureStore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  SecureStore = require('expo-secure-store');
} catch (e) {
  SecureStore = null;
}

const ACCESS_KEY = 'cw_access_token';
const REFRESH_KEY = 'cw_refresh_token';
const USER_KEY = 'cw_user';

async function secureGet(key: string): Promise<string | null> {
  try {
    if (SecureStore && SecureStore.getItemAsync) return await SecureStore.getItemAsync(key);
    return await AsyncStorage.getItem(key);
  } catch (e) {
    // fallback to AsyncStorage
    return AsyncStorage.getItem(key);
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (SecureStore && SecureStore.setItemAsync) await SecureStore.setItemAsync(key, value);
    else await AsyncStorage.setItem(key, value);
  } catch (e) {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (SecureStore && SecureStore.deleteItemAsync) await SecureStore.deleteItemAsync(key);
    else await AsyncStorage.removeItem(key);
  } catch (e) {
    await AsyncStorage.removeItem(key);
  }
}

export const StorageService = {
  getAccessToken: async (): Promise<string | null> => {
    return secureGet(ACCESS_KEY);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return secureGet(REFRESH_KEY);
  },

  setTokens: async (access: string, refresh: string) => {
    await secureSet(ACCESS_KEY, access);
    await secureSet(REFRESH_KEY, refresh);
  },

  setUserData: async (user: any) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUserData: async () => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  clearAll: async () => {
    await secureDelete(ACCESS_KEY);
    await secureDelete(REFRESH_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
  // raw item helpers for other features (queue persistence)
  getRawItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setRawItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  removeRawItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
};

