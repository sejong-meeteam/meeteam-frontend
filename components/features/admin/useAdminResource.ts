'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminErrorMessage } from './format';

type ResourceState<T> = {
  data: T | null;
  errorMessage: string | null;
  isLoading: boolean;
};

export function useAdminResource<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const loadRef = useRef(load);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    errorMessage: null,
    isLoading: true,
  });

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setState((current) => ({ ...current, isLoading: true, errorMessage: null }));
      try {
        const data = await loadRef.current(controller.signal);
        if (!controller.signal.aborted) setState({ data, errorMessage: null, isLoading: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((current) => ({
          ...current,
          isLoading: false,
          errorMessage: getAdminErrorMessage(error, '데이터를 불러오지 못했습니다.'),
        }));
      }
    };

    void run();
    return () => controller.abort();
  }, [key, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
