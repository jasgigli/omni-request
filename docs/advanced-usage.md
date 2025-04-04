# Advanced Usage

This guide covers advanced usage patterns for OmniRequest.

## Table of Contents

- [Custom Middleware](#custom-middleware)
- [Request Cancellation](#request-cancellation)
- [Interceptors](#interceptors)
- [Caching Strategies](#caching-strategies)
- [Error Handling](#error-handling)
- [Concurrency Control](#concurrency-control)
- [Circuit Breakers](#circuit-breakers)
- [Authentication](#authentication)

## Custom Middleware

You can create custom middleware to extend OmniRequest's functionality:

```typescript
import { OmniRequest } from 'omnirequest';

// Create a logging middleware
const loggingMiddleware = async (req, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  const start = Date.now();
  
  try {
    // Call the next middleware in the chain
    const response = await next(req);
    
    // Log the response
    console.log(`Response: ${response.status} (${Date.now() - start}ms)`);
    return response;
  } catch (error) {
    console.error(`Error: ${error.message} (${Date.now() - start}ms)`);
    throw error;
  }
};

// Create a client with the middleware
const client = new OmniRequest({
  middleware: [loggingMiddleware]
});

// Make a request
const response = await client.get('https://api.example.com/data');
```

## Request Cancellation

OmniRequest supports request cancellation using AbortController:

```typescript
import { OmniRequest } from 'omnirequest';

const client = new OmniRequest();

// Create an AbortController
const controller = new AbortController();

// Make a request with the signal
client.get('https://api.example.com/data', {
  signal: controller.signal
}).catch(error => {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  } else {
    console.error('Request failed:', error);
  }
});

// Cancel the request after 2 seconds
setTimeout(() => {
  controller.abort();
}, 2000);
```

## Interceptors

Interceptors allow you to modify requests and responses globally:

```typescript
import { OmniRequest } from 'omnirequest';

const client = new OmniRequest();

// Add a request interceptor
client.interceptors.request.use(config => {
  // Add a timestamp to all requests
  config.params = {
    ...config.params,
    _t: Date.now()
  };
  return config;
});

// Add a response interceptor
client.interceptors.response.use(
  response => {
    // Transform successful responses
    return response;
  },
  error => {
    // Handle errors
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors
      console.log('Unauthorized, redirecting to login');
    }
    return Promise.reject(error);
  }
);
```

## Caching Strategies

OmniRequest provides advanced caching capabilities:

```typescript
import { OmniRequest, CachePlugin } from 'omnirequest';

// Create a client with caching
const client = new OmniRequest({
  plugins: [
    new CachePlugin({
      // Cache GET requests for 5 minutes
      ttl: 5 * 60 * 1000,
      // Only cache successful responses
      predicate: (response) => response.status === 200,
      // Use localStorage in browsers, file system in Node.js
      storage: 'auto'
    })
  ]
});

// Make a request (will be cached)
const response1 = await client.get('https://api.example.com/data');

// Make the same request again (will use cache)
const response2 = await client.get('https://api.example.com/data');

// Force a fresh request
const response3 = await client.get('https://api.example.com/data', {
  cache: 'no-store'
});
```

## Error Handling

Advanced error handling with OmniRequest:

```typescript
import { OmniRequest } from 'omnirequest';

const client = new OmniRequest();

try {
  const response = await client.get('https://api.example.com/data');
  console.log('Data:', response.data);
} catch (error) {
  if (error.isNetworkError) {
    console.error('Network error:', error.message);
  } else if (error.response) {
    // The server responded with an error status code
    console.error('Server error:', error.response.status, error.response.data);
    
    if (error.response.status === 404) {
      console.log('Resource not found');
    } else if (error.response.status === 401) {
      console.log('Unauthorized, please login');
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
  } else {
    // Something else went wrong
    console.error('Error:', error.message);
  }
}
```

## Concurrency Control

Control the number of concurrent requests:

```typescript
import { OmniRequest, ConcurrencyPlugin } from 'omnirequest';

// Create a client with concurrency control
const client = new OmniRequest({
  plugins: [
    new ConcurrencyPlugin({
      // Maximum 3 concurrent requests
      max: 3,
      // Group requests by domain
      groupBy: (request) => new URL(request.url).hostname
    })
  ]
});

// These requests will be executed with a maximum of 3 concurrent requests
const promises = Array.from({ length: 10 }, (_, i) => 
  client.get(`https://api.example.com/data/${i}`)
);

const responses = await Promise.all(promises);
```

## Circuit Breakers

Implement circuit breakers to prevent cascading failures:

```typescript
import { OmniRequest, CircuitBreakerPlugin } from 'omnirequest';

// Create a client with circuit breaker
const client = new OmniRequest({
  plugins: [
    new CircuitBreakerPlugin({
      // Trip the circuit after 5 failures
      failureThreshold: 5,
      // Reset after 30 seconds
      resetTimeout: 30000,
      // Consider 5xx responses as failures
      isFailure: (error, response) => {
        if (error) return true;
        return response.status >= 500;
      }
    })
  ]
});

// This request will be blocked if the circuit is open
try {
  const response = await client.get('https://api.example.com/data');
  console.log('Data:', response.data);
} catch (error) {
  if (error.name === 'CircuitBreakerError') {
    console.error('Circuit is open, request not sent');
  } else {
    console.error('Request failed:', error);
  }
}
```

## Authentication

Handle authentication with OmniRequest:

```typescript
import { OmniRequest, AuthPlugin } from 'omnirequest';

// Create a client with authentication
const client = new OmniRequest({
  plugins: [
    new AuthPlugin({
      // Add token to all requests
      getToken: async () => localStorage.getItem('token'),
      // Handle token refresh
      refreshToken: async () => {
        const response = await fetch('https://api.example.com/refresh', {
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
        localStorage.setItem('refreshToken', data.refreshToken);
        
        return data.token;
      },
      // Detect when token needs refresh
      isTokenExpired: (error) => {
        return error.response && error.response.status === 401;
      }
    })
  ]
});

// This request will automatically include the token
const response = await client.get('https://api.example.com/data');
```
