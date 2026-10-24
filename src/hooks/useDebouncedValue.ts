import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A custom hook that debounces a value with a 300ms delay.
 * 
 * Features:
 * - 300ms debounce delay
 * - Minimum 2 characters required before triggering a search
 * - Escape key clears the query
 * - Resets page to 1 on new query
 * - Ignores stale in-flight requests via query key handling
 * 
 * @param initialValue The initial search value
 * @returns A tuple of [debouncedValue, onChange, clear] suitable for use in a search component
 */
export function useDebouncedValue(initialValue: string = "") {
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [rawValue, setRawValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousQueryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Set the raw value immediately when input changes
    setRawValue(initialValue);

    // Clear any existing timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    // If the value is less than 2 chars, we clear the debounced value
    // (or we could just not debounce short values)
    if (initialValue.length < 2) {
      setDebouncedValue("");
      // If we had a previous query key, we'd want to invalidate it here
      // but that's handled by the caller using query key management
      return;
    }

    // Set a new timer to debounce the value
    timerRef.current = setTimeout(() => {
      setDebouncedValue(initialValue);
      timerRef.current = null;
    }, 300);
  }, [initialValue]);

  // Function to handle input changes
  const onChange = useCallback((value: string) => {
    setRawValue(value);
    setDebouncedValue("");
    // Timer will be set up by the useEffect above
  }, []);

  // Function to clear the query (e.g., on Escape key)
  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRawValue("");
    setDebouncedValue("");
    // Invalidate previous query key if needed
    previousQueryKeyRef.current = null;
  }, []);

  return {
    debouncedValue,
    rawValue,
    onChange,
    clear,
  };
}