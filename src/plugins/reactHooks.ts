import { useState, useCallback } from 'react';
import { RequestClient } from '../core/requestClient';
import { RequestConfig } from '../types/request';
import { ResponseData } from '../types/response';

// Create an instance of RequestClient
const client = new RequestClient();

export function useOmniRequest<T = any>(initialConfig: RequestConfig) {
  const [data, setData] = useState<T | null>(null);
  const [response, setResponse] = useState<ResponseData<T> | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const execute = useCallback(async (overrideConfig?: Partial<RequestConfig>) => {
    setLoading(true);
    setError(null);

    try {
      // Merge the hook config with any overrides
      const mergedConfig = { ...initialConfig, ...overrideConfig };
      // Use the instance method
      const res = await client.request<T>(mergedConfig);

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
