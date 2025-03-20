import { Middleware, RequestConfig, ResponseData } from '../../types';

export class MiddlewareManager {
  private middleware: Middleware[] = [];

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  async applyRequestMiddleware(config: RequestConfig): Promise<RequestConfig> {
    let currentConfig = { ...config };

    for (const middleware of this.middleware) {
      if (middleware.request) {
        currentConfig = await middleware.request(currentConfig);
      }
    }

    return currentConfig;
  }

  async applyResponseMiddleware(response: ResponseData): Promise<ResponseData> {
    let currentResponse = { ...response };

    for (const middleware of this.middleware) {
      if (middleware.response) {
        currentResponse = await middleware.response(currentResponse);
      }
    }

    return currentResponse;
  }

  async applyErrorMiddleware(error: any): Promise<any> {
    let currentError = error;

    for (const middleware of this.middleware) {
      if (middleware.error) {
        try {
          currentError = await middleware.error(currentError);
        } catch (e) {
          currentError = e;
        }
      }
    }

    return currentError;
  }
}