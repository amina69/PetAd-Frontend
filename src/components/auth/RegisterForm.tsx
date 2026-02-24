// src/components/auth/RegisterForm.tsx
// Reusable form components and RegisterForm for the PetAd register page

import { useState, type InputHTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "../ui/authModal";
import { IdentityVerificationModal } from "../ui/IdentityVerificationModal";

// ─── Reusable: FormInput ──────────────────────────────────────────────────────

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export function FormInput({
  label,
  id,
  error,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all
          focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20
          ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}
          ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
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

// ─── Reusable: GoogleButton ───────────────────────────────────────────────────

interface GoogleButtonProps {
  label?: string;
  onClick?: () => void;
}

export function GoogleButton({
  label = "Create account with Google",
  onClick,
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#E84D2A]/20"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {label}
    </button>
  );
}

// ─── Reusable: OrDivider ──────────────────────────────────────────────────────

export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-sm text-gray-400 font-medium">Or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Reusable: SubmitButton ───────────────────────────────────────────────────

interface SubmitButtonProps {
  label: string;
  isLoading?: boolean;
}

export function SubmitButton({ label, isLoading }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full rounded-xl bg-[#E84D2A] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#d4431f] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E84D2A]/40 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Creating account...
        </span>
      ) : (
        label
      )}
    </button>
  );
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────

interface RegisterFormData {
  email: string;
  fullName: string;
  nin: string;
  password: string;
}

interface RegisterFormErrors {
  email?: string;
  fullName?: string;
  nin?: string;
  password?: string;
}

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    fullName: "",
    nin: "",
    password: "",
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name";
    }

    if (!formData.nin.trim()) {
      newErrors.nin = "NIN is required";
    } else if (formData.nin.trim().length < 11) {
      newErrors.nin = "NIN must be at least 11 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof RegisterFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // TODO: wire to API
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setShowSuccessModal(true);
  };

  const handleGoogle = () => {
    // Show Identity Modal for testing purposes
    setShowIdentityModal(true);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Create an account
      </h2>

      <div className="flex flex-col gap-5">
        <GoogleButton
          label="Create account with Google"
          onClick={handleGoogle}
        />
        <OrDivider />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
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

          <FormInput
            id="fullName"
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            error={errors.fullName}
          />

          <FormInput
            id="nin"
            label="NIN (National Identity Number)"
            type="text"
            placeholder="Enter your NIN"
            autoComplete="off"
            value={formData.nin}
            onChange={(e) => handleChange("nin", e.target.value)}
            error={errors.nin}
          />

          <PasswordInput
            id="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(value) => handleChange("password", value)}
            error={errors.password}
          />

          <SubmitButton label="Create an account" isLoading={isLoading} />
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-[#E84D2A] hover:underline"
          >
            Login
          </a>
        </p>
      </div>

      <AuthModal
        isOpen={showSuccessModal}
        title="Account Created!"
        description="Your Petad account has been created successfully"
        buttonText="Proceed To Sign In"
        onAction={() => navigate("/login")}
      />

      <IdentityVerificationModal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        onSuccess={() => setShowIdentityModal(false)}
      />
    </div>
  );
}
