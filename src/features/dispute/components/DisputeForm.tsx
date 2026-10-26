import { useCallback, useRef, useState } from "react";
import {
  DocumentUploader,
  type DocumentUploaderHandle,
  type UploadedAttachment,
} from "../../../components/forms/DocumentUploader";
import { formatFileSize, getUploadRule } from "../../../lib/uploadRules";
import { useCreateDispute } from "../hooks/useCreateDispute";
import type { CreateDisputeFieldErrors } from "../hooks/useCreateDispute";
import {
  disputeFormSchema,
  type DisputeFormData,
} from "../../disputes/schemas/disputeSchemas";
import type { DisputeReason } from "../../disputes/types/dispute.types";

/** An evidence file that has been uploaded and has a server-issued id. */
export interface DisputeAttachment {
  id: string;
  fileName: string;
  size: number;
  mimeType?: string;
}

export type DisputeFormErrors = Partial<
  Record<"reason" | "description" | "attachments", string>
>;

type SubmitHandler = (
  payload: DisputeFormData & { adoptionOrCustodyId: string },
) => boolean | void | Promise<boolean | void>;

interface DisputeFormBaseProps {
  /** The adoption or custody record this dispute belongs to. */
  adoptionOrCustodyId?: string;
  /** Alias accepted by older call sites that only have an adoption id. */
  adoptionId?: string;
  /** Maximum evidence files. The product default is 5. */
  maxAttachments?: number;
  initialReason?: DisputeReason | "";
  initialDescription?: string;
  onCancel?: () => void;
  className?: string;
}

export interface DisputeFormProps extends DisputeFormBaseProps {
  /**
   * Optional submit override for storybook/tests/route wrappers. When omitted
   * the form uses the shared `useCreateDispute` mutation.
   */
  onSubmit?: SubmitHandler;
}

interface DisputeFormFieldsProps extends DisputeFormBaseProps {
  submit: SubmitHandler;
  isPending: boolean;
  hookFieldErrors: CreateDisputeFieldErrors;
  clearHookFieldErrors: () => void;
}

const REASON_OPTIONS: ReadonlyArray<{
  value: DisputeReason;
  label: string;
}> = [
  { value: "pet_condition", label: "Pet condition" },
  { value: "custody_violation", label: "Custody violation" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "other", label: "Other" },
];

const DISPUTE_EVIDENCE_RULE = getUploadRule("dispute-evidence");

function DisputeFormFields({
  adoptionOrCustodyId,
  adoptionId,
  maxAttachments = 5,
  initialReason = "",
  initialDescription = "",
  onCancel,
  className,
  submit,
  isPending,
  hookFieldErrors,
  clearHookFieldErrors,
}: DisputeFormFieldsProps) {
  const uploaderRef = useRef<DocumentUploaderHandle>(null);
  const recordId = adoptionOrCustodyId ?? adoptionId ?? "";

  const [reason, setReason] = useState<DisputeReason | "">(initialReason);
  const [description, setDescription] = useState(initialDescription);
  const [attachments, setAttachments] = useState<DisputeAttachment[]>([]);
  const [errors, setErrors] = useState<DisputeFormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [hasAttachmentErrors, setHasAttachmentErrors] = useState(false);

  const handleValidationErrorChange = useCallback((hasErrors: boolean) => {
    setHasAttachmentErrors(hasErrors);
  }, []);

  const clearError = (field: keyof DisputeFormErrors) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
    clearHookFieldErrors();
  };

  const handleUploaded = (uploaded: UploadedAttachment) => {
    setAttachments((previous) => {
      if (previous.some((item) => item.id === uploaded.id)) return previous;
      if (previous.length >= maxAttachments) return previous;

      return [
        ...previous,
        {
          id: uploaded.id,
          fileName: uploaded.fileName,
          size: uploaded.size,
          mimeType: uploaded.mimeType,
        },
      ];
    });
    clearError("attachments");
  };

  const handleRemoveAttachment = (attachment: DisputeAttachment) => {
    setAttachments((previous) =>
      previous.filter((item) => item.id !== attachment.id),
    );
    clearError("attachments");
    // Keep the uploader's internal slot count in sync so the user can add a
    // replacement file after removing a chip.
    uploaderRef.current?.removeUploaded(attachment.id);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    const nextErrors: DisputeFormErrors = {};

    if (!reason) {
      nextErrors.reason = "Select a reason for the dispute.";
    }

    if (trimmedDescription.length < 50) {
      nextErrors.description =
        "Please provide more detail (at least 50 characters)";
    }

    if (isUploading) {
      nextErrors.attachments =
        "Please wait for your files to finish uploading before submitting.";
    }

    if (hasAttachmentErrors) {
      nextErrors.attachments =
        "Remove or retry the invalid attachment before submitting.";
    }

    const payload = {
      reason,
      description: trimmedDescription,
      attachmentIds: attachments.map((attachment) => attachment.id),
    };

    const parsed = disputeFormSchema.safeParse(payload);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "reason" || key === "description") {
          nextErrors[key] ??= issue.message;
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!reason) return;

    setErrors({});
    await submit({
      reason,
      description: trimmedDescription,
      attachmentIds: attachments.map((attachment) => attachment.id),
      adoptionOrCustodyId: recordId,
    });
  };

  const reasonError = errors.reason ?? hookFieldErrors.reason;
  const descriptionError = errors.description ?? hookFieldErrors.description;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="dispute-form"
      className={className}
    >
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Raise a dispute
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        Tell us what happened. You can attach supporting evidence below.
      </p>

      <div className="mb-5">
        <label
          htmlFor="dispute-reason"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Reason
        </label>
        <select
          id="dispute-reason"
          data-testid="dispute-reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value as DisputeReason | "");
            clearError("reason");
          }}
          aria-invalid={Boolean(reasonError)}
          aria-describedby={reasonError ? "dispute-reason-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm"
        >
          <option value="">Select a reason</option>
          {REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {reasonError && (
          <p
            id="dispute-reason-error"
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {reasonError}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label
          htmlFor="dispute-description"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="dispute-description"
          data-testid="dispute-description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            clearError("description");
          }}
          rows={5}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={
            descriptionError
              ? "dispute-description-error"
              : "dispute-description-count"
          }
          className="w-full rounded-md border border-gray-300 p-3 text-sm"
          placeholder="Explain what happened and include any relevant details."
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span id="dispute-description-count">
            {description.trim().length < 50
              ? `Minimum 50 characters`
              : "Ready to submit"}
          </span>
          <span>{description.trim().length} chars</span>
        </div>
        {descriptionError && (
          <p
            id="dispute-description-error"
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {descriptionError}
          </p>
        )}
      </div>

      <fieldset className="mb-5">
        <legend className="mb-1 block text-sm font-medium text-gray-700">
          Evidence
        </legend>
        <p className="mb-2 text-xs text-gray-500">
          Optional. Attach up to {maxAttachments} images or PDFs, max{" "}
          {DISPUTE_EVIDENCE_RULE.maxSizeMb} MB each.
        </p>

        <DocumentUploader
          ref={uploaderRef}
          kind="dispute-evidence"
          maxFiles={maxAttachments}
          maxSizeMb={DISPUTE_EVIDENCE_RULE.maxSizeMb}
          showUploadedList={false}
          onUploaded={handleUploaded}
          onBusyChange={setIsUploading}
          onValidationErrorChange={handleValidationErrorChange}
          label="Upload evidence"
        />

        {errors.attachments && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {errors.attachments}
          </p>
        )}

        {attachments.length > 0 && (
          <ul
            aria-label="Attached evidence"
            className="m-0 mt-3 flex list-none flex-col gap-2 p-0"
          >
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                data-testid="attachment-chip"
                data-attachment-id={attachment.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-orange-50/60 px-3 py-2"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#E84D2A]"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>

                <div className="min-w-0 flex-1">
                  <p
                    className="m-0 truncate text-[13px] font-medium text-gray-900"
                    title={attachment.fileName}
                  >
                    {attachment.fileName}
                  </p>
                  <p className="m-0 text-[11px] text-gray-500">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="attachment-remove"
                  aria-label={`Remove ${attachment.fileName}`}
                  onClick={() => handleRemoveAttachment(attachment)}
                  className="rounded p-1 text-gray-500 hover:bg-white hover:text-gray-900"
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          data-testid="dispute-submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Submit dispute"}
        </button>
      </div>
    </form>
  );
}

function ConnectedDisputeForm(props: DisputeFormBaseProps) {
  const {
    createDispute,
    fieldErrors,
    clearFieldErrors,
    isPending,
  } = useCreateDispute();

  return (
    <DisputeFormFields
      {...props}
      submit={createDispute}
      isPending={isPending}
      hookFieldErrors={fieldErrors}
      clearHookFieldErrors={clearFieldErrors}
    />
  );
}

/**
 * Dispute creation form, including evidence attachments.
 *
 * Evidence is uploaded through `DocumentUploader` and only the returned
 * document ids are submitted, in `attachmentIds`. Removing an attachment chip
 * removes that id from the payload.
 */
export function DisputeForm({
  onSubmit,
  ...baseProps
}: DisputeFormProps) {
  if (onSubmit) {
    return (
      <DisputeFormFields
        {...baseProps}
        submit={onSubmit}
        isPending={false}
        hookFieldErrors={{}}
        clearHookFieldErrors={() => undefined}
      />
    );
  }

  return <ConnectedDisputeForm {...baseProps} />;
}

export default DisputeForm;
