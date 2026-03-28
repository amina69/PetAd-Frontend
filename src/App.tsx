import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import FavouritePage from "./pages/FavouritePage";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/forgetPasswordPage";
import InterestPage from "./pages/interestPage";
import NotificationPage from "./pages/notificationPage";
import ResetPasswordPage from "./pages/resetPasswordPage";
import { AdoptionCompletionDemo } from "./pages/AdoptionCompletionDemo";
import PetListingDetailsPage from "./pages/PetlistingdetailsPage";
import EditAdoptionListing from "./pages/EditAdoptionListing";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import { SettlementSummaryPage } from "./pages/SettlementSummaryPage";
import AdoptionTimelinePage from "./pages/AdoptionTimelinePage";
import ModalPreview from "./pages/ModalPreview";
import StatusPollingDemo from "./pages/StatusPollingDemo";
<<<<<<< feat/custody-timeline-page
import CustodyTimelinePage from "./pages/CustodyTimelinePage";
=======
>>>>>>> main

function App() {

  return (
    <Routes>
      {/* Auth Routes - No Navbar/Footer */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgetPasswordPage />} />

      {/* Main App Routes - With Navbar/Footer */}
      <Route element={<MainLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favourites" element={<FavouritePage />} />
        <Route path="/interests" element={<InterestPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<PetListingDetailsPage />} />
        <Route path="/list-for-adoption" element={<EditAdoptionListing />} />
        <Route path="/my-listings/:id" element={<ListingDetailsPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/adoption/:adoptionId/settlement" element={<SettlementSummaryPage />} />
        <Route path="/adoption/:adoptionId/timeline" element={<AdoptionTimelinePage />} />

        {/* Custody Routes */}
        <Route path="/custody/:custodyId/timeline" element={<CustodyTimelinePage />} />

        {/* Preview Routes */}
        <Route path="/preview-modal" element={<ModalPreview />} />
        <Route path="/adoption-completion-demo" element={<AdoptionCompletionDemo />} />
        <Route path="/status-polling-demo" element={<StatusPollingDemo />} />
      </Route>
    </Routes>
  );

}

export default App;
