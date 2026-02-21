import { useEffect } from "react";

const toastStyles = `
  .toast-wrap {
    position: fixed;
    top: 24px; right: 24px;
    z-index: 9999;
    display: flex; flex-direction: column; gap: 10px;
  }
  .toast {
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.13);
    animation: toastIn 0.3s ease;
    display: flex; align-items: center; gap: 10px;
    max-width: 340px;
  }
  .toast.error   { background: #fff0ee; color: #c0392b; border-left: 4px solid #E8613C; }
  .toast.success { background: #efffef; color: #1a7a3a; border-left: 4px solid #2ecc71; }

  @keyframes toastIn {
    from { transform: translateX(110%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
`;

let injected = false;

export type ToastType = "error" | "success";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "error", duration = 4000, onClose }: ToastProps) {
  if (!injected && typeof document !== "undefined") {
    const tag = document.createElement("style");
    tag.textContent = toastStyles;
    document.head.appendChild(tag);
    injected = true;
  }

  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="toast-wrap">
      <div className={`toast ${type}`} role="alert" aria-live="assertive">
        <span aria-hidden="true">{type === "success" ? "✓" : "✕"}</span>
        {message}
      </div>
    </div>
  );
}