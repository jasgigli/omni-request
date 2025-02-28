// src/core/utils/offlineDB.ts
import { CacheEntry } from "../../middleware/revalidationCache";

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}

export function isIndexedDBAvailable(): boolean {
  return isBrowser() && "indexedDB" in window;
}

/**
 * Store offline data in IndexedDB under a "omniRequestCache" object store.
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
 * Open the "omniRequestCacheDB" IndexedDB database (version 1).
 * Creates an object store named "omniRequestCache" if not exist.
 */
async function openCacheDB(): Promise<IDBPDatabase<unknown>> {
  const db = await import("idb").then(idb => {
    return idb.openDB("omniRequestCacheDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("omniRequestCache")) {
          db.createObjectStore("omniRequestCache");
        }
      }
    });
  });
  return db;
}
