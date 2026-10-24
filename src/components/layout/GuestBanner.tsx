/**
 * GuestBanner
 *
 * A subtle, dismissible sticky banner shown to unauthenticated users on public
 * pages, encouraging them to sign in to save progress / access more features.
 *
 * Design tokens follow the existing PetAd palette:
 *  - #0D1B2A  dark navy (primary)
 *  - #E84D2A  accent orange-red
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, X } from 'lucide-react';

export function GuestBanner() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Only render for guests on browseable public pages
  if (isAuthenticated || dismissed) return null;

  const returnTo = encodeURIComponent(location.pathname + location.search);

  return (
    <div
      role="banner"
      aria-label="Guest mode banner"
      className="w-full bg-gradient-to-r from-[#0D1B2A] to-[#1a2f47] text-white text-[13px] py-2.5 px-4 flex items-center justify-center gap-3 relative"
    >
      <Sparkles size={14} className="text-[#E84D2A] flex-shrink-0" />
      <span className="text-blue-100/90">
        You&apos;re browsing as a guest.{' '}
        <Link
          to={`/login?returnTo=${returnTo}`}
          className="font-semibold text-white underline underline-offset-2 hover:text-[#E84D2A] transition-colors"
          id="guest-banner-signin-link"
        >
          Sign in
        </Link>{' '}
        to save favourites, express interest, and more.
      </span>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-blue-200/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
