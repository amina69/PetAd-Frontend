import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiMutation } from "../../../hooks/useApiMutation";
import {
  disputeFormSchema,
  type DisputeFormData,
} from "../schemas/disputeSchemas";
import {
  disputeService,
  type CreateDisputePayload,
} from "../api/disputeService";
import type { DisputeRecord } from "../types/dispute.types";

/**
 * Variables accepted by `useCreateDispute`.
 *
 * Combines the validated form fields from `disputeFormSchema` with the
 * adoption/custody record the dispute belongs to.
 */
export type CreateDisputeInput = DisputeFormData & {
  adoptionOrCustodyId: string;
};

/** Field-level validation errors keyed by form field name (for B9). */
export type CreateDisputeFieldErrors = Partial<
  Record<keyof CreateDisputeInput, string>
>;

/**
 * B6. Create-dispute mutation hook.
 *
 * Validates the payload against `disputeFormSchema` before hitting
 * `disputeService.createDispute`. Invalid input surfaces as field-level errors
 * (consumed by the dispute form) instead of a toast/generic error. On success
 * the `["disputes"]` cache is invalidated and the user is navigated to the new
 * dispute's detail view.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/455
 */
export function useCreateDispute() {
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState<CreateDisputeFieldErrors>({});

  const mutation = useApiMutation<DisputeRecord, CreateDisputePayload>(
    (payload) => disputeService.createDispute(payload),
    {
      invalidates: [["disputes"]],
      onSuccess: (dispute) => {
        navigate(`/disputes/${dispute.id}`);
      },
    },
  );

  /** Clear any previously surfaced field errors (e.g. on input change). */
  const clearFieldErrors = useCallback(() => {
    setFieldErrors((current) =>
      Object.keys(current).length === 0 ? current : {},
    );
  }, []);

  /**
   * Validate and submit a new dispute.
   *
   * Returns `true` when the mutation was dispatched, `false` when validation
   * failed and `fieldErrors` was populated.
   */
  const createDispute = useCallback(
    (input: CreateDisputeInput): boolean => {
      const parsed = disputeFormSchema.safeParse(input);

      if (!parsed.success) {
        const errors: CreateDisputeFieldErrors = {};

        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key !== "string") continue;

          const field = key as keyof CreateDisputeInput;
          if (errors[field] === undefined) {
            errors[field] = issue.message;
          }
        }

        setFieldErrors(errors);
        return false;
      }

      setFieldErrors({});
      mutation.mutate({
        ...parsed.data,
        adoptionOrCustodyId: input.adoptionOrCustodyId,
      });
      return true;
    },
    [mutation],
  );

  return {
    createDispute,
    fieldErrors,
    clearFieldErrors,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
