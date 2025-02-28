// src/middleware/transform.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

export class TransformMiddleware implements Middleware {
  request = async (config: RequestConfig): Promise<RequestConfig> => {
    if (config.transformRequest && Array.isArray(config.transformRequest)) {
      let transformedData = config.data;
      for (const fn of config.transformRequest) {
        transformedData = await fn(transformedData, config.headers || {});
      }
      return { ...config, data: transformedData };
    }
    return config;
  }
  
  response = async (response: ResponseData): Promise<ResponseData> => {
    const config = response.config;
    if (config.transformResponse && Array.isArray(config.transformResponse)) {
      let transformedData = response.data;
      for (const fn of config.transformResponse) {
        transformedData = await fn(transformedData);
      }
      return { ...response, data: transformedData };
    }
    return response;
  }
}
