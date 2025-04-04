import { OmniRequest } from "./index";
import { defaultConfig } from "./config/defaults";
import type { RequestConfig } from "./types/request";
import type { HttpMethod } from "./types/http";

// Create default instance
const omnirequest = OmniRequest.create(defaultConfig);

export default omnirequest;
export { HttpMethod, RequestConfig, OmniRequest };
