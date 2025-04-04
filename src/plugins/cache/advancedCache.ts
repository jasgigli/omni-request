import { Plugin } from "../../types/plugin";
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
import { CacheEntry } from "../../types/cache";

export class AdvancedCachePlugin implements Plugin {
  public readonly name = "advancedCache";
  public enabled = true;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(private options: AdvancedCacheOptions) {}

  private getCacheKey(config: RequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.data)}`;
  }

  private isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.options.ttl;
  }

  async beforeRequest(config: RequestConfig): Promise<RequestConfig> {
    const key = this.getCacheKey(config);
    const entry = await this.getCacheEntry(key);

    if (entry && !this.isStale(entry)) {
      return entry.data;
    }

    return config;
  }

  private async getCacheEntry(key: string): Promise<CacheEntry | undefined> {
    return this.cache.get(key);
  }
}
