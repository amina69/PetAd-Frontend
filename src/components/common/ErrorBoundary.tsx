import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureError } from "../../lib/errorTracking";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level render-error boundary. Reports the failure through the
 * privacy-gated error tracker and shows a recoverable fallback instead of a
 * blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section
          role="alert"
          className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-slate-600">
            We hit an unexpected error. You can try again, or reload the page.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-6 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }
}
