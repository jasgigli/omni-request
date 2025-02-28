
// src/core/utils/url.ts
export function buildURL(baseURL: string, params?: Record<string, any>): string {
    if (!params) return baseURL;
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${baseURL}?${queryString}`;
  }
  