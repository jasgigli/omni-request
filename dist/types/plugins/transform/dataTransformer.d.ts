import { Plugin } from "../../core/plugin/pluginManager";
import { z } from "zod";
import { ResponseData } from "../../types/response";
export interface TransformOptions {
    request?: {
        schemas?: Record<string, z.ZodType>;
        transforms?: Record<string, (data: any) => any>;
    };
    response?: {
        schemas?: Record<string, z.ZodType>;
        transforms?: Record<string, (data: any) => any>;
    };
}
export declare class DataTransformerPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private options;
    constructor(options?: TransformOptions);
    onRequest(config: RequestConfig): Promise<RequestConfig>;
    onResponse(response: ResponseData): Promise<ResponseData>;
}
