import { RequestConfig } from "./request";
import { ResponseData } from "./response";

export enum CacheStrategy {
  CACHE_FIRST = "cache-first",
  NETWORK_FIRST = "network-first",
  STALE_WHILE_REVALIDATE = "stale-while-revalidate",
  MEMORY = "memory",
}

export interface CacheEntry {
  data: ResponseData;
  timestamp: number;
  etag?: string;
  lastModified?: string;
  config?: RequestConfig;
}

export interface CacheOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  enabled?: boolean;
  maxAge?: number;
  maxEntries?: number;
  staleWhileRevalidate?: boolean;
  offline?: boolean;
}
