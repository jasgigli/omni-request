import { RequestClient } from "./core/requestClient";
import { defaultConfig } from "./config/defaults";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";
import type { ResponseData } from "./types/response";
import type { Plugin } from "./types/plugin";

// Export simple API
export * from './simple';

// Export plugins
export * from './plugins';

// Export middleware
export * from './middleware';

// Export utilities
export * from './utils';

// Export cache
export * from './cache';

// Export auth
export * from './auth';

// Export validation
export * from './validation';

/**
 * OmniRequest class extends RequestClient with additional static methods
 */
export class OmniRequest extends RequestClient {
  static create(config: Partial<RequestConfig> = {}) {
    return new OmniRequest({ ...defaultConfig, ...config });
  }

  static defaults = defaultConfig;
}

// Extended interface for the default instance
interface OmniRequestInstance extends RequestClient {
  create: (config?: Partial<RequestConfig>) => OmniRequest;
  defaults: typeof defaultConfig;
}

// Create default instance
const omnirequest = new OmniRequest(defaultConfig) as OmniRequestInstance;

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
