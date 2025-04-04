import { RequestClient } from "../core/requestClient";
interface RateLimitOptions {
    tokensPerInterval: number;
    interval: number;
}
export declare function setupRateLimiter(client: RequestClient, options: RateLimitOptions): void;
export {};
