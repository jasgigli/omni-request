import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";

export async function browserAdapter(
  config: RequestConfig
): Promise<ResponseData> {
  try {
    const {
      url,
      method = "GET",
      headers,
      data,
      signal,
      timeout,
      cache = "default",
      validateStatus = (status: number) => status >= 200 && status < 300,
      credentials = "same-origin", // Use credentials instead of withCredentials
    } = config;

    if (!url) {
      throw new Error("URL is required");
    }

    const controller = new AbortController();
    if (timeout) {
      setTimeout(() => controller.abort(), timeout);
    }

    const fetchSignal = signal || controller.signal;

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: fetchSignal,
      credentials, // Use the credentials option directly
      cache: cache as RequestCache,
    });

    const responseData = await response.json();

    // Convert Headers object to plain object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    if (!validateStatus(response.status)) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      config,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Request failed: ${error.message}`);
    }
    throw error;
  }
}
