import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useNotificationDeepLink } from "./hooks/useNotificationDeepLink";
import { MainLayout } from "./components/layout/MainLayout";
import { GuestRoute } from "./components/auth/GuestRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AuthGateProvider } from "./context/AuthGateContext";
import { AdminRouteGuard } from "./features/admin/components/AdminRouteGuard";
import { AccountPage } from "./features/auth/AccountPage";
import ListingsPage from "./pages/ListingsPage";

const FavouritePage = lazy(() => import("./pages/FavouritePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgetPasswordPage = lazy(() => import("./pages/forgetPasswordPage"));
const InterestPage = lazy(() => import("./pages/interestPage"));
const NotificationPage = lazy(() => import("./pages/notificationPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
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
const AdoptionStatusPage = lazy(() => import("./pages/AdoptionStatusPage"));
const ModalPreview = lazy(() => import("./pages/ModalPreview"));
const StatusPollingDemo = lazy(() => import("./pages/StatusPollingDemo"));
const CustodyTimelinePage = lazy(() => import("./pages/CustodyTimelinePage"));
const AdminApprovalQueuePage = lazy(() => import("./pages/AdminApprovalQueuePage"));
const ApprovalListPage = lazy(() => import("./pages/ApprovalListPage"));
const AdminDisputeListPage = lazy(() => import("./pages/AdminDisputeListPage"));
const DisputeDetailPage = lazy(() => import("./pages/DisputeDetailPage"));
const ShelterApprovalQueuePage = lazy(() => import("./pages/ShelterApprovalQueuePage"));
const MyDisputesPage = lazy(() => import("./pages/MyDisputesPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const AdminLayout = lazy(() => import("./features/admin/components/AdminLayout"));
const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage"));
const AdminSectionPage = lazy(() => import("./pages/admin/AdminSectionPage"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const DocumentVerificationPage = lazy(() => import("./pages/admin/DocumentVerificationPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const AuditLogPage = lazy(() => import("./pages/admin/AuditLogPage"));
const CaretakerDashboardPage = lazy(() => import("./pages/CaretakerDashboardPage"));

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
            <Route path="/account" element={<AccountPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/favourites" element={<FavouritePage />} />
            <Route path="/interests" element={<InterestPage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<MessagesPage />} />
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
            <Route
              path="/adoption/:adoptionId/status"
              element={<AdoptionStatusPage />}
            />
            <Route path="/admin/approvals" element={<AdminApprovalQueuePage />} />
            <Route path="/approvals" element={<ApprovalListPage />} />
            <Route path="/admin/disputes" element={<AdminDisputeListPage />} />
            <Route path="/admin/documents" element={<DocumentVerificationPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
            <Route
              path="/shelter/approvals"
              element={<ShelterApprovalQueuePage />}
            />
            <Route path="/disputes" element={<MyDisputesPage />} />
            <Route
              path="/caretaker/dashboard"
              element={<CaretakerDashboardPage />}
            />
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
          <Route path="/admin/*" element={<AdminRouteGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="approvals" element={<AdminApprovalQueuePage />} />
              <Route path="disputes" element={<AdminDisputeListPage />} />
              <Route path="documents" element={<AdminSectionPage />} />
              <Route path="users" element={<AdminSectionPage />} />
              <Route path="audit" element={<AdminSectionPage />} />
              <Route path="*" element={<AdminSectionPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/403" element={<ForbiddenPage />} />

        {/* ── Catch-all ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </AuthGateProvider>
  );
}

export default App;
