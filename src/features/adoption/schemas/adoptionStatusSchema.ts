import { z } from "zod";

/**
 * Statuses returned by the existing adoption status endpoint
 * (`GET /adoption/:id`, served by `adoptionService.getDetails`).
 *
 * Mirrors the Prisma `Adoption` model the backend exposes
 * (see src/mocks/handlers/status.ts).
 */
export const adoptionRequestStatusSchema = z.enum([
  "REQUESTED",
  "PENDING",
  "APPROVED",
  "ESCROW_FUNDED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

/**
 * A single adoption status payload.
 *
 * `decisionReason` is populated by the backend when a reviewer rejects (or an
 * admin cancels) an adoption request; it is absent/null for every other
 * status. Runtime-validated so backend contract drift surfaces as a query
 * error instead of silently breaking the status page.
 */
export const adoptionStatusSchema = z.object({
  id: z.string(),
  status: adoptionRequestStatusSchema,
  decisionReason: z.string().nullish(),
  updatedAt: z.string().optional(),
});

/** One of the statuses the adoption status endpoint can return. */
export type AdoptionRequestStatus = z.infer<typeof adoptionRequestStatusSchema>;

/** Validated payload of the adoption status endpoint. */
export type AdoptionStatusPayload = z.infer<typeof adoptionStatusSchema>;
