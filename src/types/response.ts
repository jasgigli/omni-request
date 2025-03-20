import type { RequestConfig } from "./request";

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Use the ErrorResponse from error.ts instead of defining it here
export { ErrorResponse } from "./error";
