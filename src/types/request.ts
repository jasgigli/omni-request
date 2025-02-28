// src/types/request.ts
export interface RequestConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
    withCredentials?: boolean;
    cache?: RequestCache;
    retries?: number;
    retryDelay?: number | ((retryCount: number) => number);
    validateStatus?: (status: number) => boolean;
    transformRequest?: Array<(data: any, headers: Record<string, string>) => any>;
    transformResponse?: Array<(data: any) => any>;
    signal?: AbortSignal;
    // Internal properties
    _retryCount?: number;
    _cachedResponse?: any;
  }
  
  export interface RequestOptions extends RequestConfig {
    baseURL?: string;
  }
  