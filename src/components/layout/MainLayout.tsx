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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-[#0D162B] focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Guest sign-in nudge — hidden for authenticated users */}
      <GuestBanner />

      <ApprovalBanner />

      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children ?? <Outlet />}
      </main>

      <Footer />

      {/* Auth-gate intercept modal — rendered at layout level so it overlays everything */}
      <AuthGateModal />
    </div>
  );
}
