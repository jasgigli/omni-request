import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
export declare class TransformMiddleware implements Middleware {
    request: (config: RequestConfig) => Promise<RequestConfig>;
    response: (response: ResponseData) => Promise<ResponseData>;
}
