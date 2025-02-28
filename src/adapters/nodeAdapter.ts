// src/adapters/nodeAdapter.ts
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export async function nodeAdapter(config: RequestConfig): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    const { url, method, headers = {}, data, timeout, responseType = 'json' } = config;
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers
    };
    
    const req = lib.request(options, (res) => {
      const responseHeaders: Record<string, string> = {};
      Object.entries(res.headers).forEach(([key, value]) => {
        if (key) {
          responseHeaders[key] = Array.isArray(value) ? value.join(', ') : (value as string);
        }
      });
      
      if (responseType === 'stream') {
        resolve({
          data: res,
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers: responseHeaders,
          config,
          request: req
        });
        return;
      }
      
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        let processedData;
        try {
          processedData = responseType === 'json' ? JSON.parse(rawData) : rawData;
        } catch (err) {
          processedData = rawData;
        }
        resolve({
          data: processedData,
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers: responseHeaders,
          config,
          request: req
        });
      });
    });
    
    req.on('error', (err) => {
      reject(new RequestError(err.message, config, 'NETWORK_ERROR', req));
    });
    
    if (timeout) {
      req.setTimeout(timeout, () => {
        req.abort();
        reject(new RequestError(`Timeout of ${timeout}ms exceeded`, config, 'TIMEOUT', req));
      });
    }
    
    if (data) {
      const body = typeof data === 'object' ? JSON.stringify(data) : data;
      req.write(body);
    }
    
    req.end();
  });
}
