import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ShowToastInput {
  type: ToastType;
  title: string;
  message?: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  durationMs?: number;
}

interface ToastItem extends ShowToastInput {
  id: string;
  message: string;
  duration: number;
}

interface ToastContextValue {
  showToast: (input: ShowToastInput) => void;
  dismissToast: (id: string) => void;
}

const MAX_VISIBLE_TOASTS = 3;

function getDefaultDuration(type: ToastType): number {
  if (type === "error") {
    return 8_000;
  }
  return 5_000;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

type ToastCaller = (input: Omit<ShowToastInput, "type">) => void;

export const toast: {
  success: ToastCaller;
  error: ToastCaller;
  info: ToastCaller;
  warning: ToastCaller;
} = {
  success: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warning: () => undefined,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ visible: ToastItem[]; queue: ToastItem[] }>({
    visible: [],
    queue: [],
  });
  const timeoutIdsRef = useRef<Record<string, number>>({});
  const remainingRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef<Record<string, number>>({});
  const pausedRef = useRef<Set<string>>(new Set());

  const dismissToast = useCallback((id: string) => {
    pausedRef.current.delete(id);
    delete remainingRef.current[id];
    delete startedAtRef.current[id];
    if (timeoutIdsRef.current[id]) {
      clearTimeout(timeoutIdsRef.current[id]);
      delete timeoutIdsRef.current[id];
    }

    setState((previous) => {
      const wasVisible = previous.visible.some((item) => item.id === id);
      const nextVisible = previous.visible.filter((item) => item.id !== id);
      const queueWithoutId = previous.queue.filter((item) => item.id !== id);

      if (!wasVisible) {
        return {
          visible: nextVisible,
          queue: queueWithoutId,
        };
      }

      if (nextVisible.length < MAX_VISIBLE_TOASTS && queueWithoutId.length > 0) {
        const [nextToast, ...remainingQueue] = queueWithoutId;
        return {
          visible: [...nextVisible, nextToast],
          queue: remainingQueue,
        };
      }

      return {
        visible: nextVisible,
        queue: queueWithoutId,
      };
    });
  }, []);

  const showToast = useCallback((input: ShowToastInput) => {
    const toastItem: ToastItem = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: input.description ?? input.message ?? "",
      duration: input.durationMs ?? input.duration ?? getDefaultDuration(input.type),
    };

    setState((previous) => {
      if (previous.visible.length < MAX_VISIBLE_TOASTS) {
        return {
          ...previous,
          visible: [...previous.visible, toastItem],
        };
      }

      return {
        ...previous,
        queue: [...previous.queue, toastItem],
      };
    });
  }, []);

  const startTimer = useCallback((item: ToastItem) => {
    if (pausedRef.current.has(item.id) || timeoutIdsRef.current[item.id]) return;
    const remaining = remainingRef.current[item.id] ?? item.duration;
    startedAtRef.current[item.id] = Date.now();
    timeoutIdsRef.current[item.id] = window.setTimeout(() => {
      dismissToast(item.id);
    }, remaining);
  }, [dismissToast]);

  const pauseToast = useCallback((item: ToastItem) => {
    if (pausedRef.current.has(item.id)) return;
    pausedRef.current.add(item.id);
    const started = startedAtRef.current[item.id] ?? Date.now();
    const elapsed = Date.now() - started;
    const current = remainingRef.current[item.id] ?? item.duration;
    remainingRef.current[item.id] = Math.max(0, current - elapsed);
    if (timeoutIdsRef.current[item.id]) {
      clearTimeout(timeoutIdsRef.current[item.id]);
      delete timeoutIdsRef.current[item.id];
    }
  }, []);

  const resumeToast = useCallback((item: ToastItem) => {
    if (!pausedRef.current.has(item.id)) return;
    pausedRef.current.delete(item.id);
    startTimer(item);
  }, [startTimer]);

  useEffect(() => {
    for (const item of state.visible) {
      startTimer(item);
    }

    const visibleIds = new Set(state.visible.map((item) => item.id));
    for (const toastId of Object.keys(timeoutIdsRef.current)) {
      if (!visibleIds.has(toastId)) {
        clearTimeout(timeoutIdsRef.current[toastId]);
        delete timeoutIdsRef.current[toastId];
        delete remainingRef.current[toastId];
        delete startedAtRef.current[toastId];
        pausedRef.current.delete(toastId);
      }
    }
  }, [state.visible, startTimer]);

  useEffect(() => {
    const show = (type: ToastType) => (input: Omit<ShowToastInput, "type">) => {
      showToast({ ...input, type });
    };
    toast.success = show("success");
    toast.error = show("error");
    toast.info = show("info");
    toast.warning = show("warning");

    return () => {
      toast.success = () => undefined;
      toast.error = () => undefined;
      toast.info = () => undefined;
      toast.warning = () => undefined;
    };
  }, [showToast]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;

    return () => {
      for (const timeoutId of Object.values(timeoutIds)) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3"
        data-testid="toast-viewport"
      >
        {state.visible.map((item) => (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            aria-live={item.type === "error" ? "assertive" : "polite"}
            className="pointer-events-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
            data-testid="toast-item"
            onMouseEnter={() => pauseToast(item)}
            onMouseLeave={() => resumeToast(item)}
            onFocus={() => pauseToast(item)}
            onBlur={() => resumeToast(item)}
            onKeyDown={(event) => {
              if (event.key === "Escape") dismissToast(item.id);
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                {item.message ? (
                  <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                ) : null}
                {item.action ? (
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-indigo-700"
                    onClick={item.action.onClick}
                  >
                    {item.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => dismissToast(item.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
