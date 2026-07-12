/**
 * Authentication manager for handling login, logout, token refresh, and session management
 */

export interface AuthCredentials {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: number;
}

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

export interface AuthConfig {
  loginEndpoint: string;
  logoutEndpoint?: string;
  refreshEndpoint?: string;
  tokenStorageKey?: string;
  userStorageKey?: string;
  autoRefresh?: boolean;
  refreshThreshold?: number; // seconds before expiry to refresh
  onTokenRefresh?: (tokens: AuthTokens) => Promise<AuthTokens>;
  onAuthSuccess?: (user: AuthUser, tokens: AuthTokens) => void;
  onAuthFailure?: (error: Error) => void;
  onLogout?: () => void;
}

export class AuthManager {
  private config: AuthConfig;
  private tokens: AuthTokens | null = null;
  private user: AuthUser | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: AuthConfig) {
    this.config = {
      refreshThreshold: 300, // 5 minutes default
      autoRefresh: true,
      ...config
    };
    
    this.loadFromStorage();
    this.setupAutoRefresh();
  }

  /**
   * Authenticate user with credentials
   */
  async login(credentials: AuthCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    try {
      const response = await fetch(this.config.loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract tokens and user from response
      const tokens: AuthTokens = {
        accessToken: data.access_token || data.accessToken || data.token,
        refreshToken: data.refresh_token || data.refreshToken,
        tokenType: data.token_type || data.tokenType || 'Bearer',
        expiresIn: data.expires_in || data.expiresIn,
        expiresAt: data.expires_at || data.expiresAt,
      };

      const user: AuthUser = data.user || data;

      this.setTokens(tokens);
      this.setUser(user);
      this.saveToStorage();

      this.config.onAuthSuccess?.(user, tokens);

      return { user, tokens };
    } catch (error) {
      this.config.onAuthFailure?.(error as Error);
      throw error;
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.config.logoutEndpoint && this.tokens) {
        await fetch(this.config.logoutEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `${this.tokens.tokenType || 'Bearer'} ${this.tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearSession();
      this.config.onLogout?.();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken || !this.config.refreshEndpoint) {
      throw new Error('No refresh token available');
    }

    try {
      let newTokens: AuthTokens;

      if (this.config.onTokenRefresh) {
        newTokens = await this.config.onTokenRefresh(this.tokens);
      } else {
        const response = await fetch(this.config.refreshEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: this.tokens.refreshToken,
          }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        newTokens = {
          accessToken: data.access_token || data.accessToken || data.token,
          refreshToken: data.refresh_token || data.refreshToken || this.tokens.refreshToken,
          tokenType: data.token_type || data.tokenType || 'Bearer',
          expiresIn: data.expires_in || data.expiresIn,
          expiresAt: data.expires_at || data.expiresAt,
        };
      }

      this.setTokens(newTokens);
      this.saveToStorage();

      return newTokens;
    } catch (error) {
      // If refresh fails, clear session
      this.clearSession();
      throw error;
    }
  }

  /**
   * Get authorization header value
   */
  getAuthHeader(): string | null {
    if (!this.tokens) return null;
    return `${this.tokens.tokenType || 'Bearer'} ${this.tokens.accessToken}`;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.tokens) return false;
    
    // Check if token is expired
    if (this.tokens.expiresAt) {
      return Date.now() < this.tokens.expiresAt;
    }
    
    return true;
  }

  /**
   * Get current user
   */
  getUser(): AuthUser | null {
    return this.user;
  }

  /**
   * Get current tokens
   */
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.user?.roles?.includes(role) || false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.user?.permissions?.includes(permission) || false;
  }

  /**
   * Update user data
   */
  updateUser(user: Partial<AuthUser>): void {
    if (this.user) {
      this.user = { ...this.user, ...user };
      this.saveToStorage();
    }
  }

  private setTokens(tokens: AuthTokens): void {
    this.tokens = {
      ...tokens,
      expiresAt: tokens.expiresAt || (tokens.expiresIn ? Date.now() + tokens.expiresIn * 1000 : undefined),
    };
  }

  private setUser(user: AuthUser): void {
    this.user = user;
  }

  private clearSession(): void {
    this.tokens = null;
    this.user = null;
    this.clearStorage();
    this.clearRefreshTimer();
  }

  private setupAutoRefresh(): void {
    if (!this.config.autoRefresh || !this.tokens?.expiresAt) return;

    this.clearRefreshTimer();

    const now = Date.now();
    const expiresAt = this.tokens.expiresAt;
    const threshold = (this.config.refreshThreshold || 300) * 1000;
    const refreshTime = expiresAt - threshold - now;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTokens().catch(error => {
          console.error('Auto token refresh failed:', error);
        });
      }, refreshTime);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    const tokenKey = this.config.tokenStorageKey || 'auth_tokens';
    const userKey = this.config.userStorageKey || 'auth_user';

    try {
      if (this.tokens) {
        localStorage.setItem(tokenKey, JSON.stringify(this.tokens));
      }
      if (this.user) {
        localStorage.setItem(userKey, JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Failed to save auth data to storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const tokenKey = this.config.tokenStorageKey || 'auth_tokens';
    const userKey = this.config.userStorageKey || 'auth_user';

    try {
      const tokensStr = localStorage.getItem(tokenKey);
      const userStr = localStorage.getItem(userKey);

      if (tokensStr) {
        this.tokens = JSON.parse(tokensStr);
        
        // Check if token is expired
        if (this.tokens && this.tokens.expiresAt && Date.now() >= this.tokens.expiresAt) {
          this.clearSession();
          return;
        }
      }

      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to load auth data from storage:', error);
      this.clearSession();
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    const tokenKey = this.config.tokenStorageKey || 'auth_tokens';
    const userKey = this.config.userStorageKey || 'auth_user';

    try {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Failed to clear auth data from storage:', error);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearRefreshTimer();
  }
}

// Global auth manager instance (can be configured)
let globalAuthManager: AuthManager | null = null;

export function configureAuth(config: AuthConfig): AuthManager {
  globalAuthManager = new AuthManager(config);
  return globalAuthManager;
}

export function getAuthManager(): AuthManager | null {
  return globalAuthManager;
}

export function useAuth(): {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<{ user: AuthUser; tokens: AuthTokens }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<AuthTokens>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUser: (user: Partial<AuthUser>) => void;
} {
  const authManager = getAuthManager();
  
  if (!authManager) {
    throw new Error('Auth manager not configured. Call configureAuth() first.');
  }

  return {
    user: authManager.getUser(),
    isAuthenticated: authManager.isAuthenticated(),
    login: (credentials) => authManager.login(credentials),
    logout: () => authManager.logout(),
    refreshTokens: () => authManager.refreshTokens(),
    hasRole: (role) => authManager.hasRole(role),
    hasPermission: (permission) => authManager.hasPermission(permission),
    updateUser: (user) => authManager.updateUser(user),
  };
}
