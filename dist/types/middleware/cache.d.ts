import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { CacheOptions, CacheStrategy } from "../types/cache";
export interface CacheMiddlewareOptions extends CacheOptions {
    ttl: number;
    strategy: CacheStrategy;
    enabled: boolean;
}
export declare class CacheMiddleware implements Middleware {
    private cache;
    private options;
    constructor(options?: CacheOptions);
    private getCacheKey;
    private isExpired;
    request(config: RequestConfig): Promise<RequestConfig>;
    response(response: ResponseData): Promise<ResponseData>;
    error(error: any): Promise<any>;
}
