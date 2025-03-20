import type { RequestConfig } from "./request";

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Use a different name to avoid conflict
export interface ApiErrorResponse extends ErrorResponse {
  response?: ResponseData;
}
