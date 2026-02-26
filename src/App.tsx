import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import FavouritePage from "./pages/FavouritePage";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import ModalPreview from "./pages/ModalPreview";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/forgetPasswordPage";
import InterestPage from "./pages/interestPage";
import NotificationPage from "./pages/notificationPage";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import ResetPasswordPage from "./pages/resetPasswordPage";


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
        <Route path="/listings/:id" element={<ListingDetailsPage />} />
        <Route path="/notifications" element={<NotificationPage />} />

        {/* Preview Routes */}
        <Route path="/preview-modal" element={<ModalPreview />} />

        {/* Test Route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
