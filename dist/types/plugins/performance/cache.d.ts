import { CacheOptions } from '../../types/cache';
export declare class AdvancedCache {
    private db;
    private memoryCache;
    private options;
    constructor(options: CacheOptions);
    private initDB;
    get<T>(key: string): Promise<T | null>;
    set(key: string, data: any, options?: Partial<CacheOptions>): Promise<void>;
    private enforceLimits;
    private isExpired;
    invalidate(key: string): Promise<void>;
    clear(): Promise<void>;
}
