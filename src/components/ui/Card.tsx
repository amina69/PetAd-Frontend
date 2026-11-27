import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "outlined" | "elevated" | "subtle";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Semantic wrapper element. Defaults to `"div"`. */
  as?: "div" | "article" | "section";
  /** Visual surface treatment. Defaults to `"outlined"`. */
  variant?: CardVariant;
  /** Adds subtle hover elevation for clickable cards. */
  interactive?: boolean;
  children: ReactNode;
}

export interface CardSlotProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  outlined:
    "bg-[var(--surface-card,#ffffff)] border border-[var(--border-subtle,#e2e8f0)] text-[var(--text-primary,#0f172a)]",
  elevated:
    "bg-[var(--surface-elevated,#ffffff)] border border-[var(--border-subtle,#e2e8f0)] shadow-md text-[var(--text-primary,#0f172a)]",
  subtle:
    "bg-[var(--surface-muted,#f8fafc)] border border-transparent text-[var(--text-primary,#0f172a)]",
};

/** Header slot rendered at the top of a `Card`. */
export function CardHeader({ className, children, ...props }: CardSlotProps) {
  return (
    <div
      data-slot="card-header"
      className={["flex items-start justify-between gap-3 px-5 pt-5 pb-3", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

/** Edge-to-edge media slot for images, video, or illustrations. */
export function CardMedia({ className, children, ...props }: CardMediaProps) {
  return (
    <div
      data-slot="card-media"
      className={["overflow-hidden bg-slate-100 dark:bg-slate-800", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

/** Primary content slot of a `Card`. */
export function CardBody({ className, children, ...props }: CardSlotProps) {
  return (
    <div
      data-slot="card-body"
      className={["px-5 py-4", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

/** Footer slot for actions or metadata separated from the body. */
export function CardFooter({ className, children, ...props }: CardSlotProps) {
  return (
    <div
      data-slot="card-footer"
      className={[
        "flex items-center justify-between gap-3 border-t border-[var(--border-subtle,#e2e8f0)] px-5 pt-3 pb-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

function CardRoot({
  as: Component = "div",
  variant = "outlined",
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  const classes = [
    "overflow-hidden rounded-2xl transition-shadow",
    VARIANT_CLASSES[variant],
    interactive ? "hover:shadow-lg focus-within:shadow-lg" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component data-slot="card" className={classes} {...props}>
      {children}
    </Component>
  );
}

/**
 * Composable Card primitive with `Header`, `Media`, `Body`, and `Footer` slots.
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Media: CardMedia,
  Body: CardBody,
  Footer: CardFooter,
});
