import { useState, useEffect, useCallback, useRef } from 'react';
import type { RequestConfig } from '../types/request';
import type { ResponseData } from '../types/response';
import { OmniRequest } from '../index';

// Global cache for query results
const queryCache = new Map<string, { data: any; timestamp: number; staleTime: number }>();
// Global request deduplication
const pendingRequests = new Map<string, Promise<any>>();

interface UseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

interface UseMutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => Promise<any> | any;
}

interface UseMutationResult<TData, TError, TVariables> {
  data: TData | null;
  error: TError | null;
  loading: boolean;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

interface UseInfiniteQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  getNextPageParam: (lastPage: any, allPages: any[]) => any | undefined;
}

interface UseInfiniteQueryResult<T> {
  data: T[][];
  loading: boolean;
  error: any;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching data with automatic caching and loading states
 */
export function useQuery<T = any>(
  key: string | string[],
  queryFn: () => Promise<ResponseData<T>>,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    refetchOnWindowFocus = false,
    refetchOnReconnect = false,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const cacheKey = Array.isArray(key) ? key.join(':') : key;
  const [data, setData] = useState<T | null>(() => {
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check if request is already pending (deduplication)
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey)!;
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
        return;
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
        }
        return;
      }
    }

    setLoading(true);
    setError(null);

    const requestPromise = queryFn()
      .then((response) => {
        const result = response.data;
        queryCache.set(cacheKey, { data: result, timestamp: Date.now(), staleTime });
        
        // Clean up old cache entries
        setTimeout(() => {
          const cached = queryCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp > cacheTime) {
            queryCache.delete(cacheKey);
          }
        }, cacheTime);

        if (mountedRef.current) {
          setData(result);
          setError(null);
          onSuccess?.(result);
        }
        return result;
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err);
          onError?.(err);
        }
        throw err;
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
        pendingRequests.delete(cacheKey);
      });

    pendingRequests.set(cacheKey, requestPromise);
    await requestPromise;
  }, [cacheKey, enabled, queryFn, staleTime, cacheTime, onSuccess, onError]);

  const invalidate = useCallback(() => {
    queryCache.delete(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, fetchData]);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;
    const handleOnline = () => fetchData();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchOnReconnect, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;
    const interval = setInterval(() => fetchData(), refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  return { data, loading, error, refetch: fetchData, invalidate };
}

/**
 * React hook for mutations (POST, PUT, DELETE, etc.)
 */
export function useMutation<TData = any, TError = any, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ResponseData<TData>>,
  options: UseMutationOptions<TData, TError, TVariables> = {}
): UseMutationResult<TData, TError, TVariables> {
  const { onSuccess, onError, onSettled, onMutate } = options;
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        // Run onMutate for optimistic updates
        let context: any;
        if (onMutate) {
          context = await onMutate(variables);
        }

        const response = await mutationFn(variables);
        const result = response.data;
        setData(result);
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);
        return result;
      } catch (err) {
        const error = err as TError;
        setError(error);
        onError?.(error, variables);
        onSettled?.(undefined, error, variables);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled, onMutate]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, mutate, reset };
}

/**
 * React hook for infinite queries (pagination)
 */
export function useInfiniteQuery<T = any>(
  key: string,
  queryFn: (pageParam: any) => Promise<ResponseData<T[]>>,
  options: UseInfiniteQueryOptions
): UseInfiniteQueryResult<T> {
  const { enabled = true, getNextPageParam, staleTime = 5 * 60 * 1000 } = options;

  const [pages, setPages] = useState<T[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [pageParams, setPageParams] = useState<any[]>([undefined]);

  const fetchPage = useCallback(
    async (pageParam: any) => {
      if (!enabled) return;
      setLoading(true);
      setError(null);

      try {
        const response = await queryFn(pageParam);
        const newPage = response.data;
        setPages((prev) => [...prev, newPage]);
        
        const nextPageParam = getNextPageParam(newPage, [...pages, newPage]);
        if (nextPageParam !== undefined) {
          setPageParams((prev) => [...prev, nextPageParam]);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [enabled, queryFn, getNextPageParam, pages]
  );

  const fetchNextPage = useCallback(async () => {
    const lastPageParam = pageParams[pageParams.length - 1];
    await fetchPage(lastPageParam);
  }, [pageParams, fetchPage]);

  const refetch = useCallback(async () => {
    setPages([]);
    setPageParams([undefined]);
    await fetchPage(undefined);
  }, [fetchPage]);

  useEffect(() => {
    if (enabled && pages.length === 0) {
      fetchPage(undefined);
    }
  }, [enabled, pages.length, fetchPage]);

  const hasNextPage = pageParams.length > pages.length;

  return {
    data: pages,
    loading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}

/**
 * Simplified hook for using OmniRequest instance with React
 */
export function useOmniRequest(client: OmniRequest) {
  const get = useCallback(<T = any>(url: string, config?: RequestConfig) => {
    return client.get<T>(url, config);
  }, [client]);

  const post = useCallback(<T = any>(url: string, data?: any, config?: RequestConfig) => {
    return client.post<T>(url, data, config);
  }, [client]);

  const put = useCallback(<T = any>(url: string, data?: any, config?: RequestConfig) => {
    return client.put<T>(url, data, config);
  }, [client]);

  const patch = useCallback(<T = any>(url: string, data?: any, config?: RequestConfig) => {
    return client.patch<T>(url, data, config);
  }, [client]);

  const del = useCallback(<T = any>(url: string, config?: RequestConfig) => {
    return client.delete<T>(url, config);
  }, [client]);

  return { get, post, put, patch, delete: del };
}

/**
 * Utility to invalidate cached queries
 */
export function invalidateQueries(key?: string) {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
}

/**
 * Utility to clear all cached queries
 */
export function clearQueryCache() {
  queryCache.clear();
}
