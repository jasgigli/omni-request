import { RequestClient } from "./core/requestClient";
import { defaultConfig } from "./config/defaults";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";

class OmniRequest extends RequestClient {
  static create(config: Partial<RequestConfig> = {}) {
    return new RequestClient({ ...defaultConfig, ...config });
  }

  static defaults = defaultConfig;
}

// Create default instance
const omni = new OmniRequest(defaultConfig);

export default omni;
export { HttpMethod, RequestConfig };
