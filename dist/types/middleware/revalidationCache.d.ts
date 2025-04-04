import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { CacheOptions } from "../types/cache";
export interface RevalidationCacheOptions extends CacheOptions {
    offline?: boolean;
    getCacheKey?: (config: RequestConfig) => string;
    onStore?: (key: string, response: ResponseData) => void;
    onOffline?: (key: string, data: any) => void;
    staleWhileRevalidate?: boolean;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
}
export declare class RevalidationCacheMiddleware implements Middleware {
    private cache;
    private options;
    private storage;
    private revalidating;
    constructor(options?: RevalidationCacheOptions);
    private setupFocusListener;
    private setupReconnectListener;
    private revalidateAll;
    private revalidate;
    request: (config: RequestConfig) => Promise<RequestConfig>;
    response: (response: ResponseData) => Promise<ResponseData>;
    error: (error: any) => Promise<any>;
    private getCacheEntry;
}
