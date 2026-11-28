import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: ReactNode;
  /** Router path or absolute URL. Omit for the current page. */
  href?: string;
  /** Force the current-page state even when an href is present. */
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  ariaLabel?: string;
  /** Visual separator; hidden from assistive tech. Defaults to `/`. */
  separator?: ReactNode;
  className?: string;
  listClassName?: string;
}

/**
 * Breadcrumb trail rendered as `nav > ol`.
 *
 * The last item (or the item marked `current`) gets `aria-current="page"` and
 * is not a link; separators are decorative and hidden from the accessibility
 * tree. Internal hrefs use the router `Link` so navigation is client-side.
 */
export function Breadcrumbs({
  items,
  ariaLabel = "Breadcrumb",
  separator = "/",
  className,
  listClassName,
}: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={["text-sm text-slate-500", className].filter(Boolean).join(" ")}
    >
      <ol
        className={["flex flex-wrap items-center gap-2", listClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {items.map((item, index) => {
          const isCurrent = item.current ?? index === items.length - 1;
          const isExternal = Boolean(item.href && /^[a-z][a-z\d+.-]*:/i.test(item.href));

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-slate-400">
                  {separator}
                </span>
              ) : null}
              {isCurrent || !item.href ? (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="font-medium text-slate-800"
                >
                  {item.label}
                </span>
              ) : isExternal ? (
                <a href={item.href} className="hover:underline">
                  {item.label}
                </a>
              ) : (
                <Link to={item.href} className="hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
