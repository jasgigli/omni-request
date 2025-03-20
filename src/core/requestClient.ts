import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import type { Plugin } from "../types";
import { MiddlewareManager } from "./middleware/middlewareManager";
import { getAdapter } from "../adapters";
import { createDefaultConfig } from "./config";

export class RequestClient {
  private config: RequestConfig;
  private middleware: MiddlewareManager;
  private plugins: Plugin[];

  constructor(config: RequestConfig = {}) {
    this.config = { ...createDefaultConfig(), ...config };
    this.middleware = new MiddlewareManager();
    this.plugins = [];
  }

  async request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    let finalConfig = { ...this.config, ...config };

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
}
