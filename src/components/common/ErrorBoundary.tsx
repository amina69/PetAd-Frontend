import { Component, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import ErrorPage from "../../pages/ErrorPage";
import { reportError } from "../../lib/analytics";

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: "root" | "route";
  queryClient: QueryClient;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, info.componentStack);
  }

  handleRetry = (): void => {
    this.props.queryClient.resetQueries();
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorPage
          error={this.state.error}
          onRetry={this.handleRetry}
          isolate={this.props.variant === "route"}
        />
      );
    }

    return this.props.children;
  }
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  variant?: "root" | "route";
}

export function AppErrorBoundary({ children, variant = "root" }: AppErrorBoundaryProps) {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary queryClient={queryClient} variant={variant}>
      {children}
    </ErrorBoundary>
  );
}
