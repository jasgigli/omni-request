import { ResponseData } from "../../types/response";
export type ResponseInterceptorFn = (response: ResponseData) => ResponseData | Promise<ResponseData>;
export declare class ResponseInterceptorManager {
    private interceptors;
    use(fulfilled: ResponseInterceptorFn, rejected?: (error: any) => any): number;
    eject(id: number): void;
    runInterceptors(response: ResponseData): Promise<ResponseData>;
}
