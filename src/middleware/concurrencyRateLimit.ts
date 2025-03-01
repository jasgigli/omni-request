// src/middleware/concurrencyRateLimit.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

/**
 * Concurrency & Rate Limiting Options
 */
export interface ConcurrencyRateLimitOptions {
  /**
   * Global concurrency limit (e.g., 5 means at most 5 requests in-flight).
   * If omitted, no global limit is enforced.
   */
  globalConcurrency?: number;

  /**
   * Per-endpoint concurrency limits.
   * The key is typically the request URL or a pattern, the value is the max concurrency.
   */
  endpointConcurrency?: Record<string, number>;

  /**
   * If true, requests that exceed concurrency limits are queued until slots free up.
   * If false, requests that exceed concurrency are immediately rejected with an error.
   */
  queue?: boolean;

  /**
   * Optional function to determine request priority (higher => served first).
   * If omitted, requests are handled in FIFO order.
   */
  priorityFn?: (config: RequestConfig) => number;

  /**
   * Token Bucket config for rate limiting bursts.
   * - capacity: total tokens in the bucket
   * - refillRate: how many tokens to add each interval
   * - intervalMs: how often to refill
   */
  tokenBucket?: {
    capacity: number;
    refillRate: number;
    intervalMs: number;
  };
}

/**
 * Internal structure to hold queued requests
 */
interface QueuedRequest {
  config: RequestConfig;
  resolve: (config: RequestConfig) => void;
  reject: (err: any) => void;
  priority: number;
}

/**
 * ConcurrencyRateLimitMiddleware
 * - Caps concurrency globally or per-endpoint
 * - Uses a token bucket to limit request bursts
 * - Queues requests if concurrency or tokens are unavailable
 */
export class ConcurrencyRateLimitMiddleware implements Middleware {
  private options: ConcurrencyRateLimitOptions;
  private globalInFlight = 0; // track global concurrency
  private endpointInFlight = new Map<string, number>(); // track concurrency per endpoint
  private queue: QueuedRequest[] = [];
  private tokenBucket?: {
    tokens: number;
    capacity: number;
    refillRate: number;
    intervalMs: number;
    intervalId?: NodeJS.Timer;
  };

  constructor(options: ConcurrencyRateLimitOptions = {}) {
    this.options = options;
    if (options.tokenBucket) {
      const { capacity, refillRate, intervalMs } = options.tokenBucket;
      this.tokenBucket = {
        tokens: capacity,
        capacity,
        refillRate,
        intervalMs
      };
      // Start refill interval if environment is Node or a place we can use setInterval
      // For a browser environment, this also works, but ensure you handle app lifecycle.
      this.tokenBucket.intervalId = setInterval(() => {
        if (this.tokenBucket) {
          this.tokenBucket.tokens = Math.min(
            this.tokenBucket.capacity,
            this.tokenBucket.tokens + this.tokenBucket.refillRate
          );
        }
      }, intervalMs);
    }
  }

  /**
   * The main request hook:
   * - Acquire concurrency slot (global + endpoint)
   * - Acquire token from token bucket if configured
   * - If queue is enabled and no slots/tokens, push to queue
   */
  request = async (config: RequestConfig): Promise<RequestConfig> => {
    // Only handle concurrency for actual network requests
    // If method is something else or user wants all methods, you can adjust logic here

    // 1. Attempt to acquire concurrency + token
    const canProceed = await this.acquireSlot(config);
    if (!canProceed) {
      // If queue is disabled, reject
      if (!this.options.queue) {
        throw new Error("Concurrency/Rate limit exceeded and queue is disabled.");
      }
      // Otherwise, queue the request until a slot frees up
      return new Promise<RequestConfig>((resolve, reject) => {
        const priority = this.options.priorityFn ? this.options.priorityFn(config) : 0;
        this.queue.push({ config, resolve, reject, priority });
        this.processQueue(); // Attempt to process queue in case there's space
      });
    }

    return config;
  };

  /**
   * Response hook: free the concurrency slot, return tokens if needed, then process queue
   */
  response = async (response: ResponseData): Promise<ResponseData> => {
    this.releaseSlot(response.config);
    // We can process the queue in case there's a new slot
    this.processQueue();
    return response;
  };

  /**
   * Error hook: also release slot if an error occurs
   */
  error = async (error: any): Promise<any> => {
    const config = error.config;
    if (config) {
      this.releaseSlot(config);
      this.processQueue();
    }
    return error;
  };

  /**
   * Acquire concurrency slot and token for the given request.
   * Returns true if acquired, false if no slot/token is available.
   */
  private async acquireSlot(config: RequestConfig): Promise<boolean> {
    // 1. Check token bucket
    if (this.tokenBucket) {
      if (this.tokenBucket.tokens <= 0) {
        return false;
      }
    }

    // 2. Check global concurrency
    if (this.options.globalConcurrency !== undefined) {
      if (this.globalInFlight >= this.options.globalConcurrency) {
        return false;
      }
    }

    // 3. Check endpoint concurrency
    if (this.options.endpointConcurrency) {
      const endpointLimit = this.getEndpointLimit(config);
      if (endpointLimit !== undefined) {
        const current = this.endpointInFlight.get(this.getEndpointKey(config)) || 0;
        if (current >= endpointLimit) {
          return false;
        }
      }
    }

    // If we get here, we can proceed. Acquire the slot and token
    if (this.tokenBucket) {
      this.tokenBucket.tokens = Math.max(0, this.tokenBucket.tokens - 1);
    }
    this.globalInFlight++;
    const endpointKey = this.getEndpointKey(config);
    this.endpointInFlight.set(endpointKey, (this.endpointInFlight.get(endpointKey) || 0) + 1);
    return true;
  }

  /**
   * Release concurrency slot for the given request config
   */
  private releaseSlot(config: RequestConfig) {
    this.globalInFlight = Math.max(0, this.globalInFlight - 1);
    const endpointKey = this.getEndpointKey(config);
    const current = this.endpointInFlight.get(endpointKey) || 0;
    this.endpointInFlight.set(endpointKey, Math.max(0, current - 1));
  }

  /**
   * Attempt to process queued requests in FIFO or priority order
   */
  private processQueue() {
    if (this.queue.length === 0) return;

    // Sort by priority descending (highest priority first) or FIFO if same priority
    this.queue.sort((a, b) => b.priority - a.priority);

    let i = 0;
    while (i < this.queue.length) {
      const { config, resolve, reject, priority } = this.queue[i];
      // Attempt to acquire
      if (this.acquireSlotSync(config)) {
        // If acquired, remove from queue, resolve with the config
        this.queue.splice(i, 1);
        resolve(config);
      } else {
        i++;
      }
    }
  }

  /**
   * Synchronous version of acquireSlot used for queue processing
   */
  private acquireSlotSync(config: RequestConfig): boolean {
    // 1. Token bucket
    if (this.tokenBucket) {
      if (this.tokenBucket.tokens <= 0) {
        return false;
      }
    }

    // 2. Global concurrency
    if (this.options.globalConcurrency !== undefined) {
      if (this.globalInFlight >= this.options.globalConcurrency) {
        return false;
      }
    }

    // 3. Endpoint concurrency
    if (this.options.endpointConcurrency) {
      const endpointLimit = this.getEndpointLimit(config);
      if (endpointLimit !== undefined) {
        const current = this.endpointInFlight.get(this.getEndpointKey(config)) || 0;
        if (current >= endpointLimit) {
          return false;
        }
      }
    }

    // Acquire
    if (this.tokenBucket) {
      this.tokenBucket.tokens = Math.max(0, this.tokenBucket.tokens - 1);
    }
    this.globalInFlight++;
    const endpointKey = this.getEndpointKey(config);
    this.endpointInFlight.set(endpointKey, (this.endpointInFlight.get(endpointKey) || 0) + 1);
    return true;
  }

  private getEndpointLimit(config: RequestConfig): number | undefined {
    const endpointKey = this.getEndpointKey(config);
    return this.options.endpointConcurrency?.[endpointKey];
  }

  /**
   * By default, we can just use config.url as the endpoint key.
   * Or you can do more advanced logic (e.g., parse domain/path).
   */
  private getEndpointKey(config: RequestConfig): string {
    return config.url;
  }
}
