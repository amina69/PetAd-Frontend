/**
 * AuthGateContext
 *
 * Provides shared state for the guest-mode authentication gate:
 *  - isOpen            whether the auth gate modal is visible
 *  - reason            human-readable string explaining why auth is required
 *  - pendingAction     optional callback to replay after successful login
 *  - returnTo          route the user was on when the gate fired
 *
 * Usage
 *  - Wrap the app (or any subtree) with <AuthGateProvider>.
 *  - Call requireAuth(reason, pendingAction?) from any interactive button.
 *  - After login, call replayAndClose() to execute the pending action and dismiss.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

interface AuthGateState {
  isOpen: boolean;
  reason: string;
  returnTo: string;
  pendingAction: (() => void) | null;
}

interface AuthGateContextValue extends AuthGateState {
  /** Fire this from any button that needs authentication. */
  requireAuth: (reason: string, pendingAction?: () => void) => void;
  /** Call after successful login – replays pending action then closes. */
  replayAndClose: () => void;
  /** Dismiss the modal without replaying. */
  close: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [state, setState] = useState<AuthGateState>({
    isOpen: false,
    reason: '',
    returnTo: '/',
    pendingAction: null,
  });

  const requireAuth = useCallback(
    (reason: string, pendingAction?: () => void) => {
      setState({
        isOpen: true,
        reason,
        returnTo: location.pathname + location.search,
        pendingAction: pendingAction ?? null,
      });
    },
    [location.pathname, location.search],
  );

  const replayAndClose = useCallback(() => {
    const action = state.pendingAction;
    setState((prev) => ({ ...prev, isOpen: false, pendingAction: null }));
    if (action) {
      // small tick so the modal unmounts before the action runs
      setTimeout(action, 50);
    }
  }, [state.pendingAction]);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AuthGateContext.Provider
      value={{ ...state, requireAuth, replayAndClose, close }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}

/** Must be used inside <AuthGateProvider>. */
export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error('useAuthGate must be used inside <AuthGateProvider>');
  }
  return ctx;
}
