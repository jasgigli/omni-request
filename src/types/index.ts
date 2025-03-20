export * from "./request";
export * from "./response";
export * from "./error";
export * from "./middleware";

import type { RequestConfig } from "./request";
import type { ResponseData } from "./response";

export interface Middleware {
  request?: (config: RequestConfig) => Promise<RequestConfig>;
  response?: (response: ResponseData) => Promise<ResponseData>;
}

export interface Plugin {
  onRequest?: (config: RequestConfig) => Promise<RequestConfig>;
  onResponse?: (response: ResponseData) => Promise<ResponseData>;
}
