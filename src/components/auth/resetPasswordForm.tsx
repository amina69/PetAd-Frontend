import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SubmitButton } from "../ui/submitButton";
import { AuthModal } from "../ui/authModal";
import { authService } from "../../api/authService";
import { ApiError } from "../../lib/api-errors";

// ─── Reusable: PasswordInput ──────────────────────────────────────────────────

interface PasswordInputProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function PasswordInput({
  label = "Password",
  id = "password",
  value,
  onChange,
  placeholder = "Enter your password",
  error,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all
            focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20
            ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs text-red-500 flex items-center gap-1"
          role="alert"
        >
          <svg
            className="w-3 h-3 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
  submit?: string;
  token?: string;
}

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: ResetPasswordFormErrors = {};

    if (!token) {
      newErrors.token = "Reset token is missing or invalid. Please request a new password reset link.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ResetPasswordFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: token!,
        password: formData.password,
      });
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again.";
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Invalid / missing token state ──────────────────────────────────────────
  if (!token) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Invalid Reset Link
        </h2>
        <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>

        <Link
          to="/forgot-password"
          className="inline-block w-full rounded-xl bg-[#E84D2A] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#d4431f] active:scale-[0.98] text-center"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Reset Password
      </h2>

      <p className="text-sm text-gray-500 text-center mb-6">
        Enter your new password below. Make sure it&apos;s at least 8
        characters long.
      </p>

      <div className="flex flex-col gap-5">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          <PasswordInput
            id="password"
            label="New Password"
            placeholder="Enter your new password"
            value={formData.password}
            onChange={(value) => handleChange("password", value)}
            error={errors.password}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={(value) => handleChange("confirmPassword", value)}
            error={errors.confirmPassword}
          />

          <SubmitButton
            label="Reset Password"
            isLoading={isLoading}
            loadingLabel="Resetting password..."
          />
        </form>
      </div>

      <AuthModal
        isOpen={showSuccessModal}
        title="Password Updated!"
        description="Your password has been successfully reset. You can now sign in with your new password."
        buttonText="Sign In"
        onAction={() => navigate("/login")}
      />
    </div>
  );
}
