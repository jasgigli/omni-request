import { CircuitBreakerOptions } from '../types/circuitBreaker';

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;

  constructor(private options: CircuitBreakerOptions) {}

  async executeRequest<T>(request: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
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
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  }

  private onFailure(error: any) {
    if (this.options.monitoredErrors.includes(error.status)) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN';
      }
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }
}