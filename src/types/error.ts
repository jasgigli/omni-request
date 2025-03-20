import type { RequestConfig } from "./request";
import type { ResponseData } from "./response";

export type ErrorType =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "CANCELED"
  | "RESPONSE_PROCESSING_ERROR"
  | "VALIDATION_ERROR";

export interface BaseErrorResponse {
  message: string;
  code?: string;
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  config?: RequestConfig;
}

export class RequestError extends Error {
  constructor(
    message: string,
    public config: RequestConfig,
    public code: ErrorType,
    public request?: any,
    public response?: ResponseData
  ) {
    super(message);
    this.name = "RequestError";
  }
}
