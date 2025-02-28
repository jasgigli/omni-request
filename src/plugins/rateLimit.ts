// src/plugins/rateLimit.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";

interface RateLimitOptions {
  tokensPerInterval: number;
  interval: number;
}

export function setupRateLimiter(client: RequestClient, options: RateLimitOptions): void {
  let tokens = options.tokensPerInterval;
  let lastRefill = Date.now();
  
  client.interceptors.request.use(async (config: RequestConfig) => {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const refillCount = Math.floor(elapsed / options.interval) * options.tokensPerInterval;
    if (refillCount > 0) {
      tokens = Math.min(tokens + refillCount, options.tokensPerInterval);
      lastRefill = now;
    }
    if (tokens <= 0) {
      await new Promise(resolve => setTimeout(resolve, options.interval));
      tokens = options.tokensPerInterval;
      lastRefill = Date.now();
    }
    tokens--;
    return config;
  });
}
