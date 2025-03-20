// src/core/adapters/browserAdapter.ts
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
import { RequestError } from "../../types/error";

export async function browserAdapter(
  config: RequestConfig
): Promise<ResponseData> {
  try {
    if (!config.url) {
      throw new RequestError("URL is required", config, "VALIDATION_ERROR");
    }

    const requestInit: RequestInit = {
      method: config.method || "GET",
      headers: config.headers as HeadersInit,
      body: config.data ? JSON.stringify(config.data) : undefined,
      signal: config.signal,
      // Fetch-specific options are already included in RequestConfig via RequestInit
      credentials: config.credentials,
      mode: config.mode,
      cache: config.cache,
      redirect: config.redirect,
      referrer: config.referrer,
      referrerPolicy: config.referrerPolicy,
      integrity: config.integrity,
      keepalive: config.keepalive,
    };

    const response = await fetch(config.url, requestInit);

    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseData: ResponseData = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      config,
    };

    if (
      config.validateStatus?.(response.status) ??
      (response.status >= 200 && response.status < 300)
    ) {
      return responseData;
    } else {
      throw new RequestError(
        `Request failed with status ${response.status}`,
        config,
        "SERVER_ERROR",
        {
          status: response.status,
          data,
          headers: responseHeaders,
        }
      );
    }
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RequestError("Request aborted", config, "CANCELLED");
    }

    throw new RequestError(
      error instanceof Error ? error.message : "Network Error",
      config,
      "NETWORK_ERROR"
    );
  }
}
