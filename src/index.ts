import { RequestClient } from "./core/requestClient";
import { defaultConfig } from "./config/defaults";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";
import type { ResponseData } from "./types/response";
import type { Plugin } from "./types/plugin";

/**
 * OmniRequest class extends RequestClient with additional static methods
 */
export class OmniRequest extends RequestClient {
  static create(config: Partial<RequestConfig> = {}) {
    return new OmniRequest({ ...defaultConfig, ...config });
  }

  static defaults = defaultConfig;
}

// Create default instance
const omnirequest = new OmniRequest(defaultConfig);

// Add create method to the instance
omnirequest.create = (config?: Partial<RequestConfig>) => {
  return OmniRequest.create(config);
};

// Add defaults to the instance
omnirequest.defaults = OmniRequest.defaults;

// Export types
export { HttpMethod, RequestConfig, ResponseData, Plugin };

// Export default instance
export default omnirequest;
