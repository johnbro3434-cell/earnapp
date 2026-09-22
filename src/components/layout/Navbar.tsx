import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Wallet, ShieldCheck, LogOut, LayoutDashboard, Crown, Sparkles } from 'lucide-react';
import { NotificationsModal } from '../notifications/NotificationsModal';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
}

export function Navbar({ currentView, setCurrentView, isAdminMode, setIsAdminMode }: NavbarProps) {
  const { user, admin, isAdmin, wallet, settings, logout, unreadCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const websiteName = settings?.websiteName || 'EarnNetwork BD';

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'VIP':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Senior Manager':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Middle Manager':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Manager':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <>
      <header id="app-header" className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <div
            id="brand-logo-btn"
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
          >
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="EarnNetwork BD Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-emerald-500/30 shadow-lg shadow-emerald-950 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-sm sm:text-base md:text-lg text-white tracking-tight truncate block max-w-[130px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-none group-hover:text-emerald-400 transition-colors">
                {websiteName}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                Official
              </span>
            </div>
          </div>

          {/* Navigation Links (Public vs Authenticated) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!user && !admin ? (
              // Public Navigation: Strictly Home, Login, Register (NO PACKAGE PRICING!)
              <nav className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  id="nav-link-home"
                  onClick={() => setCurrentView('home')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] flex items-center ${
                    currentView === 'home'
                      ? 'text-white bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Home
                </button>
                <button
                  id="nav-link-login"
                  onClick={() => setCurrentView('login')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] flex items-center ${
                    currentView === 'login'
                      ? 'text-white bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Login
                </button>
                <button
                  id="nav-link-register"
                  onClick={() => setCurrentView('register')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-lg shadow-md shadow-emerald-950 transition min-h-[36px] flex items-center"
                >
                  Register
                </button>
              </nav>
            ) : (
              // Authenticated Navigation
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Admin Mode Switcher if user is admin */}
                {isAdmin && (
                  <button
                    id="btn-toggle-admin-mode"
                    onClick={() => setIsAdminMode(!isAdminMode)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition min-h-[36px] ${
                      isAdminMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAdminMode ? 'Exit Admin' : 'Admin CRM'}</span>
                  </button>
                )}

                {/* Real-Time Live Wallet Balance Pill */}
                {wallet && !isAdminMode && (
                  <div
                    id="wallet-balance-pill"
                    onClick={() => setCurrentView('wallet')}
                    className="flex items-center gap-1.5 sm:gap-2 bg-emerald-950/60 hover:bg-emerald-950/90 border border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-full cursor-pointer transition select-none min-h-[36px]"
                    title="Live Wallet Balance - Click to view Wallet"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-emerald-300 whitespace-nowrap">
                      ৳ {(wallet.balance || 0).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Notifications Bell */}
                <button
                  id="btn-navbar-notifications"
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span
                      id="badge-unread-notifications"
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User Role Badge */}
                {user && (
                  <div className="hidden md:flex items-center gap-1.5">
                    <span
                      id="badge-user-role"
                      className={`text-xs font-semibold border px-2.5 py-0.5 rounded-full flex items-center gap-1 ${getRoleBadgeStyle(
                        user.role
                      )}`}
                    >
                      <Crown className="w-3 h-3" />
                      {user.role}
                    </span>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  id="btn-navbar-logout"
                  onClick={logout}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
