import { useState, type HTMLAttributes } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL to display. Falls back to initials when missing or broken. */
  src?: string | null;
  /** Accessible image alt text; also used to derive initials if `name` is omitted. */
  alt?: string;
  /** Full name used to compute fallback initials (takes precedence over `alt`). */
  name?: string;
  /** Fixed square dimension from the design-system scale (prevents layout shift). */
  size?: AvatarSize;
  /** Border radius shape. Defaults to `"circle"`. */
  shape?: AvatarShape;
}

const SIZE_STYLES: Record<AvatarSize, { classes: string; px: number }> = {
  xs: { classes: "h-6 w-6 text-[10px]", px: 24 },
  sm: { classes: "h-8 w-8 text-xs", px: 32 },
  md: { classes: "h-10 w-10 text-sm", px: 40 },
  lg: { classes: "h-12 w-12 text-base", px: 48 },
  xl: { classes: "h-16 w-16 text-lg", px: 64 },
};

const SHAPE_CLASSES: Record<AvatarShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-xl",
};

/**
 * Derive up to two uppercase initials from a display name or alt label.
 *
 * - Two or more words: first letter of first word + first letter of last word.
 * - Single word: first two characters (or single character).
 * - Empty or blank input: `"?"`.
 */
export function getAvatarInitials(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "?";
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * User/pet avatar primitive with fixed dimensions and image -> initials fallback.
 *
 * The outer container keeps identical width and height in both image and
 * fallback states so a broken image swaps to initials with zero layout shift.
 */
export function Avatar({
  src,
  alt,
  name,
  size = "md",
  shape = "circle",
  className,
  style,
  ...spanProps
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { classes: sizeClasses, px } = SIZE_STYLES[size];
  const normalizedSrc = src?.trim() || "";
  const showImage = normalizedSrc.length > 0 && failedSrc !== normalizedSrc;
  const label = alt ?? name ?? "Avatar";
  const initials = getAvatarInitials(name ?? alt);

  const containerClasses = [
    "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-semibold",
    "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
    sizeClasses,
    SHAPE_CLASSES[shape],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      data-size={size}
      data-fallback={showImage ? "false" : "true"}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : label}
      className={containerClasses}
      style={{ width: px, height: px, ...style }}
      {...spanProps}
    >
      {showImage ? (
        <img
          src={normalizedSrc}
          alt={label}
          width={px}
          height={px}
          onError={() => setFailedSrc(normalizedSrc)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="leading-none">
          {initials}
        </span>
      )}
    </span>
  );
}
