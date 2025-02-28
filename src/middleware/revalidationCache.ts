// src/middleware/revalidationCache.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { isBrowser, isIndexedDBAvailable, storeOfflineData, getOfflineData } from "../core/utils/offlineDB";

/**
 * Configuration options for the advanced revalidation cache.
 */
export interface RevalidationCacheOptions {
  /**
   * Maximum age (ms) before automatically revalidating.
   * If set to 0, always revalidate on each request.
   */
  maxAge?: number;

  /**
   * Whether to store data offline (IndexedDB or fallback).
   * By default, false (memory-only).
   */
  offline?: boolean;

  /**
   * Hook to customize how we generate cache keys from request config.
   */
  getCacheKey?: (config: RequestConfig) => string;

  /**
   * Hook to allow custom logic before storing data, e.g. partial revalidation.
   */
  onStore?: (key: string, response: ResponseData) => void;

  /**
   * Hook to allow custom logic before returning offline data, e.g. stale-while-revalidate.
   */
  onOffline?: (key: string, data: any) => void;
}

interface CacheEntry {
  data: ResponseData;
  etag?: string;
  lastModified?: string;
  timestamp: number; // used for maxAge
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
      ...options
    };
  }

  /**
   * Intercept outgoing requests:
   * - If we have a cached entry with ETag or Last-Modified,
   *   attach conditional headers (If-None-Match / If-Modified-Since).
   * - Optionally serve offline data if the user is offline or revalidation fails.
   */
  request = async (config: RequestConfig): Promise<RequestConfig> => {
    // Only handle GET requests for caching
    if (config.method !== "GET") return config;

    const key = this.options.getCacheKey!(config);
    const entry = await this.getCacheEntry(key);

    if (entry) {
      // Check maxAge
      const age = Date.now() - entry.timestamp;
      if (this.options.maxAge && age < this.options.maxAge) {
        // If within maxAge, we can skip revalidation entirely
        // by short-circuiting. We'll attach the cached response
        // so the request client can return it early if desired.
        config._cachedResponse = entry.data;
        return config;
      }

      // Otherwise, attach ETag or Last-Modified for revalidation
      if (entry.etag) {
        config.headers = { ...config.headers, "If-None-Match": entry.etag };
      }
      if (entry.lastModified) {
        config.headers = { ...config.headers, "If-Modified-Since": entry.lastModified };
      }
    }

    return config;
  };

  /**
   * Intercept incoming responses:
   * - If 304 (Not Modified), return the cached data.
   * - If 200 and ETag/Last-Modified present, store/replace the cached entry.
   * - If offline is enabled, store data in IndexedDB or fallback memory.
   */
  response = async (response: ResponseData): Promise<ResponseData> => {
    const config = response.config;
    if (config.method !== "GET") return response;

    const key = this.options.getCacheKey!(config);

    // If the server says 304, we can serve from cache
    if (response.status === 304) {
      const entry = await this.getCacheEntry(key);
      if (entry) {
        // Return cached data
        return entry.data;
      }
      return response; // fallback if no cache entry found
    }

    // If 200, we can store the new entry
    if (response.status === 200) {
      const etag = response.headers["etag"];
      const lastModified = response.headers["last-modified"];
      const newEntry: CacheEntry = {
        data: response,
        etag,
        lastModified,
        timestamp: Date.now()
      };

      // Store in memory
      this.cache.set(key, newEntry);

      // Store offline if enabled
      if (this.options.offline && isBrowser() && isIndexedDBAvailable()) {
        await storeOfflineData(key, newEntry);
      }

      // Custom hook
      if (this.options.onStore) {
        this.options.onStore(key, response);
      }
    }

    return response;
  };

  /**
   * If the request fails or user is offline, we could attempt
   * to return offline data. This can be done in an 'error' hook
   * or directly in the request if desired.
   */
  error = async (error: any): Promise<any> => {
    // Example offline fallback logic:
    const config = error.config;
    if (!config || config.method !== "GET") {
      return error;
    }

    const key = this.options.getCacheKey!(config);
    // Attempt to retrieve offline data
    const entry = await this.getCacheEntry(key);
    if (entry) {
      // Optional user hook
      if (this.options.onOffline) {
        this.options.onOffline(key, entry.data);
      }
      // Return cached data as a successful response
      return entry.data;
    }

    return error;
  };

  private async getCacheEntry(key: string): Promise<CacheEntry | undefined> {
    // First check memory
    let entry = this.cache.get(key);
    if (entry) return entry;

    // Then check offline if enabled
    if (this.options.offline && isBrowser() && isIndexedDBAvailable()) {
      entry = await getOfflineData(key);
      if (entry) {
        // Store in memory for faster subsequent lookups
        this.cache.set(key, entry);
        return entry;
      }
    }
    return undefined;
  }
}
