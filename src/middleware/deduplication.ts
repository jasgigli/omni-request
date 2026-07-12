import { Middleware } from '../types/middleware';
import { RequestConfig } from '../types/request';
import { ResponseData } from '../types/response';

/**
 * Request deduplication middleware
 * Prevents duplicate requests with the same key from being made simultaneously
 * Instead, all duplicate requests wait for the same response
 */
export class DeduplicationMiddleware implements Middleware {
  private pendingRequests = new Map<string, Promise<ResponseData>>();

  async request(config: RequestConfig): Promise<RequestConfig> {
    // Only deduplicate GET requests by default
    if (config.method !== 'GET') {
      return config;
    }

    const key = this.getRequestKey(config);
    
    // If a request with this key is already pending, attach a flag
    // The response middleware will handle returning the cached response
    if (this.pendingRequests.has(key)) {
      config._deduplicated = true;
      config._deduplicationKey = key;
      return config;
    }

    // Create a deferred promise for this request
    let resolvePromise: (value: ResponseData) => void;
    let rejectPromise: (error: any) => void;
    
    const promise = new Promise<ResponseData>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    
    this.pendingRequests.set(key, promise);
    config._deduplicationPromise = { resolve: resolvePromise!, reject: rejectPromise! };
    
    // Clean up after a short delay to allow for near-simultaneous requests
    setTimeout(() => {
      this.pendingRequests.delete(key);
    }, 100);

    return config;
  }

  async response(response: ResponseData): Promise<ResponseData> {
    const config = response.config;
    
    // If this is a deduplicated request, return the pending response
    if (config._deduplicated && config._deduplicationKey) {
      const pendingResponse = this.pendingRequests.get(config._deduplicationKey);
      if (pendingResponse) {
        return pendingResponse;
      }
    }

    // If this is the original request, resolve the pending promise
    if (config._deduplicationPromise) {
      config._deduplicationPromise.resolve(response);
    }

    return response;
  }

  async error(error: any): Promise<any> {
    const config = error.config;
    
    // Clean up pending request on error
    if (config) {
      const key = this.getRequestKey(config);
      
      // Reject the pending promise if this was the original request
      if (config._deduplicationPromise) {
        config._deduplicationPromise.reject(error);
      }
      
      this.pendingRequests.delete(key);
    }

    throw error;
  }

  private getRequestKey(config: RequestConfig): string {
    const { url, method, params, data } = config;
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const dataString = data ? JSON.stringify(data) : '';
    return `${method}-${url}${queryString}${dataString}`;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}
