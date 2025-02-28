// src/adapters/browserAdapter.ts
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";

export async function browserAdapter(config: RequestConfig): Promise<ResponseData> {
  const { url, method, headers, data, timeout, responseType = 'json', withCredentials, cache, signal } = config;
  let controller: AbortController | null = null;
  let finalSignal = signal;
  
  if (timeout && !signal) {
    controller = new AbortController();
    finalSignal = controller.signal;
    setTimeout(() => controller?.abort(), timeout);
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers,
    body: data ? (typeof data === 'object' ? JSON.stringify(data) : data) : undefined,
    signal: finalSignal,
    credentials: withCredentials ? 'include' : 'same-origin',
    cache: cache || 'default'
  };
  
  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new RequestError('Request aborted', config, 'CANCELED');
    }
    throw new RequestError(err.message || 'Network Error', config, 'NETWORK_ERROR');
  }
  
  let responseData;
  try {
    switch (responseType) {
      case 'text':
        responseData = await response.text();
        break;
      case 'blob':
        responseData = await response.blob();
        break;
      case 'arraybuffer':
        responseData = await response.arrayBuffer();
        break;
      default:
        responseData = await response.json();
        break;
    }
  } catch (e) {
    responseData = await response.text();
  }
  
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  
  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    config
  };
}
