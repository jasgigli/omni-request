# OmniRequest

<div align="center">
  <img src="assets/omniRequest.webp" alt="OmniRequest Logo" width="200"/>
  <h3>Enterprise-Grade HTTP Client for Modern Applications</h3>

[![npm version](https://img.shields.io/npm/v/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![license](https://img.shields.io/npm/l/omnirequest.svg?color=blue)](LICENSE)
[![Type definitions](https://img.shields.io/npm/types/omnirequest.svg?color=success)](https://www.npmjs.com/package/omnirequest)
[![npm downloads/month](https://img.shields.io/npm/dm/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![GitHub Stars](https://img.shields.io/github/stars/jasgigli/omni-request.svg?style=social)](https://github.com/jasgigli/omni-request/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

## 🎯 Built for Production

OmniRequest is an enterprise-grade HTTP client designed for modern applications requiring reliability, performance, and scalability. Built with TypeScript from the ground up, it provides a robust foundation for API communication in complex codebases.

### Core Principles

- **Reliability First**: Built-in error handling, automatic retries, and circuit breakers
- **Performance**: Request deduplication, intelligent caching, and connection pooling
- **Developer Experience**: Intuitive API, comprehensive TypeScript support, and React integration
- **Scalability**: Modular architecture supporting plugins and middleware for custom workflows

## ✨ Complete Full-Stack Solution

### 🚀 Zero-Config API
```javascript
import { get, post } from 'omnirequest';

// Production-ready out of the box
const users = await get('https://api.example.com/users');
const newUser = await post('https://api.example.com/users', { name: 'John' });
```

### ⚛️ React Hooks
```javascript
import { useQuery, useMutation, useInfiniteQuery } from 'omnirequest';

// Data fetching with automatic caching and loading states
const { data, loading, error, refetch } = useQuery(
  'users',
  () => get('https://api.example.com/users'),
  { staleTime: 60000 }
);

// Mutations with optimistic updates
const { mutate } = useMutation(
  (data) => post('https://api.example.com/users', data),
  { onSuccess: () => refetch() }
);

// Infinite scrolling
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  'posts',
  (page) => get(`https://api.example.com/posts?page=${page}`),
  { getNextPageParam: (lastPage) => lastPage.nextPage }
);
```

### 🔐 Authentication
```javascript
import { configureAuth, useAuth } from 'omnirequest';

// Configure authentication
configureAuth({
  loginEndpoint: '/api/auth/login',
  refreshEndpoint: '/api/auth/refresh',
  autoRefresh: true
});

// Use in components
const { user, login, logout, isAuthenticated } = useAuth();
```

### 📁 File Operations
```javascript
import { uploadFile, downloadFile } from 'omnirequest';

// Upload with progress tracking
await uploadFile('/api/upload', file, {
  onProgress: (progress) => console.log(`${progress.percentage}%`)
});

// Download with progress
await downloadFile('/api/download/file.pdf', 'file.pdf', {
  onProgress: (progress) => console.log(`${progress.percentage}%`)
});
```

### 💾 Persistent Caching
```javascript
import { persistentCache } from 'omnirequest';

// IndexedDB + localStorage fallback for offline support
await persistentCache.set('users', { data: users, timestamp: Date.now() });
const cached = await persistentCache.get('users');
```

### ✅ Data Validation
```javascript
import { validate, createSchema, Schemas } from 'omnirequest';

// Schema-based validation
const userSchema = createSchema()
  .type('object')
  .properties({
    email: Schemas.email(),
    age: Schemas.number().minimum(18)
  })
  .required(['email', 'age'])
  .build();

const result = validate(userData, userSchema);
```

### 🔄 Advanced Middleware System
- Request/response transformation
- Authentication and authorization
- Logging and telemetry
- Custom business logic integration
- Rate limiting with token bucket
- Request deduplication
- Offline sync

### 📊 Performance Optimization
- Request deduplication
- Intelligent caching (in-memory + persistent)
- Connection pooling
- Response compression
- Request batching

### 🛡️ Resilience Patterns
- Automatic retry with exponential backoff
- Circuit breaker for failing services
- Rate limiting and throttling
- Timeout management
- Request cancellation

### 🔒 Security Features
- Automatic token refresh
- Request signing
- CSRF protection
- Secure header management
- Session management

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

### 1. Simple API (Zero Config)

The simplest way to make HTTP requests - no setup required:

```javascript
import { get, post, put, patch, del } from 'omnirequest';

// GET request
const users = await get('https://api.example.com/users');

// POST request
const newUser = await post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updated = await put('https://api.example.com/users/1', { name: 'Jane' });

// PATCH request
const patched = await patch('https://api.example.com/users/1', { email: 'jane@example.com' });

// DELETE request
await del('https://api.example.com/users/1');
```

### 2. Create API Client

Create a pre-configured client for your API:

```javascript
import { createSimpleAPI } from 'omnirequest';

const api = createSimpleAPI('https://api.example.com');

const users = await api.get('/users');
const user = await api.post('/users', { name: 'John' });
```

### 3. React Hooks

Powerful React hooks with automatic caching and state management:

```javascript
import { useQuery, useMutation, invalidateQueries } from 'omnirequest';

function UsersList() {
  // Automatic caching, loading states, error handling
  const { data: users, loading, error, refetch } = useQuery(
    'users',
    () => get('https://api.example.com/users'),
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

function CreateUser() {
  const [name, setName] = useState('');
  
  // Mutation with automatic cache invalidation
  const { mutate, loading } = useMutation(
    (userData) => post('https://api.example.com/users', userData),
    {
      onSuccess: () => {
        invalidateQueries('users'); // Auto-refresh user list
        setName('');
      }
    }
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate({ name });
    }}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### 4. Advanced Configuration

For full control, use the OmniRequest client:

```javascript
import omnirequest from 'omnirequest';

const api = omnirequest.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const response = await api.get('/users');
console.log(response.data);
```

## 🔄 React Hooks Guide

### useQuery

Fetch data with automatic caching, loading states, and error handling:

```javascript
const { data, loading, error, refetch, invalidate } = useQuery(
  'unique-key',
  queryFn,
  {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30000, // 30 seconds
    onSuccess: (data) => console.log('Data loaded:', data),
    onError: (error) => console.error('Error:', error)
  }
);
```

### useMutation

Handle mutations with optimistic updates:

```javascript
const { data, error, loading, mutate, reset } = useMutation(
  mutationFn,
  {
    onMutate: async (variables) => {
      // Optimistic update
      const previousData = queryClient.getQueryData(['key']);
      queryClient.setQueryData(['key'], (old) => [...old, variables]);
      return { previousData };
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      invalidateQueries('related-key');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['key'], context.previousData);
    },
    onSettled: (data, error) => {
      // Always run after success or error
    }
  }
);
```

### useInfiniteQuery

Handle infinite scrolling/pagination:

```javascript
const { data, loading, error, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery(
  'posts',
  ({ pageParam = 0 }) => get(`/posts?page=${pageParam}`),
  {
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    }
  }
);

// Load more
<button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
  Load More
</button>
```

## 🛡️ Advanced Features

### Request Deduplication

Automatically prevents duplicate requests:

```javascript
import { DeduplicationMiddleware } from 'omnirequest';

const api = omnirequest.create();
api.getMiddlewareManager().use(new DeduplicationMiddleware());

// If you call this 10 times simultaneously, only 1 request is made
const users = await api.get('/users');
```

### Offline-First Support

Queue requests when offline and sync automatically:

```javascript
import { OfflineSyncMiddleware } from 'omnirequest';

const api = omnirequest.create();
const offlineSync = new OfflineSyncMiddleware({
  maxRetries: 3,
  retryDelay: 5000,
  onQueue: (item) => console.log('Request queued:', item),
  onSuccess: (item) => console.log('Request synced:', item)
});

api.getMiddlewareManager().use(offlineSync);

// Works even when offline!
await api.post('/users', { name: 'John' });
```

### Automatic Token Refresh

Handle authentication with automatic token refresh:

```javascript
import { AutoAuthPlugin } from 'omnirequest';

const api = omnirequest.create();
api.use(new AutoAuthPlugin({
  type: 'bearer',
  token: 'your-token',
  refreshToken: async () => {
    const response = await get('/auth/refresh');
    return response.token;
  },
  handle401: true // Auto-refresh on 401 errors
}));
```

### Intelligent Retry

Automatic retry with exponential backoff:

```javascript
import { IntelligentRetryMiddleware } from 'omnirequest';

const api = omnirequest.create();
api.getMiddlewareManager().use(new IntelligentRetryMiddleware({
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => error.status >= 500 || !error.status
}));
```

## �️ Architecture

OmniRequest is built on a modular architecture designed for extensibility and maintainability:

- **Core Layer**: HTTP client with adapter pattern for cross-platform support
- **Middleware Layer**: Composable request/response processing pipeline
- **Plugin System**: Extensible architecture for custom functionality
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## 📦 Installation

```bash
# Using npm
npm install omnirequest

# Using yarn
yarn add omnirequest

# Using pnpm
pnpm add omnirequest
```

## 📖 API Reference

### Simple API

```javascript
import { get, post, put, patch, del, createSimpleAPI } from 'omnirequest';

get<T>(url: string): Promise<T>
post<T>(url: string, data?: any): Promise<T>
put<T>(url: string, data?: any): Promise<T>
patch<T>(url: string, data?: any): Promise<T>
del<T>(url: string): Promise<T>
createSimpleAPI(baseURL: string): APIClient
```

### React Hooks

```javascript
import { useQuery, useMutation, useInfiniteQuery, invalidateQueries, clearQueryCache } from 'omnirequest';

useQuery<T>(key, queryFn, options): UseQueryResult<T>
useMutation<TData, TError, TVariables>(mutationFn, options): UseMutationResult
useInfiniteQuery<T>(key, queryFn, options): UseInfiniteQueryResult<T>
invalidateQueries(key?: string): void
clearQueryCache(): void
```

### Middleware

```javascript
import { 
  CacheMiddleware, 
  DeduplicationMiddleware, 
  OfflineSyncMiddleware,
  IntelligentRetryMiddleware,
  CircuitBreakerMiddleware 
} from 'omnirequest';

api.getMiddlewareManager().use(new MiddlewareClass(options));
```

## 💡 Real-World Examples

### Complete React App Example

```javascript
import { useQuery, useMutation, invalidateQueries, get, post } from 'omnirequest';

function App() {
  return (
    <div>
      <UserList />
      <CreateUserForm />
    </div>
  );
}

function UserList() {
  const { data: users, loading, error } = useQuery(
    'users',
    () => get('https://api.example.com/users'),
    { refetchOnWindowFocus: true }
  );

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  );
}

function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { mutate, loading } = useMutation(
    (userData) => post('https://api.example.com/users', userData),
    {
      onSuccess: () => {
        invalidateQueries('users'); // Refresh user list
        setName('');
        setEmail('');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Node.js Example

```javascript
import { get, post, createSimpleAPI } from 'omnirequest';

const api = createSimpleAPI('https://api.example.com');

async function main() {
  try {
    const users = await api.get('/users');
    console.log('Users:', users);

    const newUser = await api.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log('Created:', newUser);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## 💼 Use Cases

- **Full-Stack Applications**: Complete solution for frontend and backend API communication
- **Enterprise Applications**: Complex business logic with multiple API integrations
- **Microservices Architecture**: Service-to-service communication with resilience patterns
- **Mobile Applications**: Offline-first capabilities with data synchronization
- **Data-Intensive Applications**: Efficient caching and data management
- **Secure Applications**: Built-in authentication and security features
- **Real-time Applications**: WebSocket support with automatic reconnection
- **File Management**: Upload/download with progress tracking
- **Form Handling**: Built-in validation and transformation utilities

## 🔧 Configuration Options

```javascript
{
  // Request configuration
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  
  // Advanced options
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache';
}
```

## 🌐 Browser Support

OmniRequest works in all modern browsers and Node.js:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Node.js 18+

## 📝 License

[MIT](LICENSE)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for more information.

## 🔒 Security

If you discover a security vulnerability within OmniRequest, please follow our [Security Policy](SECURITY.md).

## 💬 Community & Support

- [GitHub Issues](https://github.com/jasgigli/omni-request/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/jasgigli/omni-request/discussions) - Questions and discussions

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/jasgigli">Junaid Ali Shah Gigli</a></sub>
  <br/>
  <sub>Enterprise-Grade HTTP Client for Modern Applications</sub>
</div>

