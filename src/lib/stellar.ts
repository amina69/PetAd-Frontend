/**
 * Stellar utility functions for explorer URLs and transaction hash formatting
 */

/**
 * Generates the correct Stellar explorer URL based on network environment
 * @param txHash - The transaction hash to create URL for
 * @returns The complete Stellar explorer URL
 */
export function stellarExplorerUrl(id: string, type: 'tx' | 'account' = 'tx'): string {
  if (!id) {
    throw new Error("ID is required");
  }

  const network = import.meta.env.VITE_STELLAR_NETWORK || "testnet";
  const networkSegment = network === "mainnet" ? "public" : "testnet";
  const baseUrl = `https://stellar.expert/explorer/${networkSegment}/${type}/`;
  
  return `${baseUrl}${id}`;
}

/**
 * Truncates a transaction hash for display purposes
 * Shows first 8 characters + "..." + last 8 characters
 * @param txHash - The transaction hash to truncate
 * @returns The truncated transaction hash
 */
export function truncateTxHash(txHash: string): string {
  if (!txHash) {
    return "";
  }

  if (txHash.length <= 16) {
    return txHash;
  }

  const firstEight = txHash.slice(0, 8);
  const lastEight = txHash.slice(-8);
  return `${firstEight}...${lastEight}`;
}
