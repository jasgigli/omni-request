import { useState, useEffect, useCallback } from 'react';
import type { RequestConfig, RequestResponse } from '../../../types/request';
import omni from '../../../factory';

export interface UseRequestOptions<T> extends RequestConfig {
  manual?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  transform?: (data: any) => T;
}

export function useRequest<T = any>(
  config: UseRequestOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!config.manual);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await omni.request<T>({
        ...config,
        params: {
          ...config.params,
          ...params
        }
      });

      const transformedData = config.transform 
        ? config.transform(response.data)
        : response.data;

      setData(transformedData);
      config.onSuccess?.(transformedData);
      return transformedData;
    } catch (err) {
      setError(err);
      config.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!config.manual) {
      execute();
    }
  }, [execute, config.manual]);

  return {
    data,
    loading,
    error,
    execute,
    refresh: execute
  };
}