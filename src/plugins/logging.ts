// src/plugins/logging.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

export function setupLogger(client: RequestClient): void {
  client.interceptors.request.use((config: RequestConfig) => {
    console.info(`[OmniRequest] ${config.method} ${config.url}`, config);
    return config;
  });
  
  client.interceptors.response.use((response: ResponseData) => {
    console.info(`[OmniRequest] ${response.status} ${response.config.url}`, response);
    return response;
  }, (error: any) => {
    console.error(`[OmniRequest] Error: ${error.message}`, error);
    throw error;
  });
}
