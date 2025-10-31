import { useEffect, useRef, useState } from "react";
import { cache, DEFAULT_TTL } from "./cache";
import { init, loading, error, type AsyncResult } from "@/lib/lib";

// TODO: take cache as a curried function, for dependency injection, so we can have more then 1 cache, instead of a monolithic singleton.
export function useCachedFetch<T>(
  key: string | null,
  fetchFn: () => Promise<AsyncResult<T>>,
  options: {
    enabled?: boolean;
    ttl?: number;
  } = {},
): AsyncResult<T> {
  // with default options
  const { enabled = true, ttl = DEFAULT_TTL } = options;

  const [state, setState] = useState<AsyncResult<T>>(init());

  const mountedRef = useRef(true);
  const prevKeyRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || key === null) {
      if (prevKeyRef.current !== key) {
        setState(init());
      }
      return;
    }

    prevKeyRef.current = key;

    // Skip loading state if already cached
    const isCached = cache.size() > 0 && cache["cache"].has(key);
    if (!isCached) {
      setState(loading());
    }

    let canceled = false;

    cache
      .getOrFetch(key, fetchFn, ttl)
      .then((data) => {
        if (!mountedRef.current || canceled) return;
        setState(data);
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || canceled) return;
        setState(
          error(
            new Error("Unhandled error... see error.cause", { cause: err }),
          ),
        );
      });

    return () => {
      canceled = true;
    };
  }, [key, enabled, fetchFn, ttl]);

  return state;
}
