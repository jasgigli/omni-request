import { Middleware, RequestConfig, RetryOptions } from "../types";

export class RetryMiddleware implements Middleware {
  private options: RetryOptions;

  constructor(options: RetryOptions) {
    this.options = {
      attempts: 3,
      backoff: "exponential",
      conditions: [(error) => error.status >= 500],
      ...options,
    };
  }

  private async delay(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    let delay: number;

    switch (this.options.backoff) {
      case "exponential":
        delay = Math.pow(2, attempt) * baseDelay;
        break;
      case "linear":
        delay = attempt * baseDelay;
        break;
      default:
        delay = baseDelay;
    }

    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.options.attempts) {
      return false;
    }

    return this.options.conditions.some((condition) => condition(error));
  }

  async error(error: any, config: RequestConfig): Promise<any> {
    let attempt = (config.retryAttempt || 0) + 1;

    if (this.shouldRetry(error, attempt)) {
      await this.delay(attempt);

      return {
        ...config,
        retryAttempt: attempt,
      };
    }

    throw error;
  }
}
