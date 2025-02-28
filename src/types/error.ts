// src/types/error.ts
import { RequestConfig } from "./request";
import { ResponseData } from "./response";

export class RequestError extends Error {
  config: RequestConfig;
  code?: string;
  request?: any;
  response?: ResponseData;
  isNetworkError: boolean;
  isTimeout: boolean;
  isCancel: boolean;
  
  constructor(message: string, config: RequestConfig, code?: string, request?: any, response?: ResponseData) {
    super(message);
    this.name = 'RequestError';
    this.config = config;
    this.code = code;
    this.request = request;
    this.response = response;
    this.isNetworkError = code === 'NETWORK_ERROR';
    this.isTimeout = code === 'TIMEOUT';
    this.isCancel = code === 'CANCELED';
  }
}
