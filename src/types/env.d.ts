declare const __DEV__: boolean;

declare global {
  interface Window {
    __DEV__?: boolean;
  }
}

export {};
