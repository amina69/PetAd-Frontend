/**
 * useAuthAction
 *
 * Wraps any interactive callback so that unauthenticated users see the
 * AuthGateModal instead of triggering the action directly.
 *
 * Usage:
 *   const handleFavourite = useAuthAction(
 *     () => saveToFavourites(petId),
 *     'Sign in to save pets to your favourites list.'
 *   );
 *
 *   <button onClick={handleFavourite}>Add to Favourites</button>
 *
 * If the user is already authenticated the callback fires immediately.
 * If not, the AuthGateModal appears with `reason` as the explanation.
 * After login the user is returned to the current page; the pending action
 * cannot be automatically replayed after a full-page redirect (sessionStorage
 * carries a hint so the UI can show a "resuming…" message), but it CAN be
 * replayed when the modal is dismissed with useAuthGate().replayAndClose().
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAuthGate } from '../context/AuthGateContext';

/**
 * @param action   The function to execute when the user is authenticated.
 * @param reason   Human-readable text shown in the AuthGateModal.
 */
export function useAuthAction<TArgs extends unknown[]>(
  action: (...args: TArgs) => void,
  reason: string,
): (...args: TArgs) => void {
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();

  return useCallback(
    (...args: TArgs) => {
      if (isAuthenticated) {
        action(...args);
      } else {
        requireAuth(reason, () => action(...args));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, requireAuth, reason],
  );
}
