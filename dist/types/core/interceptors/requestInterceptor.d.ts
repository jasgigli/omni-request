import { RequestConfig } from "../../types/request";
export type RequestInterceptorFn = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export declare class RequestInterceptorManager {
    private interceptors;
    use(fulfilled: RequestInterceptorFn, rejected?: (error: any) => any): number;
    eject(id: number): void;
    runInterceptors(config: RequestConfig): Promise<RequestConfig>;
}
