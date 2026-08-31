// src/components/escrow/utils.ts
export function getEscrowFundedBannerStorageKey(escrowId: string) {
  return `escrow-funded-banner-dismissed:${escrowId}`;
}