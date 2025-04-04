import { Plugin } from "../types/plugin";
import { RequestConfig } from "../types/request";
export interface AuthOptions {
    type: "bearer" | "basic" | "oauth2";
    tokens: {
        access: string;
        refresh?: string;
    };
    refreshToken?: () => Promise<string>;
    shouldRefresh?: (error: any) => boolean;
}
export declare class AuthPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private options;
    private refreshPromise;
    private requestQueue;
    constructor(options: AuthOptions);
    private refreshToken;
    private processQueue;
    onRequest(config: RequestConfig): Promise<RequestConfig>;
    onError(error: any): Promise<any>;
}
