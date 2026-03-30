import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import ApprovalBanner from "./ApprovalBanner";

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      
      <ApprovalBanner />

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}