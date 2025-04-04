import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import type { Plugin } from "../types/plugin";
import type { IMiddlewareManager } from "../types/middleware";
export declare class RequestClient {
    private config;
    private middleware;
    private plugins;
    constructor(config?: Partial<RequestConfig>);
    request<T = any>(requestConfig?: Partial<RequestConfig>): Promise<ResponseData<T>>;
    use(plugin: Plugin): void;
    getMiddlewareManager(): IMiddlewareManager;
}
