import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useNotificationDeepLink } from "./hooks/useNotificationDeepLink";
import { MainLayout } from "./components/layout/MainLayout";
import { GuestRoute } from "./components/auth/GuestRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AuthGateProvider } from "./context/AuthGateContext";

const FavouritePage = lazy(() => import("./pages/FavouritePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgetPasswordPage = lazy(() => import("./pages/forgetPasswordPage"));
const InterestPage = lazy(() => import("./pages/interestPage"));
const NotificationPage = lazy(() => import("./pages/notificationPage"));
const NotificationPreferencesPage = lazy(() =>
  import("./pages/NotificationPreferencesPage"),
);
const NotificationsPage = lazy(() => import("./pages/settings/NotificationsPage"));
const ResetPasswordPage = lazy(() => import("./pages/resetPasswordPage"));
const AdoptionCompletionDemo = lazy(() =>
  import("./pages/AdoptionCompletionDemo").then(({ AdoptionCompletionDemo }) => ({
    default: AdoptionCompletionDemo,
  })),
);
const PetListingDetailsPage = lazy(() => import("./pages/PetlistingdetailsPage"));
const EditAdoptionListing = lazy(() => import("./pages/EditAdoptionListing"));
const ListingDetailsPage = lazy(() => import("./pages/ListingDetailsPage"));
const SettlementSummaryPage = lazy(() =>
  import("./pages/SettlementSummaryPage").then(({ SettlementSummaryPage }) => ({
    default: SettlementSummaryPage,
  })),
);
const AdoptionTimelinePage = lazy(() => import("./pages/AdoptionTimelinePage"));
const ModalPreview = lazy(() => import("./pages/ModalPreview"));
const StatusPollingDemo = lazy(() => import("./pages/StatusPollingDemo"));
const CustodyTimelinePage = lazy(() => import("./pages/CustodyTimelinePage"));
const AdminApprovalQueuePage = lazy(() => import("./pages/AdminApprovalQueuePage"));
const AdminDisputeListPage = lazy(() => import("./pages/AdminDisputeListPage"));
const DisputeDetailPage = lazy(() => import("./pages/DisputeDetailPage"));
const ShelterApprovalQueuePage = lazy(() => import("./pages/ShelterApprovalQueuePage"));
const MyDisputesPage = lazy(() => import("./pages/MyDisputesPage"));

function RouteLoadingFallback() {
  return (
    <div role="status" aria-live="polite">
      Loading page…
    </div>
  );
}

function App() {
  useNotificationDeepLink();

  return (
    /**
     * AuthGateProvider must wrap Routes so that useLocation() inside the
     * provider reads the correct current pathname when requireAuth() is called.
     */
    <AuthGateProvider>
      <Suspense fallback={<RouteLoadingFallback />}>
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
      </Suspense>
    </AuthGateProvider>
  );
}

export default App;
