// src/middleware/cache.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

interface CacheOptions {
  maxAge?: number;        // Time-to-live for cache entries in milliseconds
  maxSize?: number;       // Maximum number of cache entries
  includeQuery?: boolean; // Include query parameters in the cache key
  exclude?: Array<string | RegExp>; // Patterns to exclude from caching
}

interface CacheEntry {
  data: ResponseData;
  expiry: number;
}

export class CacheMiddleware implements Middleware {
  private cache = new Map<string, CacheEntry>();
  private options: CacheOptions;
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      maxAge: 300000, // Default 5 minutes
      maxSize: 100,
      includeQuery: true,
      exclude: [],
      ...options
    };
  }
  
  request = async (config: RequestConfig): Promise<RequestConfig> => {
    if (config.method !== 'GET') return config;
    const key = this.getCacheKey(config);
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      // Optionally attach the cached response for early resolution.
      return { ...config, _cachedResponse: entry.data };
    }
    return config;
  }
  
  response = async (response: ResponseData): Promise<ResponseData> => {
    if (response.status < 200 || response.status >= 300) return response;
    if (response.config.method !== 'GET') return response;
    const key = this.getCacheKey(response.config);
    // Enforce cache size limit: if the cache is full, remove the oldest entry.
    if (this.cache.size >= (this.options.maxSize || 100)) {
      const iterator = this.cache.keys();
      const result = iterator.next();
      if (!result.done && result.value !== undefined) {
        this.cache.delete(result.value);
      }
    }
    this.cache.set(key, { data: response, expiry: Date.now() + (this.options.maxAge || 300000) });
    return response;
  }
  
  private getCacheKey(config: RequestConfig): string {
    let key = config.url;
    if (this.options.includeQuery && config.params) {
      const sorted = Object.entries(config.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      key += `?${sorted}`;
    }
    if (this.options.exclude?.some(pattern => 
         typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key))) {
      return "";
    }
    return key;
  }
}
