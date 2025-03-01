# OmniRequest

 
[![NPM Version](https://img.shields.io/npm/v/omnirequest.svg)](https://www.npmjs.com/package/omnirequest)  
[![License](https://img.shields.io/npm/l/omnirequest.svg)](LICENSE)

OmniRequest is a **modern Node.js HTTP client** built with a **powerful middleware architecture**. It goes beyond standard HTTP libraries like `fetch` or `axios` by offering **advanced caching & revalidation**, **concurrency & rate limiting**, **intelligent retry & circuit breakers**, **auto‑auth**, and more. Whether you’re building microservices, CLI tools, or large enterprise applications in Node.js, OmniRequest provides a flexible, pluggable solution to real‑world HTTP challenges.

---

## Table of Contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Use Cases](#advanced-use-cases)
  - [Caching & Revalidation](#caching--revalidation)
  - [Concurrency & Rate Limiting](#concurrency--rate-limiting)
  - [Intelligent Retry & Circuit Breakers](#intelligent-retry--circuit-breakers)
  - [Auto Auth & Token Refresh](#auto-auth--token-refresh)
- [Example: Putting It All Together](#example-putting-it-all-together)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

1. **Advanced Caching & Revalidation**  
   - ETag / Last-Modified handling (`If-None-Match`, `If-Modified-Since`)  
   - Offline caching in Node memory (or IndexedDB in browser, if used there)  
   - Hooks for cache invalidation, partial revalidation

2. **Concurrency Control & Rate Limiting**  
   - Global or per-endpoint concurrency limits  
   - Token bucket or leaky bucket algorithms for smoothing bursts  
   - Queueing with priority to handle overload gracefully

3. **Intelligent Retry & Circuit Breakers**  
   - Exponential backoff with optional jitter  
   - Circuit breaker pattern to fail fast after repeated endpoint failures  
   - Granular retry conditions (e.g., only retry 5xx or network errors)

4. **Auto Auth & Token Refresh**  
   - Multiple auth strategies: Basic, Bearer, OAuth2, or custom headers  
   - Automatic token refresh on expiry or 401 responses  
   - Hooks for success/error events when refreshing tokens

5. **Middleware & Plugin System**  
   - Compose your pipeline with caching, retry, logging, or custom logic  
   - Fine‑grained interceptors for request/response/error

6. **TypeScript & ESM**  
   - Written in TypeScript for full type safety  
   - Distributed as ESM for modern Node.js usage

---

## Installation

```bash
npm install omnirequest
```


---

## Basic Usage

Below is a minimal Node.js example using OmniRequest to perform a GET request:

```js
import { RequestClient } from 'omnirequest';

const client = new RequestClient();

async function fetchData() {
  try {
    const response = await client.get('https://dummyjson.com/user');
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Request error:', error);
  }
}

fetchData();
```

- **`RequestClient`** is your main entry point for sending HTTP requests (GET, POST, etc.).  
- **Promises & async/await**: OmniRequest is fully promise‑based.

---

## Advanced Use Cases

Below are real‑world problems OmniRequest solves for Node.js developers. Each feature is optional and can be enabled via middleware or plugins.

### Caching & Revalidation

**Problem**: You repeatedly call the same endpoints, or want to handle `ETag`/`If-None-Match` to reduce bandwidth.  
**Solution**: `RevalidationCacheMiddleware` automatically attaches `If-None-Match` headers if you have a cached copy. If the server responds `304 Not Modified`, OmniRequest returns the cached data.

```js
import { RequestClient, RevalidationCacheMiddleware } from 'omnirequest';

const client = new RequestClient();
client.use(new RevalidationCacheMiddleware({
  maxAge: 60_000,   // skip revalidation if data is younger than 60s
  offline: false,   // in Node, we just store in memory
  onStore: (key, response) => {
    console.log(`Stored data for ${key}, ETag: ${response.headers.etag}`);
  }
}));

// If the server returns ETag, subsequent GET requests might result in 304
client.get('https://dummyjson.com/user')
  .then(res => console.log('Items:', res.data))
  .catch(err => console.error(err));
```

### Concurrency & Rate Limiting

**Problem**: You have multiple calls to the same or different endpoints, risking overload or 429 errors.  
**Solution**: `ConcurrencyRateLimitMiddleware` can cap concurrency (global or per endpoint), plus optionally use a token bucket to smooth bursts.

```js
import { RequestClient, ConcurrencyRateLimitMiddleware } from 'omnirequest';

const client = new RequestClient();
client.use(new ConcurrencyRateLimitMiddleware({
  globalConcurrency: 3,
  endpointConcurrency: {
    'https://dummyjson.com/user': 2
  },
  queue: true,
  tokenBucket: {
    capacity: 5,
    refillRate: 1,
    intervalMs: 3000
  }
}));

// If you quickly fire 10 requests, concurrency and tokens will
// ensure only 3 run in parallel, and the rest queue or wait for tokens.
for (let i = 0; i < 10; i++) {
  client.get('https://dummyjson.com/user')
    .then(res => console.log(`Request #${i} status: ${res.status}`))
    .catch(err => console.error(`Request #${i} error: ${err}`));
}
```

### Intelligent Retry & Circuit Breakers

**Problem**: Endpoints sometimes fail, you want to retry with backoff. But if an endpoint is truly down, you want to fail fast.  
**Solution**: `IntelligentRetryMiddleware` uses exponential backoff with jitter, plus a circuit breaker pattern to avoid repeated attempts once a threshold of failures is reached.

```js
import { RequestClient, IntelligentRetryMiddleware } from 'omnirequest';

const client = new RequestClient();
client.use(new IntelligentRetryMiddleware({
  maxRetries: 3,
  baseDelay: 1000,
  jitter: true,
  circuitBreaker: {
    threshold: 2,    // after 2 consecutive failures, open circuit
    cooldown: 10_000 // wait 10s before half-opening
  }
}));

client.get('https://dummyjson.com/user')
  .then(res => console.log('Flaky endpoint data:', res.data))
  .catch(err => console.error('Failed after retries/circuit open:', err));
```

### Auto Auth & Token Refresh

**Problem**: Handling short-lived tokens (e.g., Bearer or OAuth2) is tedious, requiring code for expiry checks and refresh.  
**Solution**: `setupAutoAuth` plugin automatically attaches tokens, refreshes them upon expiry or 401, and replays failed requests after a successful refresh.

```js
import { RequestClient } from 'omnirequest';
import { setupAutoAuth } from 'omnirequest/plugins/autoAuth';

const client = new RequestClient();

setupAutoAuth(client, {
  type: 'bearer',
  token: 'INITIAL_TOKEN',
  tokenExpiry: Date.now() + 60000, // expires in 1 minute
  refreshToken: async () => {
    // Call an endpoint or do something to get a new token
    const newToken = await fetchNewTokenFromAuthServer();
    return newToken;
  },
  onRefreshSuccess: (newToken) => {
    console.log('Got a new token:', newToken);
  },
  onRefreshError: (err) => {
    console.error('Token refresh failed:', err);
  }
});

// OmniRequest automatically refreshes token if expired or if 401 is encountered
client.get('https://dummyjson.com/user')
  .then(res => console.log('Protected data:', res.data))
  .catch(err => console.error(err));
```

---

## Example: Putting It All Together

A single Node.js script that uses **caching, concurrency, retry, and auto-auth**:

```js
import {
  RequestClient,
  RevalidationCacheMiddleware,
  ConcurrencyRateLimitMiddleware,
  IntelligentRetryMiddleware
} from 'omnirequest';
import { setupAutoAuth } from 'omnirequest/plugins/autoAuth';

const client = new RequestClient({ timeout: 5000 });

// 1. Advanced Caching & Revalidation
client.use(new RevalidationCacheMiddleware({
  maxAge: 30000,
  offline: false
}));

// 2. Concurrency & Rate Limiting
client.use(new ConcurrencyRateLimitMiddleware({
  globalConcurrency: 3,
  tokenBucket: { capacity: 5, refillRate: 1, intervalMs: 3000 }
}));

// 3. Intelligent Retry & Circuit Breakers
client.use(new IntelligentRetryMiddleware({
  maxRetries: 3,
  baseDelay: 1000,
  jitter: true,
  circuitBreaker: { threshold: 2, cooldown: 10000 }
}));

// 4. Auto Auth & Token Refresh
setupAutoAuth(client, {
  type: 'bearer',
  token: 'INITIAL_TOKEN',
  tokenExpiry: Date.now() + 60000,
  refreshToken: async () => {
    // implement your token refresh logic
    return 'NEW_TOKEN';
  }
});

async function main() {
  try {
    const res = await client.get('https://dummyjson.com/user');
    console.log('Result:', res.data);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
```

- **First** call might store an ETag or last-modified if returned by the server, skipping revalidation if data is fresh.  
- **Concurrency** ensures no more than 3 in-flight requests at once, and the token bucket manages bursts.  
- **Retry** with exponential backoff if the endpoint is flaky, and the circuit breaker opens after repeated failures.  
- **Auto Auth** automatically refreshes the token if it expires or if a 401 is returned.

---

## Architecture

OmniRequest is built with a modular, pluggable architecture:

```
omnirequest/
├── src/
│   ├── adapters/       # Environment-specific (Node, Bun, Deno, etc.)
│   ├── core/           # Core request client, interceptors, pipeline
│   ├── middleware/     # Pluggable middleware (cache, concurrency, retry, etc.)
│   ├── plugins/        # Optional plugins (auth, logging, etc.)
│   └── types/          # TypeScript type definitions
└── ...
```

- **Core** handles request pipelines and interceptors.  
- **Middleware** are pluggable modules that manipulate requests, responses, or errors (e.g., caching, concurrency, retry).  
- **Plugins** can add specialized features like auto‑auth or custom logging.

---

## Contributing

We welcome contributions from the community!

1. **Fork this Repository**  
2. **Create a Feature Branch**  
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Commit Your Changes**  
4. **Open a Pull Request**

For detailed guidelines, check [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

OmniRequest is licensed under the [MIT License](LICENSE).  
Feel free to use, modify, and distribute it in your projects.

---

Happy coding with **OmniRequest** in Node.js! If you have questions or issues, please open an issue or submit a pull request.