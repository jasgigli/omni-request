import { RequestError } from "../types/error";
import { RequestConfig } from "../types/request";
import { Middleware } from "../types/middleware";
import { ResponseData } from "../types/response";
interface CircuitBreakerConfig {
    threshold: number;
    cooldown: number;
}
interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    jitter: boolean;
    circuitBreaker?: CircuitBreakerConfig;
}
export declare class IntelligentRetryMiddleware implements Middleware {
    private circuits;
    private config;
    constructor(config?: Partial<RetryConfig>);
    private getCircuitKey;
    private getCircuitState;
    request: (config: RequestConfig) => Promise<RequestConfig>;
    error: (error: RequestError) => Promise<ResponseData | RequestError>;
    private shouldRetry;
    private calculateDelay;
    private sleep;
    private incrementFailure;
    private resetCircuit;
}
export {};
