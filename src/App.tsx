import { Navigate, Route, Routes } from "react-router-dom";
import { useNotificationDeepLink } from "./hooks/useNotificationDeepLink";
import { MainLayout } from "./components/layout/MainLayout";
import { GuestRoute } from "./components/auth/GuestRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AuthGateProvider } from "./context/AuthGateContext";
import FavouritePage from "./pages/FavouritePage";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/forgetPasswordPage";
import InterestPage from "./pages/interestPage";
import NotificationPage from "./pages/notificationPage";
import NotificationPreferencesPage from "./pages/NotificationPreferencesPage";
import NotificationsPage from "./pages/settings/NotificationsPage";
import ResetPasswordPage from "./pages/resetPasswordPage";
import { AdoptionCompletionDemo } from "./pages/AdoptionCompletionDemo";
import PetListingDetailsPage from "./pages/PetlistingdetailsPage";
import EditAdoptionListing from "./pages/EditAdoptionListing";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import { SettlementSummaryPage } from "./pages/SettlementSummaryPage";
import AdoptionTimelinePage from "./pages/AdoptionTimelinePage";
import ModalPreview from "./pages/ModalPreview";
import StatusPollingDemo from "./pages/StatusPollingDemo";
import CustodyTimelinePage from "./pages/CustodyTimelinePage";
import AdminApprovalQueuePage from "./pages/AdminApprovalQueuePage";
import AdminDisputeListPage from "./pages/AdminDisputeListPage";
import DisputeDetailPage from "./pages/DisputeDetailPage";
import ShelterApprovalQueuePage from "./pages/ShelterApprovalQueuePage";
import MyDisputesPage from "./pages/MyDisputesPage";

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

        {/* ── PROTECTED routes — authenticated users only ───────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/favourites" element={<FavouritePage />} />
            <Route path="/interests" element={<InterestPage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route
              path="/notification-preferences"
              element={<NotificationPreferencesPage />}
            />
            <Route
              path="/settings/notifications"
              element={<NotificationsPage />}
            />
            <Route path="/list-for-adoption" element={<EditAdoptionListing />} />
            <Route path="/my-listings/:id" element={<ListingDetailsPage />} />
            <Route
              path="/adoption/:adoptionId/settlement"
              element={<SettlementSummaryPage />}
            />
            <Route
              path="/adoption/:adoptionId/timeline"
              element={<AdoptionTimelinePage />}
            />
            <Route path="/admin/approvals" element={<AdminApprovalQueuePage />} />
            <Route path="/admin/disputes" element={<AdminDisputeListPage />} />
            <Route
              path="/shelter/approvals"
              element={<ShelterApprovalQueuePage />}
            />
            <Route path="/disputes" element={<MyDisputesPage />} />
            <Route path="/disputes/:id" element={<DisputeDetailPage />} />
            <Route
              path="/custody/:custodyId/timeline"
              element={<CustodyTimelinePage />}
            />
            <Route path="/preview-modal" element={<ModalPreview />} />
            <Route
              path="/adoption-completion-demo"
              element={<AdoptionCompletionDemo />}
            />
            <Route path="/status-polling-demo" element={<StatusPollingDemo />} />
          </Route>
        </Route>

        {/* ── Catch-all ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthGateProvider>
  );
}

export default App;