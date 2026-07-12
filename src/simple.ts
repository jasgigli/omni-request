/**
 * Simplified zero-config API for OmniRequest
 * This provides the simplest possible way to make HTTP requests
 * Perfect for quick prototyping and simple use cases
 */

import { RequestClient } from './core/requestClient';
import { defaultConfig } from './config/defaults';

// Create a pre-configured instance with sensible defaults
const simpleClient = new RequestClient({
  ...defaultConfig,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Simple GET request - just pass a URL
 */
export async function get<T = any>(url: string): Promise<T> {
  const response = await simpleClient.get<T>(url);
  return response.data;
}

/**
 * Simple POST request - pass URL and data
 */
export async function post<T = any>(url: string, data?: any): Promise<T> {
  const response = await simpleClient.post<T>(url, data);
  return response.data;
}

/**
 * Simple PUT request - pass URL and data
 */
export async function put<T = any>(url: string, data?: any): Promise<T> {
  const response = await simpleClient.put<T>(url, data);
  return response.data;
}

/**
 * Simple PATCH request - pass URL and data
 */
export async function patch<T = any>(url: string, data?: any): Promise<T> {
  const response = await simpleClient.patch<T>(url, data);
  return response.data;
}

/**
 * Simple DELETE request - just pass a URL
 */
export async function del<T = any>(url: string): Promise<T> {
  const response = await simpleClient.delete<T>(url);
  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }
  return response.data;
}

/**
 * Simple request with any method
 */
export async function request<T = any>(config: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, any>;
}): Promise<T> {
  const response = await simpleClient.request<T>(config);
  return response.data;
}

/**
 * Create a simple API client for a specific base URL
 */
export function createSimpleAPI(baseURL: string) {
  return {
    get: <T = any>(path: string) => get<T>(`${baseURL}${path}`),
    post: <T = any>(path: string, data?: any) => post<T>(`${baseURL}${path}`, data),
    put: <T = any>(path: string, data?: any) => put<T>(`${baseURL}${path}`, data),
    patch: <T = any>(path: string, data?: any) => patch<T>(`${baseURL}${path}`, data),
    delete: <T = any>(path: string) => del<T>(`${baseURL}${path}`),
  };
}

/**
 * Quick fetch alias for one-off requests
 */
export async function fetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  return response.json() as Promise<T>;
}

// Export the simple client for advanced usage if needed
export { simpleClient };
