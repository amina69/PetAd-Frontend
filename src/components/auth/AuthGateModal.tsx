/**
 * AuthGateModal
 *
 * A full-screen overlay that intercepts unauthenticated interactive actions.
 * It:
 *  - Shows the reason the action requires auth.
 *  - Stores the return-to path and any pending action in localStorage so the
 *    SignInForm can restore them after a full-page redirect.
 *  - Offers a "Sign In" CTA that redirects to /login with ?returnTo= query.
 *  - Offers a "Create Account" secondary CTA.
 *  - Announces itself to screen-readers via role="dialog" / aria-modal.
 */

import { useNavigate } from 'react-router-dom';
import { useAuthGate } from '../../context/AuthGateContext';
import { LogIn, UserPlus, X, LockKeyhole } from 'lucide-react';

export function AuthGateModal() {
  const { isOpen, reason, returnTo, pendingAction, close } = useAuthGate();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    // Persist state across the full-page navigation to /login
    if (returnTo) {
      sessionStorage.setItem('petad_return_to', returnTo);
    }
    if (pendingAction) {
      // We cannot serialise a closure, so we store a flag so the page can
      // show a "resuming action" hint after login.
      sessionStorage.setItem('petad_pending_action_hint', reason);
    }
    close();
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const handleRegister = () => {
    if (returnTo) sessionStorage.setItem('petad_return_to', returnTo);
    close();
    navigate(`/register?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      aria-describedby="auth-gate-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1a2f47] px-8 pt-10 pb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <LockKeyhole size={26} className="text-white" />
          </div>
          <h2
            id="auth-gate-title"
            className="text-[22px] font-bold text-white mb-2"
          >
            Sign In Required
          </h2>
          <p
            id="auth-gate-desc"
            className="text-[14px] text-blue-100/80 leading-relaxed max-w-[280px] mx-auto"
          >
            {reason}
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 py-7 flex flex-col gap-3">
          <button
            id="auth-gate-signin-btn"
            onClick={handleSignIn}
            className="flex items-center justify-center gap-2 w-full bg-[#E84D2A] text-white font-semibold text-[15px] py-3.5 rounded-xl hover:bg-[#d4431f] transition-colors focus:ring-4 focus:ring-[#E84D2A]/25 active:scale-[0.98]"
          >
            <LogIn size={18} />
            Sign In to Continue
          </button>

          <button
            id="auth-gate-register-btn"
            onClick={handleRegister}
            className="flex items-center justify-center gap-2 w-full bg-gray-50 text-[#0D1B2A] font-semibold text-[15px] py-3.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors focus:ring-4 focus:ring-gray-200 active:scale-[0.98]"
          >
            <UserPlus size={18} />
            Create Free Account
          </button>

          <button
            onClick={close}
            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors text-center mt-1"
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
}
