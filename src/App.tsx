import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/forgetPasswordPage";
import ResetPasswordPage from "./pages/resetPasswordPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import FavouritePage from "./pages/FavouritePage";
import ListingsPage from "./pages/ListingsPage";
import InterestPage from "./pages/interestPage";
import NotificationPage from "./pages/notificationPage";
import ListForAdoption from "./pages/ListforadpotionPage";
import PetListingDetailsPage from "./pages/PetlistingdetailsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />

        {/* Main App Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favourites" element={<FavouritePage />} />
        <Route path="/interests" element={<InterestPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/list-for-adoption" element={<ListForAdoption />} />
        <Route path="/listings/:id" element={<PetListingDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
