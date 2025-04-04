# Middleware

OmniRequest's middleware system allows you to intercept and modify requests and responses at various stages of the request lifecycle.

## Overview

Middleware functions are executed in a pipeline, where each middleware can:

1. Modify the request before it's sent
2. Pass the request to the next middleware in the chain
3. Receive and modify the response
4. Handle errors

## Creating Middleware

A middleware function has the following signature:

```typescript
type Middleware = (
  request: Request,
  next: (request: Request) => Promise<Response>
) => Promise<Response>;
```

Here's a simple logging middleware example:

```typescript
const loggingMiddleware = async (request, next) => {
  console.log(`Request: ${request.method} ${request.url}`);
  
  try {
    const response = await next(request);
    console.log(`Response: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};
```

## Using Middleware

You can add middleware when creating a client:

```typescript
import { OmniRequest } from 'omnirequest';

const client = new OmniRequest({
  middleware: [loggingMiddleware]
});
```

Or add it to an existing client:

```typescript
client.use(loggingMiddleware);
```

## Middleware Order

Middleware functions are executed in the order they are added. For example:

```typescript
client.use(middleware1);
client.use(middleware2);
client.use(middleware3);
```

The execution order will be:

1. `middleware1` (request phase)
2. `middleware2` (request phase)
3. `middleware3` (request phase)
4. HTTP request is made
5. `middleware3` (response phase)
6. `middleware2` (response phase)
7. `middleware1` (response phase)

## Built-in Middleware

OmniRequest comes with several built-in middleware:

### Retry Middleware

Automatically retries failed requests:

```typescript
import { OmniRequest, retryMiddleware } from 'omnirequest';

const client = new OmniRequest({
  middleware: [
    retryMiddleware({
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error) => error.isNetworkError || (error.response && error.response.status >= 500)
    })
  ]
});
```

### Cache Middleware

Caches responses to improve performance:

```typescript
import { OmniRequest, cacheMiddleware } from 'omnirequest';

const client = new OmniRequest({
  middleware: [
    cacheMiddleware({
      ttl: 60000, // 1 minute
      methods: ['GET'],
      storage: 'memory'
    })
  ]
});
```

### Timeout Middleware

Adds request timeouts:

```typescript
import { OmniRequest, timeoutMiddleware } from 'omnirequest';

const client = new OmniRequest({
  middleware: [
    timeoutMiddleware(5000) // 5 seconds
  ]
});
```

### Authentication Middleware

Adds authentication headers:

```typescript
import { OmniRequest, authMiddleware } from 'omnirequest';

const client = new OmniRequest({
  middleware: [
    authMiddleware({
      type: 'Bearer',
      getToken: () => localStorage.getItem('token')
    })
  ]
});
```

## Advanced Middleware Patterns

### Conditional Middleware

Execute middleware only under certain conditions:

```typescript
const conditionalMiddleware = (condition, middleware) => {
  return async (request, next) => {
    if (condition(request)) {
      return middleware(request, next);
    }
    return next(request);
  };
};

// Only apply caching to GET requests
client.use(
  conditionalMiddleware(
    (req) => req.method === 'GET',
    cacheMiddleware({ ttl: 60000 })
  )
);
```

### Middleware Composition

Combine multiple middleware into one:

```typescript
const composeMiddleware = (...middlewares) => {
  return async (request, next) => {
    // Create a chain of middleware
    const chain = middlewares.reduceRight(
      (nextMiddleware, middleware) => {
        return (req) => middleware(req, nextMiddleware);
      },
      next
    );
    
    return chain(request);
  };
};

// Combine logging, retry, and cache middleware
client.use(
  composeMiddleware(
    loggingMiddleware,
    retryMiddleware({ retries: 3 }),
    cacheMiddleware({ ttl: 60000 })
  )
);
```

## Creating Your Own Middleware

Here are some examples of custom middleware:

### Request ID Middleware

Add a unique ID to each request:

```typescript
const requestIdMiddleware = async (request, next) => {
  // Generate a unique ID
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Add it to the request headers
  request.headers = {
    ...request.headers,
    'X-Request-ID': requestId
  };
  
  // Pass the request to the next middleware
  const response = await next(request);
  
  // Add the request ID to the response
  response.requestId = requestId;
  
  return response;
};
```

### Metrics Middleware

Collect performance metrics:

```typescript
const metricsMiddleware = async (request, next) => {
  const startTime = Date.now();
  
  try {
    const response = await next(request);
    
    const duration = Date.now() - startTime;
    
    // Record metrics
    recordMetric({
      url: request.url,
      method: request.method,
      status: response.status,
      duration
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record error metrics
    recordErrorMetric({
      url: request.url,
      method: request.method,
      error: error.message,
      duration
    });
    
    throw error;
  }
};

// Helper function to record metrics
function recordMetric(data) {
  // Send metrics to your analytics service
  console.log('Metric:', data);
}

function recordErrorMetric(data) {
  // Send error metrics to your analytics service
  console.error('Error Metric:', data);
}
```

## Best Practices

1. **Keep middleware focused**: Each middleware should have a single responsibility.
2. **Handle errors properly**: Always catch and properly handle errors in middleware.
3. **Be mindful of order**: The order of middleware matters. Put middleware that should run first at the beginning.
4. **Avoid side effects**: Middleware should be pure functions when possible.
5. **Document your middleware**: Provide clear documentation for custom middleware.
6. **Test middleware in isolation**: Write unit tests for your middleware functions.
