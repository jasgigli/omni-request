import { HttpMethod } from "./http";
export type ResponseType = "json" | "text" | "blob" | "arraybuffer";
export type CacheMode = "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached";
export interface GraphQLOptions {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
}
export interface RequestConfig {
    url?: string;
    baseURL?: string;
    method?: HttpMethod;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    validateStatus?: (status: number) => boolean;
    responseType?: ResponseType;
    cache?: CacheMode;
    signal?: AbortSignal;
    withCredentials?: boolean;
    auth?: {
        username: string;
        password: string;
    };
    graphql?: GraphQLOptions;
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
export interface BaseRequestConfig {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    baseURL?: string;
    timeout?: number;
    responseType?: string;
    validateStatus?: (status: number) => boolean;
    [key: string]: any;
}
export interface RequestConfig extends BaseRequestConfig {
    url?: string;
    baseURL?: string;
    method?: HttpMethod;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    validateStatus?: (status: number) => boolean;
    responseType?: ResponseType;
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
    use(onFulfilled?: (value: T) => T | Promise<T>, onRejected?: (error: any) => any): number;
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
export interface ErrorResponse {
    message: string;
    code?: string;
    config?: RequestConfig;
    status?: number;
}
export type RequestCache = "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached";
