"use client";

import { useEffect, useRef, useState } from "react";

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (mountedRef.current) setData(d); })
      .catch((e) => {
        if (e.name !== "AbortError" && mountedRef.current) setError(e.message);
      })
      .finally(() => { if (mountedRef.current) setLoading(false); });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}
