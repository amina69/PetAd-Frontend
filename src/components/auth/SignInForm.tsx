import React, { useState } from "react";
import { FormInput, PasswordInput, GoogleButton, OrDivider, SubmitButton } from "./RegisterForm";
import { useNavigate } from "react-router-dom";

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInFormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export function SignInForm() {
  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: SignInFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignInFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof SignInFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1500);
      });
      console.log("Sign in successful with:", formData.email);
      navigate("/home");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to sign in. Please try again.");
      setErrors((prev) => ({ ...prev, submit: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign in");
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Welcome Pet Lover!
      </h2>

      <div className="flex flex-col gap-5">
        <GoogleButton
          label="Continue with Google"
          onClick={handleGoogleSignIn}
        />

        <OrDivider />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {errors.submit}
    const [formData, setFormData] = useState<SignInFormData>({
        email: "",
        password: "",
    });
    const navigate = useNavigate();

    const [errors, setErrors] = useState<SignInFormErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: SignInFormErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof SignInFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof SignInFormErrors]) {
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
            // Simulate API call
            await new Promise((resolve) => {
                setTimeout(() => {
                    // You can simulate an error here to test the error state:
                    // reject(new Error("Invalid credentials"));
                    resolve("Success");
                }, 1500);
            });
            console.log("Sign in successful with:", formData.email);
            navigate("/home"); // Redirect to homepage after successful sign in
            // NOTE: Here you would typically redirect or dispatch a login action
        } catch (err: unknown) {
            setErrors((prev) => ({ 
                ...prev, 
                submit: err instanceof Error ? err.message : "Failed to sign in. Please try again." 
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        console.log("Google sign in");
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                Welcome Pet Lover!
            </h2>

            <div className="flex flex-col gap-5">
                <GoogleButton
                    label="Continue with Google"
                    onClick={handleGoogleSignIn}
                />

                <OrDivider />

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex flex-col gap-5"
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

                    <div className="flex flex-col gap-1">
                        <PasswordInput
                            id="password"
                            label="Password"
                            placeholder="Create your password"
                            value={formData.password}
                            onChange={(value) => handleChange("password", value)}
                            error={errors.password}
                        />
                        <div className="flex justify-end mt-1">
                            <a href="/forgot-password" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                                Forget Password?
                            </a>
                        </div>
                    </div>

                    <SubmitButton label="Sign In" isLoading={isLoading} />
                </form>

                <p className="text-center text-sm text-gray-600 mt-2">
                    Don't have an account?{" "}
                    <a
                        href="/register"
                        className="font-semibold text-[#E84D2A] hover:underline"
                    >
                        Create Account
                    </a>
                </p>
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

          <div className="flex flex-col gap-1">
            <PasswordInput
              id="password"
              label="Password"
              placeholder="Create your password"
              value={formData.password}
              onChange={(value) => handleChange("password", value)}
              error={errors.password}
            />
            <div className="flex justify-end mt-1">
              <a
                href="/forgot-password"
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                Forget Password?
              </a>
            </div>
          </div>

          <SubmitButton label="Sign In" isLoading={isLoading} />
        </form>

        <p className="text-center text-sm text-gray-600 mt-2">
          Don't have an account?{" "}
          <a
            href="/register"
            className="font-semibold text-[#E84D2A] hover:underline"
          >
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
}