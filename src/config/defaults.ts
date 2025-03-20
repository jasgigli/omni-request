import type { RequestConfig } from '../types/request';

export const defaultConfig: RequestConfig = {
  baseURL: '',
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status: number) => status >= 200 && status < 300,
  responseType: 'json',
};