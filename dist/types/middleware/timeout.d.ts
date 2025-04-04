import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
export declare class TimeoutMiddleware implements Middleware {
    private defaultTimeout;
    constructor(defaultTimeout?: number);
    request: (config: RequestConfig) => Promise<RequestConfig>;
}
