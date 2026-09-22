import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { LandingPage } from './components/public/LandingPage';
import { LoginPage } from './components/public/LoginPage';
import { RegisterPage } from './components/public/RegisterPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { VideoTasksView } from './components/tasks/VideoTasksView';
import { WalletView } from './components/wallet/WalletView';
import { PackagesView } from './components/packages/PackagesView';
import { ReferralView } from './components/referral/ReferralView';
import { SalaryView } from './components/salary/SalaryView';
import { PromotionView } from './components/promotion/PromotionView';
import { MyAccountView } from './components/account/MyAccountView';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLoginPage } from './components/admin/AdminLoginPage';

function AppContent() {
  const { user, admin, isAdmin, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isSecretAdminRoute, setIsSecretAdminRoute] = useState<boolean>(false);

  // Check URL hash/pathname for secret admin route
  useEffect(() => {
    const checkRoute = () => {
      const isSecret = window.location.hash === '#admin-secret' || window.location.pathname === '/admin-secret';
      setIsSecretAdminRoute(isSecret);
    };
    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Check URL params for referral code or initial view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !user && !admin) {
      setCurrentView('register');
    }
  }, [user, admin]);

  // If user is admin and logs in, set admin mode default
  useEffect(() => {
    if (isAdmin && admin) {
      setIsAdminMode(true);
    } else {
      setIsAdminMode(false);
    }
  }, [isAdmin, admin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Connecting to EarnNetwork BD...</p>
      </div>
    );
  }

  // If visiting secret admin route and not logged in as admin
  if (isSecretAdminRoute && !admin) {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          setIsSecretAdminRoute(false);
          setIsAdminMode(true);
          window.location.hash = '';
        }}
        onReturnHome={() => {
          setIsSecretAdminRoute(false);
          window.location.hash = '';
        }}
      />
    );
  }

  // Handle public user (not logged in)
  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isAdminMode={false}
          setIsAdminMode={() => {}}
        />

        <main className="flex-1">
          {currentView === 'login' ? (
            <LoginPage
              onNavigate={setCurrentView}
              onLoginSuccess={(isAdm) => {
                if (isAdm) {
                  setIsAdminMode(true);
                  setCurrentView('home');
                } else {
                  setIsAdminMode(false);
                  setCurrentView('home');
                }
              }}
            />
          ) : currentView === 'register' ? (
            <RegisterPage
              onNavigate={setCurrentView}
              onRegisterSuccess={() => {
                setCurrentView('home');
              }}
            />
          ) : (
            <LandingPage onNavigate={setCurrentView} />
          )}
        </main>

        <WhatsAppButton />
      </div>
    );
  }

  // Authenticated user (Member or Admin)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
      />

      <main className="flex-1">
        {isAdminMode ? (
          <AdminPanel />
        ) : (
          <>
            {currentView === 'tasks' && <VideoTasksView />}
            {currentView === 'wallet' && <WalletView initialTab="overview" onNavigate={setCurrentView} />}
            {currentView === 'withdraw' && <WalletView initialTab="withdraw" onNavigate={setCurrentView} />}
            {currentView === 'packages' && <PackagesView onNavigate={setCurrentView} />}
            {currentView === 'referral' && <ReferralView />}
            {currentView === 'salary' && <SalaryView />}
            {currentView === 'promotion' && <PromotionView />}
            {currentView === 'account' && <MyAccountView />}
            {currentView === 'notifications' && <MyAccountView />}
            {['home', 'dashboard'].includes(currentView) && <UserDashboard onNavigate={setCurrentView} />}
          </>
        )}
      </main>

      {/* Floating WhatsApp Support Button */}
      <WhatsAppButton />

      {/* Mobile Bottom Navigation (Only for regular member view) */}
      {!isAdminMode && (
        <MobileBottomNav currentView={currentView} setCurrentView={setCurrentView} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
