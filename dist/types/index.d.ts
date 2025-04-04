import { RequestClient } from "./core/requestClient";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";
declare class OmniRequest extends RequestClient {
    static create(config?: Partial<RequestConfig>): RequestClient;
    static defaults: Partial<RequestConfig>;
}
declare const omni: OmniRequest;
export { HttpMethod, RequestConfig, OmniRequest, omni };
export default omni;
