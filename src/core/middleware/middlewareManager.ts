import type { RequestConfig } from "../../types/request";
import type { ResponseData } from "../../types/response";
import type {
  MiddlewareFunction,
  ResponseMiddlewareFunction,
  MiddlewareManager,
} from "../../types/middleware";

export class MiddlewareManager implements MiddlewareManager {
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
}
