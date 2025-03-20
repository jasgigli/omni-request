import type { RequestConfig } from "./request";
import type { ResponseData } from "./response";

export interface MiddlewareFunction {
  (config: RequestConfig): Promise<RequestConfig>;
}

export interface ResponseMiddlewareFunction {
  (response: ResponseData): Promise<ResponseData>;
}

export interface MiddlewareManager {
  request: MiddlewareFunction[];
  response: ResponseMiddlewareFunction[];
}
