import type { ReactNode } from "react";

const btnStyles = `
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    border: none;
    border-radius: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.18s;
  }
  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  /* Primary */
  .btn-primary {
    padding: 15px;
    background: #FF4726;
    color: #fff;
    font-weight: 600;
    margin-top: 8px;
  }
  .btn-primary:hover:not(:disabled) {
    background: #d4532f;
    box-shadow: 0 4px 20px rgba(232,97,60,0.35);
  }
  .btn-primary:active:not(:disabled) { transform: scale(0.98); }

  /* Google */
  .btn-google {
    padding: 14px 20px;
    background: #fff;
    color: #1a1a1a;
    border: 1.5px solid #e0e0e0;
  }
  .btn-google:hover:not(:disabled) {
    background: #fafafa;
    border-color: #bbb;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  }

  /* Spinner */
  .btn-spinner {
    width: 18px; height: 18px;
    border-radius: 50%;
    animation: btn-spin 0.7s linear infinite;
  }
  .btn-spinner.light {
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
  }
  .btn-spinner.dark {
    border: 2.5px solid rgba(66,133,244,0.3);
    border-top-color: #4285F4;
  }
  @keyframes btn-spin { to { transform: rotate(360deg); } }
`;

let injected = false;

export type ButtonVariant = "primary" | "google";

interface ButtonProps {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingText,
  disabled = false,
  type = "button",
  onClick,
  children,
}: ButtonProps) {
  if (!injected && typeof document !== "undefined") {
    const tag = document.createElement("style");
    tag.textContent = btnStyles;
    document.head.appendChild(tag);
    injected = true;
  }

  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className={`btn-spinner ${variant === "primary" ? "light" : "dark"}`} />
          {loadingText ?? "Loading…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}