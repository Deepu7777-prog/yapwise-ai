import { useState, useCallback } from 'react';

export interface UseAsyncReturn<T, Args extends any[]> {
  loading: boolean;
  error: string | null;
  data: T | null;
  execute: (...args: Args) => Promise<T | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate: boolean = false,
  initialData: T | null = null
): UseAsyncReturn<T, Args> {
  const [loading, setLoading] = useState<boolean>(immediate);
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err: any) {
        const message = err.message || 'An unexpected error occurred';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(initialData);
  }, [initialData]);

  return { loading, error, data, execute, setData, reset };
}
