import { useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";

const inputStyles = `
  .input-field-wrap { margin-bottom: 16px; }

  .input-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    font-family: 'Poppins', sans-serif;
  }

  .input-inner { position: relative; }

  .input-el {
    width: 100%;
    padding: 13px 16px;
    border-radius: 10px;
    border: 1.5px solid #e0e0e0;
    font-size: 14px;
    font-family: 'Poppins', sans-serif;
    color: #1a1a1a;
    background: #fff;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .input-el::placeholder { color: #9ca3af; }
  .input-el:focus {
    border-color: #E8613C;
    box-shadow: 0 0 0 3px rgba(232,97,60,0.12);
  }
  .input-el.error { border-color: #ef4444; }
  .input-el.error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
  .input-el.has-icon { padding-right: 46px; }

  .input-icon-btn {
    position: absolute;
    right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #9ca3af; padding: 4px;
    display: flex; align-items: center;
    transition: color 0.15s;
  }
  .input-icon-btn:hover { color: #6b7280; }

  .input-error-msg {
    font-size: 12px;
    color: #ef4444;
    margin-top: 5px;
    display: flex; align-items: center; gap: 4px;
    font-family: 'Poppins', sans-serif;
  }
`;

let injected = false;

function EyeOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

interface InputProps {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

export function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  className = "",
}: InputProps) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";

  if (!injected && typeof document !== "undefined") {
    const tag = document.createElement("style");
    tag.textContent = inputStyles;
    document.head.appendChild(tag);
    injected = true;
  }

  return (
    <div className={`input-field-wrap ${className}`}>
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
        </label>
      )}
      <div className="input-inner">
        <input
          id={name}
          name={name}
          type={isPassword ? (showPw ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={[
            "input-el",
            isPassword ? "has-icon" : "",
            error ? "error" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={!!error}
          autoComplete={
            name === "password"
              ? "new-password"
              : name === "email"
              ? "email"
              : "off"
          }
        />
        {isPassword && (
          <button
            type="button"
            className="input-icon-btn"
            onClick={() => setShowPw((p) => !p)}
            aria-label={showPw ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPw ? <EyeOff /> : <EyeOn />}
          </button>
        )}
      </div>
      {error && (
        <p className="input-error-msg" id={`${name}-error`} role="alert">
          <AlertIcon />
          {error}
        </p>
      )}
    </div>
  );
}