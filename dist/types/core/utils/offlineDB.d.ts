import { CacheEntry } from "../../types/cache";
/**
 * Check if we're in a browser environment.
 */
export declare function isBrowser(): boolean;
/**
 * Check if indexedDB is available (i.e., not in Node).
 */
export declare function isIndexedDBAvailable(): boolean;
/**
 * Store offline data in IndexedDB under "omniRequestCache".
 */
export declare function storeOfflineData(key: string, entry: CacheEntry): Promise<void>;
/**
 * Retrieve offline data from IndexedDB by key.
 */
export declare function getOfflineData(key: string): Promise<CacheEntry | undefined>;
