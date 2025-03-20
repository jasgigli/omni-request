export type ErrorType =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "CANCELED"
  | "RESPONSE_PROCESSING_ERROR"
  | "VALIDATION_ERROR";

export interface ErrorResponse {
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  config?: any;
}

export class RequestError extends Error {
  constructor(
    message: string,
    public config: any,
    public code: ErrorType,
    public request?: any,
    public response?: ErrorResponse
  ) {
    super(message);
    this.name = "RequestError";
  }
}
