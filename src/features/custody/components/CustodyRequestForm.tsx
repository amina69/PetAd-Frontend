import { useMemo, useState } from "react";
import { DateRangePicker, type DateRange } from "../../../components/forms/DateRangePicker";
import { countNights, formatDateOnly } from "../../../lib/dateOnly";
import type { PetSummary } from "../../../types/pet";
import { custodyRequestSchema, type CustodyRequest } from "../schemas/custodySchemas";
import { useCustodyAvailability } from "../hooks/useCustodyAvailability";
import { useRequestCustody } from "../hooks/useRequestCustody";

/** A person who can look after the pet during the custody period. */
export interface CaretakerOption {
  id: string;
  name: string;
}

export interface CustodyRequestFormProps {
  /** The pet the custody is requested for. */
  pet: PetSummary;
  /** People who can look after the pet. */
  caretakers?: CaretakerOption[];
  /** Caretaker selected when the form opens. */
  defaultCaretakerId?: string;
  /** Date range selected when the form opens. */
  initialRange?: DateRange;
}

/** Fields the form can report an error for. */
type FormField =
  | "caretaker"
  | "dateRange"
  | "emergencyContact"
  | "notes";

type FormErrors = Partial<Record<FormField, string>>;

/** Sentinel used by the caretaker select for "somebody else". */
const OTHER_CARETAKER = "__other__";

const EMPTY_RANGE: DateRange = { startDate: null, endDate: null };

/**
 * CustodyRequestForm — ask for a temporary custody arrangement.
 *
 * The form has two steps:
 *
 * 1. **Details** — the custody period, who looks after the pet, an optional
 *    emergency contact and optional notes.
 * 2. **Confirmation** — a summary of the period and what happens next.
 *
 * The payload is validated with `custodyRequestSchema` *before* the request
 * is sent, so an invalid form never reaches the network. Field-level errors
 * are rendered inline next to the field they belong to.
 */
export function CustodyRequestForm({
  pet,
  caretakers = [],
  defaultCaretakerId = "",
  initialRange = EMPTY_RANGE,
}: CustodyRequestFormProps) {
  const { unavailableDates } = useCustodyAvailability(pet.id);
  const { requestCustody, isPending, isError, error } = useRequestCustody();

  const [range, setRange] = useState<DateRange>(initialRange);
  const [caretakerId, setCaretakerId] = useState(defaultCaretakerId);
  const [caretakerName, setCaretakerName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<"details" | "confirm">("details");

  const caretakerOptions = useMemo(() => {
    const options = [...caretakers];
    if (defaultCaretakerId && !options.some((option) => option.id === defaultCaretakerId)) {
      options.unshift({ id: defaultCaretakerId, name: "Me" });
    }
    return options;
  }, [caretakers, defaultCaretakerId]);

  const selectedCaretakerName = useMemo(() => {
    if (caretakerId === OTHER_CARETAKER) return caretakerName.trim();
    return (
      caretakerOptions.find((option) => option.id === caretakerId)?.name ?? ""
    );
  }, [caretakerId, caretakerName, caretakerOptions]);

  /** The payload that would be sent to the API. */
  const buildPayload = () => ({
    petId: pet.id,
    caretakerId:
      caretakerId === OTHER_CARETAKER ? caretakerName.trim() : caretakerId,
    startDate: range.startDate ?? "",
    endDate: range.endDate ?? "",
    notes: notes.trim() || undefined,
    emergencyContact: emergencyContact.trim() || undefined,
  });

  /**
   * Validates the form. Returns the payload when the form is valid and
   * `null` (after populating `errors`) when it is not.
   */
  const validate = (): CustodyRequest | null => {
    const parsed = custodyRequestSchema.safeParse(buildPayload());

    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }

    const nextErrors: FormErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (field === "caretakerId") {
        nextErrors.caretaker ??= issue.message;
      } else if (field === "startDate" || field === "endDate") {
        nextErrors.dateRange ??= issue.message;
      } else if (field === "emergencyContact" || field === "notes") {
        nextErrors[field] ??= issue.message;
      }
    }

    setErrors(nextErrors);

    return null;
  };

  const handleContinue = () => {
    if (!validate()) return;

    setStep("confirm");
  };

  const handleSubmit = () => {
    const payload = validate();
    if (!payload) {
      // The confirmation step is only reachable with a valid form, but a
      // re-validation keeps the guarantee even if the data changed.
      setStep("details");
      return;
    }

    requestCustody(payload);
  };

  const nights =
    range.startDate && range.endDate
      ? countNights(range.startDate, range.endDate)
      : null;

  // ─── Details step ─────────────────────────────────────────────────────────

  if (step === "details") {
    return (
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleContinue();
        }}
        noValidate
        data-testid="custody-request-form"
      >
        {/* Pet summary header */}
        <div
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4"
          data-testid="custody-pet-summary"
        >
          {pet.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.name}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-500"
            >
              {pet.name.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Temporary custody request
            </p>
            <h2 className="text-lg font-bold text-gray-900">{pet.name}</h2>
            <p className="text-sm text-gray-500">
              {[pet.breed, pet.age].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* Custody period */}
        <div className="flex flex-col gap-1.5">
          <DateRangePicker
            id="custody-period"
            label="Custody period"
            value={range}
            onChange={(next) => {
              setRange(next);
              if (errors.dateRange) {
                setErrors((current) => ({ ...current, dateRange: undefined }));
              }
            }}
            unavailableDates={unavailableDates}
            error={errors.dateRange}
            hint="Pick the first and the last day of the custody period."
          />
        </div>

        {/* Caretaker */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="custody-caretaker"
            className="text-sm font-medium text-gray-700"
          >
            Who will look after {pet.name}?
          </label>
          <select
            id="custody-caretaker"
            value={caretakerId}
            onChange={(event) => {
              setCaretakerId(event.target.value);
              if (errors.caretaker) {
                setErrors((current) => ({ ...current, caretaker: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.caretaker)}
            aria-describedby={
              errors.caretaker ? "custody-caretaker-error" : undefined
            }
            className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20 ${
              errors.caretaker ? "border-red-400" : ""
            }`}
          >
            <option value="">Select a caretaker</option>
            {caretakerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
            <option value={OTHER_CARETAKER}>Somebody else</option>
          </select>

          {caretakerId === OTHER_CARETAKER && (
            <input
              type="text"
              aria-label="Caretaker name"
              data-testid="custody-caretaker-name"
              value={caretakerName}
              onChange={(event) => {
                setCaretakerName(event.target.value);
                if (errors.caretaker) {
                  setErrors((current) => ({ ...current, caretaker: undefined }));
                }
              }}
              placeholder="Full name"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20"
            />
          )}

          {errors.caretaker && (
            <p
              id="custody-caretaker-error"
              role="alert"
              className="text-xs text-red-500"
              data-testid="custody-caretaker-error"
            >
              {errors.caretaker}
            </p>
          )}
        </div>

        {/* Emergency contact */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="custody-emergency-contact"
            className="text-sm font-medium text-gray-700"
          >
            Emergency contact
          </label>
          <input
            id="custody-emergency-contact"
            type="text"
            value={emergencyContact}
            onChange={(event) => {
              setEmergencyContact(event.target.value);
              if (errors.emergencyContact) {
                setErrors((current) => ({
                  ...current,
                  emergencyContact: undefined,
                }));
              }
            }}
            placeholder="Name and phone number"
            aria-invalid={Boolean(errors.emergencyContact)}
            aria-describedby={
              errors.emergencyContact
                ? "custody-emergency-contact-error"
                : undefined
            }
            className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20 ${
              errors.emergencyContact ? "border-red-400" : ""
            }`}
          />
          {errors.emergencyContact && (
            <p
              id="custody-emergency-contact-error"
              role="alert"
              className="text-xs text-red-500"
              data-testid="custody-emergency-contact-error"
            >
              {errors.emergencyContact}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="custody-notes"
            className="text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="custody-notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              if (errors.notes) {
                setErrors((current) => ({ ...current, notes: undefined }));
              }
            }}
            rows={3}
            placeholder="Anything the caretaker should know"
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "custody-notes-error" : undefined}
            className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20 ${
              errors.notes ? "border-red-400" : ""
            }`}
          />
          {errors.notes && (
            <p
              id="custody-notes-error"
              role="alert"
              className="text-xs text-red-500"
              data-testid="custody-notes-error"
            >
              {errors.notes}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#E84D2A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d34424]"
          data-testid="custody-request-continue"
        >
          Continue
        </button>
      </form>
    );
  }

  // ─── Confirmation step ────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="custody-request-confirmation"
    >
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">
          Check the custody request
        </h2>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Pet</dt>
            <dd className="font-medium text-gray-900">{pet.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">From</dt>
            <dd
              className="font-medium text-gray-900"
              data-testid="custody-confirm-start"
            >
              {range.startDate ? formatDateOnly(range.startDate) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">To</dt>
            <dd
              className="font-medium text-gray-900"
              data-testid="custody-confirm-end"
            >
              {range.endDate ? formatDateOnly(range.endDate) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Length</dt>
            <dd
              className="font-medium text-gray-900"
              data-testid="custody-confirm-nights"
            >
              {nights === null
                ? "—"
                : `${nights} ${nights === 1 ? "night" : "nights"}`}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Caretaker</dt>
            <dd
              className="font-medium text-gray-900"
              data-testid="custody-confirm-caretaker"
            >
              {selectedCaretakerName || "—"}
            </dd>
          </div>
          {emergencyContact.trim() ? (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Emergency contact</dt>
              <dd className="font-medium text-gray-900">
                {emergencyContact.trim()}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">What happens next</h3>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-gray-600">
          <li>
            We notify the caretaker and ask them to accept the request.
          </li>
          <li>
            Once the caretaker accepts, an escrow is created so the pet&apos;s
            adoption fee stays protected while it is in someone else&apos;s care.
          </li>
          <li>
            The custody period starts on the first day and ends on the last day
            you picked.
          </li>
        </ol>
      </div>

      {isError && error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          data-testid="custody-request-error"
        >
          {error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStep("details")}
          disabled={isPending}
          className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          data-testid="custody-request-back"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-xl bg-[#E84D2A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d34424] disabled:opacity-50"
          data-testid="custody-request-submit"
        >
          {isPending ? "Sending request…" : "Confirm request"}
        </button>
      </div>
    </div>
  );
}
