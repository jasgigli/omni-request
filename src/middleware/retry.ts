import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";

interface RetryOptions {
  attempts: number;
  backoff: "exponential" | "linear" | "fixed";
  conditions: ((error: RequestError) => boolean)[];
}

export class RetryMiddleware implements Middleware {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      attempts: 3,
      backoff: "exponential",
      conditions: [(error: RequestError) => error.status >= 500],
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

  private shouldRetry(error: RequestError, attempt: number): boolean {
    if (attempt >= this.options.attempts) {
      return false;
    }

    return this.options.conditions.some(
      (condition: (error: RequestError) => boolean) => condition(error)
    );
  }

  async request(config: RequestConfig): Promise<RequestConfig> {
    // Initialize retry attempt count if not present
    return { ...config, retryAttempt: config.retryAttempt || 0 };
  }

  async error(error: any): Promise<any> {
    if (!(error instanceof RequestError)) {
      throw error;
    }

    const config = error.config as RequestConfig;
    const attempt = (config.retryAttempt || 0) + 1;

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
