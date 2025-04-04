import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { RequestError } from "../types/error";
interface RetryOptions {
    attempts: number;
    backoff: "exponential" | "linear" | "fixed";
    conditions: ((error: RequestError) => boolean)[];
}
export declare class RetryMiddleware implements Middleware {
    private options;
    constructor(options?: Partial<RetryOptions>);
    private delay;
    private shouldRetry;
    request(config: RequestConfig): Promise<RequestConfig>;
    error(error: any): Promise<any>;
}
export {};
