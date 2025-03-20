import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";

export async function browserAdapter(
  config: RequestConfig
): Promise<ResponseData> {
  const { url, method = "GET", headers = {}, data, ...rest } = config;

  const fetchOptions: RequestInit = {
    method,
    headers: headers as HeadersInit,
    ...rest,
  };

  if (data) {
    if (typeof data === "object") {
      fetchOptions.body = JSON.stringify(data);
    } else {
      fetchOptions.body = data as BodyInit;
    }
  }

  const response = await fetch(url, fetchOptions);
  const responseData = await response.json();

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    config,
  };
}
