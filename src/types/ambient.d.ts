// Ambient module declarations for native/native-only packages
declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module '@sentry/react-native' {
  export function init(options: { dsn?: string } | string): void;
  export function captureException(e: any): void;
  export const Native: any;
}

declare module 'expo-haptics' {
  export const ImpactFeedbackStyle: any;
  export function impactAsync(type?: any): Promise<void>;
  export function notificationAsync(type?: any): Promise<void>;
}
