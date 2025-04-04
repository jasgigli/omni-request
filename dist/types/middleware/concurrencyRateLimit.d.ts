import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
/**
 * Concurrency & Rate Limiting Options
 */
export interface ConcurrencyRateLimitOptions {
    globalConcurrency?: number;
    endpointConcurrency?: Record<string, number>;
    queue?: boolean;
    priorityFn?: (config: RequestConfig) => number;
    tokenBucket?: {
        capacity: number;
        refillRate: number;
        intervalMs: number;
    };
}
export declare class ConcurrencyRateLimitMiddleware implements Middleware {
    private options;
    private globalInFlight;
    private endpointInFlight;
    private queue;
    private tokenBucket?;
    constructor(options: ConcurrencyRateLimitOptions);
    request: (config: RequestConfig) => Promise<RequestConfig>;
    response: (response: ResponseData) => Promise<ResponseData>;
    error: (error: any) => Promise<any>;
    private processQueue;
    private acquireSlot;
    private acquireSlotSync;
    private releaseSlot;
    private getEndpointLimit;
    private getEndpointKey;
    private startTokenRefill;
    dispose(): void;
}
