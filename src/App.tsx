import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/forgetPasswordPage";
import ResetPasswordPage from "./pages/resetPasswordPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import InterestsPage from "./pages/InterestsPage";
import ListingsPage from "./pages/ListingsPage";

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
        <Route path="/interests" element={<InterestsPage />} />
        <Route path="/listings" element={<ListingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
