import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { UserOnlyRoute } from "./components/auth/UserOnlyRoute";
import { AppLayout } from "./components/layout/AppLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import MyWarrantiesPage from "./pages/MyWarrantiesPage";
import AddProductPage from "./pages/AddProductPage";
import GmailImportPage from "./pages/GmailImportPage";
import DigitalLockerPage from "./pages/DigitalLockerPage";
import ClaimAssistantPage from "./pages/ClaimAssistantPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import ServiceCentersPage from "./pages/ServiceCentersPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  useAuth();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Regular user routes — admin is redirected away from these */}
          <Route element={<UserOnlyRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/warranties" element={<MyWarrantiesPage />} />
            <Route path="/add-product" element={<AddProductPage />} />
            <Route path="/gmail-import" element={<GmailImportPage />} />
            <Route path="/digital-locker" element={<DigitalLockerPage />} />
            <Route path="/claim-assistant" element={<ClaimAssistantPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/service-centers" element={<ServiceCentersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin-only route */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
