import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
}

export function LoadingOverlay({ visible, label = 'Processing…' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-white/60 backdrop-blur-sm"
      data-testid="loading-overlay"
    >
      <Spinner size="md" label={label} />
    </div>
  );
}
