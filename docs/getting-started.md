# Getting Started with OmniRequest

This guide will help you get started with OmniRequest, a modern cross-platform TypeScript-based HTTP client.

## Installation

```bash
# Using npm
npm install omnirequest

# Using yarn
yarn add omnirequest

# Using pnpm
pnpm add omnirequest
```

## Basic Usage

```typescript
import { OmniRequest } from 'omnirequest';

// Create a new instance
const client = new OmniRequest();

// Make a GET request
const response = await client.get('https://api.example.com/data');
console.log(response.data);

// Make a POST request
const postResponse = await client.post('https://api.example.com/data', {
  name: 'John Doe',
  email: 'john@example.com'
});
console.log(postResponse.data);
```

## Configuration

You can configure OmniRequest with various options:

```typescript
import { OmniRequest } from 'omnirequest';

const client = new OmniRequest({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  }
});
```

## Next Steps

- Check out the [API Reference](./api-reference.md) for detailed information about all available methods and options
- Learn about [Advanced Usage](./advanced-usage.md) for more complex scenarios
- Explore [Plugins](./plugins.md) and [Middleware](./middleware.md) to extend functionality
