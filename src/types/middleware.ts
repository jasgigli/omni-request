import type { RequestConfig } from "./request";
import type { ResponseData } from "./response";

export type MiddlewareFunction = (
  config: RequestConfig
) => Promise<RequestConfig>;
export type ResponseMiddlewareFunction = (
  response: ResponseData
) => Promise<ResponseData>;

export interface IMiddlewareManager {
  request: MiddlewareFunction[];
  response: ResponseMiddlewareFunction[];
  applyRequestMiddleware(config: RequestConfig): Promise<RequestConfig>;
  applyResponseMiddleware(response: ResponseData): Promise<ResponseData>;
}

export interface Middleware {
  request?: MiddlewareFunction;
  response?: ResponseMiddlewareFunction;
}
