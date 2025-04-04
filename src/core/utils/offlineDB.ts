// src/core/utils/offlineDB.ts
import { openDB, IDBPDatabase } from "idb";
import { CacheEntry } from "../../types/cache";

/**
 * Check if we're in a browser environment.
 */
export function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.document !== "undefined"
  );
}

/**
 * Check if indexedDB is available (i.e., not in Node).
 */
export function isIndexedDBAvailable(): boolean {
  return isBrowser() && "indexedDB" in window;
}

/**
 * Store offline data in IndexedDB under "omniRequestCache".
 */
export async function storeOfflineData(
  key: string,
  entry: CacheEntry
): Promise<void> {
  const db = await openCacheDB();
  await db.put("omniRequestCache", entry, key);
}

/**
 * Retrieve offline data from IndexedDB by key.
 */
export async function getOfflineData(
  key: string
): Promise<CacheEntry | undefined> {
  const db = await openCacheDB();
  return db.get("omniRequestCache", key);
}

/**
 * Interface describing our object stores.
 */
interface OmniRequestDB {
  omniRequestCache: {
    key: string;
    value: CacheEntry;
  };
}

/**
 * Open the "omniRequestCacheDB" IndexedDB database (version 1).
 * Creates an object store named "omniRequestCache" if not existing.
 */
async function openCacheDB(): Promise<IDBPDatabase<OmniRequestDB>> {
  return openDB<OmniRequestDB>("omniRequestCacheDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("omniRequestCache")) {
        db.createObjectStore("omniRequestCache");
      }
    },
  });
}
