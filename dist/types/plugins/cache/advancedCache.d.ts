import { Plugin } from "../../types/plugin";
import { RequestConfig } from "../../types/request";
export declare class AdvancedCachePlugin implements Plugin {
    private options;
    readonly name = "advancedCache";
    enabled: boolean;
    private cache;
    constructor(options: AdvancedCacheOptions);
    private getCacheKey;
    private isStale;
    beforeRequest(config: RequestConfig): Promise<RequestConfig>;
    private getCacheEntry;
}
