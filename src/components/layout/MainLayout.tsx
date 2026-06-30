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

      <main className="flex-1">
        {children ?? <Outlet />}
      </main>

      <Footer />

      {/* Auth-gate intercept modal — rendered at layout level so it overlays everything */}
      <AuthGateModal />
    </div>
  );
}