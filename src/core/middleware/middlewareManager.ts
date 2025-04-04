import {
  IMiddlewareManager,
  Middleware,
  MiddlewareFunction,
  ResponseMiddlewareFunction,
} from "../../types/middleware";
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";

export class MiddlewareManager implements IMiddlewareManager {
  private requestMiddlewares: MiddlewareFunction[] = [];
  private responseMiddlewares: ResponseMiddlewareFunction[] = [];

  get request(): MiddlewareFunction[] {
    return this.requestMiddlewares;
  }

  get response(): ResponseMiddlewareFunction[] {
    return this.responseMiddlewares;
  }

  async applyRequestMiddleware(config: RequestConfig): Promise<RequestConfig> {
    let finalConfig = { ...config };
    for (const middleware of this.requestMiddlewares) {
      finalConfig = await middleware(finalConfig);
    }
    return finalConfig;
  }

  async applyResponseMiddleware(response: ResponseData): Promise<ResponseData> {
    let finalResponse = { ...response };
    for (const middleware of this.responseMiddlewares) {
      finalResponse = await middleware(finalResponse);
    }
    return finalResponse;
  }

  use(middleware: Middleware): void {
    if (this.isRequestMiddleware(middleware)) {
      const requestHandler: MiddlewareFunction = async (
        config: RequestConfig
      ) => {
        return await Promise.resolve(middleware.request(config));
      };
      this.requestMiddlewares.push(requestHandler);
    }

    if (this.isResponseMiddleware(middleware)) {
      const responseHandler: ResponseMiddlewareFunction = async (
        response: ResponseData
      ) => {
        return await Promise.resolve(middleware.response(response));
      };
      this.responseMiddlewares.push(responseHandler);
    }
  }

  remove(middleware: Middleware): void {
    if (this.isRequestMiddleware(middleware)) {
      this.requestMiddlewares = this.requestMiddlewares.filter(
        (handler) => handler !== middleware.request
      );
    }
    if (this.isResponseMiddleware(middleware)) {
      this.responseMiddlewares = this.responseMiddlewares.filter(
        (handler) => handler !== middleware.response
      );
    }
  }

  private isRequestMiddleware(
    middleware: Middleware
  ): middleware is Middleware & {
    request: NonNullable<Middleware["request"]>;
  } {
    return typeof middleware.request === "function";
  }

  private isResponseMiddleware(
    middleware: Middleware
  ): middleware is Middleware & {
    response: NonNullable<Middleware["response"]>;
  } {
    return typeof middleware.response === "function";
  }
}
