import { ResponseData } from "./response";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";
export type ResponseType = "json" | "text" | "blob" | "arraybuffer";

export type CacheMode =
  | "default"
  | "no-store"
  | "reload"
  | "no-cache"
  | "force-cache"
  | "only-if-cached";

export interface GraphQLOptions {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface AxiosLikeRequestConfig {
  url?: string;
  method?: HttpMethod;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: any;
  data?: any;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  auth?: {
    username: string;
    password: string;
  };
  responseType?: ResponseType;
  responseEncoding?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  maxContentLength?: number;
  maxBodyLength?: number;
  maxRedirects?: number;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
    protocol?: string;
  };
  decompress?: boolean;
  transitional?: {
    silentJSONParsing?: boolean;
    forcedJSONParsing?: boolean;
    clarifyTimeoutError?: boolean;
  };
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  validateStatus?: ((status: number) => boolean) | null;
  paramsSerializer?: (params: any) => string;
  transformRequest?: ((data: any, headers?: any) => any)[];
  transformResponse?: ((data: any) => any)[];
}

export interface RequestOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  method?: string;
  url?: string;
  data?: any;
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  validateStatus?: ((status: number) => boolean) | null;
  paramsSerializer?: (params: any) => string;
  transformRequest?: ((data: any, headers?: any) => any)[];
  transformResponse?: ((data: any) => any)[];
}

export interface RequestConfig {
  url?: string;
  method?: HttpMethod;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: any;
  data?: any;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  auth?: {
    username: string;
    password: string;
  };
  responseType?: ResponseType;
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  transformRequest?: ((data: any, headers: Record<string, string>) => any)[];
  transformResponse?: ((data: any) => any)[];
  paramsSerializer?: (params: any) => string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
}

export interface RequestResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface Interceptors {
  request: InterceptorManager<RequestConfig>;
  response: InterceptorManager<RequestResponse>;
}

export interface InterceptorManager<T> {
  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: any) => any
  ): number;
  eject(id: number): void;
}

export interface UploadOptions extends Partial<RequestOptions> {
  chunkSize?: number;
  concurrent?: number;
  resumable?: boolean;
  onProgress?: (progress: number) => void;
  metadata?: Record<string, any>;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  progress: number;
}

export interface ErrorResponse extends Error {
  config: RequestConfig;
  code?: string;
  request?: any;
  response?: RequestResponse;
  status?: number;
}

export type RequestCache =
  | "default"
  | "no-store"
  | "reload"
  | "no-cache"
  | "force-cache"
  | "only-if-cached";
