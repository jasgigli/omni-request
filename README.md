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

### Making Requests

```typescript
import omni from "omnirequest";

// Make a GET request
omni
  .get("/user?ID=12345")
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });

// Make a POST request
omni
  .post("/user", {
    firstName: "Fred",
    lastName: "Flintstone",
  })
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });

// Using async/await
async function getUser() {
  try {
    const response = await omni.get("/user?ID=12345");
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
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
const instance = omni.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});

// The instance will now use the custom configuration
instance.get("/user/12345");
```

### Request Configuration

```typescript
// Send a POST request
omni({
  method: "post",
  url: "/user/12345",
  data: {
    firstName: "Fred",
    lastName: "Flintstone",
  },
});

// GET request with query parameters
omni({
  method: "get",
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

#### Request Interceptors

```typescript
// Add a request interceptor
omni.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);
```

#### Response Interceptors

```typescript
// Add a response interceptor
omni.interceptors.response.use(
  function (response) {
    // Any status code within the range of 2xx
    return response;
  },
  function (error) {
    // Any status codes outside the range of 2xx
    return Promise.reject(error);
  }
);
```

#### Automatic Token Refresh

```typescript
const instance = omni.create({
  baseURL: "https://api.example.com",
  auth: {
    getToken: () => localStorage.getItem("token"),
    refreshToken: async () => {
      const response = await omni.post("/refresh");
      return response.data.token;
    },
    shouldRefresh: (error) => error.response?.status === 401,
  },
});
```

#### Caching

```typescript
const instance = omni.create({
  baseURL: "https://api.example.com",
  cache: {
    enable: true,
    ttl: 60000, // 1 minute
    strategy: "stale-while-revalidate",
  },
});
```

#### Retry Logic

```typescript
const instance = omni.create({
  baseURL: "https://api.example.com",
  retry: {
    attempts: 3,
    backoff: "exponential",
    conditions: [(error) => error.status === 503],
  },
});
```

#### Circuit Breaker

```typescript
const instance = omni.create({
  baseURL: "https://api.example.com",
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoredErrors: [500, 503],
  },
});
```

### React Integration

```typescript
import { useOmni } from "omnirequest/react";

function UserProfile({ userId }) {
  const { data, loading, error } = useOmni(`/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Hello, {data.name}!</div>;
}
```

## 📝 License

[MIT](LICENSE)

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/jasgigli">Junaid Ali Shah Gigli</a>
</div>
