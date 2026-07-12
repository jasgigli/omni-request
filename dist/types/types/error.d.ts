import { RequestConfig } from "./request";
export declare enum ErrorType {
    NETWORK = "NETWORK_ERROR",
    TIMEOUT = "TIMEOUT_ERROR",
    ABORT = "ABORT_ERROR",
    PARSE = "PARSE_ERROR",
    VALIDATION = "VALIDATION_ERROR",
    SERVER = "SERVER_ERROR",
    REQUEST = "REQUEST_ERROR",
    CIRCUIT_OPEN = "CIRCUIT_OPEN",
    CANCELED = "CANCELED",
    AUTH = "AUTH_ERROR",
    RATE_LIMIT = "RATE_LIMIT_ERROR"
}
export interface RequestErrorOptions {
    message: string;
    config?: RequestConfig;
    status?: number;
    response?: any;
    type?: ErrorType;
    code?: string;
    stack?: string;
}
export declare class RequestError extends Error {
    status: number;
    config: RequestConfig;
    response?: any;
    type: ErrorType;
    _retry?: {
        count: number;
        delay: number;
        maxRetries: number;
    };
    code?: string;
    constructor(options: RequestErrorOptions);
    /**
     * Check if error is a network error
     */
    isNetworkError(): boolean;
    /**
     * Check if error is a timeout error
     */
    isTimeoutError(): boolean;
    /**
     * Check if error is a server error (5xx)
     */
    isServerError(): boolean;
    /**
     * Check if error is a client error (4xx)
     */
    isClientError(): boolean;
    /**
     * Check if error is an authentication error
     */
    isAuthError(): boolean;
    /**
     * Check if error is a rate limit error
     */
    isRateLimitError(): boolean;
    /**
     * Get retry information if available
     */
    getRetryInfo(): {
        count: number;
        delay: number;
        maxRetries: number;
    } | undefined;
}
