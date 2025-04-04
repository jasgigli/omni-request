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

// Function to detect the current environment and return appropriate adapter
function getAdapter() {
    if (typeof window !== "undefined" && typeof window.fetch === "function") {
        return browserAdapter;
    }
    // Add other environment checks and adapters here
    // For now, default to browser adapter
    return browserAdapter;
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
    }
    async request(requestConfig = {}) {
        let finalConfig = { ...this.config, ...requestConfig };
        try {
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
            throw error;
        }
    }
    use(plugin) {
        this.plugins.push(plugin);
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

class OmniRequest extends RequestClient {
    static create(config = {}) {
        return new RequestClient({ ...defaultConfig, ...config });
    }
}
OmniRequest.defaults = defaultConfig;
// Create default instance
const omni = new OmniRequest(defaultConfig);

export { OmniRequest, omni as default, omni };
//# sourceMappingURL=index.js.map
