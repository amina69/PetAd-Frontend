/**
 * ApplicantStep
 *
 * Form step for pet adoption applications. The validation rules come from
 * `adoptionFormSchema` (README "Validation Example"):
 * - Name: minimum 2 characters
 * - Email: valid email format
 * - Phone: E.164-style regex
 * - Reason: minimum 50 characters
 *
 * Validation errors are shown inline, and only after a field has been blurred
 * - never while the applicant is still typing. Fields are prefilled from
 * `useCurrentUser` and stay editable afterwards.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { FormInput } from "../../../components/ui/formInput";
import { InlineError } from "../../../components/ui/InlineError";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import {
  adoptionFieldSchemas,
  adoptionFormSchema,
  type AdoptionFormData,
  type AdoptionFormField,
} from "../schemas/adoptionSchemas";

const FORM_FIELDS: AdoptionFormField[] = ["fullName", "email", "phone", "reason"];

export interface ApplicantStepProps {
  /** Called with the validated values when the application is submitted. */
  onSubmit?: (values: AdoptionFormData) => void;
}

function validateField(field: AdoptionFormField, value: string): string | undefined {
  const result = adoptionFieldSchemas[field].safeParse(value);

  if (result.success) {
    return undefined;
  }

  return result.error.issues[0]?.message;
}

export function ApplicantStep({ onSubmit }: ApplicantStepProps) {
  const currentUser = useCurrentUser();

  const prefilledValues = useMemo<AdoptionFormData>(
    () => ({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone,
      reason: "",
    }),
    [currentUser.fullName, currentUser.email, currentUser.phone],
  );

  const [values, setValues] = useState<AdoptionFormData>(prefilledValues);
  const [touched, setTouched] = useState<Partial<Record<AdoptionFormField, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tracks the fields the applicant has edited, so a profile that arrives
  // after mount only prefills the fields that are still untouched.
  const editedFields = useRef<Set<AdoptionFormField>>(new Set());

  useEffect(() => {
    setValues((previous) => ({
      fullName: editedFields.current.has("fullName")
        ? previous.fullName
        : currentUser.fullName,
      email: editedFields.current.has("email") ? previous.email : currentUser.email,
      phone: editedFields.current.has("phone") ? previous.phone : currentUser.phone,
      reason: previous.reason,
    }));
  }, [currentUser.fullName, currentUser.email, currentUser.phone]);

  const errors = useMemo(() => {
    const nextErrors: Partial<Record<AdoptionFormField, string>> = {};

    for (const field of FORM_FIELDS) {
      if (!touched[field]) {
        continue;
      }

      const message = validateField(field, values[field]);
      if (message) {
        nextErrors[field] = message;
      }
    }

    return nextErrors;
  }, [touched, values]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (field: AdoptionFormField, value: string) => {
    editedFields.current.add(field);
    setValues((previous) => ({ ...previous, [field]: value }));
    setSuccessMessage(null);
  };

  const handleBlur = (field: AdoptionFormField) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const handleReset = () => {
    editedFields.current.clear();
    setValues(prefilledValues);
    setTouched({});
    setIsSubmitted(false);
    setSuccessMessage(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
    setSuccessMessage(null);
    // A submit attempt validates every field, so all of them surface their
    // inline error (if any) straight away.
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      reason: true,
    });

    const result = adoptionFormSchema.safeParse(values);

    if (!result.success) {
      return;
    }

    setSuccessMessage("Application submitted successfully!");
    onSubmit?.(result.data);
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h2 className="mb-6 text-center text-xl font-semibold">Adoption Application</h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {isSubmitted && hasErrors && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            Please correct the highlighted fields before submitting.
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        <FormInput
          id="applicant-fullName"
          name="fullName"
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          value={values.fullName}
          error={errors.fullName}
          onChange={(event) => handleChange("fullName", event.target.value)}
          onBlur={() => handleBlur("fullName")}
        />

        <FormInput
          id="applicant-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="your.email@example.com"
          value={values.email}
          error={errors.email}
          onChange={(event) => handleChange("email", event.target.value)}
          onBlur={() => handleBlur("email")}
        />

        <FormInput
          id="applicant-phone"
          name="phone"
          label="Phone (E.164)"
          type="tel"
          autoComplete="tel"
          placeholder="+1234567890"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          onBlur={() => handleBlur("phone")}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="applicant-reason" className="text-sm font-medium text-gray-700">
            Reason for adoption
          </label>
          <textarea
            id="applicant-reason"
            name="reason"
            rows={4}
            placeholder="Please provide more details (at least 50 characters)"
            value={values.reason}
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? "applicant-reason-error" : undefined}
            onChange={(event) => handleChange("reason", event.target.value)}
            onBlur={() => handleBlur("reason")}
            className={`w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all
              focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20
              ${errors.reason ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
          />
          {errors.reason && (
            <InlineError field="applicant-reason" message={errors.reason} />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Submit Application
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
