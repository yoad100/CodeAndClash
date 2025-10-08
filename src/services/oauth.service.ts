import { makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the browser session on web
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'github';

interface OAuthConfig {
  clientId: string;
  scopes: string[];
  redirectUri: string;
  additionalParams?: Record<string, string>;
}

// OAuth provider configurations
const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  google: {
    clientId: __DEV__ 
      ? '284151312824-f8ur9brlkndi19n3d8m3e3q9b9j6l8i6.apps.googleusercontent.com' // Dev client ID
      : '284151312824-production-client-id.apps.googleusercontent.com', // Prod client ID
    scopes: ['openid', 'profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'codingwar',
      path: 'auth',
    }),
    additionalParams: {
      access_type: 'offline',
    },
  },
  github: {
    clientId: __DEV__
      ? 'your-github-dev-client-id' // Replace with your GitHub dev client ID
      : 'your-github-prod-client-id', // Replace with your GitHub prod client ID
    scopes: ['read:user', 'user:email'],
    redirectUri: makeRedirectUri({
      scheme: 'codingwar',
      path: 'auth',
    }),
  },
};

// Discovery endpoints
const DISCOVERY_ENDPOINTS = {
  google: 'https://accounts.google.com/.well-known/openid_configuration',
  github: null, // GitHub uses manual configuration
};

// GitHub manual configuration (since it doesn't support OpenID Connect discovery)
const GITHUB_CONFIG = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: 'https://github.com/settings/connections/applications/{client_id}',
};

/**
 * Professional OAuth Service for Google and GitHub authentication
 */
export class OAuthService {
  /**
   * Get OAuth configuration for a provider
   */
  private static getConfig(provider: OAuthProvider): OAuthConfig {
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    return config;
  }

  /**
   * Initiate OAuth flow for Google
   */
  static useGoogleAuth() {
    const config = this.getConfig('google');
    const discovery = useAutoDiscovery(DISCOVERY_ENDPOINTS.google);
    
    const [request, response, promptAsync] = useAuthRequest(
      {
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: 'code',
        extraParams: {
          // Ensure we get refresh token
          access_type: 'offline',
          prompt: 'consent',
          ...config.additionalParams,
        },
      },
      discovery
    );

    return { request, response, promptAsync };
  }

  /**
   * Initiate OAuth flow for GitHub
   */
  static useGitHubAuth() {
    const config = this.getConfig('github');
    
    const [request, response, promptAsync] = useAuthRequest(
      {
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: 'code',
        extraParams: {
          // GitHub specific parameters
          allow_signup: 'true',
        },
      },
      GITHUB_CONFIG
    );

    return { request, response, promptAsync };
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<string> {
    const config = this.getConfig(provider);
    
    try {
      if (provider === 'google') {
        // For Google, we'll let the backend handle the token exchange
        // since it requires the client secret
        return code;
      } else if (provider === 'github') {
        // For GitHub, we'll also let the backend handle the token exchange
        return code;
      }
      
      throw new Error(`Token exchange not implemented for provider: ${provider}`);
    } catch (error) {
      console.error(`Error exchanging code for token (${provider}):`, error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Get user info from OAuth provider
   * This is mainly for validation - the backend will also fetch this
   */
  static async getUserInfo(provider: OAuthProvider, token: string) {
    try {
      let userInfoEndpoint: string;
      
      if (provider === 'google') {
        userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
      } else if (provider === 'github') {
        userInfoEndpoint = 'https://api.github.com/user';
      } else {
        throw new Error(`User info not supported for provider: ${provider}`);
      }

      const response = await fetch(userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching user info (${provider}):`, error);
      throw new Error('Failed to fetch user information');
    }
  }

  /**
   * Validate OAuth configuration
   */
  static validateConfig(provider: OAuthProvider): boolean {
    try {
      const config = this.getConfig(provider);
      
      // Check if client ID is properly configured
      if (!config.clientId || config.clientId.includes('your-') || config.clientId.includes('client-id')) {
        console.warn(`⚠️  OAuth client ID not configured for ${provider}`);
        return false;
      }
      
      // Check if redirect URI is valid
      if (!config.redirectUri) {
        console.warn(`⚠️  OAuth redirect URI not configured for ${provider}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`OAuth configuration validation failed for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Get human-readable error messages
   */
  static getErrorMessage(error: any, provider: OAuthProvider): string {
    if (error?.code === 'ERR_CANCELED') {
      return 'Authentication was cancelled';
    }
    
    if (error?.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection';
    }
    
    if (error?.message?.includes('client_id')) {
      return `${provider} authentication is not properly configured`;
    }
    
    if (error?.message?.includes('redirect_uri')) {
      return 'Authentication redirect is not properly configured';
    }
    
    return error?.message || `${provider} authentication failed`;
  }
}

// Platform-specific configurations
export const OAUTH_PLATFORM_CONFIG = {
  // Web-specific settings
  web: {
    preferEphemeralSession: false, // Use persistent session on web
  },
  // Mobile-specific settings
  mobile: {
    preferEphemeralSession: true, // Use ephemeral session on mobile for security
    showInRecents: false,
  },
};

// Development helpers
export const OAUTH_DEV_UTILS = {
  /**
   * Log OAuth configuration for debugging
   */
  logConfig: (provider: OAuthProvider) => {
    if (__DEV__) {
      const config = OAUTH_CONFIGS[provider];
      console.log(`📋 OAuth Config for ${provider}:`, {
        clientId: config.clientId.substring(0, 10) + '...',
        scopes: config.scopes,
        redirectUri: config.redirectUri,
      });
    }
  },
  
  /**
   * Check if OAuth is properly configured
   */
  checkConfiguration: () => {
    if (__DEV__) {
      console.log('🔍 Checking OAuth configuration...');
      
      (['google', 'github'] as OAuthProvider[]).forEach(provider => {
        const isValid = OAuthService.validateConfig(provider);
        console.log(`${isValid ? '✅' : '❌'} ${provider}: ${isValid ? 'Configured' : 'Not configured'}`);
      });
    }
  },
};