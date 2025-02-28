// src/plugins/auth.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";

interface AuthOptions {
  type: 'basic' | 'bearer' | 'custom';
  username?: string;
  password?: string;
  token?: string;
  tokenType?: string;
  header?: string;
  value?: string | (() => string | Promise<string>);
  refreshToken?: () => Promise<string>;
  tokenExpiry?: number;
}

export function setupAuth(client: RequestClient, options: AuthOptions): void {
  client.interceptors.request.use(async (config: RequestConfig) => {
    const headers = { ...config.headers };
    switch (options.type) {
      case 'basic':
        if (options.username && options.password) {
          const credentials = Buffer.from(`${options.username}:${options.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'bearer':
        let token = options.token;
        if (options.refreshToken && options.tokenExpiry && Date.now() >= options.tokenExpiry) {
          token = await options.refreshToken();
          options.token = token;
        }
        if (token) {
          headers['Authorization'] = `${options.tokenType || 'Bearer'} ${token}`;
        }
        break;
      case 'custom':
        if (options.value) {
          const val = typeof options.value === 'function' ? await options.value() : options.value;
          headers[options.header || 'Authorization'] = val;
        }
        break;
    }
    return { ...config, headers };
  });
}
