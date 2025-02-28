// src/core/utils/offlineDB.ts
import { openDB, IDBPDatabase } from "idb";
import { CacheEntry } from "../../middleware/revalidationCache";

/**
 * Check if we're in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
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
export async function storeOfflineData(key: string, entry: CacheEntry): Promise<void> {
  try {
    const db = await openCacheDB();
    const tx = db.transaction("omniRequestCache", "readwrite");
    const store = tx.objectStore("omniRequestCache");
    await store.put(entry, key);
    await tx.done;
    db.close();
  } catch (err) {
    console.warn("Failed to store data in IndexedDB:", err);
  }
}

/**
 * Retrieve offline data from IndexedDB by key.
 */
export async function getOfflineData(key: string): Promise<CacheEntry | undefined> {
  try {
    const db = await openCacheDB();
    const tx = db.transaction("omniRequestCache", "readonly");
    const store = tx.objectStore("omniRequestCache");
    const data = await store.get(key);
    db.close();
    return data;
  } catch (err) {
    console.warn("Failed to retrieve data from IndexedDB:", err);
    return undefined;
  }
}

/**
 * Interface describing our object stores.
 */
interface OmniRequestDB {
  omniRequestCache: CacheEntry;
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
    }
  });
}
