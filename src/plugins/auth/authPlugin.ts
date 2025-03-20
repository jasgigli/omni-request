import { Plugin } from '../../types/plugin';
import { RequestConfig } from '../../types/request';

export interface AuthOptions {
  getToken: () => Promise<string> | string;
  refreshToken: () => Promise<string>;
  shouldRefresh: (error: any) => boolean;
  tokenType?: string;
}

export class AuthPlugin implements Plugin {
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  constructor(private options: AuthOptions) {}

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const token = await this.options.getToken();
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `${this.options.tokenType || 'Bearer'} ${token}`
      }
    };
  }

  async onError(error: any, config: RequestConfig): Promise<RequestConfig> {
    if (!this.options.shouldRefresh(error)) {
      throw error;
    }

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push((token) => {
          resolve(this.updateConfig(config, token));
        });
      });
    }

    try {
      this.isRefreshing = true;
      const newToken = await this.options.refreshToken();
      this.refreshQueue.forEach((callback) => callback(newToken));
      this.refreshQueue = [];
      return this.updateConfig(config, newToken);
    } finally {
      this.isRefreshing = false;
    }
  }

  private updateConfig(config: RequestConfig, token: string): RequestConfig {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `${this.options.tokenType || 'Bearer'} ${token}`
      }
    };
  }
}