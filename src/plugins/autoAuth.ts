// src/plugins/autoAuth.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";

/**
 * Auth strategy type: "basic", "bearer", "oauth2", or "custom".
 */
export type AuthStrategy = "basic" | "bearer" | "oauth2" | "custom";

/**
 * Configuration for automatic token refresh and multiple auth strategies.
 */
export interface AutoAuthOptions {
  type: AuthStrategy;

  // Basic auth
  username?: string;
  password?: string;

  // Bearer / OAuth2
  token?: string;

  // Custom header
  headerName?: string;
  /**
   * If headerValue is a function, it must resolve to a string.
   */
  headerValue?: string | (() => string | Promise<string>);

  /**
   * Refresh logic
   */
  refreshToken?: () => Promise<string>;
  refreshOAuthToken?: (oldToken: string) => Promise<string>;

  tokenExpiry?: number;
  onRefreshError?: (error: any) => void;
  onRefreshSuccess?: (newToken: string) => void;

  /**
   * Whether to automatically attach auth headers to each request.
   */
  autoAttach?: boolean;

  /**
   * If true, automatically handle 401 by refreshing token.
   */
  handle401?: boolean;

  /**
   * Custom logic for deciding if we should refresh on an error.
   */
  shouldRefreshOnError?: (error: RequestError) => boolean;
}

export function setupAutoAuth(client: RequestClient, options: AutoAuthOptions) {
  const {
    type,
    username,
    password,
    token,
    refreshToken,
    refreshOAuthToken,
    tokenExpiry,
    onRefreshError,
    onRefreshSuccess,
    autoAttach = true,
    handle401 = true,
    shouldRefreshOnError,
    headerName,
    headerValue
  } = options;

  let currentToken = token;
  let currentTokenExpiry = tokenExpiry;

  function isTokenExpired(): boolean {
    if (!currentTokenExpiry) return false;
    return Date.now() >= currentTokenExpiry;
  }

  async function doRefreshToken(): Promise<void> {
    if (!refreshToken && !refreshOAuthToken) return;

    try {
      if (refreshOAuthToken && currentToken) {
        const newToken = await refreshOAuthToken(currentToken);
        currentToken = newToken;
        if (onRefreshSuccess) onRefreshSuccess(newToken);
      } else if (refreshToken) {
        const newToken = await refreshToken();
        currentToken = newToken;
        if (onRefreshSuccess) onRefreshSuccess(newToken);
      }
    } catch (err) {
      if (onRefreshError) onRefreshError(err);
      throw err;
    }
  }

  // 1. Request Interceptor
  const requestId = client.interceptors.request.use(async (config: RequestConfig) => {
    // Check token expiry
    if (isTokenExpired()) {
      await doRefreshToken();
    }

    if (!autoAttach) {
      return config;
    }

    const headers = { ...config.headers };

    switch (type) {
      case "basic":
        if (username && password) {
          const encoded = Buffer.from(`${username}:${password}`).toString("base64");
          headers["Authorization"] = `Basic ${encoded}`;
        }
        break;

      case "bearer":
      case "oauth2":
        if (currentToken) {
          headers["Authorization"] = `Bearer ${currentToken}`;
        }
        break;

      case "custom":
        if (headerName) {
          // If headerValue is a function, call it
          let val: string | undefined;
          if (typeof headerValue === "function") {
            const result = await headerValue();
            if (typeof result === "string") {
              val = result;
            }
          } else if (typeof headerValue === "string") {
            val = headerValue;
          }

          if (val) {
            headers[headerName] = val;
          }
        }
        break;
    }

    return { ...config, headers };
  });

  // 2. Response Interceptor
  const responseId = client.interceptors.response.use(
    (response: ResponseData) => {
      return response;
    },
    async (error: any) => {
      if (!(error instanceof RequestError)) {
        throw error;
      }
      if (!handle401 && !shouldRefreshOnError) {
        throw error;
      }

      let doRefresh = false;
      if (handle401 && error.response?.status === 401) {
        doRefresh = true;
      } else if (shouldRefreshOnError && shouldRefreshOnError(error)) {
        doRefresh = true;
      }

      if (!doRefresh) {
        throw error;
      }

      // Attempt token refresh
      try {
        await doRefreshToken();
      } catch (err) {
        // If refresh fails, bubble original error
        throw error;
      }

      // Re-run the original request
      const originalConfig = error.config;
      if (!originalConfig) {
        throw error;
      }
      originalConfig._retryCount = (originalConfig._retryCount || 0) + 1;

      return client.request(originalConfig);
    }
  );

  // Return a function to remove interceptors if needed
  return function removeAutoAuth() {
    client.interceptors.request.eject(requestId);
    client.interceptors.response.eject(responseId);
  };
}
