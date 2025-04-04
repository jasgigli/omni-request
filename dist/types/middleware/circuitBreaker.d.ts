import { CircuitBreakerOptions, CircuitBreakerStats } from "../types/circuitBreaker";
export declare class CircuitBreaker {
    private options;
    private state;
    private failureCount;
    private successCount;
    private totalRequests;
    private lastFailureTime;
    constructor(options: CircuitBreakerOptions);
    executeRequest<T>(request: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldAttemptReset;
    private transitionState;
    getStats(): CircuitBreakerStats;
}
