import { beforeEach, describe, expect, it, vi } from "vitest";
import { stellarExplorerUrl, truncateTxHash } from "../stellar";

describe("stellar utilities", () => {
  beforeEach(() => {
    // Clear environment variables before each test
    vi.stubEnv("VITE_STELLAR_NETWORK", undefined);
  });

  describe("stellarExplorerUrl", () => {
    it("returns testnet URL when VITE_STELLAR_NETWORK is testnet", () => {
      vi.stubEnv("VITE_STELLAR_NETWORK", "testnet");
      const txHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      
      const result = stellarExplorerUrl(txHash);
      
      expect(result).toBe("https://stellar.expert/explorer/testnet/tx/" + txHash);
    });

    it("returns mainnet URL when VITE_STELLAR_NETWORK is mainnet", () => {
      vi.stubEnv("VITE_STELLAR_NETWORK", "mainnet");
      const txHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      
      const result = stellarExplorerUrl(txHash);
      
      expect(result).toBe("https://stellar.expert/explorer/public/tx/" + txHash);
    });

    it("defaults to testnet URL when VITE_STELLAR_NETWORK is not set", () => {
      const txHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      
      const result = stellarExplorerUrl(txHash);
      
      expect(result).toBe("https://stellar.expert/explorer/testnet/tx/" + txHash);
    });

    it("throws error when txHash is empty", () => {
      expect(() => stellarExplorerUrl("")).toThrow("Transaction hash is required");
    });

    it("throws error when txHash is null", () => {
      expect(() => stellarExplorerUrl(null as unknown as string)).toThrow("Transaction hash is required");
    });

    it("throws error when txHash is undefined", () => {
      expect(() => stellarExplorerUrl(undefined as unknown as string)).toThrow("Transaction hash is required");
    });
  });

  describe("truncateTxHash", () => {
    it("truncates long transaction hash correctly", () => {
      const txHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      
      const result = truncateTxHash(txHash);
      
      expect(result).toBe("abcdef12...34567890");
    });

    it("returns original hash when length is 16 characters or less", () => {
      const shortHash = "123456789012345";
      
      const result = truncateTxHash(shortHash);
      
      expect(result).toBe("123456789012345");
    });

    it("returns original hash when length is exactly 16 characters", () => {
      const exactHash = "1234567890123456";
      
      const result = truncateTxHash(exactHash);
      
      expect(result).toBe("1234567890123456");
    });

    it("returns empty string when txHash is empty", () => {
      const result = truncateTxHash("");
      
      expect(result).toBe("");
    });

    it("returns empty string when txHash is null", () => {
      const result = truncateTxHash(null as unknown as string);
      
      expect(result).toBe("");
    });

    it("returns empty string when txHash is undefined", () => {
      const result = truncateTxHash(undefined as unknown as string);
      
      expect(result).toBe("");
    });

    it("handles hash with exactly 17 characters", () => {
      const hash = "12345678901234567";
      
      const result = truncateTxHash(hash);
      
      expect(result).toBe("12345678...01234567");
    });
  });
});
