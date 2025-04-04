# API Reference

This document provides detailed information about the OmniRequest API.

## OmniRequest Class

The main class for creating HTTP clients.

### Constructor

```typescript
new OmniRequest(config?: OmniRequestConfig)
```

#### Parameters

- `config` (optional): Configuration object for the client

### Methods

#### get(url, config?)

Makes a GET request.

```typescript
client.get(url: string, config?: RequestConfig): Promise<Response>
```

#### post(url, data?, config?)

Makes a POST request.

```typescript
client.post(url: string, data?: any, config?: RequestConfig): Promise<Response>
```

#### put(url, data?, config?)

Makes a PUT request.

```typescript
client.put(url: string, data?: any, config?: RequestConfig): Promise<Response>
```

#### delete(url, config?)

Makes a DELETE request.

```typescript
client.delete(url: string, config?: RequestConfig): Promise<Response>
```

#### patch(url, data?, config?)

Makes a PATCH request.

```typescript
client.patch(url: string, data?: any, config?: RequestConfig): Promise<Response>
```

#### request(config)

Makes a request with custom config.

```typescript
client.request(config: RequestConfig): Promise<Response>
```

## Types

### OmniRequestConfig

Configuration for the OmniRequest instance.

```typescript
interface OmniRequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  // ... other configuration options
}
```

### RequestConfig

Configuration for individual requests.

```typescript
interface RequestConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  // ... other request options
}
```

### Response

The response object returned by requests.

```typescript
interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}
```
