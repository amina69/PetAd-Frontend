import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/toast/ToastProvider";
import { AuthGateProvider } from "../context/AuthGateContext";

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  /** Seeds the auth_token that useAuth reads. There is no separate AuthProvider. */
  authenticated?: boolean;
}

/**
 * Renders UI with the providers tests otherwise rebuild by hand:
 * a fresh QueryClient (retries off), the toast provider, a memory router,
 * and the auth gate. Authentication follows useAuth (a stored token).
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", authenticated = false, ...options }: RenderWithProvidersOptions = {},
) {
  if (authenticated) {
    localStorage.setItem("auth_token", "test-token");
  } else {
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <AuthGateProvider>{children}</AuthGateProvider>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
