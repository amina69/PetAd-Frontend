import { useEffect, useState, useCallback } from "react";

function readFromUrl<T extends Record<string, unknown>>(defaults: T): T {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, unknown> = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    const values = params.getAll(key);

    if (values.length > 1) {
      result[key] = values;
    } else if (values.length === 1) {
      result[key] = values[0];
    } else {
      result[key] = defaults[key];
    }
  });

  return result as T;
}

function writeToUrl(state: Record<string, unknown>) {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const newUrl = window.location.pathname + (query ? `?${query}` : "");

  window.history.replaceState(null, "", newUrl);
}

export function useUrlSync<T extends Record<string, unknown>>(defaults: T) {
  const [state, setState] = useState<T>(() => readFromUrl(defaults));

  const setUrlState = useCallback((next: T) => {
    setState(next);
    writeToUrl(next as Record<string, unknown>);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setState(readFromUrl(defaults));
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [defaults]);

  return [state, setUrlState] as const;
}
