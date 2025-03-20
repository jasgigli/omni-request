import { Plugin, RequestConfig, ResponseData } from "../types";

export interface AuthOptions {
  type: "bearer" | "basic" | "oauth2";
  tokens?: {
    access?: string;
    refresh?: string;
  };
  refreshToken?: () => Promise<string>;
  shouldRefresh?: (error: any) => boolean;
}

export class AuthPlugin implements Plugin {
  private options: AuthOptions;
  private refreshPromise: Promise<string> | null = null;
  private requestQueue: Array<() => void> = [];

  constructor(options: AuthOptions) {
    this.options = options;
  }

  private async refreshToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.options.refreshToken().then((token) => {
        this.options.tokens.access = token;
        this.refreshPromise = null;
        this.processQueue();
        return token;
      });
    }
    return this.refreshPromise;
  }

  private processQueue(): void {
    while (this.requestQueue.length > 0) {
      const resolve = this.requestQueue.shift();
      resolve();
    }
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (this.options.type === "bearer" && this.options.tokens?.access) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${this.options.tokens.access}`,
        },
      };
    }
    return config;
  }

  async onError(error: any, config: RequestConfig): Promise<RequestConfig> {
    if (
      this.options.shouldRefresh?.(error) &&
      this.options.refreshToken &&
      !config.isRetryAfterRefresh
    ) {
      await new Promise<void>((resolve) => {
        this.requestQueue.push(resolve);
        if (this.requestQueue.length === 1) {
          this.refreshToken();
        }
      });

      return {
        ...config,
        isRetryAfterRefresh: true,
      };
    }

    throw error;
  }
}
