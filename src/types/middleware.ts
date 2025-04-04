import { RequestConfig } from "./request";
import { ResponseData } from "./response";

export interface Middleware {
  request?: (config: RequestConfig) => Promise<RequestConfig>;
  response?: (response: ResponseData) => Promise<ResponseData>;
  error?: (error: any) => Promise<any>;
}

export type MiddlewareFunction = (
  config: RequestConfig
) => Promise<RequestConfig>;
export type ResponseMiddlewareFunction = (
  response: ResponseData
) => Promise<ResponseData>;
export type ErrorMiddlewareFunction = (
  error: any,
  config: RequestConfig
) => Promise<RequestConfig | ResponseData>;

export interface IMiddlewareManager {
  request: MiddlewareFunction[];
  response: ResponseMiddlewareFunction[];
  use(middleware: Middleware): void;
  remove(middleware: Middleware): void;
  applyRequestMiddleware(config: RequestConfig): Promise<RequestConfig>;
  applyResponseMiddleware(response: ResponseData): Promise<ResponseData>;
}
