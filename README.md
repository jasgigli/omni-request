# OmniRequest

<div align="center">
  <img src="assets/omniRequest.webp" alt="OmniRequest Logo" width="200"/>
  <h3>The Ultimate TypeScript-First HTTP Client for Modern Applications</h3>

[![npm version](https://img.shields.io/npm/v/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![license](https://img.shields.io/npm/l/omnirequest.svg?color=blue)](LICENSE)
[![Type definitions](https://img.shields.io/npm/types/omnirequest.svg?color=success)](https://www.npmjs.com/package/omnirequest)
[![npm downloads/month](https://img.shields.io/npm/dm/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![GitHub Stars](https://img.shields.io/github/stars/jasgigli/omni-request.svg?style=social)](https://github.com/jasgigli/omni-request/stargazers)

</div>

## 🚀 Core Features

- **🔥 Universal Platform Support** - Works seamlessly in Node.js, Browsers, Deno, and Bun
- **📦 Zero Dependencies** - Lightweight and efficient with no external dependencies
- **🎯 TypeScript-First** - Full type safety and excellent IDE support
- **🔌 Extensible Architecture** - Powerful middleware system for custom functionality

## 📦 Installation

```bash
# Using npm
npm install omnirequest

# Using yarn
yarn add omnirequest

# Using pnpm
pnpm add omnirequest
```

## 🎯 Quick Start

### Import the Library

```typescript
// ESM
import { OmniRequest } from "omnirequest";

// CommonJS
const { OmniRequest } = require("omnirequest");
```

### Making Requests

```typescript
// Create a new instance of OmniRequest
const client = new OmniRequest();

// Simple GET request
const response = await client.request({
  method: "GET",
  url: "https://dummyjson.com/products",
});

// POST request with data
const response = await client.request({
  method: "POST",
  url: "https://dummyjson.com/products",
  data: {
    name: "John Doe",
    email: "john@example.com",
  },
});

// Access the response data
console.log(response.data);
```

## 📚 Advanced Features

### 🔄 Request Management & Optimization

#### Smart Request Deduplication

```typescript
const instance = omni.create({
  deduplication: {
    enabled: true,
    window: 2000, // 2 seconds
    compare: ["url", "method", "data"], // Compare criteria
    cacheStrategy: "memory", // or "storage"
  },
});
```

#### Request Batching & Aggregation

```typescript
const instance = omni.create({
  batch: {
    enabled: true,
    maxSize: 10, // Maximum requests in a batch
    delay: 50, // Delay in ms before sending batch
    endpoints: {
      "/api/v1/batch": {
        method: "POST",
        transform: (requests) => ({ batch: requests }),
      },
    },
  },
});
```

#### Request Prioritization

```typescript
const instance = omni.create({
  priority: {
    enabled: true,
    levels: {
      critical: { weight: 100, timeout: 10000 },
      high: { weight: 75, timeout: 5000 },
      normal: { weight: 50, timeout: 3000 },
      low: { weight: 25, timeout: 2000 },
    },
    rules: [
      { pattern: "/api/payments/*", priority: "critical" },
      { pattern: "/api/analytics/*", priority: "low" },
    ],
  },
});
```

### 🛡️ Reliability & Resilience

#### Advanced Circuit Breaker

```typescript
const instance = omni.create({
  circuitBreaker: {
    enabled: true,
    thresholds: {
      failures: 5,
      timeout: "60s",
      successRate: 0.5,
    },
    states: {
      closed: { maxRequests: Infinity },
      halfOpen: { maxRequests: 10, duration: "30s" },
      open: { duration: "60s" },
    },
    monitoring: {
      metrics: ["latency", "errorRate", "requestCount"],
      callback: (metrics) => logMetrics(metrics),
    },
  },
});
```

#### Intelligent Retry Strategy

```typescript
const instance = omni.create({
  retry: {
    enabled: true,
    strategies: {
      network: {
        conditions: ["offline", "slow-connection"],
        backoff: "exponential",
        maxAttempts: 5,
      },
      status: {
        codes: [429, 503, 504],
        backoff: (attempt) => Math.pow(2, attempt) * 1000,
        maxAttempts: 3,
      },
      custom: {
        condition: (error) => error.response?.data?.retryable === true,
        backoff: "fixed",
        delay: 1000,
      },
    },
    events: {
      onRetry: (error, attempt) => logRetryAttempt(error, attempt),
      onSuccess: (response, attempts) => logRetrySuccess(response, attempts),
      onFail: (error, attempts) => logRetryFailure(error, attempts),
    },
  },
});
```

### 📦 Caching & Storage

#### Advanced Caching System

```typescript
const instance = omni.create({
  cache: {
    strategy: "predictive",
    storage: {
      type: "multi-level",
      levels: [
        { type: "memory", size: "100MB" },
        { type: "indexedDB", size: "1GB" },
        { type: "filesystem", size: "10GB" },
      ],
    },
    prefetch: {
      links: true,
      patterns: ["/api/user/:id/*"],
      conditions: {
        connection: "4g",
        battery: { min: 0.2 },
      },
    },
    revalidation: {
      background: true,
      interval: "5m",
      staleWhileRevalidate: true,
      conditionalGet: true,
    },
    compression: {
      enabled: true,
      algorithm: "brotli",
      threshold: "1KB",
    },
  },
});
```

### 🔐 Security & Authentication

#### Enhanced Authentication

```typescript
const instance = omni.create({
  auth: {
    type: "oauth2",
    tokens: {
      access: localStorage.getItem("access_token"),
      refresh: localStorage.getItem("refresh_token"),
    },
    refresh: {
      auto: true,
      threshold: "5m",
      retry: true,
      queue: true,
      backoff: "exponential",
    },
    multiAuth: {
      enabled: true,
      strategies: {
        api: "bearer",
        storage: "aws-signature",
        analytics: "api-key",
      },
    },
    sessionManagement: {
      enabled: true,
      timeout: "30m",
      keepAlive: true,
      singleSession: true,
    },
  },
});
```

#### Security Features

```typescript
const instance = omni.create({
  security: {
    encryption: {
      enabled: true,
      algorithm: "AES-256-GCM",
      keyManagement: "auto",
    },
    headers: {
      hsts: true,
      csp: true,
      xssProtection: true,
    },
    sanitization: {
      input: true,
      output: true,
      sql: true,
    },
    rateLimit: {
      enabled: true,
      max: 100,
      window: "1m",
      strategy: "token-bucket",
    },
  },
});
```

### 📱 Offline & Mobile Support

#### Advanced Offline Capabilities

```typescript
const instance = omni.create({
  offline: {
    enabled: true,
    storage: {
      type: "indexedDB",
      encryption: true,
      compression: true,
    },
    sync: {
      auto: true,
      strategy: "background",
      conflict: {
        resolution: "client-wins",
        detection: "version-vector",
        merge: "custom",
      },
      queue: {
        priority: true,
        persistence: true,
        retry: true,
      },
    },
    networkDetection: {
      mode: "adaptive",
      timeout: 5000,
      interval: "1m",
    },
  },
});
```

### 📊 Monitoring & Debugging

#### Comprehensive Monitoring

```typescript
const instance = omni.create({
  monitoring: {
    metrics: {
      enabled: true,
      capture: ["timing", "size", "cache", "errors", "memory"],
      aggregation: {
        window: "1m",
        types: ["avg", "p95", "p99"],
      },
      export: {
        format: "prometheus",
        endpoint: "/metrics",
      },
    },
    logging: {
      level: "debug",
      format: "json",
      correlation: true,
      redaction: ["password", "token"],
      persistence: {
        enabled: true,
        rotation: "1d",
      },
    },
    tracing: {
      enabled: true,
      distributed: true,
      sampling: 0.1,
      exporters: ["jaeger", "zipkin"],
    },
    alerts: {
      conditions: [
        { metric: "errorRate", threshold: 0.1, window: "5m" },
        { metric: "latency", threshold: 1000, window: "1m" },
      ],
      channels: ["slack", "email"],
    },
  },
});
```

### Creating an Instance

```typescript
// Create a new instance with custom configuration
const client = new OmniRequest({
  baseURL: "https://dummyjson.com/products",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});

// The instance will now use the custom configuration
const response = await client.request({
  method: "GET",
  url: "/user/12345",
});
```

### Request Configuration

```typescript
// Create a client instance
const client = new OmniRequest();

// Send a POST request
const postResponse = await client.request({
  method: "POST",
  url: "/user/12345",
  data: {
    firstName: "Fred",
    lastName: "Flintstone",
  },
});

// GET request with query parameters
const getResponse = await client.request({
  method: "GET",
  url: "/user",
  params: {
    ID: 12345,
  },
});
```

### Response Schema

```typescript
{
  // `data` is the response that was provided by the server
  data: {},

  // `status` is the HTTP status code
  status: 200,

  // `statusText` is the HTTP status message
  statusText: 'OK',

  // `headers` the HTTP headers
  headers: {},

  // `config` is the config that was provided to `omni` for the request
  config: {},
}
```

### Advanced Features

#### Using Middleware

```typescript
// Create a client instance
const client = new OmniRequest();

// Get the middleware manager
const middlewareManager = client.getMiddlewareManager();

// Add request middleware
middlewareManager.use({
  request: async (config) => {
    // Do something before request is sent
    console.log("Request:", config.url);
    return config;
  },
  response: async (response) => {
    // Do something with the response
    console.log("Response:", response.status);
    return response;
  },
  error: async (error) => {
    // Handle errors
    console.error("Error:", error.message);
    throw error;
  },
});
```

#### Using Plugins

```typescript
// Create a client instance
const client = new OmniRequest();

// Create a custom plugin
const loggingPlugin = {
  name: "logger",
  enabled: true,
  beforeRequest: async (config) => {
    console.log(`Request: ${config.method} ${config.url}`);
    return config;
  },
  afterResponse: async (response) => {
    console.log(`Response: ${response.status} ${response.config.url}`);
    return response;
  },
};

// Register the plugin
client.use(loggingPlugin);
```

#### Automatic Token Refresh

```typescript
// Create a client instance
const client = new OmniRequest({
  baseURL: "https://dummyjson.com/products",
});

// Create an auth plugin
const authPlugin = {
  name: "auth",
  enabled: true,
  beforeRequest: async (config) => {
    // Add token to request
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  onError: async (error) => {
    // Handle 401 errors by refreshing token
    if (error.status === 401) {
      // Create a new client for the refresh request to avoid loops
      const refreshClient = new OmniRequest();
      const refreshResponse = await refreshClient.request({
        method: "POST",
        url: "https://dummyjson.com/products/refresh",
        data: { refreshToken: localStorage.getItem("refreshToken") },
      });

      // Save the new token
      localStorage.setItem("token", refreshResponse.data.token);

      // Retry the original request
      return client.request(error.config);
    }
    throw error;
  },
};

// Register the plugin
client.use(authPlugin);
```

#### Caching

```typescript
// Create a client instance
const client = new OmniRequest({
  baseURL: "https://dummyjson.com/products",
});

// Create a simple cache
const cache = new Map();

// Create a caching plugin
const cachePlugin = {
  name: "cache",
  enabled: true,
  beforeRequest: async (config) => {
    // Only cache GET requests
    if (config.method !== "GET") return config;

    const cacheKey = `${config.method}-${config.url}`;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < 60000) {
      // 1 minute TTL
      // Return cached response
      return Promise.reject({
        __cached: true,
        cachedResponse: cachedResponse.data,
      });
    }

    return config;
  },
  afterResponse: async (response) => {
    // Only cache GET requests
    if (response.config.method !== "GET") return response;

    const cacheKey = `${response.config.method}-${response.config.url}`;

    // Store in cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response,
    });

    return response;
  },
  onError: async (error) => {
    // Check if this is our cached response signal
    if (error.__cached) {
      return error.cachedResponse;
    }
    throw error;
  },
};

// Register the plugin
client.use(cachePlugin);
```

#### Retry Logic

```typescript
// Create a client instance
const client = new OmniRequest({
  baseURL: "https://dummyjson.com/products",
});

// Create a retry plugin
const retryPlugin = {
  name: "retry",
  enabled: true,
  onError: async (error) => {
    // Get the original request config
    const config = error.config || {};

    // Initialize retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if we should retry (503 Service Unavailable)
    if (error.status === 503 && config.__retryCount < 3) {
      // Increment retry count
      config.__retryCount++;

      // Calculate exponential backoff delay
      const delay = Math.pow(2, config.__retryCount) * 1000;

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return client.request(config);
    }

    // If we shouldn't retry or we've reached max retries, throw the error
    throw error;
  },
};

// Register the plugin
client.use(retryPlugin);
```

#### Circuit Breaker

```typescript
// Create a client instance
const client = new OmniRequest({
  baseURL: "https://dummyjson.com/products",
});

// Create a circuit breaker plugin
const circuitBreakerPlugin = {
  name: "circuitBreaker",
  enabled: true,
  priority: 100, // High priority to run early

  // Circuit state
  state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
  failures: 0,
  lastFailureTime: 0,
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute

  beforeRequest: async (config) => {
    // Check if circuit is open
    if (this.state === "OPEN") {
      // Check if reset timeout has elapsed
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        // Move to half-open state
        this.state = "HALF_OPEN";
      } else {
        // Circuit is open, reject the request
        return Promise.reject({
          message: "Circuit breaker is open",
          type: "CIRCUIT_OPEN",
          status: 0,
        });
      }
    }

    return config;
  },

  afterResponse: async (response) => {
    // If we're in half-open state and got a successful response, close the circuit
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failures = 0;
    }

    return response;
  },

  onError: async (error) => {
    // Check if this is a monitored error (500, 503)
    if ([500, 503].includes(error.status)) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Check if we've reached the failure threshold
      if (this.failures >= this.failureThreshold) {
        this.state = "OPEN";
      }
    }

    throw error;
  },
};

// Register the plugin
client.use(circuitBreakerPlugin);
```

### Complete Example

```typescript
// Import the library
import { OmniRequest } from "omnirequest";

// Create a new instance with custom configuration
const client = new OmniRequest({
  baseURL: "https://dummyjson.com/products",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

// Create a simple logging plugin
const loggingPlugin = {
  name: "logger",
  enabled: true,
  beforeRequest: async (config) => {
    console.log(`Request: ${config.method} ${config.url}`);
    return config;
  },
  afterResponse: async (response) => {
    console.log(`Response: ${response.status} ${response.config.url}`);
    return response;
  },
};

// Register the plugin
client.use(loggingPlugin);

// Make a request
async function fetchData() {
  try {
    const response = await client.request({
      method: "GET",
      url: "/users",
      params: { page: 1, limit: 10 },
    });

    console.log("Data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Call the function
fetchData();
```

## 📝 License

[MIT](LICENSE)

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/jasgigli">Junaid Ali Shah Gigli</a>
</div>
