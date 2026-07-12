import { RequestConfig } from "./request";

export enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  ABORT = "ABORT_ERROR",
  PARSE = "PARSE_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  SERVER = "SERVER_ERROR",
  REQUEST = "REQUEST_ERROR",
  CIRCUIT_OPEN = "CIRCUIT_OPEN",
  CANCELED = "CANCELED",
  AUTH = "AUTH_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
}

export interface RequestErrorOptions {
  message: string;
  config?: RequestConfig;
  status?: number;
  response?: any;
  type?: ErrorType;
  code?: string;
  stack?: string;
}

export class RequestError extends Error {
  status: number;
  config: RequestConfig;
  response?: any;
  type: ErrorType;
  _retry?: {
    count: number;
    delay: number;
    maxRetries: number;
  };
  code?: string;

  constructor(options: RequestErrorOptions) {
    super(options.message);
    this.name = "RequestError";
    this.status = options.status || 0;
    this.config = options.config || ({} as RequestConfig);
    this.response = options.response;
    this.type = options.type || ErrorType.NETWORK;
    this.code = options.code;
    
    if (options.stack) {
      this.stack = options.stack;
    }
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.type === ErrorType.NETWORK;
  }

  /**
   * Check if error is a timeout error
   */
  isTimeoutError(): boolean {
    return this.type === ErrorType.TIMEOUT;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(): boolean {
    return this.status === 401 || this.type === ErrorType.AUTH;
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(): boolean {
    return this.status === 429 || this.type === ErrorType.RATE_LIMIT;
  }

  /**
   * Get retry information if available
   */
  getRetryInfo(): { count: number; delay: number; maxRetries: number } | undefined {
    return this._retry;
  }
}
