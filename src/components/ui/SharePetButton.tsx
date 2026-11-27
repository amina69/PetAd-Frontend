import { useState } from "react";
import { Share2, Link, Check } from "lucide-react";

export interface SharePetButtonProps {
  /** The URL to share. Defaults to `window.location.href`. */
  url?: string;
  /** Pet name used in the Web Share sheet title and aria-label. */
  petName?: string;
  /** Optional short description passed to the Web Share API. */
  description?: string;
}

/**
 * SharePetButton — Web Share API with copy-link fallback (issue #793).
 *
 * On devices that support navigator.share the native sheet opens.
 * Where the API is unavailable (most desktops) the URL is copied to the
 * clipboard and a brief "Link copied!" confirmation is shown.
 */
export function SharePetButton({ url, petName = "this pet", description }: SharePetButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Adopt ${petName} on PetAd`,
          text: description ?? `Check out ${petName} available for adoption on PetAd.`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to copy-link fallback.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Copy-link fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write not permitted — no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Link copied to clipboard" : `Share ${petName}`}
      aria-live="polite"
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E84D2A] ${
        copied
          ? "border-green-200 bg-green-50 text-green-600"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      {copied ? (
        <>
          <Check size={16} aria-hidden="true" />
          <span>Link copied!</span>
        </>
      ) : (
        <>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <Share2 size={16} aria-hidden="true" />
          ) : (
            <Link size={16} aria-hidden="true" />
          )}
          <span>Share</span>
        </>
      )}
    </button>
  );
}
