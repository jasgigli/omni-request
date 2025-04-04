import { RequestError } from "../../types/error";
import type { RequestConfig } from "../../types/request";
export declare class ErrorHandler {
    private client;
    private fallbackEndpoints;
    constructor(client: any);
    handleError(error: RequestError, config: RequestConfig): Promise<any>;
    private categorizeError;
    private logError;
    private tryFallbackEndpoints;
}
