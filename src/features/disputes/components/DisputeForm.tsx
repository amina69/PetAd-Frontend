/**
 * The canonical dispute form lives at `features/dispute/components`
 * (the path named by the Phase 3 backlog). This module keeps the plural
 * feature path working for existing imports.
 */
export {
  DisputeForm,
  type DisputeAttachment,
  type DisputeFormErrors,
  type DisputeFormProps,
} from "../../dispute/components/DisputeForm";
export { default } from "../../dispute/components/DisputeForm";
