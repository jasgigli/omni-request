// src/core/interceptors/responseInterceptor.ts
import { ResponseData } from "../../types/response";

export type ResponseInterceptorFn = (response: ResponseData) => ResponseData | Promise<ResponseData>;

export class ResponseInterceptorManager {
  private interceptors: Array<{ fulfilled: ResponseInterceptorFn; rejected?: (error: any) => any }> = [];
  
  use(fulfilled: ResponseInterceptorFn, rejected?: (error: any) => any): number {
    this.interceptors.push({ fulfilled, rejected });
    return this.interceptors.length - 1;
  }
  
  eject(id: number): void {
    if (this.interceptors[id]) {
      this.interceptors[id] = { fulfilled: response => response };
    }
  }
  
  async runInterceptors(response: ResponseData): Promise<ResponseData> {
    let currentResponse = { ...response };
    for (const { fulfilled, rejected } of this.interceptors) {
      try {
        currentResponse = await fulfilled(currentResponse);
      } catch (error) {
        if (rejected) return rejected(error);
        throw error;
      }
    }
    return currentResponse;
  }
}
