// src/plugins/reactHooks.ts
import { useState, useEffect, useCallback } from 'react';
import RequestClient from '../core/requestClient';
import { RequestConfig } from '../types/request';
import { ResponseData } from '../types/response';

export function useOmniRequest<T = any>(initialConfig: RequestConfig) {
  const [data, setData] = useState<T | null>(null);
  const [response, setResponse] = useState<ResponseData<T> | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  const execute = useCallback(async (overrideConfig?: Partial<RequestConfig>) => {
    setLoading(true);
    setError(null);
    try {
      const mergedConfig = { ...initialConfig, ...overrideConfig };
      const res = await RequestClient.request<T>(mergedConfig);
      setData(res.data);
      setResponse(res);
      setLoading(false);
      return res;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, [initialConfig]);
  
  return { data, response, error, loading, execute };
}
