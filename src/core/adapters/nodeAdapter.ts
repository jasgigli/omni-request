// src/core/adapters/nodeAdapter.ts
import { RequestConfig } from '../../types/request';
import { ResponseData } from '../../types/response';
import { RequestError } from '../../types/error';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export async function nodeAdapter(config: RequestConfig): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    const { url, method, headers = {}, data, timeout } = config;
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(method) && data && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const req = httpModule.request(options, (res) => {
      const responseHeaders: Record<string, string> = {};
      Object.entries(res.headers).forEach(([key, value]) => {
        if (key && value) {
          responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
        }
      });
      
      let responseData: any = '';
      const responseType = config.responseType || 'json';
      
      if (responseType === 'stream') {
        resolve({ data: res, status: res.statusCode || 0, statusText: res.statusMessage || '', headers: responseHeaders, config, request: req });
        return;
      }
      
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        let processedData: any;
        try {
          processedData = responseType === 'json'
            ? JSON.parse(responseData)
            : responseData;
          resolve({ data: processedData, status: res.statusCode || 0, statusText: res.statusMessage || '', headers: responseHeaders, config, request: req });
        } catch (err: any) {
          reject(new RequestError('Error processing response: ' + err.message, config, 'RESPONSE_PROCESSING_ERROR', req));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(new RequestError('Network Error: ' + err.message, config, 'NETWORK_ERROR', req));
    });
    
    if (timeout) {
      req.setTimeout(timeout, () => {
        req.abort();
        reject(new RequestError(`Timeout of ${timeout}ms exceeded`, config, 'TIMEOUT', req));
      });
    }
    
    if (config.signal) {
      config.signal.addEventListener('abort', () => {
        req.abort();
        reject(new RequestError('Request aborted', config, 'CANCELED', req));
      });
    }
    
    if (data) {
      const body = typeof data === 'object' ? JSON.stringify(data) : data;
      req.write(body);
    }
    
    req.end();
  });
}
