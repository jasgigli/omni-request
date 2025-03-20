import { RequestConfig, ResponseData, Middleware, Plugin } from "../types";
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
      const modifiedConfig = await this.middleware.applyRequestMiddleware(
        finalConfig
      );

      // Get the appropriate adapter for the current environment
      const adapter = getAdapter();

      // Make the request
      let response = await adapter(modifiedConfig);

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

  // HTTP method shortcuts
  async get<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, method: "GET", url });
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, method: "DELETE", url });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, method: "PATCH", url, data });
  }

  // Plugin and middleware management
  use(middleware: Middleware): this {
    this.middleware.use(middleware);
    return this;
  }

  addPlugin(plugin: Plugin): this {
    this.plugins.push(plugin);
    return this;
  }

  // Instance creation
  static create(config?: RequestConfig): RequestClient {
    return new RequestClient(config);
  }
}
