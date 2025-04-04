import { Plugin } from "../types/plugin";
import { RequestConfig } from "../types/request";
export interface AuthOptions {
    getToken: () => Promise<string> | string;
    refreshToken: () => Promise<string>;
    shouldRefresh: (error: any) => boolean;
    tokenType?: string;
}
export declare class AuthPlugin implements Plugin {
    private options;
    readonly name = "auth";
    enabled: boolean;
    private isRefreshing;
    private refreshQueue;
    constructor(options: AuthOptions);
    beforeRequest(config: RequestConfig): Promise<RequestConfig>;
    afterResponse(response: any): Promise<any>;
    onError(error: any, config: RequestConfig): Promise<RequestConfig>;
    private updateConfig;
}
