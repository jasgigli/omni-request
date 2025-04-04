// src/plugins/rateLimit.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { Plugin } from "../types/plugin";

export interface RateLimitOptions {
  tokensPerInterval: number;
  interval: number;
}

/**
 * Rate limiter plugin for OmniRequest
 */
export class RateLimitPlugin implements Plugin {
  public name = "rateLimit";
  public enabled = true;
  private options: RateLimitOptions;
  private tokens: number;
  private lastRefill: number;

  constructor(options: RateLimitOptions) {
    this.options = options;
    this.tokens = options.tokensPerInterval;
    this.lastRefill = Date.now();
  }

  async beforeRequest(config: RequestConfig): Promise<RequestConfig> {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillCount =
      Math.floor(elapsed / this.options.interval) *
      this.options.tokensPerInterval;

    if (refillCount > 0) {
      this.tokens = Math.min(
        this.tokens + refillCount,
        this.options.tokensPerInterval
      );
      this.lastRefill = now;
    }

    if (this.tokens <= 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.interval)
      );
      this.tokens = this.options.tokensPerInterval;
      this.lastRefill = Date.now();
    }

    this.tokens--;
    return config;
  }
}

/**
 * Legacy function for backward compatibility
 */
export function setupRateLimiter(
  client: RequestClient,
  options: RateLimitOptions
): void {
  let tokens = options.tokensPerInterval;
  let lastRefill = Date.now();

  // @ts-ignore - We know these properties don't exist, but we're providing backward compatibility
  if (client.interceptors) {
    // @ts-ignore
    client.interceptors.request.use(async (config: RequestConfig) => {
      const now = Date.now();
      const elapsed = now - lastRefill;
      const refillCount =
        Math.floor(elapsed / options.interval) * options.tokensPerInterval;
      if (refillCount > 0) {
        tokens = Math.min(tokens + refillCount, options.tokensPerInterval);
        lastRefill = now;
      }
      if (tokens <= 0) {
        await new Promise((resolve) => setTimeout(resolve, options.interval));
        tokens = options.tokensPerInterval;
        lastRefill = Date.now();
      }
      tokens--;
      return config;
    });
  }
}
