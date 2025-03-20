import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import type { Plugin } from "../types";
import type { IMiddlewareManager } from "../types/middleware";
import { MiddlewareManager } from "./middleware/middlewareManager";
import { getAdapter } from "../adapters";
import { createDefaultConfig } from "./config";

export class RequestClient {
  private config: RequestConfig;
  private middleware: IMiddlewareManager;
  private plugins: Plugin[];

  constructor(config: Partial<RequestConfig> = {}) {
    this.config = { ...createDefaultConfig(), ...config };
    this.middleware = new MiddlewareManager();
    this.plugins = [];
  }

  async request<T = any>(
    requestConfig: RequestConfig
  ): Promise<ResponseData<T>> {
    if (!requestConfig.url) {
      throw new Error("URL is required for making a request");
    }

    let finalConfig = { ...this.config, ...requestConfig };

    try {
      // Apply plugins pre-request
      for (const plugin of this.plugins) {
        if (plugin.onRequest) {
          finalConfig = await plugin.onRequest(finalConfig);
        }
      }

      // Apply middleware pre-request
      finalConfig = await this.middleware.applyRequestMiddleware(finalConfig);

      // Get the appropriate adapter for the current environment
      const adapter = getAdapter();

      // Make the request
      let response = await adapter(finalConfig);

      // Apply middleware post-response
      response = await this.middleware.applyResponseMiddleware(response);

      // Apply plugins post-response
      for (const plugin of this.plugins) {
        if (plugin.onResponse) {
          response = await plugin.onResponse(response);
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  use(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  getMiddlewareManager(): IMiddlewareManager {
    return this.middleware;
  }
}
