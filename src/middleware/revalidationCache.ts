// src/middleware/revalidationCache.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { isBrowser, isIndexedDBAvailable, storeOfflineData, getOfflineData } from "../core/utils/offlineDB";

/**
 * Configuration options for the advanced revalidation cache.
 */
export interface RevalidationCacheOptions {
  maxAge?: number;
  offline?: boolean;
  getCacheKey?: (config: RequestConfig) => string;
  onStore?: (key: string, response: ResponseData) => void;
  onOffline?: (key: string, data: any) => void;
}

/**
 * Export the CacheEntry interface so offlineDB.ts can import it.
 */
export interface CacheEntry {
  data: ResponseData;
  etag?: string;
  lastModified?: string;
  timestamp: number;
}

/**
 * RevalidationCacheMiddleware implements ETag/Last-Modified logic
 * and can store data offline in IndexedDB (or fallback memory).
 */
export class RevalidationCacheMiddleware implements Middleware {
  private cache = new Map<string, CacheEntry>();
  private options: RevalidationCacheOptions;

  constructor(options: RevalidationCacheOptions = {}) {
    this.options = {
      maxAge: 0,
      offline: false,
      getCacheKey: (config) => config.url,
      ...options,
    };
  }

  request = async (config: RequestConfig): Promise<RequestConfig> => {
    if (config.method !== "GET") return config;

    const key = this.options.getCacheKey!(config);
    const entry = await this.getCacheEntry(key);

    if (entry) {
      const age = Date.now() - entry.timestamp;
      if (this.options.maxAge && age < this.options.maxAge) {
        config._cachedResponse = entry.data;
        return config;
      }
      // Attach ETag or Last-Modified for revalidation
      if (entry.etag) {
        config.headers = { ...config.headers, "If-None-Match": entry.etag };
      }
      if (entry.lastModified) {
        config.headers = { ...config.headers, "If-Modified-Since": entry.lastModified };
      }
    }
    return config;
  };

  response = async (response: ResponseData): Promise<ResponseData> => {
    const config = response.config;
    if (config.method !== "GET") return response;

    const key = this.options.getCacheKey!(config);

    // 304 => Serve from cache
    if (response.status === 304) {
      const entry = await this.getCacheEntry(key);
      if (entry) {
        return entry.data;
      }
      return response;
    }

    // 200 => Update cache
    if (response.status === 200) {
      const etag = response.headers["etag"];
      const lastModified = response.headers["last-modified"];
      const newEntry: CacheEntry = {
        data: response,
        etag,
        lastModified,
        timestamp: Date.now(),
      };

      this.cache.set(key, newEntry);
      if (this.options.offline && isBrowser() && isIndexedDBAvailable()) {
        await storeOfflineData(key, newEntry);
      }
      if (this.options.onStore) {
        this.options.onStore(key, response);
      }
    }
    return response;
  };

  error = async (error: any): Promise<any> => {
    const config = error.config;
    if (!config || config.method !== "GET") {
      return error;
    }

    const key = this.options.getCacheKey!(config);
    const entry = await this.getCacheEntry(key);
    if (entry) {
      if (this.options.onOffline) {
        this.options.onOffline(key, entry.data);
      }
      return entry.data; // Return as a successful response
    }
    return error;
  };

  private async getCacheEntry(key: string): Promise<CacheEntry | undefined> {
    let entry = this.cache.get(key);
    if (entry) return entry;

    if (this.options.offline && isBrowser() && isIndexedDBAvailable()) {
      entry = await getOfflineData(key);
      if (entry) {
        this.cache.set(key, entry);
        return entry;
      }
    }
    return undefined;
  }
}
