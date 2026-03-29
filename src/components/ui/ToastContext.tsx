import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  activeToasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_AUTO_DISMISS_DURATIONS: Record<ToastType, number> = {
  success: 5000,
  info: 5000,
  warning: 5000, // Not explicitly specified, but 5s is a reasonable default
  error: 8000,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);
  const [toastQueue, setToastQueue] = useState<Omit<Toast, 'id'>[]>([]);
  
  // Use a ref for the queue to avoid stale state issues in fast-firing toasts
  const queueRef = useRef<Omit<Toast, 'id'>[]>([]);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    queueRef.current.push(toast);
    setToastQueue([...queueRef.current]);
  }, []);

  // Effect to move toasts from queue to active
  useEffect(() => {
    if (activeToasts.length < MAX_VISIBLE_TOASTS && toastQueue.length > 0) {
      const nextToast = queueRef.current.shift()!;
      setToastQueue([...queueRef.current]);
      
      const newToast: Toast = {
        ...nextToast,
        id: Math.random().toString(36).substring(2, 9),
      };
      
      setActiveToasts((prev) => [...prev, newToast]);
    }
  }, [activeToasts.length, toastQueue.length]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, activeToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
