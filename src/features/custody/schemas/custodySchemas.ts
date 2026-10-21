import { z } from "zod";
import { ESCROW_RECORD_STATUSES } from "../../../types/escrow";
import {
  CUSTODY_STATUSES,
  type CustodyArrangement,
} from "../types/custody";

/**
 * Longest custody period a user can request in one go.
 *
 * TODO: confirm with product — 90 days is a placeholder until the business
 * rule is agreed (issue #626).
 */
export const MAX_CUSTODY_DURATION_DAYS = 90;

/** Maximum length of the free-text notes on a custody request. */
export const MAX_CUSTODY_NOTES_LENGTH = 500;

/** Maximum length of the emergency contact on a custody request. */
export const MAX_CUSTODY_EMERGENCY_CONTACT_LENGTH = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

export const CUSTODY_VALIDATION_MESSAGES = {
  invalidDate: "Enter a valid date",
  startInPast: "Start date cannot be in the past",
  endBeforeStart: "End date must be after the start date",
  tooLong: `Custody cannot be longer than ${MAX_CUSTODY_DURATION_DAYS} days`,
  notesTooLong: `Notes must be ${MAX_CUSTODY_NOTES_LENGTH} characters or fewer`,
  emergencyContactTooLong: `Emergency contact must be ${MAX_CUSTODY_EMERGENCY_CONTACT_LENGTH} characters or fewer`,
} as const;

function isValidDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Parses a date-only string (`YYYY-MM-DD`) as a *local* date. `Date.parse`
 * treats date-only strings as UTC midnight, which would shift the day for
 * users west of UTC when compared with "today".
 */
function toLocalDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value);
}

/** ISO-8601 date (`YYYY-MM-DD`) or date-time string. */
const isoDateStringSchema = z
  .string()
  .refine(isValidDateString, CUSTODY_VALIDATION_MESSAGES.invalidDate);

export const custodyStatusSchema = z.enum(CUSTODY_STATUSES);

export const custodyEscrowStatusSchema = z.enum(ESCROW_RECORD_STATUSES);

/** A custody arrangement as returned by the API. */
export const custodyArrangementSchema = z.object({
  id: z.string(),
  petId: z.string(),
  ownerId: z.string(),
  caretakerId: z.string(),
  startDate: isoDateStringSchema,
  endDate: isoDateStringSchema,
  status: custodyStatusSchema,
  notes: z.string().nullable(),
  escrowStatus: custodyEscrowStatusSchema.nullable(),
  escrowId: z.string().nullable().optional(),
  petName: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  caretakerName: z.string().nullable().optional(),
}) satisfies z.ZodType<CustodyArrangement>;

/**
 * Payload for requesting a new custody arrangement.
 *
 * - `startDate` must be today or later
 * - `endDate` must be strictly after `startDate`
 * - the period may not exceed `MAX_CUSTODY_DURATION_DAYS`
 * - `notes` is optional and capped at `MAX_CUSTODY_NOTES_LENGTH` characters
 */
export const custodyRequestSchema = z
  .object({
    petId: z.string().min(1, "Select a pet"),
    caretakerId: z.string().min(1, "Select a caretaker"),
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    notes: z
      .string()
      .max(MAX_CUSTODY_NOTES_LENGTH, CUSTODY_VALIDATION_MESSAGES.notesTooLong)
      .optional(),
    emergencyContact: z
      .string()
      .max(
        MAX_CUSTODY_EMERGENCY_CONTACT_LENGTH,
        CUSTODY_VALIDATION_MESSAGES.emergencyContactTooLong,
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!isValidDateString(value.startDate) || !isValidDateString(value.endDate)) {
      // Field-level refinements already reported the malformed date.
      return;
    }

    const start = toLocalDate(value.startDate);
    const end = toLocalDate(value.endDate);

    if (startOfLocalDay(start) < startOfLocalDay(new Date())) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: CUSTODY_VALIDATION_MESSAGES.startInPast,
      });
    }

    if (end.getTime() <= start.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: CUSTODY_VALIDATION_MESSAGES.endBeforeStart,
      });
      return;
    }

    // Compare calendar days (rounded) so a DST shift cannot add a phantom hour.
    const durationDays = Math.round(
      (startOfLocalDay(end) - startOfLocalDay(start)) / DAY_MS,
    );
    if (durationDays > MAX_CUSTODY_DURATION_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: CUSTODY_VALIDATION_MESSAGES.tooLong,
      });
    }
  });

export type CustodyRequest = z.infer<typeof custodyRequestSchema>;

/** Paginated envelope returned by `GET /custody`. */
export const custodyListResponseSchema = z.object({
  data: z.array(custodyArrangementSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type CustodyListResponse = z.infer<typeof custodyListResponseSchema>;

/**
 * Days the API reported as unavailable for a pet.
 *
 * The dates are date-only strings so the client never has to re-interpret
 * them in a different time zone.
 */
export const custodyAvailabilitySchema = z.object({
  unavailableDates: z.array(isoDateStringSchema),
});

export type CustodyAvailability = z.infer<typeof custodyAvailabilitySchema>;
