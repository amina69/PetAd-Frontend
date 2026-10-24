/**
 * The dispute feature lives under `features/disputes` (plural). This module
 * re-exports the hook at the `features/dispute/hooks` path referenced by
 * issue #455 so either import path works.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/455
 */
export {
  useCreateDispute,
  type CreateDisputeInput,
  type CreateDisputeFieldErrors,
} from "../../disputes/hooks/useCreateDispute";
