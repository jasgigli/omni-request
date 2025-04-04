# Plugins

OmniRequest's plugin system allows you to extend the core functionality with reusable modules.

## Overview

Plugins are modular extensions that can:

1. Add new features to OmniRequest
2. Modify the behavior of existing features
3. Integrate with external services
4. Provide utility functions

## Using Plugins

You can add plugins when creating a client:

```typescript
import { OmniRequest, RetryPlugin, CachePlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new RetryPlugin({ retries: 3 }),
    new CachePlugin({ ttl: 60000 })
  ]
});
```

Or add them to an existing client:

```typescript
import { AuthPlugin } from 'omnirequest';

client.addPlugin(new AuthPlugin({
  type: 'Bearer',
  getToken: () => localStorage.getItem('token')
}));
```

## Built-in Plugins

OmniRequest comes with several built-in plugins:

### Retry Plugin

Automatically retries failed requests:

```typescript
import { OmniRequest, RetryPlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new RetryPlugin({
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error) => error.isNetworkError || (error.response && error.response.status >= 500),
      backoff: 'exponential' // 'linear', 'exponential', or a custom function
    })
  ]
});
```

### Cache Plugin

Caches responses to improve performance:

```typescript
import { OmniRequest, CachePlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new CachePlugin({
      ttl: 60000, // 1 minute
      methods: ['GET'],
      storage: 'memory', // 'memory', 'localStorage', 'sessionStorage', or a custom storage
      key: (request) => `${request.method}:${request.url}`,
      serialize: JSON.stringify,
      deserialize: JSON.parse
    })
  ]
});
```

### Auth Plugin

Handles authentication and token refresh:

```typescript
import { OmniRequest, AuthPlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new AuthPlugin({
      type: 'Bearer',
      getToken: async () => localStorage.getItem('token'),
      refreshToken: async () => {
        // Refresh the token
        const response = await fetch('/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refreshToken: localStorage.getItem('refreshToken')
          })
        });
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        return data.token;
      },
      isTokenExpired: (error) => {
        return error.response && error.response.status === 401;
      }
    })
  ]
});
```

### Rate Limit Plugin

Prevents exceeding API rate limits:

```typescript
import { OmniRequest, RateLimitPlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new RateLimitPlugin({
      limit: 100, // 100 requests
      interval: 60000, // per minute
      strategy: 'queue' // 'queue', 'drop', or 'error'
    })
  ]
});
```

### Circuit Breaker Plugin

Prevents cascading failures:

```typescript
import { OmniRequest, CircuitBreakerPlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new CircuitBreakerPlugin({
      failureThreshold: 5, // Number of failures before opening the circuit
      resetTimeout: 30000, // Time to wait before trying again (30 seconds)
      isFailure: (error, response) => {
        if (error) return true;
        return response.status >= 500;
      }
    })
  ]
});
```

### Metrics Plugin

Collects performance metrics:

```typescript
import { OmniRequest, MetricsPlugin } from 'omnirequest';

const client = new OmniRequest({
  plugins: [
    new MetricsPlugin({
      onRequest: (request) => {
        // Record request metrics
        console.log(`Request: ${request.method} ${request.url}`);
      },
      onResponse: (response, duration) => {
        // Record response metrics
        console.log(`Response: ${response.status} (${duration}ms)`);
      },
      onError: (error, duration) => {
        // Record error metrics
        console.error(`Error: ${error.message} (${duration}ms)`);
      }
    })
  ]
});
```

## Creating Custom Plugins

You can create your own plugins by implementing the `Plugin` interface:

```typescript
import { Plugin, Request, Response } from 'omnirequest';

class LoggingPlugin implements Plugin {
  name = 'LoggingPlugin';
  
  constructor(private options = {}) {}
  
  onRequest(request: Request) {
    console.log(`Request: ${request.method} ${request.url}`);
    return request;
  }
  
  onResponse(response: Response) {
    console.log(`Response: ${response.status}`);
    return response;
  }
  
  onError(error: Error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

// Use the plugin
const client = new OmniRequest({
  plugins: [new LoggingPlugin()]
});
```

## Plugin Lifecycle

Plugins hook into different stages of the request lifecycle:

1. **onRequest**: Called before a request is sent
2. **onResponse**: Called after a response is received
3. **onError**: Called when an error occurs
4. **onInit**: Called when the plugin is initialized
5. **onDestroy**: Called when the plugin is removed

## Plugin Configuration

Plugins can be configured with options:

```typescript
const cachePlugin = new CachePlugin({
  ttl: 60000,
  methods: ['GET'],
  storage: 'memory'
});

client.addPlugin(cachePlugin);
```

## Plugin Composition

Multiple plugins can be used together:

```typescript
const client = new OmniRequest({
  plugins: [
    new LoggingPlugin(),
    new RetryPlugin({ retries: 3 }),
    new CachePlugin({ ttl: 60000 }),
    new AuthPlugin({ type: 'Bearer', getToken: () => localStorage.getItem('token') })
  ]
});
```

## Plugin Ordering

The order of plugins matters. Plugins are executed in the order they are added:

```typescript
// First LoggingPlugin, then RetryPlugin, then CachePlugin
const client = new OmniRequest({
  plugins: [
    new LoggingPlugin(),
    new RetryPlugin({ retries: 3 }),
    new CachePlugin({ ttl: 60000 })
  ]
});
```

## Best Practices

1. **Keep plugins focused**: Each plugin should have a single responsibility.
2. **Handle errors properly**: Always catch and properly handle errors in plugins.
3. **Be mindful of order**: The order of plugins matters. Put plugins that should run first at the beginning.
4. **Document your plugins**: Provide clear documentation for custom plugins.
5. **Test plugins in isolation**: Write unit tests for your plugins.
6. **Make plugins configurable**: Allow users to customize the behavior of your plugins.
