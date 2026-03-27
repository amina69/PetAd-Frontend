import { useEffect, useState, useCallback } from "react";

function readFromUrl<T extends Record<string, string | string[]>>(defaults: T): T {
  const params = new URLSearchParams(window.location.search);
  const result: T = { ...defaults };

  (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
    const values = params.getAll(key as string);

    if (values.length > 1) {
      result[key] = values as T[keyof T];
    } else if (values.length === 1) {
      result[key] = values[0] as T[keyof T];
    } else {
      result[key] = defaults[key];
    }
  });

  return result;
}

function writeToUrl<T extends Record<string, string | string[] | undefined>>(state: T) {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const newUrl = window.location.pathname + (query ? `?${query}` : "");

  window.history.replaceState(null, "", newUrl);
}

export function useUrlSync<T extends Record<string, string | string[] | undefined>>(defaults: T) {
  const [state, setState] = useState<T>(() => readFromUrl(defaults));

  const setUrlState = useCallback((next: T) => {
    setState(next);
    writeToUrl(next);
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
