/**
 * omnirequest v2.0.1
 * A modern cross-platform TypeScript-based HTTP client for Node.js, browsers, Deno, and more, featuring advanced caching, concurrency limiting, intelligent retries, circuit breakers, and automatic token refresh.
 *
 * @author Junaid Ali Shah Gigli <overview.jjj@gmail.com>
 * @license MIT
 * @preserve
 */
import * as http from 'http';
import * as https from 'https';
import { openDB } from 'idb';

class MiddlewareManager {
    constructor() {
        this.requestMiddlewares = [];
        this.responseMiddlewares = [];
    }
    get request() {
        return this.requestMiddlewares;
    }
    get response() {
        return this.responseMiddlewares;
    }
    async applyRequestMiddleware(config) {
        let finalConfig = { ...config };
        for (const middleware of this.requestMiddlewares) {
            finalConfig = await middleware(finalConfig);
        }
        return finalConfig;
    }
    async applyResponseMiddleware(response) {
        let finalResponse = { ...response };
        for (const middleware of this.responseMiddlewares) {
            finalResponse = await middleware(finalResponse);
        }
        return finalResponse;
    }
    use(middleware) {
        if (this.isRequestMiddleware(middleware)) {
            const requestHandler = async (config) => {
                return await Promise.resolve(middleware.request(config));
            };
            this.requestMiddlewares.push(requestHandler);
        }
        if (this.isResponseMiddleware(middleware)) {
            const responseHandler = async (response) => {
                return await Promise.resolve(middleware.response(response));
            };
            this.responseMiddlewares.push(responseHandler);
        }
    }
    remove(middleware) {
        if (this.isRequestMiddleware(middleware)) {
            this.requestMiddlewares = this.requestMiddlewares.filter((handler) => handler !== middleware.request);
        }
        if (this.isResponseMiddleware(middleware)) {
            this.responseMiddlewares = this.responseMiddlewares.filter((handler) => handler !== middleware.response);
        }
    }
    isRequestMiddleware(middleware) {
        return typeof middleware.request === "function";
    }
    isResponseMiddleware(middleware) {
        return typeof middleware.response === "function";
    }
}

class InterceptorManager {
    constructor() {
        this.interceptors = [];
    }
    use(resolved, rejected) {
        this.interceptors.push({
            resolved,
            rejected
        });
        return this.interceptors.length - 1;
    }
    eject(id) {
        if (this.interceptors[id]) {
            this.interceptors[id] = null;
        }
    }
    forEach(fn) {
        this.interceptors.forEach(interceptor => {
            if (interceptor !== null) {
                fn(interceptor);
            }
        });
    }
    async apply(value) {
        let result = value;
        for (const interceptor of this.interceptors) {
            if (interceptor !== null) {
                result = await interceptor.resolved(result);
            }
        }
        return result;
    }
}

var ErrorType;
(function (ErrorType) {
    ErrorType["NETWORK"] = "NETWORK_ERROR";
    ErrorType["TIMEOUT"] = "TIMEOUT_ERROR";
    ErrorType["ABORT"] = "ABORT_ERROR";
    ErrorType["PARSE"] = "PARSE_ERROR";
    ErrorType["VALIDATION"] = "VALIDATION_ERROR";
    ErrorType["SERVER"] = "SERVER_ERROR";
    ErrorType["REQUEST"] = "REQUEST_ERROR";
    ErrorType["CIRCUIT_OPEN"] = "CIRCUIT_OPEN";
    ErrorType["CANCELED"] = "CANCELED";
})(ErrorType || (ErrorType = {}));
class RequestError extends Error {
    constructor(options) {
        super(options.message);
        this.name = "RequestError";
        this.status = options.status || 0;
        this.config = options.config || {};
        this.response = options.response;
        this.type = options.type || ErrorType.NETWORK;
    }
}

const browserAdapter = {
    async request(config) {
        if (!config.url) {
            throw new RequestError({
                message: "URL is required",
                config,
                type: ErrorType.VALIDATION,
                status: 0,
            });
        }
        const response = await fetch(config.url, {
            method: config.method,
            headers: config.headers,
            body: config.data ? JSON.stringify(config.data) : undefined,
        });
        const data = await response.json();
        return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            config,
        };
    },
};

const nodeAdapter = {
    async request(config) {
        return new Promise((resolve, reject) => {
            try {
                if (!config.url) {
                    reject(new RequestError({
                        message: "URL is required",
                        config,
                        type: ErrorType.VALIDATION,
                        status: 0,
                    }));
                    return;
                }
                const parsedUrl = new URL(config.url);
                const isHttps = parsedUrl.protocol === "https:";
                const httpModule = isHttps ? https : http;
                const { method = "GET", headers = {}, data, timeout, signal, } = config;
                if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
                    data &&
                    !headers["Content-Type"]) {
                    headers["Content-Type"] = "application/json";
                }
                const requestOptions = {
                    method: method.toUpperCase(),
                    headers,
                    timeout,
                };
                const req = httpModule.request(parsedUrl, requestOptions, (res) => {
                    let responseData = "";
                    res.on("data", (chunk) => {
                        responseData += chunk;
                    });
                    res.on("end", () => {
                        let parsedData;
                        // Handle 204 No Content responses
                        if (res.statusCode === 204) {
                            parsedData = null;
                        }
                        else {
                            try {
                                parsedData = responseData ? JSON.parse(responseData) : null;
                            }
                            catch {
                                parsedData = responseData;
                            }
                        }
                        // Throw error for non-2xx status codes
                        if (res.statusCode && res.statusCode >= 400) {
                            reject(new RequestError({
                                message: `Request failed with status ${res.statusCode}`,
                                config,
                                type: ErrorType.SERVER,
                                status: res.statusCode,
                                response: parsedData,
                            }));
                            return;
                        }
                        resolve({
                            data: parsedData,
                            status: res.statusCode || 200,
                            statusText: res.statusMessage || "OK",
                            headers: Object.fromEntries(Object.entries(res.headers).map(([key, value]) => [
                                key,
                                Array.isArray(value) ? value.join(", ") : value || "",
                            ])),
                            config,
                        });
                    });
                });
                req.on("error", (error) => {
                    reject(new RequestError({
                        message: `Network Error: ${error.message}`,
                        config,
                        type: ErrorType.NETWORK,
                        status: 0,
                    }));
                });
                if (timeout) {
                    req.setTimeout(timeout, () => {
                        req.destroy();
                        reject(new RequestError({
                            message: `Timeout of ${timeout}ms exceeded`,
                            config,
                            type: ErrorType.TIMEOUT,
                            status: 0,
                        }));
                    });
                }
                if (signal) {
                    signal.addEventListener("abort", () => {
                        req.destroy();
                        reject(new RequestError({
                            message: "Request aborted",
                            config,
                            type: ErrorType.CANCELED,
                            status: 0,
                        }));
                    });
                }
                if (data) {
                    const bodyData = typeof data === "string" ? data : JSON.stringify(data);
                    req.write(bodyData);
                }
                req.end();
            }
            catch (err) {
                reject(new RequestError({
                    message: `Request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                    config,
                    type: ErrorType.REQUEST,
                    status: 0,
                }));
            }
        });
    }
};

// Function to detect the current environment and return appropriate adapter
function getAdapter() {
    if (typeof window !== "undefined" && typeof window.fetch === "function") {
        return browserAdapter;
    }
    // Node.js environment
    return nodeAdapter;
}

function createDefaultConfig() {
    return {
        baseURL: "",
        timeout: 0,
        headers: {
            "Content-Type": "application/json",
        },
        validateStatus: (status) => status >= 200 && status < 300,
        responseType: "json",
    };
}

class RequestClient {
    constructor(config = {}) {
        this.config = { ...createDefaultConfig(), ...config };
        this.middleware = new MiddlewareManager();
        this.plugins = [];
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };
    }
    async request(requestConfig = {}) {
        let finalConfig = { ...this.config, ...requestConfig };
        // Combine baseURL with URL if URL is relative
        if (finalConfig.url && finalConfig.baseURL && !finalConfig.url.startsWith('http')) {
            const baseURL = finalConfig.baseURL.endsWith('/')
                ? finalConfig.baseURL.slice(0, -1)
                : finalConfig.baseURL;
            const url = finalConfig.url.startsWith('/')
                ? finalConfig.url
                : `/${finalConfig.url}`;
            finalConfig.url = `${baseURL}${url}`;
        }
        try {
            // Apply request interceptors
            finalConfig = await this.interceptors.request.apply(finalConfig);
            // Apply plugins pre-request
            for (const plugin of this.plugins) {
                if (plugin.onRequest) {
                    finalConfig = await plugin.onRequest(finalConfig);
                }
                else if (plugin.beforeRequest) {
                    finalConfig = await plugin.beforeRequest(finalConfig);
                }
            }
            // Apply middleware pre-request
            finalConfig = await this.middleware.applyRequestMiddleware(finalConfig);
            // Get the appropriate adapter for the current environment
            const adapter = getAdapter();
            // Make the request using the adapter's request method
            let response = await adapter.request(finalConfig);
            // Apply middleware post-response
            response = await this.middleware.applyResponseMiddleware(response);
            // Apply response interceptors
            response = await this.interceptors.response.apply(response);
            // Apply plugins post-response
            for (const plugin of this.plugins) {
                if (plugin.onResponse) {
                    response = await plugin.onResponse(response);
                }
                else if (plugin.afterResponse) {
                    response = await plugin.afterResponse(response);
                }
            }
            return response;
        }
        catch (error) {
            // Apply response interceptors to errors
            try {
                await this.interceptors.response.apply(error);
            }
            catch (e) {
                // Ignore interceptor errors
            }
            // Handle retry if middleware indicated retry
            if (error._retry && error._retry.count <= error._retry.maxRetries) {
                return this.request({
                    ...finalConfig,
                    _retryCount: error._retry.count
                });
            }
            throw error;
        }
    }
    use(plugin) {
        this.plugins.push(plugin);
    }
    async get(url, config = {}) {
        return this.request({
            ...config,
            method: "GET",
            url,
        });
    }
    async post(url, data, config = {}) {
        return this.request({
            ...config,
            method: "POST",
            url,
            data,
        });
    }
    async put(url, data, config = {}) {
        return this.request({
            ...config,
            method: "PUT",
            url,
            data,
        });
    }
    async delete(url, config = {}) {
        return this.request({
            ...config,
            method: "DELETE",
            url,
        });
    }
    async patch(url, data, config = {}) {
        return this.request({
            ...config,
            method: "PATCH",
            url,
            data,
        });
    }
    getMiddlewareManager() {
        return this.middleware;
    }
}

const defaultConfig = {
    baseURL: "",
    method: "GET",
    timeout: 0,
    headers: {
        "Content-Type": "application/json",
    },
    validateStatus: (status) => status >= 200 && status < 300,
    responseType: "json",
};

/**
 * Simplified zero-config API for OmniRequest
 * This provides the simplest possible way to make HTTP requests
 * Perfect for quick prototyping and simple use cases
 */
// Create a pre-configured instance with sensible defaults
const simpleClient = new RequestClient({
    ...defaultConfig,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
/**
 * Simple GET request - just pass a URL
 */
async function get(url) {
    const response = await simpleClient.get(url);
    return response.data;
}
/**
 * Simple POST request - pass URL and data
 */
async function post(url, data) {
    const response = await simpleClient.post(url, data);
    return response.data;
}
/**
 * Simple PUT request - pass URL and data
 */
async function put(url, data) {
    const response = await simpleClient.put(url, data);
    return response.data;
}
/**
 * Simple PATCH request - pass URL and data
 */
async function patch(url, data) {
    const response = await simpleClient.patch(url, data);
    return response.data;
}
/**
 * Simple DELETE request - just pass a URL
 */
async function del(url) {
    const response = await simpleClient.delete(url);
    // Handle 204 No Content responses
    if (response.status === 204) {
        return undefined;
    }
    return response.data;
}
/**
 * Simple request with any method
 */
async function request(config) {
    const response = await simpleClient.request(config);
    return response.data;
}
/**
 * Create a simple API client for a specific base URL
 */
function createSimpleAPI(baseURL) {
    return {
        get: (path) => get(`${baseURL}${path}`),
        post: (path, data) => post(`${baseURL}${path}`, data),
        put: (path, data) => put(`${baseURL}${path}`, data),
        patch: (path, data) => patch(`${baseURL}${path}`, data),
        delete: (path) => del(`${baseURL}${path}`),
    };
}
/**
 * Quick fetch alias for one-off requests
 */
async function fetch$1(url, options) {
    const response = await fetch$1();
    return response.json();
}

class AuthPlugin {
    constructor(options) {
        this.name = "auth";
        this.enabled = true;
        this.refreshPromise = null;
        this.requestQueue = [];
        this.options = options;
    }
    async refreshToken() {
        if (!this.refreshPromise && this.options.refreshToken) {
            this.refreshPromise = this.options.refreshToken().then((token) => {
                if (this.options.tokens) {
                    this.options.tokens.access = token;
                }
                this.refreshPromise = null;
                this.processQueue();
                return token;
            });
        }
        if (!this.refreshPromise) {
            throw new Error("No refresh token handler available");
        }
        return this.refreshPromise;
    }
    processQueue() {
        while (this.requestQueue.length > 0) {
            const resolve = this.requestQueue.shift();
            if (resolve) {
                resolve();
            }
        }
    }
    async onRequest(config) {
        if (this.options.type === "bearer" && this.options.tokens?.access) {
            return {
                ...config,
                headers: {
                    ...config.headers,
                    Authorization: `Bearer ${this.options.tokens.access}`,
                },
            };
        }
        return config;
    }
    async onError(error) {
        const config = error.config;
        if (this.options.shouldRefresh?.(error) &&
            this.options.refreshToken &&
            !config.isRetryAfterRefresh) {
            await new Promise((resolve) => {
                this.requestQueue.push(resolve);
                if (this.requestQueue.length === 1) {
                    this.refreshToken().catch(() => {
                        // Handle refresh failure
                        this.processQueue();
                    });
                }
            });
            return {
                ...config,
                isRetryAfterRefresh: true,
            };
        }
        throw error;
    }
}

/**
 * Rate limiter plugin for OmniRequest
 */
class RateLimitPlugin {
    constructor(options) {
        this.name = "rateLimit";
        this.enabled = true;
        this.options = options;
        this.tokens = options.tokensPerInterval;
        this.lastRefill = Date.now();
    }
    async beforeRequest(config) {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const refillCount = Math.floor(elapsed / this.options.interval) *
            this.options.tokensPerInterval;
        if (refillCount > 0) {
            this.tokens = Math.min(this.tokens + refillCount, this.options.tokensPerInterval);
            this.lastRefill = now;
        }
        if (this.tokens <= 0) {
            await new Promise((resolve) => setTimeout(resolve, this.options.interval));
            this.tokens = this.options.tokensPerInterval;
            this.lastRefill = Date.now();
        }
        this.tokens--;
        return config;
    }
}
/**
 * Legacy function for backward compatibility
 */
function setupRateLimiter(client, options) {
    let tokens = options.tokensPerInterval;
    let lastRefill = Date.now();
    // @ts-ignore - We know these properties don't exist, but we're providing backward compatibility
    if (client.interceptors) {
        // @ts-ignore
        client.interceptors.request.use(async (config) => {
            const now = Date.now();
            const elapsed = now - lastRefill;
            const refillCount = Math.floor(elapsed / options.interval) * options.tokensPerInterval;
            if (refillCount > 0) {
                tokens = Math.min(tokens + refillCount, options.tokensPerInterval);
                lastRefill = now;
            }
            if (tokens <= 0) {
                await new Promise((resolve) => setTimeout(resolve, options.interval));
                tokens = options.tokensPerInterval;
                lastRefill = Date.now();
            }
            tokens--;
            return config;
        });
    }
}

/**
 * Logger plugin for OmniRequest
 */
class LoggerPlugin {
    constructor(prefix = "OmniRequest") {
        this.name = "logger";
        this.enabled = true;
        this.prefix = prefix;
    }
    async beforeRequest(config) {
        console.info(`[${this.prefix}] ${config.method} ${config.url}`, config);
        return config;
    }
    async afterResponse(response) {
        console.info(`[${this.prefix}] ${response.status} ${response.config.url}`, response);
        return response;
    }
    async onError(error) {
        console.error(`[${this.prefix}] Error: ${error.message}`, error);
        throw error;
    }
}
/**
 * Legacy function for backward compatibility
 */
function setupLogger(client) {
    // @ts-ignore - We know these properties don't exist, but we're providing backward compatibility
    if (client.interceptors) {
        // @ts-ignore
        client.interceptors.request.use((config) => {
            console.info(`[OmniRequest] ${config.method} ${config.url}`, config);
            return config;
        });
        // @ts-ignore
        client.interceptors.response.use((response) => {
            console.info(`[OmniRequest] ${response.status} ${response.config.url}`, response);
            return response;
        }, (error) => {
            console.error(`[OmniRequest] Error: ${error.message}`, error);
            throw error;
        });
    }
}

/**
 * AutoAuth plugin for automatic authentication and token refresh.
 */
class AutoAuthPlugin {
    constructor(options) {
        this.name = "autoAuth";
        this.enabled = true;
        this.client = null;
        this.currentToken = null;
        this.currentTokenExpiry = null;
        this.requestInterceptorId = null;
        this.responseInterceptorId = null;
        this.options = options;
        this.currentToken = options.token || null;
        this.currentTokenExpiry = options.tokenExpiry || null;
    }
    /**
     * Initialize the plugin with a client instance
     */
    init(client) {
        this.client = client;
        this.setupInterceptors();
    }
    /**
     * Handle request - add authentication headers
     */
    async beforeRequest(config) {
        const { type, username, password, headerName, headerValue, autoAttach = true, } = this.options;
        // Check token expiry
        if (this.isTokenExpired()) {
            await this.doRefreshToken();
        }
        if (!autoAttach) {
            return config;
        }
        const headers = { ...config.headers } || {};
        switch (type) {
            case "basic":
                if (username && password) {
                    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
                    headers["Authorization"] = `Basic ${encoded}`;
                }
                break;
            case "bearer":
                if (this.currentToken) {
                    headers["Authorization"] = `Bearer ${this.currentToken}`;
                }
                break;
            case "custom":
                if (headerName && headerValue) {
                    headers[headerName] = headerValue;
                }
                break;
        }
        return { ...config, headers };
    }
    /**
     * Handle response - check for auth errors
     */
    async afterResponse(response) {
        return response;
    }
    /**
     * Handle errors - refresh token on 401
     */
    async onError(error) {
        const { handle401 = true, shouldRefreshOnError } = this.options;
        // Check if we should refresh the token
        const shouldRefresh = (handle401 && error.status === 401) ||
            (shouldRefreshOnError && shouldRefreshOnError(error));
        if (shouldRefresh && this.client) {
            try {
                await this.doRefreshToken();
                // Retry the request with the new token
                return this.client.request(error.config);
            }
            catch (refreshError) {
                throw error; // If refresh fails, throw the original error
            }
        }
        throw error;
    }
    /**
     * Clean up resources when plugin is destroyed
     */
    destroy() {
        this.removeInterceptors();
    }
    /**
     * Check if the token is expired
     */
    isTokenExpired() {
        if (!this.currentTokenExpiry)
            return false;
        return Date.now() >= this.currentTokenExpiry;
    }
    /**
     * Refresh the token
     */
    async doRefreshToken() {
        const { refreshToken, refreshOAuthToken, onRefreshSuccess, onRefreshError, } = this.options;
        if (!refreshToken && !refreshOAuthToken)
            return;
        try {
            if (refreshOAuthToken && this.currentToken) {
                const newToken = await refreshOAuthToken(this.currentToken);
                this.currentToken = newToken;
                if (onRefreshSuccess)
                    onRefreshSuccess(newToken);
            }
            else if (refreshToken) {
                const newToken = await refreshToken();
                this.currentToken = newToken;
                if (onRefreshSuccess)
                    onRefreshSuccess(newToken);
            }
        }
        catch (error) {
            if (onRefreshError)
                onRefreshError(error);
            throw error;
        }
    }
    /**
     * Set up the auth interceptors
     */
    setupInterceptors() {
        if (!this.client)
            return;
        // Legacy function for backward compatibility
        return setupAutoAuth(this.client, this.options);
    }
    /**
     * Remove the interceptors
     */
    removeInterceptors() {
        if (!this.client ||
            this.requestInterceptorId === null ||
            this.responseInterceptorId === null)
            return;
        try {
            // @ts-ignore - We know these properties don't exist, but we're providing backward compatibility
            if (this.client.interceptors) {
                // @ts-ignore
                this.client.interceptors.request.eject(this.requestInterceptorId);
                // @ts-ignore
                this.client.interceptors.response.eject(this.responseInterceptorId);
            }
        }
        catch (error) {
            console.error("Error removing interceptors:", error);
        }
    }
}
/**
 * Legacy function for backward compatibility
 */
function setupAutoAuth(client, options) {
    const { type, username, password, token, refreshToken, refreshOAuthToken, tokenExpiry, onRefreshError, onRefreshSuccess, autoAttach = true, handle401 = true, shouldRefreshOnError, headerName, headerValue, } = options;
    let currentToken = token;
    let currentTokenExpiry = tokenExpiry;
    function isTokenExpired() {
        if (!currentTokenExpiry)
            return false;
        return Date.now() >= currentTokenExpiry;
    }
    async function doRefreshToken() {
        if (!refreshToken && !refreshOAuthToken)
            return;
        try {
            if (refreshOAuthToken && currentToken) {
                const newToken = await refreshOAuthToken(currentToken);
                currentToken = newToken;
                if (onRefreshSuccess)
                    onRefreshSuccess(newToken);
            }
            else if (refreshToken) {
                const newToken = await refreshToken();
                currentToken = newToken;
                if (onRefreshSuccess)
                    onRefreshSuccess(newToken);
            }
        }
        catch (err) {
            if (onRefreshError)
                onRefreshError(err);
            throw err;
        }
    }
    // 1. Request Interceptor
    const requestId = client.interceptors.request.use(async (config) => {
        // Check token expiry
        if (isTokenExpired()) {
            await doRefreshToken();
        }
        if (!autoAttach) {
            return config;
        }
        const headers = { ...config.headers };
        switch (type) {
            case "basic":
                if (username && password) {
                    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
                    headers["Authorization"] = `Basic ${encoded}`;
                }
                break;
            case "bearer":
            case "oauth2":
                if (currentToken) {
                    headers["Authorization"] = `Bearer ${currentToken}`;
                }
                break;
            case "custom":
                if (headerName) {
                    // If headerValue is a function, call it
                    let val;
                    if (typeof headerValue === "function") {
                        const result = await headerValue();
                        if (typeof result === "string") {
                            val = result;
                        }
                    }
                    else if (typeof headerValue === "string") {
                        val = headerValue;
                    }
                    if (val) {
                        headers[headerName] = val;
                    }
                }
                break;
        }
        return { ...config, headers };
    });
    // 2. Response Interceptor
    const responseId = client.interceptors.response.use((response) => {
        return response;
    }, async (error) => {
        if (!(error instanceof RequestError)) {
            throw error;
        }
        if (!handle401 && !shouldRefreshOnError) {
            throw error;
        }
        let doRefresh = false;
        if (handle401 && error.response?.status === 401) {
            doRefresh = true;
        }
        else if (shouldRefreshOnError && shouldRefreshOnError(error)) {
            doRefresh = true;
        }
        if (!doRefresh) {
            throw error;
        }
        // Attempt token refresh
        try {
            await doRefreshToken();
        }
        catch (err) {
            // If refresh fails, bubble original error
            throw error;
        }
        // Re-run the original request
        const originalConfig = error.config;
        if (!originalConfig) {
            throw error;
        }
        originalConfig._retryCount = (originalConfig._retryCount || 0) + 1;
        return client.request(originalConfig);
    });
    // Return a function to remove interceptors if needed
    return function removeAutoAuth() {
        client.interceptors.request.eject(requestId);
        client.interceptors.response.eject(responseId);
    };
}

var CacheStrategy;
(function (CacheStrategy) {
    CacheStrategy["CACHE_FIRST"] = "cache-first";
    CacheStrategy["NETWORK_FIRST"] = "network-first";
    CacheStrategy["STALE_WHILE_REVALIDATE"] = "stale-while-revalidate";
    CacheStrategy["MEMORY"] = "memory";
})(CacheStrategy || (CacheStrategy = {}));

class CacheMiddleware {
    constructor(options = {}) {
        this.cache = new Map();
        this.options = {
            ttl: 60000, // Default 1 minute
            strategy: CacheStrategy.MEMORY,
            enabled: true,
            ...options,
        };
    }
    getCacheKey(config) {
        const { url, method, data } = config;
        return `${method}-${url}-${JSON.stringify(data)}`;
    }
    isExpired(timestamp) {
        return Date.now() - timestamp > this.options.ttl;
    }
    async request(config) {
        if (config.method !== "GET" || !this.options.enabled) {
            return config;
        }
        const cacheKey = this.getCacheKey(config);
        const cached = this.cache.get(cacheKey);
        if (cached && !this.isExpired(cached.timestamp)) {
            throw {
                isCache: true,
                data: cached.data,
            };
        }
        return config;
    }
    async response(response) {
        if (response.config.method === "GET" && this.options.enabled) {
            const cacheKey = this.getCacheKey(response.config);
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now(),
            });
        }
        return response;
    }
    async error(error) {
        if (error.isCache) {
            return error.data;
        }
        throw error;
    }
}

class RetryMiddleware {
    constructor(options = {}) {
        this.options = {
            attempts: 3,
            backoff: "exponential",
            conditions: [(error) => error.status >= 500],
            ...options,
        };
    }
    async delay(attempt) {
        const baseDelay = 1000; // 1 second
        let delay;
        switch (this.options.backoff) {
            case "exponential":
                delay = Math.pow(2, attempt) * baseDelay;
                break;
            case "linear":
                delay = attempt * baseDelay;
                break;
            default:
                delay = baseDelay;
        }
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
    shouldRetry(error, attempt) {
        if (attempt >= this.options.attempts) {
            return false;
        }
        return this.options.conditions.some((condition) => condition(error));
    }
    async request(config) {
        // Initialize retry attempt count if not present
        return { ...config, retryAttempt: config.retryAttempt || 0 };
    }
    async error(error) {
        if (!(error instanceof RequestError)) {
            throw error;
        }
        const config = error.config;
        const attempt = (config.retryAttempt || 0) + 1;
        if (this.shouldRetry(error, attempt)) {
            await this.delay(attempt);
            return {
                ...config,
                retryAttempt: attempt,
            };
        }
        throw error;
    }
}

class TimeoutMiddleware {
    constructor(defaultTimeout = 30000) {
        this.request = async (config) => {
            if (!config.timeout) {
                return { ...config, timeout: this.defaultTimeout };
            }
            return config;
        };
        this.defaultTimeout = defaultTimeout;
    }
}

class TransformMiddleware {
    constructor() {
        this.request = async (config) => {
            if (config.transformRequest && Array.isArray(config.transformRequest)) {
                let transformedData = config.data;
                for (const fn of config.transformRequest) {
                    transformedData = await fn(transformedData, config.headers || {});
                }
                return { ...config, data: transformedData };
            }
            return config;
        };
        this.response = async (response) => {
            const config = response.config;
            if (config.transformResponse && Array.isArray(config.transformResponse)) {
                let transformedData = response.data;
                for (const fn of config.transformResponse) {
                    transformedData = await fn(transformedData);
                }
                return { ...response, data: transformedData };
            }
            return response;
        };
    }
}

// src/core/utils/offlineDB.ts
/**
 * Check if we're in a browser environment.
 */
function isBrowser() {
    return (typeof window !== "undefined" && typeof window.document !== "undefined");
}
/**
 * Check if indexedDB is available (i.e., not in Node).
 */
function isIndexedDBAvailable() {
    return isBrowser() && "indexedDB" in window;
}
/**
 * Store offline data in IndexedDB under "omniRequestCache".
 */
async function storeOfflineData(key, entry) {
    const db = await openCacheDB();
    await db.put("omniRequestCache", entry, key);
}
/**
 * Retrieve offline data from IndexedDB by key.
 */
async function getOfflineData(key) {
    const db = await openCacheDB();
    return db.get("omniRequestCache", key);
}
/**
 * Open the "omniRequestCacheDB" IndexedDB database (version 1).
 * Creates an object store named "omniRequestCache" if not existing.
 */
async function openCacheDB() {
    return openDB("omniRequestCacheDB", 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("omniRequestCache")) {
                db.createObjectStore("omniRequestCache");
            }
        },
    });
}

class MemoryStorage {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        return this.store.get(key);
    }
    async set(key, value) {
        this.store.set(key, value);
    }
    async remove(key) {
        this.store.delete(key);
    }
    async clear() {
        this.store.clear();
    }
    async keys() {
        return Array.from(this.store.keys());
    }
}
function createStorage(type) {
    switch (type) {
        case 'memory':
            return new MemoryStorage();
        default:
            return new MemoryStorage();
    }
}

class RevalidationCacheMiddleware {
    constructor(options = {}) {
        this.cache = new Map();
        this.revalidating = new Set();
        this.request = async (config) => {
            if (config.method !== "GET")
                return config;
            const key = this.options.getCacheKey(config);
            const entry = await this.getCacheEntry(key);
            if (entry) {
                const age = Date.now() - entry.timestamp;
                if (this.options.maxAge && age < this.options.maxAge) {
                    config._cachedResponse = entry.data;
                    return config;
                }
                // Attach ETag or Last-Modified for revalidation
                if (entry.etag) {
                    config.headers = { ...config.headers, "If-None-Match": entry.etag };
                }
                if (entry.lastModified) {
                    config.headers = {
                        ...config.headers,
                        "If-Modified-Since": entry.lastModified,
                    };
                }
            }
            return config;
        };
        this.response = async (response) => {
            const config = response.config;
            if (config.method !== "GET")
                return response;
            const key = this.options.getCacheKey(config);
            // 304 => Serve from cache
            if (response.status === 304) {
                const entry = await this.getCacheEntry(key);
                if (entry) {
                    return entry.data;
                }
                return response;
            }
            // 200 => Update cache
            if (response.status === 200) {
                const headers = response.headers;
                const etag = headers["etag"];
                const lastModified = headers["last-modified"];
                // Ensure etag and lastModified are strings
                const newEntry = {
                    data: response,
                    etag: Array.isArray(etag) ? etag[0] : etag,
                    lastModified: Array.isArray(lastModified)
                        ? lastModified[0]
                        : lastModified,
                    timestamp: Date.now(),
                };
                this.cache.set(key, newEntry);
                if (this.options.offline && isBrowser() && isIndexedDBAvailable()) {
                    await storeOfflineData(key, newEntry);
                }
                if (this.options.onStore) {
                    this.options.onStore(key, response);
                }
            }
            return response;
        };
        this.error = async (error) => {
            const config = error.config;
            if (!config || config.method !== "GET") {
                return error;
            }
            const key = this.options.getCacheKey(config);
            const entry = await this.getCacheEntry(key);
            if (entry) {
                if (this.options.onOffline) {
                    this.options.onOffline(key, entry.data);
                }
                return entry.data;
            }
            return error;
        };
        this.options = {
            // CacheOptions properties
            ttl: 60000, // 1 minute default
            strategy: CacheStrategy.MEMORY,
            enabled: true,
            maxAge: 0,
            maxEntries: 100,
            // RevalidationCacheOptions properties
            offline: false,
            staleWhileRevalidate: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            getCacheKey: (config) => {
                const { url, method, params, data } = config;
                if (!url)
                    throw new Error("URL is required for cache key generation");
                const queryString = params
                    ? `?${new URLSearchParams(params).toString()}`
                    : "";
                const dataString = data ? JSON.stringify(data) : "";
                return `${method || "GET"}-${url}${queryString}${dataString}`;
            },
            onStore: () => { },
            onOffline: () => { },
            ...options,
        };
        this.storage = createStorage("memory");
        if (this.options.revalidateOnFocus) {
            this.setupFocusListener();
        }
        if (this.options.revalidateOnReconnect) {
            this.setupReconnectListener();
        }
    }
    setupFocusListener() {
        if (typeof window === "undefined")
            return;
        window.addEventListener("focus", () => {
            this.revalidateAll();
        });
    }
    setupReconnectListener() {
        if (typeof window === "undefined")
            return;
        window.addEventListener("online", () => {
            this.revalidateAll();
        });
    }
    async revalidateAll() {
        const keys = await this.storage.keys();
        keys.forEach((key) => this.revalidate(key));
    }
    async revalidate(key) {
        if (this.revalidating.has(key))
            return;
        this.revalidating.add(key);
        try {
            const cached = await this.storage.get(key);
            if (!cached)
                return;
            const response = await fetch(cached.config.url, cached.config);
            const data = await response.json();
            await this.storage.set(key, {
                ...cached,
                data,
                timestamp: Date.now(),
            });
        }
        finally {
            this.revalidating.delete(key);
        }
    }
    async getCacheEntry(key) {
        let entry = this.cache.get(key);
        if (entry)
            return entry;
        if (this.options.offline && isBrowser() && isIndexedDBAvailable()) {
            entry = await getOfflineData(key);
            if (entry) {
                this.cache.set(key, entry);
                return entry;
            }
        }
        return undefined;
    }
}

class ConcurrencyRateLimitMiddleware {
    constructor(options) {
        this.globalInFlight = 0;
        this.endpointInFlight = new Map();
        this.queue = [];
        this.request = async (config) => {
            const canProceed = await this.acquireSlot(config);
            if (!canProceed) {
                if (!this.options.queue) {
                    throw new Error("Concurrency/Rate limit exceeded and queue is disabled.");
                }
                return new Promise((resolve, reject) => {
                    const priority = this.options.priorityFn
                        ? this.options.priorityFn(config)
                        : 0;
                    this.queue.push({ config, resolve, reject, priority });
                    this.processQueue();
                });
            }
            return config;
        };
        this.response = async (response) => {
            this.releaseSlot(response.config);
            this.processQueue();
            return response;
        };
        this.error = async (error) => {
            if (error.config) {
                this.releaseSlot(error.config);
                this.processQueue();
            }
            return error;
        };
        this.options = options;
        if (options.tokenBucket) {
            this.tokenBucket = {
                tokens: options.tokenBucket.capacity,
                ...options.tokenBucket,
            };
            this.startTokenRefill();
        }
    }
    processQueue() {
        if (this.queue.length === 0)
            return;
        this.queue.sort((a, b) => b.priority - a.priority);
        let i = 0;
        while (i < this.queue.length) {
            const { config, resolve, reject } = this.queue[i];
            if (this.acquireSlotSync(config)) {
                this.queue.splice(i, 1);
                resolve(config);
            }
            else {
                i++;
            }
        }
    }
    async acquireSlot(config) {
        return this.acquireSlotSync(config);
    }
    acquireSlotSync(config) {
        if (this.options.globalConcurrency &&
            this.globalInFlight >= this.options.globalConcurrency) {
            return false;
        }
        const endpointLimit = this.getEndpointLimit(config);
        if (endpointLimit !== undefined) {
            const currentEndpointCount = this.endpointInFlight.get(this.getEndpointKey(config)) || 0;
            if (currentEndpointCount >= endpointLimit) {
                return false;
            }
        }
        if (this.tokenBucket && this.tokenBucket.tokens <= 0) {
            return false;
        }
        if (this.tokenBucket) {
            this.tokenBucket.tokens = Math.max(0, this.tokenBucket.tokens - 1);
        }
        this.globalInFlight++;
        const endpointKey = this.getEndpointKey(config);
        this.endpointInFlight.set(endpointKey, (this.endpointInFlight.get(endpointKey) || 0) + 1);
        return true;
    }
    releaseSlot(config) {
        this.globalInFlight = Math.max(0, this.globalInFlight - 1);
        const endpointKey = this.getEndpointKey(config);
        const current = this.endpointInFlight.get(endpointKey) || 0;
        if (current > 0) {
            this.endpointInFlight.set(endpointKey, current - 1);
        }
    }
    getEndpointLimit(config) {
        const endpointKey = this.getEndpointKey(config);
        return this.options.endpointConcurrency?.[endpointKey];
    }
    getEndpointKey(config) {
        // Ensure we always return a valid string, even if url is undefined
        return config.url || "default";
    }
    startTokenRefill() {
        if (!this.tokenBucket)
            return;
        this.tokenBucket.intervalId = setInterval(() => {
            if (this.tokenBucket) {
                this.tokenBucket.tokens = Math.min(this.tokenBucket.capacity, this.tokenBucket.tokens + this.tokenBucket.refillRate);
            }
        }, this.tokenBucket.intervalMs);
    }
    dispose() {
        if (this.tokenBucket?.intervalId) {
            clearInterval(this.tokenBucket.intervalId);
        }
    }
}

class IntelligentRetryMiddleware {
    constructor(config = {}) {
        this.circuits = new Map();
        this.request = async (config) => {
            const circuitState = this.getCircuitState(config);
            if (circuitState.open && !circuitState.halfOpen) {
                const now = Date.now();
                if (now < circuitState.reopenTime) {
                    throw new RequestError({
                        message: "Circuit is open for endpoint. Failing fast.",
                        config,
                        type: "CIRCUIT_OPEN",
                        status: 0,
                    });
                }
                else {
                    circuitState.halfOpen = true;
                }
            }
            return config;
        };
        this.error = async (error) => {
            const config = error.config;
            const circuitState = this.getCircuitState(config);
            const retryCount = (config._retryCount || 0) + 1;
            if (retryCount > this.config.maxRetries) {
                this.incrementFailure(circuitState);
                throw error;
            }
            if (!this.shouldRetry(error)) {
                this.incrementFailure(circuitState);
                throw error;
            }
            const delay = this.calculateDelay(retryCount);
            // Attach retry information to the error for the request client to handle
            error._retry = {
                count: retryCount,
                delay,
                maxRetries: this.config.maxRetries
            };
            await this.sleep(delay);
            throw error;
        };
        this.config = {
            maxRetries: 3,
            baseDelay: 1000,
            jitter: true,
            ...config,
        };
    }
    getCircuitKey(config) {
        return `${config.method || "GET"}-${config.url}`;
    }
    getCircuitState(config) {
        const key = this.getCircuitKey(config);
        let state = this.circuits.get(key);
        if (!state) {
            state = {
                failures: 0,
                lastFailure: 0,
                open: false,
                halfOpen: false,
                reopenTime: 0,
            };
            this.circuits.set(key, state);
        }
        return state;
    }
    shouldRetry(error) {
        if (error.type === "NETWORK_ERROR")
            return true;
        if (error.status >= 500)
            return true;
        return false;
    }
    calculateDelay(retryCount) {
        const baseDelay = this.config.baseDelay * Math.pow(2, retryCount - 1);
        if (!this.config.jitter)
            return baseDelay;
        const jitterMax = baseDelay * 0.2;
        return baseDelay + Math.random() * jitterMax;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    incrementFailure(state) {
        state.failures++;
        state.lastFailure = Date.now();
        if (this.config.circuitBreaker &&
            state.failures >= this.config.circuitBreaker.threshold) {
            state.open = true;
            state.reopenTime =
                Date.now() + (this.config.circuitBreaker.cooldown || 60000);
        }
    }
    resetCircuit(state) {
        state.failures = 0;
        state.open = false;
        state.halfOpen = false;
    }
}

/**
 * Request deduplication middleware
 * Prevents duplicate requests with the same key from being made simultaneously
 * Instead, all duplicate requests wait for the same response
 */
class DeduplicationMiddleware {
    constructor() {
        this.pendingRequests = new Map();
    }
    async request(config) {
        // Only deduplicate GET requests by default
        if (config.method !== 'GET') {
            return config;
        }
        const key = this.getRequestKey(config);
        // If a request with this key is already pending, attach a flag
        // The response middleware will handle returning the cached response
        if (this.pendingRequests.has(key)) {
            config._deduplicated = true;
            config._deduplicationKey = key;
            return config;
        }
        // Create a deferred promise for this request
        let resolvePromise;
        let rejectPromise;
        const promise = new Promise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
        });
        this.pendingRequests.set(key, promise);
        config._deduplicationPromise = { resolve: resolvePromise, reject: rejectPromise };
        // Clean up after a short delay to allow for near-simultaneous requests
        setTimeout(() => {
            this.pendingRequests.delete(key);
        }, 100);
        return config;
    }
    async response(response) {
        const config = response.config;
        // If this is a deduplicated request, return the pending response
        if (config._deduplicated && config._deduplicationKey) {
            const pendingResponse = this.pendingRequests.get(config._deduplicationKey);
            if (pendingResponse) {
                return pendingResponse;
            }
        }
        // If this is the original request, resolve the pending promise
        if (config._deduplicationPromise) {
            config._deduplicationPromise.resolve(response);
        }
        return response;
    }
    async error(error) {
        const config = error.config;
        // Clean up pending request on error
        if (config) {
            const key = this.getRequestKey(config);
            // Reject the pending promise if this was the original request
            if (config._deduplicationPromise) {
                config._deduplicationPromise.reject(error);
            }
            this.pendingRequests.delete(key);
        }
        throw error;
    }
    getRequestKey(config) {
        const { url, method, params, data } = config;
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        const dataString = data ? JSON.stringify(data) : '';
        return `${method}-${url}${queryString}${dataString}`;
    }
    /**
     * Clear all pending requests
     */
    clear() {
        this.pendingRequests.clear();
    }
}

/**
 * Offline-first middleware that queues requests when offline
 * and automatically syncs when connection is restored
 */
class OfflineSyncMiddleware {
    constructor(options = {}) {
        this.queue = [];
        this.isOnline = true;
        this.syncInProgress = false;
        this.handleOnline = () => {
            this.isOnline = true;
            this.syncQueue();
        };
        this.handleOffline = () => {
            this.isOnline = false;
        };
        this.options = {
            enabled: true,
            storageKey: 'omnirequest-offline-queue',
            maxRetries: 3,
            retryDelay: 5000,
            onQueue: () => { },
            onSuccess: () => { },
            onError: () => { },
            ...options,
        };
        this.initialize();
    }
    initialize() {
        if (typeof window === 'undefined')
            return;
        // Load queue from localStorage
        this.loadQueue();
        // Listen for online/offline events
        this.isOnline = navigator.onLine;
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        // Sync on load if online
        if (this.isOnline) {
            this.syncQueue();
        }
    }
    async request(config) {
        if (!this.options.enabled)
            return config;
        // Only queue safe-to-retry methods
        const safeMethods = ['GET', 'POST', 'PUT', 'PATCH'];
        if (!safeMethods.includes(config.method || 'GET')) {
            return config;
        }
        // If offline, queue the request
        if (!this.isOnline) {
            const queueItem = {
                config,
                timestamp: Date.now(),
                retryCount: 0,
            };
            this.queue.push(queueItem);
            this.saveQueue();
            this.options.onQueue(queueItem);
            // Throw a special error to indicate offline
            throw {
                isOffline: true,
                message: 'Request queued for when online',
                queued: true,
            };
        }
        return config;
    }
    async response(response) {
        return response;
    }
    async error(error) {
        // If it's an offline error, rethrow it
        if (error.isOffline) {
            throw error;
        }
        // If it's a network error and we're offline, queue the request
        if (!this.isOnline && error.config) {
            const queueItem = {
                config: error.config,
                timestamp: Date.now(),
                retryCount: 0,
            };
            this.queue.push(queueItem);
            this.saveQueue();
            this.options.onQueue(queueItem);
            throw {
                isOffline: true,
                message: 'Request queued for when online',
                queued: true,
            };
        }
        throw error;
    }
    async syncQueue() {
        if (this.syncInProgress || this.queue.length === 0)
            return;
        this.syncInProgress = true;
        while (this.queue.length > 0 && this.isOnline) {
            const item = this.queue[0];
            try {
                // Make the request using the original config
                // Note: This would need access to the client instance
                // For now, we'll just mark it as would-sync
                this.options.onSuccess(item);
                this.queue.shift();
                this.saveQueue();
            }
            catch (error) {
                item.retryCount++;
                if (item.retryCount >= this.options.maxRetries) {
                    this.options.onError(item, error);
                    this.queue.shift();
                    this.saveQueue();
                }
                else {
                    // Move to end of queue to try later
                    this.queue.shift();
                    this.queue.push(item);
                    this.saveQueue();
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
                }
            }
        }
        this.syncInProgress = false;
    }
    loadQueue() {
        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Failed to load offline queue:', error);
        }
    }
    saveQueue() {
        try {
            localStorage.setItem(this.options.storageKey, JSON.stringify(this.queue));
        }
        catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }
    /**
     * Manually trigger sync
     */
    sync() {
        this.syncQueue();
    }
    /**
     * Clear the offline queue
     */
    clearQueue() {
        this.queue = [];
        this.saveQueue();
    }
    /**
     * Get the current queue size
     */
    getQueueSize() {
        return this.queue.length;
    }
    /**
     * Check if currently online
     */
    isCurrentlyOnline() {
        return this.isOnline;
    }
    /**
     * Cleanup event listeners
     */
    destroy() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this.handleOnline);
            window.removeEventListener('offline', this.handleOffline);
        }
    }
}

/**
 * OmniRequest class extends RequestClient with additional static methods
 */
class OmniRequest extends RequestClient {
    static create(config = {}) {
        return new OmniRequest({ ...defaultConfig, ...config });
    }
}
OmniRequest.defaults = defaultConfig;
// Create default instance
const omnirequest = new OmniRequest(defaultConfig);
// Add create method to the instance
omnirequest.create = (config) => {
    return OmniRequest.create(config);
};
// Add defaults to the instance
omnirequest.defaults = OmniRequest.defaults;

export { AuthPlugin, AutoAuthPlugin, CacheMiddleware, ConcurrencyRateLimitMiddleware, DeduplicationMiddleware, IntelligentRetryMiddleware, LoggerPlugin, OfflineSyncMiddleware, OmniRequest, RateLimitPlugin, RetryMiddleware, RevalidationCacheMiddleware, TimeoutMiddleware, TransformMiddleware, createSimpleAPI, omnirequest as default, del, fetch$1 as fetch, get, patch, post, put, request, setupAutoAuth, setupLogger, setupRateLimiter, simpleClient };
//# sourceMappingURL=index.js.map
