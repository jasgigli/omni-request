// src/types/middleware.ts
import { RequestConfig } from "./request";
import { ResponseData } from "./response";
import { RequestError } from "./error";

export interface Middleware {
  request?: (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
  response?: (response: ResponseData) => Promise<ResponseData> | ResponseData;
  error?: (
    error: RequestError
  ) => Promise<ResponseData | RequestError> | ResponseData | RequestError;
}
