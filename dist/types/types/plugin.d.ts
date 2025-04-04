import { RequestConfig } from "./request";
import { ResponseData } from "./response";
export interface Plugin {
    name: string;
    enabled: boolean;
    beforeRequest?: (config: RequestConfig) => Promise<RequestConfig>;
    afterResponse?: (response: ResponseData) => Promise<ResponseData>;
    onRequest?: (config: RequestConfig) => Promise<RequestConfig>;
    onResponse?: (response: ResponseData) => Promise<ResponseData>;
    onError?: (error: any) => Promise<any>;
    priority?: number;
    destroy?: () => void;
}
