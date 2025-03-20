import { Plugin } from "../../core/plugin/pluginManager";
import { openDB } from 'idb';

export class AdvancedCachePlugin implements Plugin {
  name = "advancedCache";
  enabled = true;
  private cache: Map<string, CacheEntry> = new Map();
  private db?: IDBPDatabase;

  constructor(options: CacheOptions = {}) {
    this.options = {
      strategy: 'stale-while-revalidate',
      maxAge: 5 * 60 * 1000, // 5 minutes
      ...options
    };
    this.initializeDB();
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const key = this.getCacheKey(config);
    const entry = await this.getCacheEntry(key);

    if (!entry) return config;

    switch (this.options.strategy) {
      case 'cache-first':
        if (!this.isStale(entry)) {
          return entry.response;
        }
        break;

      case 'stale-while-revalidate':
        if (entry) {
          // Return cached data immediately
          setTimeout(() => this.revalidate(key, config), 0);
          return entry.response;
        }
        break;

      case 'network-first':
        try {
          const response = await this.client.request(config);
          await this.setCacheEntry(key, response);
          return response;
        } catch (error) {
          if (entry) return entry.response;
          throw error;
        }
    }

    return config;
  }

  async onResponse(response: ResponseData): Promise<ResponseData> {
    if (response.status === 200) {
      const key = this.getCacheKey(response.config);
      await this.setCacheEntry(key, response);
    }
    return response;
  }

  private async revalidate(key: string, config: RequestConfig) {
    try {
      const response = await this.client.request(config);
      await this.setCacheEntry(key, response);
    } catch (error) {
      console.error('Background revalidation failed:', error);
    }
  }

  private async getCacheEntry(key: string): Promise<CacheEntry | undefined> {
    // Try memory cache first
    let entry = this.cache.get(key);
    if (entry) return entry;

    // Try persistent cache
    entry = await this.db?.get('cache', key);
    if (entry) {
      this.cache.set(key, entry);
      return entry;
    }

    return undefined;
  }

  private async setCacheEntry(key: string, response: ResponseData) {
    const entry: CacheEntry = {
      response,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);
    await this.db?.put('cache', entry, key);
  }
}