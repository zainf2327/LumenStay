import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PropertyThemeProvider } from './context/PropertyThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StaffBroadcastBanner } from './components/StaffBroadcastBanner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { BookingEngine } from './pages/BookingEngine';
import { LandingPage } from './pages/LandingPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { BookingLookup } from './pages/BookingLookup';

// 8 Dedicated Role Dashboards
import { GuestDashboard } from './pages/dashboards/GuestDashboard';
import { HousekeeperDashboard } from './pages/dashboards/HousekeeperDashboard';
import { SupervisorDashboard } from './pages/dashboards/SupervisorDashboard';
import { FrontDeskDashboard } from './pages/dashboards/FrontDeskDashboard';
import { GMDashboard } from './pages/dashboards/GMDashboard';
import { OwnerDashboard } from './pages/dashboards/OwnerDashboard';
import { MaintenanceDashboard } from './pages/dashboards/MaintenanceDashboard';
import { RevenueDashboard } from './pages/dashboards/RevenueDashboard';

function ProtectedStaffRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const { isAuthenticated, currentRole } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#F8F9FA]">
        <div className="editorial-card max-w-md p-8 rounded-3xl text-center space-y-4 border border-[#E5E7EB] bg-white shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A]/5 text-[#0F172A] mx-auto flex items-center justify-center font-bold text-lg">
            🔒
          </div>
          <h2 className="font-heading font-bold text-2xl text-[#0F172A]">Staff Access Required</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            This operations module is reserved for verified hotel staff and property managers. Please sign in with your staff credentials.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 astra-btn-primary rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Sign In with Staff Account
          </button>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { currentRole } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Determine if this is a public guest-facing view or dedicated staff route
  const isGuestExperience =
    location.pathname === '/' ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/confirmation') ||
    location.pathname === '/lookup' ||
    location.pathname === '/booking-engine';

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/set-password';

  // Dedicated default landing route based on role
  const defaultRoute =
    currentRole === 'housekeeping'
      ? '/housekeeper'
      : currentRole === 'housekeeping_supervisor'
      ? '/supervisor'
      : currentRole === 'front_desk'
      ? '/frontdesk'
      : currentRole === 'maintenance'
      ? '/maintenance'
      : currentRole === 'gm'
      ? '/gm'
      : currentRole === 'owner'
      ? '/owner'
      : currentRole === 'revenue_manager'
      ? '/revenue'
      : '/guest';

  return (
    <div className="min-h-screen flex bg-[#FAF9FC] text-[#1E1627] selection:bg-[#4A1D6D]/15 selection:text-[#4A1D6D] overflow-x-hidden font-sans">
      {/* Left Vertical Sidebar Navigation (Only on Staff Management & Operations Views) */}
      {!isGuestExperience && !isAuthPage && (
        <Sidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
      )}

      {/* Right Content View Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300 ${
          isGuestExperience || isAuthPage
            ? 'pl-0'
            : 'lg:pl-[76px]'
        }`}
      >
        {/* Top Bar & Emergency Staff Broadcast (Only on Staff Management & Operations Views) */}
        {!isGuestExperience && !isAuthPage && (
          <>
            <TopBar
              onMobileMenuOpen={() => setIsMobileOpen(true)}
            />
            <StaffBroadcastBanner />
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            {/* Public Guest Luxury Brand, Booking, Checkout & Lookup Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/booking-engine" element={<BookingEngine />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation/:code" element={<ConfirmationPage />} />
            <Route path="/lookup" element={<BookingLookup />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signup" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />

            {/* 8 Dedicated Role-Specific Dashboard Routes */}
            <Route
              path="/guest"
              element={
                <ProtectedStaffRoute allowedRoles={['guest', 'gm', 'owner']}>
                  <GuestDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/housekeeper"
              element={
                <ProtectedStaffRoute allowedRoles={['housekeeping', 'housekeeping_supervisor', 'gm', 'owner']}>
                  <HousekeeperDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/supervisor"
              element={
                <ProtectedStaffRoute allowedRoles={['housekeeping_supervisor', 'gm', 'owner']}>
                  <SupervisorDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/frontdesk"
              element={
                <ProtectedStaffRoute allowedRoles={['front_desk', 'gm', 'owner']}>
                  <FrontDeskDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/gm"
              element={
                <ProtectedStaffRoute allowedRoles={['gm', 'owner']}>
                  <GMDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/owner"
              element={
                <ProtectedStaffRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedStaffRoute allowedRoles={['maintenance', 'gm', 'owner']}>
                  <MaintenanceDashboard />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/revenue"
              element={
                <ProtectedStaffRoute allowedRoles={['revenue_manager', 'gm', 'owner']}>
                  <RevenueDashboard />
                </ProtectedStaffRoute>
              }
            />

            {/* Fallback Redirects */}
            <Route path="/executive" element={<Navigate to="/gm" replace />} />
            <Route path="/housekeeping" element={<Navigate to="/housekeeper" replace />} />
            <Route path="/guests" element={<Navigate to="/gm" replace />} />
            <Route path="/pms" element={<Navigate to={defaultRoute} replace />} />
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </main>

        {/* Staff Operations PMS Footer */}
        {!isGuestExperience && !isAuthPage && (
          <footer className="border-t border-[#E9E5EE] py-6 text-center text-xs text-[#6E6678] bg-[#FAF9FC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <p>© 2026 Lumen Hospitality Group LLC — Operations PMS Management</p>
              <p className="text-[#1E1627] font-semibold">
                Aspen • Breckenridge • Telluride • Park City • Moab • Salt Lake City
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <PropertyThemeProvider>
        <WebSocketProvider>
          <ToastProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </ConfirmProvider>
          </ToastProvider>
        </WebSocketProvider>
      </PropertyThemeProvider>
    </AuthProvider>
  );
}

export default App;
