// src/middleware/timeout.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";

export class TimeoutMiddleware implements Middleware {
  private defaultTimeout: number;
  
  constructor(defaultTimeout: number = 30000) {
    this.defaultTimeout = defaultTimeout;
  }
  
  request = (config: RequestConfig): RequestConfig => {
    if (!config.timeout) {
      return { ...config, timeout: this.defaultTimeout };
    }
    return config;
  }
}
