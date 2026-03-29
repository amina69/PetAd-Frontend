import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast, useToast, ToastType } from './ToastContext';

const DEFAULT_AUTO_DISMISS_DURATIONS: Record<ToastType, number> = {
  success: 5000,
  info: 5000,
  warning: 5000,
  error: 8000,
};

const TOAST_STYLES: Record<ToastType, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { dismissToast } = useToast();
  const style = TOAST_STYLES[toast.type];

  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_AUTO_DISMISS_DURATIONS[toast.type];
    const timer = setTimeout(() => {
      dismissToast(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.type, toast.duration, dismissToast]);

  const role = (toast.type === 'error') ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start p-4 mb-4 rounded-lg border shadow-md transition-all duration-300 ease-in-out transform translate-x-0 ${style.bg} ${style.border} ${style.text}`}
    >
      <div className="flex-shrink-0 mr-3">{style.icon}</div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold">{toast.title}</h3>
        <p className="mt-1 text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="flex-shrink-0 ml-4 p-1 rounded-md hover:bg-black/5 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { activeToasts } = useToast();

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-full max-w-sm px-4 md:px-0">
      <div className="flex flex-col gap-2">
        {activeToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};
