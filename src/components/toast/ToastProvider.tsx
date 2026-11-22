import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { registerQueryErrorToast } from "../../lib/query-client";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ShowToastInput {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastItem extends ShowToastInput {
  id: string;
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ visible: ToastItem[]; queue: ToastItem[] }>({
    visible: [],
    queue: [],
  });
  const timeoutIdsRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    setState((previous) => {
      const wasVisible = previous.visible.some((toast) => toast.id === id);
      const nextVisible = previous.visible.filter((toast) => toast.id !== id);
      const queueWithoutId = previous.queue.filter((toast) => toast.id !== id);

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
    const toast: ToastItem = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      duration: input.duration ?? getDefaultDuration(input.type),
    };

    setState((previous) => {
      if (previous.visible.length < MAX_VISIBLE_TOASTS) {
        return {
          ...previous,
          visible: [...previous.visible, toast],
        };
      }

      return {
        ...previous,
        queue: [...previous.queue, toast],
      };
    });
  }, []);

  useEffect(() => {
    for (const toast of state.visible) {
      if (timeoutIdsRef.current[toast.id]) {
        continue;
      }

      timeoutIdsRef.current[toast.id] = window.setTimeout(() => {
        dismissToast(toast.id);
      }, toast.duration);
    }

    const visibleIds = new Set(state.visible.map((toast) => toast.id));
    for (const toastId of Object.keys(timeoutIdsRef.current)) {
      if (!visibleIds.has(toastId)) {
        clearTimeout(timeoutIdsRef.current[toastId]);
        delete timeoutIdsRef.current[toastId];
      }
    }
  }, [state.visible, dismissToast]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;

    return () => {
      for (const timeoutId of Object.values(timeoutIds)) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    return registerQueryErrorToast((message) => {
      showToast({
        type: "error",
        title: "Something went wrong",
        message,
      });
    });
  }, [showToast]);

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
        {state.visible.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className="pointer-events-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
            data-testid="toast-item"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => dismissToast(toast.id)}
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
