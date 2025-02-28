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
      "Content-Type": "application/json"
    },
    timeout: 30000,
    validateStatus: (status: number) => status >= 200 && status < 300,
    retries: 0,
    responseType: "json"
  };

  private adapter: AdapterFunction;
  private middleware: Middleware[] = [];

  public interceptors = {
    request: new RequestInterceptorManager(),
    response: new ResponseInterceptorManager()
  };

  // Accept a partial configuration so defaults are merged
  constructor(config: Partial<RequestOptions> = {}) {
    this.defaults = { ...this.defaults, ...config } as RequestOptions;
    this.adapter = getAdapter();
  }

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  async request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    const mergedConfig = this.mergeConfig(this.defaults, config);
    try {
      let reqConfig = await this.interceptors.request.runInterceptors(mergedConfig);
      for (const mw of this.middleware) {
        if (mw.request) {
          reqConfig = await mw.request(reqConfig);
        }
      }
      let response = await this.adapter(reqConfig);

      if (reqConfig.validateStatus && !reqConfig.validateStatus(response.status)) {
        throw new RequestError(
          `Request failed with status code ${response.status}`,
          reqConfig,
          "STATUS_ERROR",
          undefined,
          response
        );
      }

      for (const mw of this.middleware) {
        if (mw.response) {
          response = await mw.response(response);
        }
      }

      response = await this.interceptors.response.runInterceptors(response);
      return response as ResponseData<T>;
    } catch (error: any) {
      let finalError = error;
      if (!(error instanceof RequestError)) {
        finalError = new RequestError(error.message || "Request failed", mergedConfig);
      }
      for (const mw of this.middleware) {
        if (mw.error) {
          try {
            const result = await mw.error(finalError);
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

  get<T = any>(url: string, config?: Omit<RequestConfig, "url" | "method">): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "GET" } as RequestConfig);
  }

  post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, "url" | "method">): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "POST", data } as RequestConfig);
  }

  put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, "url" | "method">): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "PUT", data } as RequestConfig);
  }

  patch<T = any>(url: string, data?: any, config?: Omit<RequestConfig, "url" | "method">): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "PATCH", data } as RequestConfig);
  }

  delete<T = any>(url: string, config?: Omit<RequestConfig, "url" | "method">): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: "DELETE" } as RequestConfig);
  }

  // Accept partial options for creating new client instances
  create(config: Partial<RequestOptions> = {}): RequestClient {
    return new RequestClient({ ...this.defaults, ...config } as RequestOptions);
  }

  private mergeConfig(defaults: RequestOptions, config: RequestConfig): RequestConfig {
    return {
      ...defaults,
      ...config,
      headers: { ...defaults.headers, ...config.headers }
    };
  }
}

export default new RequestClient();
