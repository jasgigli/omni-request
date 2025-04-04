import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { CacheEntry, CacheOptions, CacheStrategy } from "../types/cache";
import {
  isBrowser,
  isIndexedDBAvailable,
  storeOfflineData,
  getOfflineData,
} from "../core/utils/offlineDB";
import { createStorage, Storage } from "../utils/storage";

export interface RevalidationCacheOptions extends CacheOptions {
  offline?: boolean;
  getCacheKey?: (config: RequestConfig) => string;
  onStore?: (key: string, response: ResponseData) => void;
  onOffline?: (key: string, data: any) => void;
  staleWhileRevalidate?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

export class RevalidationCacheMiddleware implements Middleware {
  private cache = new Map<string, CacheEntry>();
  private options: Required<RevalidationCacheOptions>;
  private storage: Storage;
  private revalidating = new Set<string>();

  constructor(options: RevalidationCacheOptions = {}) {
    this.options = {
      // CacheOptions properties
      ttl: 60000, // 1 minute default
      strategy: CacheStrategy.MEMORY,
      enabled: true,
      maxAge: 0,
      maxEntries: 100,

      // RevalidationCacheOptions properties
      offline: false,
      staleWhileRevalidate: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      getCacheKey: (config: RequestConfig): string => {
        const { url, method, params, data } = config;
        if (!url) throw new Error("URL is required for cache key generation");

        const queryString = params
          ? `?${new URLSearchParams(params).toString()}`
          : "";
        const dataString = data ? JSON.stringify(data) : "";

        return `${method || "GET"}-${url}${queryString}${dataString}`;
      },
      onStore: () => {},
      onOffline: () => {},
      ...options,
    } as Required<RevalidationCacheOptions>;

    this.storage = createStorage("memory");

    if (this.options.revalidateOnFocus) {
      this.setupFocusListener();
    }
    if (this.options.revalidateOnReconnect) {
      this.setupReconnectListener();
    }
  }

  private setupFocusListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("focus", () => {
      this.revalidateAll();
    });
  }

  private setupReconnectListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      this.revalidateAll();
    });
  }

  private async revalidateAll() {
    const keys = await this.storage.keys();
    keys.forEach((key) => this.revalidate(key));
  }

  private async revalidate(key: string) {
    if (this.revalidating.has(key)) return;
    this.revalidating.add(key);

    try {
      const cached = await this.storage.get(key);
      if (!cached) return;

      const response = await fetch(cached.config.url, cached.config);
      const data = await response.json();

      await this.storage.set(key, {
        ...cached,
        data,
        timestamp: Date.now(),
      });
    } finally {
      this.revalidating.delete(key);
    }
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
        config.headers = {
          ...config.headers,
          "If-Modified-Since": entry.lastModified,
        };
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
      const headers = response.headers;
      const etag = headers["etag"];
      const lastModified = headers["last-modified"];

      // Ensure etag and lastModified are strings
      const newEntry: CacheEntry = {
        data: response,
        etag: Array.isArray(etag) ? etag[0] : etag,
        lastModified: Array.isArray(lastModified)
          ? lastModified[0]
          : lastModified,
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
      return entry.data;
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
