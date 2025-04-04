import { RequestClient } from "../core/requestClient";
import { RequestError } from "../types/error";
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
export declare function setupAutoAuth(client: RequestClient, options: AutoAuthOptions): () => void;
