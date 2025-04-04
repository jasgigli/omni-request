import type { Plugin } from "../../types/plugin";
import type { RequestConfig } from "../../types/request";
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
}
export declare class RateLimitPlugin implements Plugin {
    private options;
    name: string;
    enabled: boolean;
    priority: number;
    private timestamps;
    constructor(options: RateLimitOptions);
    onRequest(config: RequestConfig): Promise<RequestConfig>;
    destroy(): void;
}
