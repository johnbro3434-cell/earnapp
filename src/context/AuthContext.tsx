import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AdminUser, Wallet, Package, WebsiteSettings } from '../types';
import { getToken, setToken, removeToken, apiRequest, getDeviceFingerprint } from '../lib/api';
import { getSocket, joinUserRoom, joinAdminRoom } from '../lib/socket';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  isAdmin: boolean;
  wallet: Wallet | null;
  activePackage: Package | null;
  settings: WebsiteSettings | null;
  isLoading: boolean;
  unreadCount: number;
  login: (phone: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (phone: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  decrementUnread: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activePackage, setActivePackage] = useState<Package | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { showToast } = useToast();

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiRequest('/api/settings/public');
      if (data && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setAdmin(null);
      setIsAdmin(false);
      setWallet(null);
      setActivePackage(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me');
      if (data.isAdmin) {
        setIsAdmin(true);
        setAdmin(data.admin);
        setUser(null);
        joinAdminRoom(data.admin.role);
      } else {
        setIsAdmin(false);
        setUser(data.user);
        setAdmin(null);
        setWallet(data.wallet);
        setActivePackage(data.activePackage || null);
        joinUserRoom(data.user.id);
      }

      // Fetch unread notifications count if regular user
      if (!data.isAdmin && data.user) {
        try {
          const notifRes = await apiRequest('/api/notifications');
          if (notifRes && notifRes.notifications) {
            const unread = notifRes.notifications.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
          }
        } catch (e) {
          // ignore notification error
        }
      }
    } catch (err) {
      console.warn('Authentication token invalid, clearing');
      removeToken();
      setUser(null);
      setAdmin(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshUserData();
  }, [refreshSettings, refreshUserData]);

  // Real-Time Socket.IO event listeners
  useEffect(() => {
    const socket = getSocket();

    const handleWalletUpdated = (data: any) => {
      if (user && (!data.userId || data.userId === user.id)) {
        setWallet((prev) => (prev ? { ...prev, ...data } : data));
        showToast('info', 'Live Balance Updated', `Your wallet balance is now ৳${(data.balance || 0).toLocaleString()}`);
      }
    };

    const handleDepositChanged = (data: any) => {
      if (user && data.userId === user.id) {
        if (data.status === 'approved') {
          showToast('success', 'Deposit Approved!', `৳${data.amount} has been added to your balance.`);
        } else if (data.status === 'rejected') {
          showToast('error', 'Deposit Rejected', data.rejectedReason || 'Could not verify transaction.');
        }
        refreshUserData();
      }
    };

    const handleWithdrawChanged = (data: any) => {
      if (user && data.userId === user.id) {
        if (data.status === 'approved') {
          showToast('info', 'Withdraw Approved', `৳${data.amount} withdrawal approved and queued for payout.`);
        } else if (data.status === 'paid') {
          showToast('success', 'Withdraw Paid!', `৳${data.netAmount} sent to your ${data.paymentMethod} number.`);
        } else if (data.status === 'rejected') {
          showToast('error', 'Withdraw Rejected', `৳${data.amount} refunded. ${data.rejectedReason || ''}`);
        }
        refreshUserData();
      }
    };

    const handleNewNotification = (notif: any) => {
      setUnreadCount((prev) => prev + 1);
      showToast('info', notif.title || 'New Notification', notif.message || '');
    };

    const handleBrandingUpdated = (newSettings: any) => {
      setSettings(newSettings);
      showToast('info', 'System Update', 'Platform settings and branding updated live.');
    };

    socket.on('wallet.updated', handleWalletUpdated);
    socket.on('deposit.status.changed', handleDepositChanged);
    socket.on('withdraw.status.changed', handleWithdrawChanged);
    socket.on('notification.new', handleNewNotification);
    socket.on('branding.updated', handleBrandingUpdated);

    return () => {
      socket.off('wallet.updated', handleWalletUpdated);
      socket.off('deposit.status.changed', handleDepositChanged);
      socket.off('withdraw.status.changed', handleWithdrawChanged);
      socket.off('notification.new', handleNewNotification);
      socket.off('branding.updated', handleBrandingUpdated);
    };
  }, [user, showToast, refreshUserData]);

  const login = async (phone: string, password: string) => {
    const fp = getDeviceFingerprint();
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, deviceFingerprint: fp }),
    });

    setToken(data.token);
    if (data.isAdmin) {
      setIsAdmin(true);
      setAdmin(data.admin);
      setUser(null);
      joinAdminRoom(data.admin.role);
      showToast('success', 'Admin Portal Access', `Welcome back, ${data.admin.name}`);
      return { isAdmin: true };
    } else {
      setIsAdmin(false);
      setUser(data.user);
      setAdmin(null);
      setWallet(data.wallet);
      joinUserRoom(data.user.id);
      showToast('success', 'Login Successful', `Welcome back, ${data.user.phone}`);
      return { isAdmin: false };
    }
  };

  const register = async (phone: string, password: string, referralCode?: string) => {
    const fp = getDeviceFingerprint();
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, referralCode, deviceFingerprint: fp }),
    });

    setToken(data.token);
    setIsAdmin(false);
    setUser(data.user);
    setWallet(data.wallet);
    joinUserRoom(data.user.id);
    showToast('success', 'Account Created!', 'Your 4-Day Free Trial (25 TK daily) has begun.');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setAdmin(null);
    setIsAdmin(false);
    setWallet(null);
    setActivePackage(null);
    showToast('info', 'Logged Out', 'You have been safely signed out.');
  };

  const decrementUnread = () => {
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAdmin,
        wallet,
        activePackage,
        settings,
        isLoading,
        unreadCount,
        login,
        register,
        logout,
        refreshUserData,
        refreshSettings,
        decrementUnread,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
