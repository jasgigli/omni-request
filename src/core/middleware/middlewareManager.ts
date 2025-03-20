import type { RequestConfig } from "../../types/request";
import type { ResponseData } from "../../types/response";
import type {
  IMiddlewareManager,
  MiddlewareFunction,
  ResponseMiddlewareFunction,
  Middleware,
} from "../../types/middleware";

export class MiddlewareManager implements IMiddlewareManager {
  request: MiddlewareFunction[] = [];
  response: ResponseMiddlewareFunction[] = [];

  async applyRequestMiddleware(config: RequestConfig): Promise<RequestConfig> {
    let finalConfig = { ...config };
    for (const middleware of this.request) {
      finalConfig = await middleware(finalConfig);
    }
    return finalConfig;
  }

  async applyResponseMiddleware(response: ResponseData): Promise<ResponseData> {
    let finalResponse = { ...response };
    for (const middleware of this.response) {
      finalResponse = await middleware(finalResponse);
    }
    return finalResponse;
  }

  use(middleware: Middleware): void {
    if (middleware.request) {
      this.request.push(middleware.request);
    }
    if (middleware.response) {
      this.response.push(middleware.response);
    }
  }

  clear(): void {
    this.request = [];
    this.response = [];
  }
}
