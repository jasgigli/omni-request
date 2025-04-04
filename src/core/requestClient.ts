import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import type { Plugin } from "../types/plugin";
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
    requestConfig: Partial<RequestConfig> = {}
  ): Promise<ResponseData<T>> {
    let finalConfig = { ...this.config, ...requestConfig };

    try {
      // Apply plugins pre-request
      for (const plugin of this.plugins) {
        if (plugin.onRequest) {
          finalConfig = await plugin.onRequest(finalConfig);
        } else if (plugin.beforeRequest) {
          finalConfig = await plugin.beforeRequest(finalConfig);
        }
      }

      // Apply middleware pre-request
      finalConfig = await this.middleware.applyRequestMiddleware(finalConfig);

      // Get the appropriate adapter for the current environment
      const adapter = getAdapter();

      // Make the request using the adapter's request method
      let response = await adapter.request<T>(finalConfig);

      // Apply middleware post-response
      response = await this.middleware.applyResponseMiddleware(response);

      // Apply plugins post-response
      for (const plugin of this.plugins) {
        if (plugin.onResponse) {
          response = await plugin.onResponse(response);
        } else if (plugin.afterResponse) {
          response = await plugin.afterResponse(response);
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

  async get<T = any>(
    url: string,
    config: Partial<RequestConfig> = {}
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: "GET",
      url,
    });
  }

  async post<T = any>(
    url: string,
    data?: any,
    config: Partial<RequestConfig> = {}
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: "POST",
      url,
      data,
    });
  }

  async put<T = any>(
    url: string,
    data?: any,
    config: Partial<RequestConfig> = {}
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
  }

  async delete<T = any>(
    url: string,
    config: Partial<RequestConfig> = {}
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: "DELETE",
      url,
    });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config: Partial<RequestConfig> = {}
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: "PATCH",
      url,
      data,
    });
  }

  getMiddlewareManager(): IMiddlewareManager {
    return this.middleware;
  }
}
