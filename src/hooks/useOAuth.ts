import { useState } from 'react';
import { rootStore } from '../stores/RootStore';

export interface OAuthState {
  loading: boolean;
  error: string | null;
}

export interface OAuthHookReturn {
  googleState: OAuthState;
  githubState: OAuthState;
  authenticateWithGoogle: () => Promise<void>;
  authenticateWithGitHub: () => Promise<void>;
  clearError: (provider: 'google' | 'github') => void;
}

/**
 * Simple OAuth hook for testing
 */
export const useOAuth = (): OAuthHookReturn => {
  const [googleState, setGoogleState] = useState<OAuthState>({ loading: false, error: null });
  const [githubState, setGithubState] = useState<OAuthState>({ loading: false, error: null });

  /**
   * Authenticate with Google - Demo version
   */
  const authenticateWithGoogle = async () => {
    try {
      setGoogleState({ loading: true, error: null });
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show demo success
      rootStore.uiStore.showToast('Google OAuth Demo - Configure your client ID!', 'info');
      console.log('Google OAuth button clicked - needs configuration');
      
      setGoogleState({ loading: false, error: null });
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      setGoogleState({ loading: false, error: 'Authentication failed' });
    }
  };

  /**
   * Authenticate with GitHub - Demo version
   */
  const authenticateWithGitHub = async () => {
    try {
      setGithubState({ loading: true, error: null });
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show demo success
      rootStore.uiStore.showToast('GitHub OAuth Demo - Configure your client ID!', 'info');
      console.log('GitHub OAuth button clicked - needs configuration');
      
      setGithubState({ loading: false, error: null });
    } catch (error: any) {
      console.error('GitHub OAuth error:', error);
      setGithubState({ loading: false, error: 'Authentication failed' });
    }
  };

  /**
   * Clear error for a specific provider
   */
  const clearError = (provider: 'google' | 'github') => {
    if (provider === 'google') {
      setGoogleState(prev => ({ ...prev, error: null }));
    } else {
      setGithubState(prev => ({ ...prev, error: null }));
    }
  };

  return {
    googleState,
    githubState,
    authenticateWithGoogle,
    authenticateWithGitHub,
    clearError,
  };
};