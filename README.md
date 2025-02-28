# OmniRequest

[![Build Status](https://img.shields.io/travis/yourusername/omnirequest.svg)](https://travis-ci.org/yourusername/omnirequest)
[![NPM Version](https://img.shields.io/npm/v/omnirequest.svg)](https://www.npmjs.com/package/omnirequest)
[![License](https://img.shields.io/npm/l/omnirequest.svg)](LICENSE)

OmniRequest is a **modern, cross‑platform API client library** designed for developers building applications in browsers, Node.js, Bun, Deno, and even in frameworks like React and Next.js. It combines the best features of legacy approaches (XMLHttpRequest) with modern APIs (Fetch, Axios) while providing a pluggable, middleware‑driven architecture.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Example](#basic-example)
  - [Advanced Configuration](#advanced-configuration)
  - [React Integration](#react-integration)
  - [Next.js Integration](#nextjs-integration)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Universal Compatibility:**  
  Works seamlessly in modern browsers, Node.js, Bun, Deno, and server‑side frameworks.

- **Modern API Design:**  
  Promise‑based interface with async/await support, AbortController for cancellation, and streaming support.

- **Middleware & Interceptors:**  
  Easily extend or modify requests/responses via custom middleware (caching, retry, timeout, transformation) and interceptors.

- **Plugin System:**  
  Built‑in plugins for authentication (including token refresh), rate limiting, logging, and React hook integration.

- **Framework Integrations:**  
  Utilities for seamless integration with React and Next.js for both client‑side and server‑side data fetching.

- **TypeScript & ESM:**  
  Fully typed with TypeScript and designed as an ESM library for modern development environments.

---

## Installation

Install OmniRequest via npm:

```bash
npm install omnirequest
```

Or with yarn:

```bash
yarn add omnirequest
```

---

## Usage

### Basic Example

```typescript
import { RequestClient } from 'omnirequest';

const client = new RequestClient();

async function fetchData() {
  try {
    const response = await client.get('https://api.example.com/data');
    console.log(response.data);
  } catch (error) {
    console.error('API call error:', error);
  }
}

fetchData();
```

### Advanced Configuration

You can create a customized client with middleware and interceptors:

```typescript
import { RequestClient } from 'omnirequest';
import { CacheMiddleware } from 'omnirequest/middleware';
import { setupAuth } from 'omnirequest/plugins/auth';

const client = new RequestClient({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add caching middleware
client.use(new CacheMiddleware({ maxAge: 60000 }));

// Setup authentication
setupAuth(client, {
  type: 'bearer',
  token: 'YOUR_TOKEN_HERE'
});

client.get('https://api.example.com/protected-data')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

### React Integration

Use the provided React hook for effortless integration into your components:

```tsx
import React from 'react';
import { useOmniRequest } from 'omnirequest/plugins/reactHooks';

const DataComponent: React.FC = () => {
  const { data, error, loading, execute } = useOmniRequest({
    url: 'https://api.example.com/data',
    method: 'GET'
  });

  React.useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data!</p>;

  return (
    <div>
      <h1>Data:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DataComponent;
```

### Next.js Integration

Fetch data on the server-side in Next.js using the integration utilities:

```typescript
// pages/index.tsx
import React from 'react';
import { fetchServerSideData } from 'omnirequest/integrations/nextjs';

export async function getServerSideProps() {
  const data = await fetchServerSideData({
    url: 'https://api.example.com/data',
    method: 'GET'
  });
  return { props: { data } };
}

const HomePage = ({ data }: { data: any }) => (
  <div>
    <h1>Server-Side Fetched Data</h1>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

export default HomePage;
```

---

## Architecture

OmniRequest is built with a modular, pluggable architecture:

```
omnirequest/
├── src/
│   ├── adapters/       # Environment-specific implementations (browser, Node, Bun, Deno)
│   ├── core/           # Core request handling, interceptors, and pipeline
│   ├── middleware/     # Pluggable middleware (cache, retry, timeout, transform)
│   ├── plugins/        # Optional plugins (auth, rate limiting, logging, React hooks)
│   ├── integrations/   # Framework integrations (React, Next.js)
│   └── types/          # TypeScript type definitions
```

This design allows you to easily extend or replace parts of the library to suit your needs.

---

## Contributing

We welcome contributions from the community!

1. **Fork the Repository**
2. **Create a Feature Branch**  
   `git checkout -b feature/my-new-feature`
3. **Commit Your Changes**
4. **Submit a Pull Request**

For detailed guidelines, please refer to our [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Special thanks to the contributors and the open source community for making this project possible.

---

Happy coding with OmniRequest!
