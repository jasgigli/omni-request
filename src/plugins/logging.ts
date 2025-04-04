// src/plugins/logging.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { Plugin } from "../types/plugin";

/**
 * Logger plugin for OmniRequest
 */
export class LoggerPlugin implements Plugin {
  public name = "logger";
  public enabled = true;
  private prefix: string;

  constructor(prefix = "OmniRequest") {
    this.prefix = prefix;
  }

  async beforeRequest(config: RequestConfig): Promise<RequestConfig> {
    console.info(`[${this.prefix}] ${config.method} ${config.url}`, config);
    return config;
  }

  async afterResponse(response: ResponseData): Promise<ResponseData> {
    console.info(
      `[${this.prefix}] ${response.status} ${response.config.url}`,
      response
    );
    return response;
  }

  async onError(error: any): Promise<any> {
    console.error(`[${this.prefix}] Error: ${error.message}`, error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 */
export function setupLogger(client: RequestClient): void {
  // @ts-ignore - We know these properties don't exist, but we're providing backward compatibility
  if (client.interceptors) {
    // @ts-ignore
    client.interceptors.request.use((config: RequestConfig) => {
      console.info(`[OmniRequest] ${config.method} ${config.url}`, config);
      return config;
    });

    // @ts-ignore
    client.interceptors.response.use(
      (response: ResponseData) => {
        console.info(
          `[OmniRequest] ${response.status} ${response.config.url}`,
          response
        );
        return response;
      },
      (error: any) => {
        console.error(`[OmniRequest] Error: ${error.message}`, error);
        throw error;
      }
    );
  }
}
