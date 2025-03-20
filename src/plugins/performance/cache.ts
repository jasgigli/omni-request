import { openDB, IDBPDatabase } from 'idb';
import { CacheStrategy, CacheEntry, CacheOptions } from '../../types/cache';

export class AdvancedCache {
  private db: IDBPDatabase | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private options: CacheOptions;

  constructor(options: CacheOptions) {
    this.options = {
      strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
      ...options,
    };
    this.initDB();
  }

  private async initDB() {
    if (typeof window === 'undefined') return;

    this.db = await openDB('omnirequest-cache', 1, {
      upgrade(db) {
        db.createObjectStore('cache', { keyPath: 'key' });
      },
    });
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data as T;
    }

    // Check IndexedDB if available
    if (this.db) {
      const dbEntry = await this.db.get('cache', key);
      if (dbEntry && !this.isExpired(dbEntry)) {
        // Update memory cache
        this.memoryCache.set(key, dbEntry);
        return dbEntry.data as T;
      }
    }

    return null;
  }

  async set(key: string, data: any, options?: Partial<CacheOptions>): Promise<void> {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      maxAge: options?.maxAge || this.options.maxAge,
    };

    // Update memory cache
    this.memoryCache.set(key, entry);

    // Update IndexedDB if available
    if (this.db) {
      await this.db.put('cache', entry);
    }

    // Enforce cache size limits
    await this.enforceLimits();
  }

  private async enforceLimits() {
    if (this.memoryCache.size > this.options.maxEntries) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.options.maxEntries);
      for (const [key] of toRemove) {
        this.memoryCache.delete(key);
        if (this.db) {
          await this.db.delete('cache', key);
        }
      }
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.maxAge;
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.db) {
      await this.db.delete('cache', key);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    if (this.db) {
      await this.db.clear('cache');
    }
  }
}