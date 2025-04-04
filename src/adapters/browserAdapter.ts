import type { Adapter } from "./adapter";
import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import { RequestError, ErrorType } from "../types/error";

export const browserAdapter: Adapter = {
  async request<T>(config: RequestConfig): Promise<ResponseData<T>> {
    if (!config.url) {
      throw new RequestError({
        message: "URL is required",
        config,
        type: ErrorType.VALIDATION,
        status: 0,
      });
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
    };
  },
};
