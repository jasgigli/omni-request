import { Plugin } from "../types/plugin";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

export interface AuthOptions {
  type: "bearer" | "basic" | "oauth2";
  tokens: {
    access: string;
    refresh?: string;
  };
  refreshToken?: () => Promise<string>;
  shouldRefresh?: (error: any) => boolean;
}

export class AuthPlugin implements Plugin {
  public name = "auth";
  public enabled = true;
  private options: AuthOptions;
  private refreshPromise: Promise<string> | null = null;
  private requestQueue: Array<() => void> = [];

  constructor(options: AuthOptions) {
    this.options = options;
  }

  private async refreshToken(): Promise<string> {
    if (!this.refreshPromise && this.options.refreshToken) {
      this.refreshPromise = this.options.refreshToken().then((token) => {
        if (this.options.tokens) {
          this.options.tokens.access = token;
        }
        this.refreshPromise = null;
        this.processQueue();
        return token;
      });
    }
    if (!this.refreshPromise) {
      throw new Error("No refresh token handler available");
    }
    return this.refreshPromise;
  }

  private processQueue(): void {
    while (this.requestQueue.length > 0) {
      const resolve = this.requestQueue.shift();
      if (resolve) {
        resolve();
      }
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

  async onError(error: any): Promise<any> {
    const config = error.config as RequestConfig;
    if (
      this.options.shouldRefresh?.(error) &&
      this.options.refreshToken &&
      !config.isRetryAfterRefresh
    ) {
      await new Promise<void>((resolve) => {
        this.requestQueue.push(resolve);
        if (this.requestQueue.length === 1) {
          this.refreshToken().catch(() => {
            // Handle refresh failure
            this.processQueue();
          });
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
