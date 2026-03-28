import { useEffect, useState, useCallback } from "react";

function readFromUrl<T>(defaults: T): T {
  const params = new URLSearchParams(window.location.search);
  const result: any = { ...defaults };

  Object.keys(defaults as any).forEach((key) => {
    const values = params.getAll(key);

    if (values.length > 1) {
      result[key] = values;
    } else if (values.length === 1) {
      result[key] = values[0];
    } else {
      result[key] = (defaults as any)[key];
    }
  });

  return result;
}

function writeToUrl(state: any) {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== undefined && value !== null) {
      params.set(key, value as string);
    }
  });

  const query = params.toString();
  const newUrl = window.location.pathname + (query ? `?${query}` : "");

  window.history.replaceState(null, "", newUrl);
}

export function useUrlSync<T extends Record<string, any>>(defaults: T) {
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
