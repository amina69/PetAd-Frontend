import { useState } from "react";
import { Link } from "react-router-dom";
import { FormInput } from "../ui/formInput";
import { SubmitButton } from "../ui/submitButton";
import { authService } from "../../api/authService";
import { ApiError } from "../../lib/api-errors";

// ─── ForgetPasswordForm ──────────────────────────────────────────────────────

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormErrors {
  email?: string;
  submit?: string;
}

export function ForgetPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });

  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validate = (): boolean => {
    const newErrors: ForgotPasswordFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ForgotPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ForgotPasswordFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authService.requestPasswordReset({
        email: formData.email.trim(),
      });
      setEmailSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to send reset link. Please try again.";
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Email-sent confirmation ────────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Check Your Email
        </h2>
        <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
          We&apos;ve sent a password reset link to{" "}
          <span className="font-semibold text-gray-900">{formData.email}</span>.
          Please check your inbox and follow the instructions.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="w-full rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            Didn&apos;t receive it? Try again
          </button>

          <Link
            to="/login"
            className="w-full rounded-xl bg-[#E84D2A] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#d4431f] active:scale-[0.98] text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Request form ───────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Forgot Password?
      </h2>

      <p className="text-sm text-gray-500 text-center mb-6">
        Enter the email address associated with your account and we&apos;ll send
        you a link to reset your password.
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

          <FormInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
          />

          <SubmitButton
            label="Send Reset Link"
            isLoading={isLoading}
            loadingLabel="Sending reset link..."
          />
        </form>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#E84D2A] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
