import { useState, useCallback } from "react";
import { authService } from "../api/authService";

export interface RegisterFormValues {
  fullName: string;
  email: string;
  nin: string;
  password: string;
  role: "seeker" | "caretaker";
  termsAccepted: boolean;
}

export interface RegisterErrors {
  fullName?: string;
  email?: string;
  nin?: string;
  password?: string;
  role?: string;
  terms?: string;
}

export function useRegister() {
  const [form, setForm] = useState<RegisterFormValues>({
    fullName: "",
    email: "",
    nin: "",
    password: "",
    role: "seeker",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const newErrors: RegisterErrors = {};

    // Full name validation
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter at least 2 characters";
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // NIN validation
    if (!form.nin.trim()) {
      newErrors.nin = "NIN is required";
    } else if (form.nin.trim().length < 11) {
      newErrors.nin = "NIN must be at least 11 characters";
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Role validation
    if (!form.role) {
      newErrors.role = "Please select a role";
    }

    // Terms acceptance validation
    if (!form.termsAccepted) {
      newErrors.terms = "You must accept the terms and privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleChange = useCallback(
    (field: keyof RegisterFormValues, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field as keyof RegisterErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setIsLoading(true);
      setSubmitError(null);

      try {
        await authService.register({
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          nin: form.nin.trim(),
          password: form.password,
        });
        // Registration successful - could redirect to verify email, etc.
      } catch (err) {
        if (err instanceof Error && err.message.includes("409")) {
          setErrors((prev) => ({ ...prev, email: "An account with this email already exists" }));
        } else {
          setSubmitError(
            err instanceof Error ? err.message : "Registration failed. Please try again.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [form, validate],
  );

  return {
    form,
    setForm,
    errors,
    isLoading,
    submitError,
    handleChange,
    handleSubmit,
    validate,
    reset: () =>
      setForm({
        fullName: "",
        email: "",
        nin: "",
        password: "",
        role: "seeker",
        termsAccepted: false,
      }),
  };
}