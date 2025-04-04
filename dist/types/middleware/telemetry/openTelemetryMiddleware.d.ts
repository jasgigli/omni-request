import { Middleware } from "../../types/middleware";
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
export interface TelemetryOptions {
    serviceName?: string;
    includeHeaders?: boolean;
    includeBody?: boolean;
    filterSensitiveData?: (key: string, value: any) => any;
}
export declare class OpenTelemetryMiddleware implements Middleware {
    private options;
    constructor(options?: TelemetryOptions);
    request: (config: RequestConfig) => Promise<RequestConfig>;
    response: (response: ResponseData) => Promise<ResponseData>;
    private filterSensitiveData;
}
