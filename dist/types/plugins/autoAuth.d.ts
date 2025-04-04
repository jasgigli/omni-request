import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";
import { Plugin } from "../types/plugin";
/**
 * Auth strategy type: "basic", "bearer", "oauth2", or "custom".
 */
export type AuthStrategy = "basic" | "bearer" | "oauth2" | "custom";
/**
 * Configuration for automatic token refresh and multiple auth strategies.
 */
export interface AutoAuthOptions {
    type: AuthStrategy;
    username?: string;
    password?: string;
    token?: string;
    headerName?: string;
    /**
     * If headerValue is a function, it must resolve to a string.
     */
    headerValue?: string | (() => string | Promise<string>);
    /**
     * Refresh logic
     */
    refreshToken?: () => Promise<string>;
    refreshOAuthToken?: (oldToken: string) => Promise<string>;
    tokenExpiry?: number;
    onRefreshError?: (error: any) => void;
    onRefreshSuccess?: (newToken: string) => void;
    /**
     * Whether to automatically attach auth headers to each request.
     */
    autoAttach?: boolean;
    /**
     * If true, automatically handle 401 by refreshing token.
     */
    handle401?: boolean;
    /**
     * Custom logic for deciding if we should refresh on an error.
     */
    shouldRefreshOnError?: (error: RequestError) => boolean;
}
/**
 * AutoAuth plugin for automatic authentication and token refresh.
 */
export declare class AutoAuthPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private options;
    private client;
    private currentToken;
    private currentTokenExpiry;
    private requestInterceptorId;
    private responseInterceptorId;
    constructor(options: AutoAuthOptions);
    /**
     * Initialize the plugin with a client instance
     */
    init(client: RequestClient): void;
    /**
     * Handle request - add authentication headers
     */
    beforeRequest(config: RequestConfig): Promise<RequestConfig>;
    /**
     * Handle response - check for auth errors
     */
    afterResponse(response: ResponseData): Promise<ResponseData>;
    /**
     * Handle errors - refresh token on 401
     */
    onError(error: any): Promise<any>;
    /**
     * Clean up resources when plugin is destroyed
     */
    destroy(): void;
    /**
     * Check if the token is expired
     */
    private isTokenExpired;
    /**
     * Refresh the token
     */
    private doRefreshToken;
    /**
     * Set up the auth interceptors
     */
    private setupInterceptors;
    /**
     * Remove the interceptors
     */
    private removeInterceptors;
}
/**
 * Legacy function for backward compatibility
 */
export declare function setupAutoAuth(client: RequestClient, options: AutoAuthOptions): () => void;
