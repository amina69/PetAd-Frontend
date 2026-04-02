import { type PropsWithChildren } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import ApprovalBanner from "./ApprovalBanner";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      
      <ApprovalBanner />

      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}