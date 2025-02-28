// src/types/middleware.ts
import { RequestConfig } from "./request";
import { ResponseData } from "./response";
import { RequestError } from "./error";

export interface Middleware {
  request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  response?: (response: ResponseData) => ResponseData | Promise<ResponseData>;
  error?: (error: RequestError) => RequestError | Promise<RequestError> | ResponseData | Promise<ResponseData>;
}
