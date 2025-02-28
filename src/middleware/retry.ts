// src/middleware/retry.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { RequestError } from "../types/error";

interface RetryOptions {
  retries?: number;
  retryDelay?: number | ((retryCount: number) => number);
  retryCondition?: (error: RequestError) => boolean;
}

export class RetryMiddleware implements Middleware {
  private options: RetryOptions;
  
  constructor(options: RetryOptions = {}) {
    this.options = {
      retries: 3,
      retryDelay: (retryCount: number) => Math.pow(2, retryCount) * 1000,
      retryCondition: (error) =>
        error.isNetworkError || (error.response?.status ? error.response.status >= 500 : false),
      ...options
    };
  }
  
  error = async (error: RequestError): Promise<RequestError> => {
    const config = error.config;
    const maxRetries = config.retries !== undefined ? config.retries : this.options.retries!;
    const currentAttempt = config._retryCount || 0;
    
    if (currentAttempt >= maxRetries || !this.options.retryCondition!(error)) {
      return error;
    }
    
    const delay = typeof this.options.retryDelay === 'function'
      ? this.options.retryDelay(currentAttempt)
      : this.options.retryDelay!;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const newConfig = { ...config, _retryCount: currentAttempt + 1 };
    throw new RequestError(`Retrying request (${currentAttempt + 1}/${maxRetries})`, newConfig, 'RETRY');
  }
}
