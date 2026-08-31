import { Navigate, Route, Routes } from "react-router-dom";
import { useNotificationDeepLink } from "./hooks/useNotificationDeepLink";
import { MainLayout } from "./components/layout/MainLayout";
import { GuestRoute } from "./components/auth/GuestRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AuthGateProvider } from "./context/AuthGateContext";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/forgetPasswordPage";
import ResetPasswordPage from "./pages/resetPasswordPage";
import PetListingDetailsPage from "./pages/PetlistingdetailsPage";
import AdminApprovalQueuePage from "./pages/AdminApprovalQueuePage";
import AdminDisputeListPage from "./pages/AdminDisputeListPage";

function App() {
  useNotificationDeepLink();

  return (
    /**
     * AuthGateProvider must wrap Routes so that useLocation() inside the
     * provider reads the correct current pathname when requireAuth() is called.
     */
    <AuthGateProvider>
      <Routes>
        {/* ── Root redirect ─────────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* ── Auth pages (redirect to /home when already logged in) ─────── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        </Route>

        {/* ── PUBLIC browsing routes — accessible to guests ─────────────── */}
        {/*
         * PublicRoute renders the Outlet unconditionally (no auth check).
         * Interactive actions inside these pages must use useAuthAction() or
         * call requireAuth() directly to gate state-changing operations.
         */}
        <Route element={<PublicRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/:id" element={<PetListingDetailsPage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/disputes" element={<AdminDisputeListPage />} />
        <Route path="/admin/approvals" element={<AdminApprovalQueuePage />} />

        {/* ── Catch-all ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthGateProvider>
  );
}

export default App;