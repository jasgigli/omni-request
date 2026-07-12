import { RequestClient } from "./core/requestClient";
import { defaultConfig } from "./config/defaults";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";
import type { ResponseData } from "./types/response";
import type { Plugin } from "./types/plugin";
export * from './simple';
export * from './plugins';
export * from './middleware';
/**
 * OmniRequest class extends RequestClient with additional static methods
 */
export declare class OmniRequest extends RequestClient {
    static create(config?: Partial<RequestConfig>): OmniRequest;
    static defaults: Partial<RequestConfig>;
}
interface OmniRequestInstance extends RequestClient {
    create: (config?: Partial<RequestConfig>) => OmniRequest;
    defaults: typeof defaultConfig;
}
declare const omnirequest: OmniRequestInstance;
export { HttpMethod, RequestConfig, ResponseData, Plugin };
export default omnirequest;
