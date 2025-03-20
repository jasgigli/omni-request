// src/types/index.ts
export * from "./request";
export * from "./response";
export * from "./middleware";
export * from "./error";

export interface RequestConfig {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  baseURL?: string;
  headers?: Record<string, string>;
  params?: any;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: "json" | "text" | "blob" | "arraybuffer";
  signal?: AbortSignal;
  cache?: CacheOptions;
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  middleware?: Middleware[];
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface Plugin {
  onRequest?: (config: RequestConfig) => Promise<RequestConfig>;
  onResponse?: (response: ResponseData) => Promise<ResponseData>;
  onError?: (error: any, config: RequestConfig) => Promise<RequestConfig>;
}

export interface Middleware {
  request?: (config: RequestConfig) => Promise<RequestConfig>;
  response?: (response: ResponseData) => Promise<ResponseData>;
  error?: (error: any) => Promise<any>;
}
