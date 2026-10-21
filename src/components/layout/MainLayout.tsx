import { type PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import ApprovalBanner from "./ApprovalBanner";
import { GuestBanner } from "./GuestBanner";
import { AuthGateModal } from "../auth/AuthGateModal";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Guest sign-in nudge — hidden for authenticated users */}
      <GuestBanner />

      <ApprovalBanner />

      <Navbar />

      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-[#001323] px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E84D2A]"
      >
        Skip to main content
      </a>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children ?? <Outlet />}
      </main>

      <Footer />

      {/* Auth-gate intercept modal — rendered at layout level so it overlays everything */}
      <AuthGateModal />
    </div>
  );
}
