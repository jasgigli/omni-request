import type { Plugin } from "../../types/plugin";
import type { RequestConfig } from "../../types/request";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export class RateLimitPlugin implements Plugin {
  name = "rateLimit";
  enabled = true;
  priority = 100; // High priority to run early in the chain
  private timestamps: number[] = [];

  constructor(private options: RateLimitOptions) {}

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(
      (time) => now - time < this.options.windowMs
    );

    if (this.timestamps.length >= this.options.maxRequests) {
      const oldestTimestamp = this.timestamps[0];
      const waitTime = oldestTimestamp + this.options.windowMs - now;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.timestamps.push(now);
    return config;
  }

  destroy(): void {
    this.timestamps = [];
  }
}
