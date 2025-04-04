import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { Plugin } from "../types/plugin";
/**
 * Logger plugin for OmniRequest
 */
export declare class LoggerPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private prefix;
    constructor(prefix?: string);
    beforeRequest(config: RequestConfig): Promise<RequestConfig>;
    afterResponse(response: ResponseData): Promise<ResponseData>;
    onError(error: any): Promise<any>;
}
/**
 * Legacy function for backward compatibility
 */
export declare function setupLogger(client: RequestClient): void;
