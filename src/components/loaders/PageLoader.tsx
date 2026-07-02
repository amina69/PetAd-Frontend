import { Spinner } from './Spinner';

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = 'Loading page…' }: PageLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center" data-testid="page-loader">
      <Spinner size="lg" label={label} />
    </div>
  );
}
