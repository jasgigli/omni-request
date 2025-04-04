import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { Plugin } from "../types/plugin";
export interface RateLimitOptions {
    tokensPerInterval: number;
    interval: number;
}
/**
 * Rate limiter plugin for OmniRequest
 */
export declare class RateLimitPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private options;
    private tokens;
    private lastRefill;
    constructor(options: RateLimitOptions);
    beforeRequest(config: RequestConfig): Promise<RequestConfig>;
}
/**
 * Legacy function for backward compatibility
 */
export declare function setupRateLimiter(client: RequestClient, options: RateLimitOptions): void;
