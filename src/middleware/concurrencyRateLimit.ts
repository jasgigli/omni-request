import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

/**
 * Concurrency & Rate Limiting Options
 */
export interface ConcurrencyRateLimitOptions {
  globalConcurrency?: number;
  endpointConcurrency?: Record<string, number>;
  queue?: boolean;
  priorityFn?: (config: RequestConfig) => number;
  tokenBucket?: {
    capacity: number;
    refillRate: number;
    intervalMs: number;
  };
}

interface QueuedRequest {
  config: RequestConfig;
  resolve: (config: RequestConfig) => void;
  reject: (err: any) => void;
  priority: number;
}

export class ConcurrencyRateLimitMiddleware implements Middleware {
  private options: ConcurrencyRateLimitOptions;
  private globalInFlight = 0;
  private endpointInFlight = new Map<string, number>();
  private queue: QueuedRequest[] = [];
  private tokenBucket?: {
    tokens: number;
    capacity: number;
    refillRate: number;
    intervalMs: number;
    intervalId?: ReturnType<typeof setInterval>;
  };

  constructor(options: ConcurrencyRateLimitOptions) {
    this.options = options;
    if (options.tokenBucket) {
      this.tokenBucket = {
        tokens: options.tokenBucket.capacity,
        ...options.tokenBucket,
      };
      this.startTokenRefill();
    }
  }

  request = async (config: RequestConfig): Promise<RequestConfig> => {
    const canProceed = await this.acquireSlot(config);
    if (!canProceed) {
      if (!this.options.queue) {
        throw new Error(
          "Concurrency/Rate limit exceeded and queue is disabled."
        );
      }
      return new Promise<RequestConfig>((resolve, reject) => {
        const priority = this.options.priorityFn
          ? this.options.priorityFn(config)
          : 0;
        this.queue.push({ config, resolve, reject, priority });
        this.processQueue();
      });
    }
    return config;
  };

  response = async (response: ResponseData): Promise<ResponseData> => {
    this.releaseSlot(response.config);
    this.processQueue();
    return response;
  };

  error = async (error: any): Promise<any> => {
    if (error.config) {
      this.releaseSlot(error.config);
      this.processQueue();
    }
    return error;
  };

  private processQueue() {
    if (this.queue.length === 0) return;

    this.queue.sort((a, b) => b.priority - a.priority);

    let i = 0;
    while (i < this.queue.length) {
      const { config, resolve, reject } = this.queue[i];
      if (this.acquireSlotSync(config)) {
        this.queue.splice(i, 1);
        resolve(config);
      } else {
        i++;
      }
    }
  }

  private async acquireSlot(config: RequestConfig): Promise<boolean> {
    return this.acquireSlotSync(config);
  }

  private acquireSlotSync(config: RequestConfig): boolean {
    if (
      this.options.globalConcurrency &&
      this.globalInFlight >= this.options.globalConcurrency
    ) {
      return false;
    }

    const endpointLimit = this.getEndpointLimit(config);
    if (endpointLimit !== undefined) {
      const currentEndpointCount =
        this.endpointInFlight.get(this.getEndpointKey(config)) || 0;
      if (currentEndpointCount >= endpointLimit) {
        return false;
      }
    }

    if (this.tokenBucket && this.tokenBucket.tokens <= 0) {
      return false;
    }

    if (this.tokenBucket) {
      this.tokenBucket.tokens = Math.max(0, this.tokenBucket.tokens - 1);
    }
    this.globalInFlight++;
    const endpointKey = this.getEndpointKey(config);
    this.endpointInFlight.set(
      endpointKey,
      (this.endpointInFlight.get(endpointKey) || 0) + 1
    );
    return true;
  }

  private releaseSlot(config: RequestConfig) {
    this.globalInFlight = Math.max(0, this.globalInFlight - 1);
    const endpointKey = this.getEndpointKey(config);
    const current = this.endpointInFlight.get(endpointKey) || 0;
    if (current > 0) {
      this.endpointInFlight.set(endpointKey, current - 1);
    }
  }

  private getEndpointLimit(config: RequestConfig): number | undefined {
    const endpointKey = this.getEndpointKey(config);
    return this.options.endpointConcurrency?.[endpointKey];
  }

  private getEndpointKey(config: RequestConfig): string {
    // Ensure we always return a valid string, even if url is undefined
    return config.url || "default";
  }

  private startTokenRefill() {
    if (!this.tokenBucket) return;

    this.tokenBucket.intervalId = setInterval(() => {
      if (this.tokenBucket) {
        this.tokenBucket.tokens = Math.min(
          this.tokenBucket.capacity,
          this.tokenBucket.tokens + this.tokenBucket.refillRate
        );
      }
    }, this.tokenBucket.intervalMs);
  }

  dispose() {
    if (this.tokenBucket?.intervalId) {
      clearInterval(this.tokenBucket.intervalId);
    }
  }
}
