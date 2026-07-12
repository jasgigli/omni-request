import { Middleware } from '../types/middleware';
import { RequestConfig } from '../types/request';
import { ResponseData } from '../types/response';

export interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  burstSize?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

export class RateLimitMiddleware implements Middleware {
  private config: Required<RateLimitConfig>;
  private state: RateLimitState;
  private requestQueue: Array<() => void> = [];

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      requestsPerSecond: config.requestsPerSecond || 0,
      requestsPerMinute: config.requestsPerMinute || 60,
      requestsPerHour: config.requestsPerHour || 0,
      burstSize: config.burstSize || 10,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
    };

    this.state = {
      tokens: this.config.burstSize,
      lastRefill: Date.now(),
    };

    this.startRefillInterval();
  }

  async request(config: RequestConfig): Promise<RequestConfig> {
    await this.waitForToken();
    return config;
  }

  async response(response: ResponseData): Promise<ResponseData> {
    if (this.config.skipSuccessfulRequests) {
      this.refundToken();
    }
    return response;
  }

  async error(error: any): Promise<any> {
    if (this.config.skipFailedRequests) {
      this.refundToken();
    }
    throw error;
  }

  private async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.state.tokens > 0) {
      this.state.tokens--;
      return;
    }

    // Wait for token to become available
    await new Promise<void>((resolve) => {
      this.requestQueue.push(resolve);
    });
  }

  private refundToken(): void {
    this.state.tokens = Math.min(
      this.state.tokens + 1,
      this.config.burstSize
    );
  }

  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = now - this.state.lastRefill;

    if (timeSinceLastRefill < 1000) {
      return;
    }

    let tokensToAdd = 0;

    // Calculate tokens based on per-second rate
    if (this.config.requestsPerSecond > 0) {
      const secondsPassed = Math.floor(timeSinceLastRefill / 1000);
      tokensToAdd = secondsPassed * this.config.requestsPerSecond;
    }
    // Calculate tokens based on per-minute rate
    else if (this.config.requestsPerMinute > 0) {
      const minutesPassed = timeSinceLastRefill / 60000;
      tokensToAdd = Math.floor(minutesPassed * this.config.requestsPerMinute);
    }
    // Calculate tokens based on per-hour rate
    else if (this.config.requestsPerHour > 0) {
      const hoursPassed = timeSinceLastRefill / 3600000;
      tokensToAdd = Math.floor(hoursPassed * this.config.requestsPerHour);
    }

    if (tokensToAdd > 0) {
      this.state.tokens = Math.min(
        this.state.tokens + tokensToAdd,
        this.config.burstSize
      );
      this.state.lastRefill = now;

      // Process queued requests
      this.processQueue();
    }
  }

  private processQueue(): void {
    while (this.requestQueue.length > 0 && this.state.tokens > 0) {
      this.state.tokens--;
      const resolve = this.requestQueue.shift();
      resolve?.();
    }
  }

  private startRefillInterval(): void {
    setInterval(() => {
      this.refillTokens();
    }, 1000);
  }

  /**
   * Reset the rate limiter state
   */
  reset(): void {
    this.state = {
      tokens: this.config.burstSize,
      lastRefill: Date.now(),
    };
    this.requestQueue = [];
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    tokens: number;
    burstSize: number;
    queuedRequests: number;
  } {
    return {
      tokens: this.state.tokens,
      burstSize: this.config.burstSize,
      queuedRequests: this.requestQueue.length,
    };
  }
}
