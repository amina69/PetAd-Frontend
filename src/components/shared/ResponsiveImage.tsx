import { useState } from "react";
import type { ImgHTMLAttributes } from "react";

/** Neutral paw-free placeholder shown when an image fails to load. */
const FALLBACK_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#e5e7eb"/>' +
      '<path d="M120 200l50-60 40 45 30-35 40 50z" fill="#9ca3af"/>' +
      '<circle cx="150" cy="110" r="18" fill="#9ca3af"/></svg>',
  );

export interface ResponsiveImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "src" | "width" | "height"> {
  src: string;
  alt: string;
  /** Intrinsic width in px. Together with `height` it reserves space and prevents CLS. */
  width: number;
  /** Intrinsic height in px. */
  height: number;
  /**
   * Above-the-fold image (e.g. the first gallery image / LCP candidate):
   * loads eagerly with high fetch priority. Everything else is lazy.
   */
  priority?: boolean;
  /** Image used when `src` fails to load. Defaults to a neutral SVG. */
  fallbackSrc?: string;
  /** Responsive variants, if the API exposes them (e.g. "a.jpg 400w, b.jpg 800w"). */
  srcSet?: string;
  sizes?: string;
}

/**
 * Shared <img> wrapper that applies the image-performance rules in one place:
 * lazy loading (eager for `priority`), explicit dimensions, a solid placeholder
 * until the bitmap decodes, optional srcset/sizes, and an error fallback.
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fallbackSrc = FALLBACK_SRC,
  className = "",
  style,
  onLoad,
  onError,
  ...rest
}: ResponsiveImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  // Track by src so a changed `src` prop (gallery thumbnails) resets state without an effect.
  const failed = failedSrc === src;
  const loaded = loadedSrc === src || failed;

  return (
    <img
      {...rest}
      src={failed ? fallbackSrc : src}
      // srcset describes the original resource, so it is dropped for the fallback.
      srcSet={failed ? undefined : rest.srcSet}
      sizes={failed ? undefined : rest.sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      data-loaded={loaded ? "true" : "false"}
      className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`.trim()}
      // Solid placeholder painted behind the image while it loads.
      style={{ backgroundColor: "#e5e7eb", ...style }}
      onLoad={(event) => {
        setLoadedSrc(src);
        onLoad?.(event);
      }}
      onError={(event) => {
        if (!failed) setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
}

export default ResponsiveImage;
