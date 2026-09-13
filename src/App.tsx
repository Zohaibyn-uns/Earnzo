import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlatformProvider } from './context/PlatformContext';

// Layouts
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { PlansPage } from './pages/public/PlansPage';
import { FAQPage } from './pages/public/FAQPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { LegalPages } from './pages/public/LegalPages';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard Pages
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { WatchAndEarnPage } from './pages/dashboard/WatchAndEarnPage';
import { VideoPlayerPage } from './pages/dashboard/VideoPlayerPage';
import { WalletPage } from './pages/dashboard/WalletPage';
import { WithdrawPage } from './pages/dashboard/WithdrawPage';
import { MembershipPage } from './pages/dashboard/MembershipPage';
import { ReferralPage } from './pages/dashboard/ReferralPage';
import { TransactionsPage } from './pages/dashboard/TransactionsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { SupportPage } from './pages/dashboard/SupportPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminVideos } from './pages/admin/AdminVideos';
import { AdminCampaigns } from './pages/admin/AdminCampaigns';
import { AdminWithdrawals } from './pages/admin/AdminWithdrawals';
import { AdminAdvertisements } from './pages/admin/AdminAdvertisements';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

// Public Shell
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Route Guards
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout />;
};

const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <AdminLayout />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlatformProvider>
          <Routes>
            {/* Public Marketing Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<LegalPages />} />
              <Route path="/privacy" element={<LegalPages />} />
              <Route path="/refund-policy" element={<LegalPages />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Member Dashboard Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route index element={<DashboardOverview />} />
              <Route path="earn" element={<WatchAndEarnPage />} />
              <Route path="videos" element={<WatchAndEarnPage />} />
              <Route path="videos/:id" element={<VideoPlayerPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="withdraw" element={<WithdrawPage />} />
              <Route path="membership" element={<MembershipPage />} />
              <Route path="plans" element={<Navigate to="/plans" replace />} />
              <Route path="referrals" element={<ReferralPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="support" element={<SupportPage />} />
            </Route>

            {/* Direct Member Route Shortcuts / Aliases */}
            <Route path="/earn" element={<Navigate to="/dashboard/videos" replace />} />
            <Route path="/wallet" element={<Navigate to="/dashboard/wallet" replace />} />
            <Route path="/withdraw" element={<Navigate to="/dashboard/withdraw" replace />} />
            <Route path="/referrals" element={<Navigate to="/dashboard/referrals" replace />} />
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/membership" element={<Navigate to="/plans" replace />} />

            {/* Admin Command Center Protected Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="videos" element={<AdminVideos />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="rewards" element={<AdminAuditLogs />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="advertisements" element={<AdminAdvertisements />} />
              <Route path="referrals" element={<AdminUsers />} />
              <Route path="reports" element={<AdminDashboard />} />
              <Route path="announcements" element={<AdminSettings />} />
              <Route path="support" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PlatformProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
