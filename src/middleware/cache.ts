import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { CacheEntry, CacheOptions, CacheStrategy } from "../types/cache";

export interface CacheMiddlewareOptions extends CacheOptions {
  ttl: number;
  strategy: CacheStrategy;
  enabled: boolean;
}

export class CacheMiddleware implements Middleware {
  private cache: Map<string, { data: ResponseData; timestamp: number }> =
    new Map();
  private options: CacheMiddlewareOptions;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 60000, // Default 1 minute
      strategy: CacheStrategy.MEMORY,
      enabled: true,
      ...options,
    } as CacheMiddlewareOptions;
  }

  private getCacheKey(config: RequestConfig): string {
    const { url, method, data } = config;
    return `${method}-${url}-${JSON.stringify(data)}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.options.ttl;
  }

  async request(config: RequestConfig): Promise<RequestConfig> {
    if (config.method !== "GET" || !this.options.enabled) {
      return config;
    }

    const cacheKey = this.getCacheKey(config);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached.timestamp)) {
      throw {
        isCache: true,
        data: cached.data,
      };
    }

    return config;
  }

  async response(response: ResponseData): Promise<ResponseData> {
    if (response.config.method === "GET" && this.options.enabled) {
      const cacheKey = this.getCacheKey(response.config);
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });
    }
    return response;
  }

  async error(error: any): Promise<any> {
    if (error.isCache) {
      return error.data;
    }
    throw error;
  }
}
