# OmniRequest Architecture

This document provides an overview of the OmniRequest architecture and design principles.

## Overview

OmniRequest is designed as a modular, extensible HTTP client with a focus on cross-platform compatibility, type safety, and developer experience.

## Core Components

### Client

The main entry point for the library. It provides a simple, intuitive API for making HTTP requests.

### Adapters

Platform-specific implementations that handle the actual HTTP requests. This allows OmniRequest to work seamlessly across different environments:

- Browser (using Fetch API)
- Node.js (using http/https modules)
- Deno (using native fetch)
- Bun (using native fetch)

### Middleware Pipeline

A powerful middleware system that allows for request/response transformation, logging, caching, and more. Middleware can be added globally or per-request.

### Plugins

Modular extensions that add specific functionality to OmniRequest, such as:

- Authentication
- Caching
- Retry logic
- Circuit breakers
- Rate limiting

## Request Flow

1. **Request Creation**: The client creates a request object based on the provided configuration.
2. **Middleware Processing (Request)**: The request passes through all registered middleware.
3. **Adapter Selection**: The appropriate adapter is selected based on the environment.
4. **Request Execution**: The adapter sends the request to the server.
5. **Response Reception**: The adapter receives the response from the server.
6. **Middleware Processing (Response)**: The response passes through all registered middleware in reverse order.
7. **Response Return**: The final response is returned to the caller.

## Directory Structure

```
src/
├── adapters/           # Platform-specific adapters
│   ├── browser/        # Browser-specific code
│   ├── node/           # Node.js-specific code
│   └── ...
├── core/               # Core functionality
│   ├── client.ts       # Main client implementation
│   ├── request.ts      # Request handling
│   ├── response.ts     # Response handling
│   └── ...
├── middleware/         # Middleware components
│   ├── cache.ts        # Caching middleware
│   ├── retry.ts        # Retry logic
│   └── ...
├── plugins/            # Plugin system
│   ├── auth.ts         # Authentication plugin
│   ├── circuit.ts      # Circuit breaker
│   └── ...
├── types/              # TypeScript type definitions
│   ├── request.ts      # Request types
│   ├── response.ts     # Response types
│   └── ...
├── utils/              # Utility functions
│   ├── url.ts          # URL handling
│   ├── headers.ts      # Headers utilities
│   └── ...
└── index.ts            # Main entry point
```

## Design Principles

1. **Modularity**: Components should be modular and have a single responsibility.
2. **Extensibility**: The library should be easy to extend with new functionality.
3. **Type Safety**: Strong TypeScript types should be used throughout the codebase.
4. **Cross-Platform**: The library should work seamlessly across different environments.
5. **Developer Experience**: The API should be intuitive and easy to use.
6. **Performance**: The library should be optimized for performance.

## Future Directions

See the [Roadmap](./ROADMAP.md) for planned features and improvements.
