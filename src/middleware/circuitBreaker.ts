import {
  CircuitBreakerOptions,
  CircuitBreakerState,
  CircuitBreakerStats,
} from "../types/circuitBreaker";

export class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime: number | null = null;

  constructor(private options: CircuitBreakerOptions) {}

  async executeRequest<T>(request: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.transitionState("HALF_OPEN");
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await request();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    this.successCount++;
    if (this.state === "HALF_OPEN") {
      this.transitionState("CLOSED");
      this.failureCount = 0;
    }
    this.options.onSuccess?.();
  }

  private onFailure(error: any) {
    if (this.options.monitoredErrors.includes(error.status)) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionState("OPEN");
      }
      this.options.onFailure?.(error);
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }

  private transitionState(newState: CircuitBreakerState) {
    this.state = newState;
    this.options.onStateChange?.(newState);
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
    };
  }
}
