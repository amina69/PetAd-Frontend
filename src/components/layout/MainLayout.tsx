import { type PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import ApprovalBanner from "./ApprovalBanner";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      
      
      <ApprovalBanner />

      <Navbar />

      <main className="flex-1">
        {children ?? <Outlet />}
      </main>

      <Footer />
    </div>
  );
}