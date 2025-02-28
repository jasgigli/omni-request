// src/core/interceptors/requestInterceptor.ts
import { RequestConfig } from "../../types/request";

export type RequestInterceptorFn = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

export class RequestInterceptorManager {
  private interceptors: Array<{ fulfilled: RequestInterceptorFn; rejected?: (error: any) => any }> = [];
  
  use(fulfilled: RequestInterceptorFn, rejected?: (error: any) => any): number {
    this.interceptors.push({ fulfilled, rejected });
    return this.interceptors.length - 1;
  }
  
  eject(id: number): void {
    if (this.interceptors[id]) {
      this.interceptors[id] = { fulfilled: config => config };
    }
  }
  
  async runInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let currentConfig = { ...config };
    for (const { fulfilled, rejected } of this.interceptors) {
      try {
        currentConfig = await fulfilled(currentConfig);
      } catch (error) {
        if (rejected) return rejected(error);
        throw error;
      }
    }
    return currentConfig;
  }
}
