// src/core/adapters/browserAdapter.ts
import { RequestConfig } from '../../types/request';
import { ResponseData } from '../../types/response';
import { RequestError } from '../../types/error';

export async function browserAdapter(config: RequestConfig): Promise<ResponseData> {
  try {
    const { url, method, headers, data, signal, timeout } = config;
    let localAbortController: AbortController | undefined;
    let finalSignal = signal;
    
    // Use AbortController for timeout if no external signal provided
    if (timeout && !signal) {
      localAbortController = new AbortController();
      finalSignal = localAbortController.signal;
      setTimeout(() => localAbortController?.abort(), timeout);
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: finalSignal,
      credentials: config.withCredentials ? 'include' : 'same-origin',
      cache: config.cache || 'default'
    });
    
    let responseData;
    switch (config.responseType) {
      case 'json':
        responseData = await response.json();
        break;
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
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }
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
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new RequestError('Request aborted', config, 'CANCELED', null);
    }
    throw new RequestError(error.message || 'Network Error', config, 'NETWORK_ERROR', null);
  }
}
