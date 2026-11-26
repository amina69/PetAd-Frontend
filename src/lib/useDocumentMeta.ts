import { useEffect } from "react";

export interface DocumentMetaOptions {
  title: string;
  description?: string;
  /** Canonical URL for this page. Defaults to `window.location.href`. */
  canonical?: string;
  /** Open Graph / Twitter card image URL. */
  ogImage?: string;
  /** Open Graph type. Defaults to "website". */
  ogType?: string;
}

function upsertMeta(property: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * useDocumentMeta — sets per-route <title>, description, canonical, and
 * Open Graph / Twitter card meta tags from the given options (issue #793).
 *
 * Note: this hook updates the DOM at run-time. Search crawlers and social
 * preview renderers that do not execute client JavaScript will not see these
 * tags. For pet detail pages where social previews matter, consider a prerender
 * edge function or server-side rendering. See issue #793 for details.
 *
 * Usage:
 *   useDocumentMeta({ title: "Luna — German Shepherd | PetAd", description: "…" });
 */
export function useDocumentMeta({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
}: DocumentMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const url = canonical ?? window.location.href;
    upsertLink("canonical", url);

    if (description) {
      upsertMeta("description", description);
      upsertMeta("og:description", description, "property");
      upsertMeta("twitter:description", description, "name");
    }

    upsertMeta("og:title", title, "property");
    upsertMeta("og:type", ogType, "property");
    upsertMeta("og:url", url, "property");

    upsertMeta("twitter:card", "summary_large_image", "name");
    upsertMeta("twitter:title", title, "name");

    if (ogImage) {
      upsertMeta("og:image", ogImage, "property");
      upsertMeta("twitter:image", ogImage, "name");
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonical, ogImage, ogType]);
}
