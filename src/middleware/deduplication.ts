import { Middleware } from '../types/middleware';
import { RequestConfig } from '../types/request';
import { ResponseData } from '../types/response';

/**
 * Request deduplication middleware
 * Prevents duplicate requests with the same key from being made simultaneously
 * Instead, all duplicate requests wait for the same response
 */
export class DeduplicationMiddleware implements Middleware {
  private pendingRequests = new Map<string, {
    promise: Promise<ResponseData>;
    resolve: (value: ResponseData) => void;
    reject: (error: any) => void;
  }>();

  async request(config: RequestConfig): Promise<RequestConfig> {
    // Only deduplicate GET requests by default
    if (config.method !== 'GET') {
      return config;
    }

    const key = this.getRequestKey(config);
    
    // If a request with this key is already pending, attach the promise
    if (this.pendingRequests.has(key)) {
      const pending = this.pendingRequests.get(key)!;
      config._deduplicated = true;
      config._deduplicationKey = key;
      config._deduplicationPromise = pending.promise;
      return config;
    }

    // Create a deferred promise for this request
    let resolvePromise: (value: ResponseData) => void;
    let rejectPromise: (error: any) => void;
    
    const promise = new Promise<ResponseData>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    
    this.pendingRequests.set(key, {
      promise,
      resolve: resolvePromise!,
      reject: rejectPromise!
    });
    
    // Mark this as the original request
    config._isOriginalDeduplication = true;
    config._deduplicationKey = key;

    return config;
  }

  async response(response: ResponseData): Promise<ResponseData> {
    const config = response.config;
    
    // If this is a deduplicated request, wait for the original request's promise
    if (config._deduplicated && config._deduplicationKey) {
      const pending = this.pendingRequests.get(config._deduplicationKey);
      if (pending) {
        return pending.promise;
      }
    }

    // If this is the original request, resolve the pending promise
    if (config._isOriginalDeduplication && config._deduplicationKey) {
      const pending = this.pendingRequests.get(config._deduplicationKey);
      if (pending) {
        pending.resolve(response);
        
        // Clean up after a short delay to allow for near-simultaneous requests
        setTimeout(() => {
          this.pendingRequests.delete(config._deduplicationKey!);
        }, 100);
      }
    }

    return response;
  }

  async error(error: any): Promise<any> {
    const config = error.config;
    
    // Clean up pending request on error
    if (config && config._deduplicationKey) {
      const pending = this.pendingRequests.get(config._deduplicationKey);
      
      // If this was the original request, reject the pending promise
      if (config._isOriginalDeduplication && pending) {
        pending.reject(error);
        
        // Clean up immediately on error
        this.pendingRequests.delete(config._deduplicationKey);
      }
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
