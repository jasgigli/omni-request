export * from "./request";
export * from "./response";

export interface Middleware {
  request?: (config: RequestConfig) => Promise<RequestConfig>;
  response?: (response: ResponseData) => Promise<ResponseData>;
}

export interface Plugin {
  onRequest?: (config: RequestConfig) => Promise<RequestConfig>;
  onResponse?: (response: ResponseData) => Promise<ResponseData>;
}
