import { IMiddlewareManager, Middleware, MiddlewareFunction, ResponseMiddlewareFunction } from "../../types/middleware";
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
export declare class MiddlewareManager implements IMiddlewareManager {
    private requestMiddlewares;
    private responseMiddlewares;
    get request(): MiddlewareFunction[];
    get response(): ResponseMiddlewareFunction[];
    applyRequestMiddleware(config: RequestConfig): Promise<RequestConfig>;
    applyResponseMiddleware(response: ResponseData): Promise<ResponseData>;
    use(middleware: Middleware): void;
    remove(middleware: Middleware): void;
    private isRequestMiddleware;
    private isResponseMiddleware;
}
