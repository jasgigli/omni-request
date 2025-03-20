import type { RequestConfig } from "../types/request";

export const defaultConfig: Partial<RequestConfig> = {
  baseURL: "",
  method: "GET",
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: (status: number) => status >= 200 && status < 300,
  responseType: "json",
};
