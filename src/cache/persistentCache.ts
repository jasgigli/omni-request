/**
 * Persistent cache implementation using IndexedDB and localStorage
 * Provides offline-first capabilities with automatic synchronization
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  etag?: string;
  lastModified?: string;
}

export interface PersistentCacheOptions {
  dbName?: string;
  storeName?: string;
  version?: number;
  fallbackToLocalStorage?: boolean;
}

export class PersistentCache {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;
  private version: number;
  private fallbackToLocalStorage: boolean;
  private ready: Promise<boolean>;

  constructor(options: PersistentCacheOptions = {}) {
    this.dbName = options.dbName || 'omnirequest-cache';
    this.storeName = options.storeName || 'responses';
    this.version = options.version || 1;
    this.fallbackToLocalStorage = options.fallbackToLocalStorage ?? true;
    
    this.ready = this.initDB();
  }

  private async initDB(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return false;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.warn('IndexedDB initialization failed, falling back to localStorage');
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    await this.ready;

    if (this.db) {
      return this.getFromIndexedDB<T>(key);
    } else if (this.fallbackToLocalStorage) {
      return this.getFromLocalStorage<T>(key);
    }

    return null;
  }

  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < result.staleTime) {
          resolve(result as CacheEntry<T>);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const item = localStorage.getItem(`${this.dbName}:${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      if (Date.now() - entry.timestamp < entry.staleTime) {
        return entry;
      }
      localStorage.removeItem(`${this.dbName}:${key}`);
      return null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    await this.ready;

    if (this.db) {
      await this.setToIndexedDB(key, entry);
    } else if (this.fallbackToLocalStorage) {
      this.setToLocalStorage(key, entry);
    }
  }

  private async setToIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ ...entry, key });

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private setToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`${this.dbName}:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('localStorage set failed:', error);
    }
  }

  async delete(key: string): Promise<void> {
    await this.ready;

    if (this.db) {
      await this.deleteFromIndexedDB(key);
    } else if (this.fallbackToLocalStorage) {
      this.deleteFromLocalStorage(key);
    }
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private deleteFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`${this.dbName}:${key}`);
    } catch (error) {
      console.warn('localStorage delete failed:', error);
    }
  }

  async clear(): Promise<void> {
    await this.ready;

    if (this.db) {
      await this.clearIndexedDB();
    } else if (this.fallbackToLocalStorage) {
      this.clearLocalStorage();
    }
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.dbName}:`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('localStorage clear failed:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.ready;

    if (this.db) {
      await this.cleanupIndexedDB();
    } else if (this.fallbackToLocalStorage) {
      this.cleanupLocalStorage();
    }
  }

  private async cleanupIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  private cleanupLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      keys.forEach(key => {
        if (key.startsWith(`${this.dbName}:`)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry: CacheEntry<any> = JSON.parse(item);
              if (now - entry.timestamp > entry.staleTime) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('localStorage cleanup failed:', error);
    }
  }

  async getSize(): Promise<number> {
    await this.ready;

    if (this.db) {
      return this.getIndexedDBSize();
    } else if (this.fallbackToLocalStorage) {
      return this.getLocalStorageSize();
    }

    return 0;
  }

  private async getIndexedDBSize(): Promise<number> {
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }

  private getLocalStorageSize(): number {
    try {
      let count = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.dbName}:`)) {
          count++;
        }
      });
      return count;
    } catch {
      return 0;
    }
  }
}

// Global persistent cache instance
export const persistentCache = new PersistentCache();
