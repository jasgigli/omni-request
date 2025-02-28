// src/core/requestClient.ts
import { RequestConfig, RequestOptions } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";
import { Middleware } from "../types/middleware";
import { getAdapter, AdapterFunction } from "../adapters";
import { RequestInterceptorManager, ResponseInterceptorManager } from "./interceptors";

export class RequestClient {
  private defaults: RequestOptions = {
    url: "",
    method: "GET",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    timeout: 30000,
    validateStatus: (status: number) => status >= 200 && status < 300,
    retries: 0,
    responseType: "json",
  };

  private adapter: AdapterFunction;
  private middleware: Middleware[] = [];

  public interceptors = {
    request: new RequestInterceptorManager(),
    response: new ResponseInterceptorManager(),
  };

  /**
   * @description Accepts a partial configuration, merges with defaults,
   * and auto-selects an adapter for Node, browsers, Bun, or Deno.
   */
  constructor(config: Partial<RequestOptions> = {}) {
    this.defaults = { ...this.defaults, ...config } as RequestOptions;
    this.adapter = getAdapter();
  }

  /**
   * @description Add a middleware instance (e.g., cache, retry, timeout).
   */
  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  /**
   * @description Main request method that runs interceptors, middleware,
   * and executes the request via the adapter.
   */
  async request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    const mergedConfig = this.mergeConfig(this.defaults, config);
    try {
      // Run request interceptors
      let reqConfig = await this.interceptors.request.runInterceptors(mergedConfig);

      // Run middleware request hooks
      for (const mw of this.middleware) {
        if (mw.request) {
          reqConfig = await mw.request(reqConfig);
        }
      }

      // Execute the request
      let response = await this.adapter(reqConfig);

      // Validate status
      if (reqConfig.validateStatus && !reqConfig.validateStatus(response.status)) {
        throw new RequestError(
          `Request failed with status code ${response.status}`,
          reqConfig,
          "STATUS_ERROR",
          undefined,
          response
        );
      }

      // Run middleware response hooks
      for (const mw of this.middleware) {
        if (mw.response) {
          response = await mw.response(response);
        }
      }

      // Run response interceptors
      response = await this.interceptors.response.runInterceptors(response);
      return response as ResponseData<T>;
    } catch (error: any) {
      let finalError = error;

      // Wrap non-RequestError errors
      if (!(error instanceof RequestError)) {
        finalError = new RequestError(
          error.message || "Request failed",
          mergedConfig
        );
      }

      // Run middleware error hooks
      for (const mw of this.middleware) {
        if (mw.error) {
          try {
            const result = await mw.error(finalError);
            // If middleware returns a success response, return it
            if (!(result instanceof RequestError)) {
              return result as ResponseData<T>;
            }
            finalError = result;
          } catch (e) {
            finalError = e instanceof RequestError ? e : finalError;
          }
        }
      }
      throw finalError;
    }
  }

  // Convenience methods for HTTP verbs

  get<T = any>(
    url: string,
    config?: Omit<RequestConfig, "url" | "method">
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "GET" } as RequestConfig);
  }

  post<T = any>(
    url: string,
    data?: any,
    config?: Omit<RequestConfig, "url" | "method">
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "POST", data } as RequestConfig);
  }

  put<T = any>(
    url: string,
    data?: any,
    config?: Omit<RequestConfig, "url" | "method">
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "PUT", data } as RequestConfig);
  }

  patch<T = any>(
    url: string,
    data?: any,
    config?: Omit<RequestConfig, "url" | "method">
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "PATCH", data } as RequestConfig);
  }

  delete<T = any>(
    url: string,
    config?: Omit<RequestConfig, "url" | "method">
  ): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "DELETE" } as RequestConfig);
  }

  /**
   * @description Create a new client instance with merged defaults.
   */
  create(config: Partial<RequestOptions> = {}): RequestClient {
    return new RequestClient({ ...this.defaults, ...config } as RequestOptions);
  }

  /**
   * @description Merge defaults with user-supplied config, including headers.
   */
  private mergeConfig(
    defaults: RequestOptions,
    config: RequestConfig
  ): RequestConfig {
    return {
      ...defaults,
      ...config,
      headers: { ...defaults.headers, ...config.headers },
    };
  }
}
