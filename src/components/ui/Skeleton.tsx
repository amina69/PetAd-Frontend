import type { HTMLAttributes, CSSProperties } from 'react';

type SkeletonVariant = 'text' | 'card' | 'row';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  lines?: number;
  variant?: SkeletonVariant;
}

export function Skeleton({
  width,
  height,
  lines,
  variant = 'text',
  className = '',
  ...props
}: SkeletonProps) {
  // Render multiple lines for a paragraph-like skeleton
  if (lines && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`} data-testid="skeleton-group" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            height={height}
            // Decrease width for the last few lines to make it look like a paragraph
            width={
              i === lines - 1 
                ? '60%' 
                : i === lines - 2 && lines > 2 
                  ? '80%' 
                  : width || '100%'
            }
          />
        ))}
      </div>
    );
  }

  // Base classes including the shimmer animation hook
  const baseClasses = 'animate-shimmer rounded-md';
  
  // Specific classes per variant
  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    row: 'h-12 w-full rounded-none',
  };

  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  // Allow custom styling dimensions, falling back to CSS variables for colors if needed
  const styles: CSSProperties = {
    ...(width && { width }),
    ...(height && { height }),
    ...props.style,
  };

  return (
    <div
      className={finalClassName}
      style={styles}
      data-testid="skeleton"
      aria-hidden="true"
      {...props}
    />
  );
}
