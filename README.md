# OmniRequest &mdash; The Ultimate Node.js HTTP Client with Advanced Middleware

<!-- Core Project Badges -->

[![npm version](https://img.shields.io/npm/v/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![npm downloads/total](https://img.shields.io/npm/dt/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![license](https://img.shields.io/npm/l/omnirequest.svg?color=blue)](LICENSE)

<!-- [![node](https://img.shields.io/node/v/omnirequest.svg?color=informational)](https://www.npmjs.com/package/omnirequest) -->

[![Type definitions](https://img.shields.io/npm/types/omnirequest.svg?color=success)](https://www.npmjs.com/package/omnirequest)

<!-- Popularity & Downloads -->

[![npm downloads/month](https://img.shields.io/npm/dm/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)

<!-- CI & Build -->
<!-- [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/jasgigli/omni-request/ci.yml?label=CI&color=blueviolet)](https://github.com/jasgigli/omni-request/actions)
[![Travis Build](https://img.shields.io/travis/jasgigli/omni-request.svg?label=Travis%20CI)](https://travis-ci.org/jasgigli/omni-request) -->
<!-- Code Quality & Coverage -->
<!-- [![codecov](https://codecov.io/gh/jasgigli/omni-request/branch/master/graph/badge.svg)](https://codecov.io/gh/jasgigli/omni-request)
[![Maintainability](https://img.shields.io/codeclimate/maintainability/jasgigli/omni-request.svg?color=yellow)](https://codeclimate.com/github/jasgigli/omni-request/maintainability)
[![Known Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/jasgigli/omni-request.svg?color=red)](https://snyk.io/test/github/jasgigli/omni-request) -->
<!-- Project Activity -->

[![Commit Activity](https://img.shields.io/github/commit-activity/m/jasgigli/omni-request.svg?color=orange)](https://github.com/jasgigli/omni-request/commits)
[![Last Commit](https://img.shields.io/github/last-commit/jasgigli/omni-request.svg)](https://github.com/jasgigli/omni-request/commits)

<!-- [![Open Issues](https://img.shields.io/github/issues/jasgigli/omni-request.svg)](https://github.com/jasgigli/omni-request/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/jasgigli/omni-request.svg)](https://github.com/jasgigli/omni-request/pulls) -->
<!-- Community & Engagement -->

[![GitHub Stars](https://img.shields.io/github/stars/jasgigli/omni-request.svg?style=social)](https://github.com/jasgigli/omni-request/stargazers)

<!-- [![GitHub Forks](https://img.shields.io/github/forks/jasgigli/omni-request.svg?style=social)](https://github.com/jasgigli/omni-request/network/members)
[![GitHub Watchers](https://img.shields.io/github/watchers/jasgigli/omni-request.svg?style=social)](https://github.com/jasgigli/omni-request/watchers) -->

<!-- Style & Commit Conventions -->

<!-- [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) -->

<!-- Repository Visitors -->

[![Visitors](https://visitor-badge.laobi.icu/badge?page_id=jasgigli.omni-request)](https://github.com/jasgigli/omni-request)

**OmniRequest** is a **feature‑rich HTTP client** built for Node.js (and beyond) that solves real‑world challenges like **advanced caching & revalidation**, **concurrency & rate limiting**, **intelligent retry & circuit breakers**, and **auto‑auth with token refresh**. Whether you’re developing **microservices**, **CLI tools**, or **enterprise backends**, OmniRequest’s **middleware architecture** delivers unmatched flexibility and reliability.

---

## Table of Contents

- [Key Features](#key-features)
- [Why OmniRequest?](#why-omnirequest)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Use Cases](#advanced-use-cases)
  - [Caching & Revalidation](#caching--revalidation)
  - [Concurrency & Rate Limiting](#concurrency--rate-limiting)
  - [Intelligent Retry & Circuit Breakers](#intelligent-retry--circuit-breakers)
  - [Auto Auth & Token Refresh](#auto-auth--token-refresh)
- [Full Example](#full-example)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

1. **Advanced Caching & Revalidation**

   - Automatically handles `ETag` / `If-Modified-Since` to reduce bandwidth
   - Offline caching (in Node memory or IndexedDB in browsers)
   - Hooks for cache invalidation, partial revalidation

2. **Concurrency Control & Rate Limiting**

   - Global or per-endpoint concurrency limits
   - Token bucket or leaky bucket to smooth out request bursts
   - Optional queueing & priority to handle overload gracefully

3. **Intelligent Retry & Circuit Breakers**

   - Exponential backoff with optional jitter to avoid retry storms
   - Circuit breaker opens after multiple failures to fail fast
   - Granular retry conditions (e.g., only 5xx or network errors)

4. **Auto Auth & Token Refresh**

   - Built-in Basic, Bearer, or OAuth2 strategies, plus custom headers
   - Automatic token refresh upon expiry or 401 responses
   - Callbacks for success/error events during refresh

5. **Middleware & Plugin System**

   - Easily compose caching, concurrency, retry, logging, etc.
   - Fine‑grained interceptors for request, response, and error handling

6. **TypeScript & ESM**
   - Written in TypeScript for type safety
   - Distributed as ESM for modern Node.js usage

---

## Why OmniRequest?

Traditional HTTP clients (like `fetch` or `axios`) handle basic scenarios but leave advanced requirements to manual coding. **OmniRequest** solves these **real‑world developer pain points** out of the box:

- **Reduce bandwidth** with ETag caching & revalidation
- **Protect your server** from overload with concurrency & rate limiting
- **Improve reliability** via intelligent retry & circuit breakers
- **Secure endpoints** with auto‑auth and token refresh

By leveraging OmniRequest’s powerful middleware architecture, you can integrate these features seamlessly into your Node.js applications.

---

## Installation

```bash
npm install omnirequest
```

_(Yarn users: `yarn add omnirequest`)_

---

## Basic Usage

Here’s a minimal Node.js example performing a simple GET request:

```js
import { RequestClient } from "omnirequest";

const client = new RequestClient();

async function fetchData() {
  try {
    const response = await client.get("https://dummyjson.com/user");
    console.log("Data:", response.data);
  } catch (error) {
    console.error("Request error:", error);
  }
}

fetchData();
```

- **Promise & async/await**: OmniRequest uses promises for a clean, modern API.
- **Request Methods**: Easily call `.get()`, `.post()`, `.put()`, `.delete()`, etc.

---

## Advanced Use Cases

### Caching & Revalidation

**Challenge**: Frequent requests to the same endpoint, or need to handle `ETag` to reduce bandwidth.  
**Solution**: `RevalidationCacheMiddleware` automatically attaches `If-None-Match`, returning `304` if data is unchanged.

```js
import { RequestClient, RevalidationCacheMiddleware } from "omnirequest";

const client = new RequestClient();
client.use(
  new RevalidationCacheMiddleware({
    maxAge: 60_000, // skip revalidation if data is < 60s old
    offline: false, // store in Node memory
    onStore: (key, response) => {
      console.log(`Cached ${key} => ETag: ${response.headers.etag || "none"}`);
    },
  })
);

client
  .get("https://dummyjson.com/user")
  .then((res) => console.log("User data:", res.data))
  .catch((err) => console.error("Error:", err));
```

### Concurrency & Rate Limiting

**Challenge**: Avoid overloading your API with too many concurrent or burst requests.  
**Solution**: `ConcurrencyRateLimitMiddleware` sets concurrency caps and optional token bucket rate limiting.

```js
import { RequestClient, ConcurrencyRateLimitMiddleware } from "omnirequest";

const client = new RequestClient();
client.use(
  new ConcurrencyRateLimitMiddleware({
    globalConcurrency: 3,
    tokenBucket: {
      capacity: 5,
      refillRate: 1,
      intervalMs: 3000,
    },
    queue: true,
  })
);

// Fire multiple requests; only 3 run at once, extra requests queue
for (let i = 0; i < 10; i++) {
  client
    .get("https://dummyjson.com/user")
    .then((res) => console.log(`Request #${i}: ${res.status}`))
    .catch((err) => console.error(`Request #${i} error:`, err));
}
```

### Intelligent Retry & Circuit Breakers

**Challenge**: Endpoints might fail sporadically; you need exponential backoff. If a service is truly down, open a circuit breaker.  
**Solution**: `IntelligentRetryMiddleware` tries each request up to `maxRetries`, uses backoff with jitter, and can open a circuit after repeated failures.

```js
import { RequestClient, IntelligentRetryMiddleware } from "omnirequest";

const client = new RequestClient();
client.use(
  new IntelligentRetryMiddleware({
    maxRetries: 3,
    baseDelay: 1000,
    jitter: true,
    circuitBreaker: {
      threshold: 2,
      cooldown: 10000,
    },
  })
);

client
  .get("https://dummyjson.com/user")
  .then((res) => console.log("Data:", res.data))
  .catch((err) => console.error("Failed after retries/circuit:", err));
```

### Auto Auth & Token Refresh

**Challenge**: Managing short‑lived tokens (Bearer/OAuth2) or basic auth across multiple endpoints.  
**Solution**: `setupAutoAuth` automatically attaches credentials, refreshes tokens on expiry/401, and replays failed requests.

```js
import { RequestClient, setupAutoAuth } from "omnirequest";

const client = new RequestClient();

setupAutoAuth(client, {
  type: "bearer",
  token: "INITIAL_TOKEN",
  tokenExpiry: Date.now() + 60000,
  refreshToken: async () => {
    // call an auth server to get new token
    return "NEW_TOKEN";
  },
  onRefreshSuccess: (newToken) => console.log("Refreshed token =>", newToken),
  onRefreshError: (err) => console.error("Refresh failed:", err),
});

client
  .get("https://dummyjson.com/user")
  .then((res) => console.log("Secured data:", res.data))
  .catch((err) => console.error("Auth error:", err));
```

---

## Full Example

A single Node.js script using **all** advanced features together:

```js
import {
  RequestClient,
  RevalidationCacheMiddleware,
  ConcurrencyRateLimitMiddleware,
  IntelligentRetryMiddleware,
} from "omnirequest";
import { setupAutoAuth } from "omnirequest/plugins/autoAuth";

const client = new RequestClient({ timeout: 5000 });

// 1. Caching & Revalidation
client.use(new RevalidationCacheMiddleware({ maxAge: 30000, offline: false }));

// 2. Concurrency & Rate Limiting
client.use(
  new ConcurrencyRateLimitMiddleware({
    globalConcurrency: 3,
    tokenBucket: { capacity: 5, refillRate: 1, intervalMs: 3000 },
    queue: true,
  })
);

// 3. Intelligent Retry & Circuit Breakers
client.use(
  new IntelligentRetryMiddleware({
    maxRetries: 3,
    baseDelay: 1000,
    jitter: true,
    circuitBreaker: { threshold: 2, cooldown: 10000 },
  })
);

// 4. Auto Auth & Token Refresh
setupAutoAuth(client, {
  type: "bearer",
  token: "INITIAL_TOKEN",
  tokenExpiry: Date.now() + 60000,
  refreshToken: async () => "NEW_TOKEN",
});

async function main() {
  try {
    const response = await client.get("https://dummyjson.com/user");
    console.log("User info:", response.data);
  } catch (err) {
    console.error("Request error:", err);
  }
}

main();
```

---

## Architecture

```
omnirequest/
├── src/
│   ├── adapters/           # Node/Bun/Deno-specific adapters
│   ├── core/               # Core request pipeline & interceptors
│   ├── middleware/         # Pluggable modules (cache, concurrency, retry, transform)
│   ├── plugins/            # Specialized plugins (autoAuth, logging, etc.)
│   └── types/              # TypeScript definitions
└── ...
```

- **Core**: The heart of OmniRequest, handling request orchestration.
- **Middleware**: Extend or modify behavior (caching, concurrency, retry).
- **Plugins**: Add specialized functionality (auto auth, logging).
- **Interceptors**: Fine-grained hooks for request, response, and error.

---

## Contributing

We love community contributions! Here’s how to help:

1. **Fork the Repo**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Commit & Push**
4. **Open a Pull Request** on GitHub

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## License

OmniRequest is open‑source under the [MIT License](LICENSE).  
Use it freely for your Node.js or cross‑platform projects!

---

**Ready to streamline your Node.js HTTP calls?** Install OmniRequest now and discover a more reliable, efficient, and secure way to handle API requests. If you have questions or need support, please open an issue or pull request. Happy coding!
