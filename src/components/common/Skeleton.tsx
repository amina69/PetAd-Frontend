import type { CSSProperties, HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

/**
 * Token-driven placeholder block. Color comes from `--skeleton-base`.
 *
 * @example
 * <Skeleton width="100%" height={16} />
 */
export function Skeleton({ width, height, className = "", style, ...props }: SkeletonProps) {
  const styles: CSSProperties = {
    width,
    height,
    background: "var(--skeleton-base, #e2e8f0)",
    ...style,
  };

  return (
    <div
      className={`animate-pulse rounded-md ${className}`.trim()}
      style={styles}
      data-testid="skeleton"
      aria-hidden="true"
      {...props}
    />
  );
}
