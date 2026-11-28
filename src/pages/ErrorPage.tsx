import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/approval/EmptyState";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error?: Error | null;
  onRetry?: () => void;
  isolate?: boolean;
}

export default function ErrorPage({ error, onRetry, isolate = false }: ErrorPageProps) {
  const navigate = useNavigate();
  const showStack = Boolean(import.meta.env.DEV && error);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <div
      className={
        isolate
          ? "flex items-center justify-center p-6"
          : "min-h-screen bg-gray-50 flex items-center justify-center p-4"
      }
      role="alert"
    >
      <EmptyState
        title="Something went wrong"
        description="This page hit an unexpected error. You can try again or go back home."
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="px-6 py-2.5 bg-[#E84D2A] text-white font-semibold rounded-xl hover:bg-[#d4431f] transition-colors shadow-sm"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              Go home
            </button>
          </div>
        }
      />
      {showStack ? (
        <pre className="mt-4 max-w-2xl overflow-auto rounded-lg bg-slate-900 p-4 text-left text-xs text-slate-100">
          {error?.stack ?? error?.message}
        </pre>
      ) : null}
    </div>
  );
}
