interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
};

export function Spinner({ size = 'md', label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full border-gray-300 border-t-blue-600 animate-spin ${sizeClasses[size]} ${className}`}
      data-testid="spinner"
    />
  );
}
