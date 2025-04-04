# OmniRequest

<div align="center">
  <img src="assets/omniRequest.webp" alt="OmniRequest Logo" width="200"/>
  <h3>Simple and Powerful HTTP Client for JavaScript and TypeScript</h3>

[![npm version](https://img.shields.io/npm/v/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![license](https://img.shields.io/npm/l/omnirequest.svg?color=blue)](LICENSE)
[![Type definitions](https://img.shields.io/npm/types/omnirequest.svg?color=success)](https://www.npmjs.com/package/omnirequest)
[![npm downloads/month](https://img.shields.io/npm/dm/omnirequest.svg?color=brightgreen)](https://www.npmjs.com/package/omnirequest)
[![GitHub Stars](https://img.shields.io/github/stars/jasgigli/omni-request.svg?style=social)](https://github.com/jasgigli/omni-request/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

## What is OmniRequest?

OmniRequest is a simple, easy-to-use HTTP client for making API requests in JavaScript and TypeScript applications. It works in browsers, Node.js, and other JavaScript environments.

## Features

- 🔄 **Simple API** - Similar to Axios with a clean, intuitive interface
- 🌐 **Works Everywhere** - Browser, Node.js, and other JavaScript environments
- 📦 **Lightweight** - Small footprint with minimal dependencies
- 🔍 **TypeScript Support** - Full type definitions for better development experience
- ⚙️ **Configurable** - Easy to customize for your specific needs

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

### Import

```javascript
// Using ES modules (recommended)
import omnirequest from 'omnirequest';

// Using CommonJS
const omnirequest = require('omnirequest');
```

### Make a GET Request

```javascript
// Simple GET request
omnirequest.get('https://api.example.com/users')
  .then(response => {
    console.log(response.data); // The response data
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Using Async/Await

```javascript
async function getUsers() {
  try {
    const response = await omnirequest.get('https://api.example.com/users');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

getUsers();
```

### POST Request with Data

```javascript
omnirequest.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
  .then(response => {
    console.log('User created:', response.data);
  })
  .catch(error => {
    console.error('Error creating user:', error);
  });
```

### Request with Query Parameters

```javascript
omnirequest.get('https://api.example.com/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name'
  }
})
  .then(response => {
    console.log('Users:', response.data);
  });
```

## Advanced Usage

### Creating a Custom Instance

```javascript
// Create a custom instance with specific configuration
const api = omnirequest.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  timeout: 5000 // 5 seconds
});

// Now use this instance for all requests
api.get('/users'); // This will request https://api.example.com/users
api.post('/posts', { title: 'New Post' });
```

### All Available Request Methods

```javascript
// GET request
omnirequest.get(url, config);

// POST request
omnirequest.post(url, data, config);

// PUT request
omnirequest.put(url, data, config);

// PATCH request
omnirequest.patch(url, data, config);

// DELETE request
omnirequest.delete(url, config);

// HEAD request
omnirequest.head(url, config);

// OPTIONS request
omnirequest.options(url, config);
```

### Request Configuration

You can customize your requests with various options:

```javascript
omnirequest.get('https://api.example.com/data', {
  // URL parameters
  params: {
    id: 123,
    filter: 'active'
  },
  
  // Request headers
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json'
  },
  
  // Request timeout in milliseconds
  timeout: 3000,
  
  // Whether to include credentials for cross-site requests
  withCredentials: true,
  
  // Response type
  responseType: 'json' // 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
});
```

### Complete Example

```javascript
// Import the library
import omnirequest from 'omnirequest';

// Create a custom API client
const api = omnirequest.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// Function to get users
async function getUsers() {
  try {
    // Get users with pagination
    const response = await api.get('/users', {
      params: { page: 1, limit: 10 }
    });
    
    console.log('Users:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Function to create a user
async function createUser(userData) {
  try {
    const response = await api.post('/users', userData);
    console.log('User created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Use the functions
getUsers();

createUser({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
});
```

## Response Object

Every request returns a response object with these properties:

```javascript
{
  // The response data (parsed JSON or string)
  data: {},
  
  // HTTP status code
  status: 200,
  
  // HTTP status message
  statusText: 'OK',
  
  // Response headers
  headers: {},
  
  // The original request configuration
  config: {}
}
```

## Error Handling

OmniRequest provides detailed error information:

```javascript
try {
  const response = await omnirequest.get('https://api.example.com/users');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // The server responded with an error status code (4xx, 5xx)
    console.error('Server error:', error.response.status);
    console.error('Error data:', error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received');
  } else {
    // Something else went wrong
    console.error('Error:', error.message);
  }
}
```

## API Reference

### Request Methods

```javascript
// GET request
omnirequest.get(url, config);

// POST request
omnirequest.post(url, data, config);

// PUT request
omnirequest.put(url, data, config);

// PATCH request
omnirequest.patch(url, data, config);

// DELETE request
omnirequest.delete(url, config);

// HEAD request
omnirequest.head(url, config);

// OPTIONS request
omnirequest.options(url, config);

// Generic request method
omnirequest.request(config);
```

### Configuration Options

```javascript
{
  // URL for the request
  url: 'https://api.example.com/users',
  
  // HTTP method
  method: 'GET',
  
  // Base URL that will be prepended to the URL
  baseURL: 'https://api.example.com',
  
  // URL parameters (added to the query string)
  params: {
    page: 1,
    limit: 10
  },
  
  // Request body for POST, PUT, PATCH
  data: {
    name: 'John Doe'
  },
  
  // Request headers
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  
  // Request timeout in milliseconds
  timeout: 5000,
  
  // Whether to include credentials for cross-site requests
  withCredentials: true,
  
  // Response type
  responseType: 'json' // 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
}
```

## Browser Support

OmniRequest works in all modern browsers and Node.js:

- Chrome
- Firefox
- Safari
- Edge
- Node.js 14+



## Community & Support

- [GitHub Issues](https://github.com/jasgigli/omni-request/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/jasgigli/omni-request/discussions) - Questions and discussions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for more information.

## Security

If you discover a security vulnerability within OmniRequest, please follow our [Security Policy](SECURITY.md).

## License

[MIT](LICENSE)

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/jasgigli">Junaid Ali Shah Gigli</a></sub>
</div>
