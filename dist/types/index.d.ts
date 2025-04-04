import { RequestClient } from "./core/requestClient";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";
import type { ResponseData } from "./types/response";
import type { Plugin } from "./types/plugin";
/**
 * OmniRequest class extends RequestClient with additional static methods
 */
export declare class OmniRequest extends RequestClient {
    static create(config?: Partial<RequestConfig>): OmniRequest;
    static defaults: Partial<RequestConfig>;
}
declare const omnirequest: OmniRequest;
export { HttpMethod, RequestConfig, ResponseData, Plugin };
export default omnirequest;
