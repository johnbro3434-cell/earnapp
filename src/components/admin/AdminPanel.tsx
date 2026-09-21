import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Film,
  DollarSign,
  Package as PackageIcon,
  Sliders,
  Bell,
  Settings,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Power,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Menu,
} from 'lucide-react';
import { apiRequest, removeToken } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, DepositRequest, WithdrawRequest, VideoTask, PaymentNumber, WebsiteSettings } from '../../types';

export function AdminPanel() {
  const { admin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'users' | 'tasks' | 'finance' | 'packages' | 'sliders' | 'broadcast' | 'settings'
  >('analytics');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Analytics State
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users State
  const [userList, setUserList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<number>(100);
  const [balanceActionType, setBalanceActionType] = useState<'add' | 'subtract'>('add');

  // Video Tasks State
  const [tasksList, setTasksList] = useState<VideoTask[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskUrl, setNewTaskUrl] = useState('');
  const [newTaskThumb, setNewTaskThumb] = useState('');
  const [newTaskReward, setNewTaskReward] = useState(25);
  const [newTaskCategory, setNewTaskCategory] = useState('Sponsor Ads');

  // Finance State
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [pendingWithdraws, setPendingWithdraws] = useState<WithdrawRequest[]>([]);
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<'deposit' | 'withdraw'>('deposit');
  const [newPayMethod, setNewPayMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [newPayNumber, setNewPayNumber] = useState('');

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');

  // Website Settings State
  const [siteSettings, setSiteSettings] = useState<WebsiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Packages State
  const [packagesList, setPackagesList] = useState<any[]>([]);

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    try {
      if (activeTab === 'analytics') {
        setLoadingStats(true);
        const data = await apiRequest('/api/admin/analytics');
        setStats(data.analytics);
        setLoadingStats(false);
      } else if (activeTab === 'users') {
        const data = await apiRequest('/api/admin/users');
        setUserList(data.users || []);
      } else if (activeTab === 'tasks') {
        const data = await apiRequest('/api/admin/tasks');
        setTasksList(data.tasks || []);
      } else if (activeTab === 'packages') {
        const data = await apiRequest('/api/admin/packages');
        setPackagesList(data.packages || []);
      } else if (activeTab === 'finance') {
        const [depData, wdrData, numData] = await Promise.all([
          apiRequest('/api/admin/deposits/pending'),
          apiRequest('/api/admin/withdraws/pending'),
          apiRequest('/api/wallet/payment-numbers'),
        ]);
        setPendingDeposits(depData.deposits || []);
        setPendingWithdraws(wdrData.withdraws || []);
        setPaymentNumbers(numData.paymentNumbers || []);
      } else if (activeTab === 'settings' || activeTab === 'sliders') {
        const data = await apiRequest('/api/settings/public');
        setSiteSettings(data.settings);
      }
    } catch (e: any) {
      console.warn('Admin load error:', e);
    }
  };

  const handleUpdatePackage = async (id: string, updatedFields: any) => {
    try {
      await apiRequest(`/api/admin/packages/${id}`, {
        method: 'POST',
        body: JSON.stringify(updatedFields),
      });
      showToast('success', 'Package Updated', 'VIP Package configuration saved successfully.');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // User ban/unban
  const handleToggleBan = async (u: User) => {
    try {
      const res = await apiRequest(`/api/admin/users/${u.id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ isBanned: !u.isBanned }),
      });
      showToast('success', 'User Updated', res.message);
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Balance adjustment
  const handleBalanceAdjust = async () => {
    if (!balanceModalUser) return;
    try {
      await apiRequest(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'POST',
        body: JSON.stringify({
          amount: balanceAmount,
          action: balanceActionType,
          reason: 'Manual Admin adjustment via CRM',
        }),
      });
      showToast('success', 'Balance Updated', `Successfully modified balance for ${balanceModalUser.phone}`);
      setBalanceModalUser(null);
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Failed', e.message);
    }
  };

  // Approve Deposit
  const handleApproveDeposit = async (id: string) => {
    try {
      await apiRequest(`/api/admin/deposits/${id}/approve`, { method: 'POST' });
      showToast('success', 'Deposit Approved', 'Deposit approved and added to user wallet balance.');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Approval Error', e.message);
    }
  };

  // Reject Deposit
  const handleRejectDeposit = async () => {
    if (!rejectingId) return;
    try {
      await apiRequest(`/api/admin/deposits/${rejectingId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason || 'Transaction ID not verified' }),
      });
      showToast('info', 'Deposit Rejected', 'Deposit request rejected.');
      setRejectingId(null);
      setRejectReason('');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Approve Withdrawal
  const handleApproveWithdraw = async (id: string) => {
    try {
      await apiRequest(`/api/admin/withdraws/${id}/approve`, { method: 'POST' });
      showToast('success', 'Withdrawal Approved', 'Withdrawal status set to approved.');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Mark Withdrawal Paid (Dispatch)
  const handlePayWithdraw = async (id: string) => {
    const payoutTrx = prompt('Enter Bank / MFS Transaction ID (TrxID) for this payout:', 'TRX' + Date.now().toString(36).toUpperCase());
    if (!payoutTrx) return;

    try {
      await apiRequest(`/api/admin/withdraws/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ payoutTrxId: payoutTrx }),
      });
      showToast('success', 'Withdrawal Paid', 'Marked as paid and user notified.');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Reject Withdrawal (Auto Refund)
  const handleRejectWithdraw = async () => {
    if (!rejectingId) return;
    try {
      await apiRequest(`/api/admin/withdraws/${rejectingId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason || 'Incorrect payment credentials' }),
      });
      showToast('info', 'Withdrawal Rejected', 'Amount refunded automatically to user wallet.');
      setRejectingId(null);
      setRejectReason('');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Add Payment Number
  const handleAddPaymentNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayNumber) return;
    try {
      await apiRequest('/api/admin/payment-numbers', {
        method: 'POST',
        body: JSON.stringify({
          method: newPayMethod,
          number: newPayNumber,
          type: 'Personal',
        }),
      });
      showToast('success', 'Number Added', `New ${newPayMethod} payment number registered.`);
      setNewPayNumber('');
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Toggle Payment Number Active Status
  const handleTogglePaymentNumber = async (id: string, current: boolean) => {
    try {
      await apiRequest(`/api/admin/payment-numbers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !current }),
      });
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Toggle Free User Withdraw Permission
  const handleToggleFreeWithdraw = async (u: any) => {
    try {
      const res = await apiRequest(`/api/admin/users/${u.id}/toggle-free-withdraw`, {
        method: 'POST',
      });
      showToast(
        'success',
        'Free Withdraw Status Updated',
        res.message || `Free withdrawal permission updated for ${u.phone}`
      );
      loadAllAdminData();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Broadcast notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) {
      showToast('error', 'Missing Fields', 'Title and message are required.');
      return;
    }
    try {
      await apiRequest('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMsg,
          targetUserId: broadcastTarget === 'all' ? undefined : broadcastTarget,
        }),
      });
      showToast('success', 'Notification Sent', 'Broadcast notification dispatched live.');
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      setSavingSettings(true);
      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(siteSettings),
      });
      showToast('success', 'Settings Saved', 'Platform settings and branding updated live.');
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const navTabs = [
    { id: 'analytics', label: 'Dashboard & Metrics', icon: LayoutDashboard },
    { id: 'finance', label: 'Finance & Gateways', icon: DollarSign },
    { id: 'users', label: 'User CRM & Wallets', icon: Users },
    { id: 'tasks', label: 'Task Manager', icon: Film },
    { id: 'packages', label: 'Investment Packages', icon: PackageIcon },
    { id: 'sliders', label: 'Sliders & Marquee', icon: Sliders },
    { id: 'broadcast', label: 'Broadcasts', icon: Bell },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  // Filtered user list
  const filteredUsers = userList.filter((u) =>
    (u.phone || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.referralCode || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div id="admin-panel-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-amber-500 selection:text-slate-950">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-extrabold text-sm">
            EH
          </div>
          <div>
            <h1 className="text-sm font-black text-white">EarnHub CRM</h1>
            <p className="text-[10px] text-amber-400 font-semibold">{admin?.role || 'Super Admin'}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer / Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-72 bg-slate-900 h-full border-r border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
                    EH
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">Enterprise CRM</h2>
                    <span className="text-xs text-amber-400">{admin?.role || 'Admin'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/40'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs font-bold text-white truncate">{admin?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{admin?.phone}</p>
              </div>
              <button
                onClick={() => {
                  removeToken();
                  window.location.reload();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" />
                <span>Secure Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left-Side Sidebar */}
      <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 flex-col justify-between p-6 shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shadow-inner">
              EH
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">EarnHub BD</h2>
              <span className="text-[11px] text-amber-400 font-extrabold tracking-wide uppercase">
                {admin?.role || 'Super Admin'}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`sidebar-admin-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xl shadow-amber-950/50 font-black'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Admin User'}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{admin?.phone}</p>
            </div>
          </div>
          <button
            onClick={() => {
              removeToken();
              window.location.reload();
            }}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-x-hidden pb-24 md:pb-12">
        {/* Top Header Bar inside Main Area */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Secure Enterprise CRM
              </span>
              <span className="text-xs text-slate-400">Active Module: <strong className="text-white capitalize">{activeTab}</strong></span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {activeTab === 'analytics' && 'Dashboard Overview & Real-Time Metrics'}
              {activeTab === 'finance' && 'Finance Engine: Deposits & Payouts'}
              {activeTab === 'users' && 'User CRM & Balance Management'}
              {activeTab === 'tasks' && 'Sponsored Video Tasks Manager'}
              {activeTab === 'packages' && 'VIP Investment Packages Control'}
              {activeTab === 'sliders' && 'Marquee & Banner Announcements'}
              {activeTab === 'broadcast' && 'System Notifications & Broadcasts'}
              {activeTab === 'settings' && 'Platform Settings & Security'}
            </h2>
          </div>

          <button
            onClick={loadAllAdminData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh CRM Data</span>
          </button>
        </div>

      {/* 1. ANALYTICS MODULE */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Total Registered Users</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.totalUsers}</h3>
              <span className="text-[11px] text-emerald-400">{stats.activeUsers} active paid accounts</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Total Deposit Inflow</span>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">৳{stats.totalDeposits.toLocaleString()}</h3>
              <span className="text-[11px] text-slate-500">Verified via bKash/Nagad</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Total Withdrawn Out</span>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">৳{stats.totalWithdraws.toLocaleString()}</h3>
              <span className="text-[11px] text-slate-500">Dispatched payouts</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Pending Queue</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-base font-bold text-amber-400">{stats.pendingDepositsCount} Dep</span>
                <span className="text-slate-600">•</span>
                <span className="text-base font-bold text-rose-400">{stats.pendingWithdrawsCount} Wdr</span>
              </div>
              <span className="text-[11px] text-slate-500">Requires manual action</span>
            </div>
          </div>

          {/* Recharts Inflow / Outflow Visualizer */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Financial Traffic Overview (Last 7 Days)
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" textAnchor="middle" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="deposits" name="Deposits (TK)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="withdraws" name="Withdrawals (TK)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. FINANCE ENGINE MODULE */}
      {activeTab === 'finance' && (
        <div className="space-y-8">
          {/* Pending Deposits Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  Pending Deposits Queue ({pendingDeposits.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Approval adds funds directly to wallet balance. Does NOT activate packages!
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Gateway</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Sender Phone</th>
                    <th className="p-3">TrxID</th>
                    <th className="p-3">Proof</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">No pending deposits in queue.</td>
                    </tr>
                  ) : (
                    pendingDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-850">
                        <td className="p-3 font-bold text-emerald-400 text-sm">৳{dep.amount.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-white">{dep.paymentMethod}</td>
                        <td className="p-3 font-mono text-slate-300">{dep.assignedNumber}</td>
                        <td className="p-3 font-mono text-white">{dep.senderNumber}</td>
                        <td className="p-3 font-mono font-bold text-cyan-300">{dep.transactionId}</td>
                        <td className="p-3">
                          <a href={dep.screenshotUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                            View Proof
                          </a>
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          <button
                            onClick={() => handleApproveDeposit(dep.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(dep.id);
                              setRejectType('deposit');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Withdrawals Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-rose-400" />
                  Pending Withdrawals Queue ({pendingWithdraws.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Review withdrawal destination, mark paid with TrxID, or reject to refund wallet automatically.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Gross Amount</th>
                    <th className="p-3">Net (After 10%)</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Destination Mobile</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingWithdraws.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">No pending withdrawals in queue.</td>
                    </tr>
                  ) : (
                    pendingWithdraws.map((wdr) => (
                      <tr key={wdr.id} className="hover:bg-slate-850">
                        <td className="p-3 font-bold text-white">৳{wdr.amount.toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-400">৳{wdr.netAmount.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-300">{wdr.paymentMethod}</td>
                        <td className="p-3 font-mono font-bold text-white">{wdr.withdrawNumber}</td>
                        <td className="p-3 uppercase text-amber-400 font-bold text-[10px]">{wdr.status}</td>
                        <td className="p-3 flex items-center gap-2">
                          {wdr.status === 'pending' && (
                            <button
                              onClick={() => handleApproveWithdraw(wdr.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handlePayWithdraw(wdr.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                          >
                            Dispatch (Paid)
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(wdr.id);
                              setRejectType('withdraw');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs transition"
                          >
                            Reject & Refund
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Number Manager */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Payment Gateway Numbers Manager</h3>
            <form onSubmit={handleAddPaymentNumber} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={newPayMethod}
                onChange={(e) => setNewPayMethod(e.target.value as any)}
                className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold"
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
              </select>
              <input
                type="text"
                value={newPayNumber}
                onChange={(e) => setNewPayNumber(e.target.value)}
                placeholder="017xxxxxxxx"
                className="sm:col-span-2 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                + Add Number
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {paymentNumbers.map((num) => (
                <div key={num.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{num.method} ({num.type})</span>
                    <span className="font-mono font-bold text-white text-sm">{num.number}</span>
                    <span className="text-[10px] text-slate-500 block">Used: {num.usageCount} times</span>
                  </div>
                  <button
                    onClick={() => handleTogglePaymentNumber(num.id, num.isActive)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      num.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {num.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. USER MANAGEMENT MODULE */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white">Registered Users CRM</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search phone or ref code..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Ref Code</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Free Withdraw</th>
                  <th className="p-3">Device FP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850">
                    <td className="p-3 font-bold text-white font-mono">{u.phone}</td>
                    <td className="p-3 font-mono text-purple-400">{u.referralCode}</td>
                    <td className="p-3 text-slate-300 font-semibold">{u.role}</td>
                    <td className="p-3 text-emerald-400">{u.isTrial ? 'Free Trial' : 'Paid VIP'}</td>
                    <td className="p-3">
                      {u.isTrial ? (
                        <button
                          onClick={() => handleToggleFreeWithdraw(u)}
                          title="Click to toggle Free User withdraw permission"
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            u.freeWithdrawAllowed
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          {u.freeWithdrawAllowed ? '✓ Permitted' : '🔒 Blocked'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">VIP Paid</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[10px] truncate max-w-[120px]">{u.deviceFingerprint}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isBanned ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {u.isBanned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      {u.isTrial && (
                        <button
                          onClick={() => handleToggleFreeWithdraw(u)}
                          title="Grant or Revoke Free User Withdraw Permission"
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                            u.freeWithdrawAllowed
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950'
                              : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950'
                          }`}
                        >
                          {u.freeWithdrawAllowed ? 'Revoke' : 'Permit'}
                        </button>
                      )}
                      <button
                        onClick={() => setBalanceModalUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs"
                      >
                        Adjust Balance
                      </button>
                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          u.isBanned
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950'
                            : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TASK MANAGER MODULE */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Video Task Catalog</h3>
              <p className="text-xs text-slate-400">Strict 10-second duration required for all sponsor videos.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasksList.map((task) => (
              <div key={task.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <img src={task.thumbnailUrl} alt={task.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm truncate">{task.title}</h4>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{task.category}</span>
                    <span className="text-emerald-400 font-bold">৳{task.rewardAmount} TK</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4.5. PACKAGES MODULE */}
      {activeTab === 'packages' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">VIP Investment Packages Control</h3>
              <p className="text-xs text-slate-400">Modify package pricing, daily income yields, and enable/disable VIP tiers instantly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packagesList.map((pkg) => (
              <div key={pkg.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {pkg.name}
                  </span>
                  <button
                    onClick={() => handleUpdatePackage(pkg.id, { enabled: !pkg.enabled })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      pkg.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {pkg.enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Price (TK):</span>
                    <strong className="text-white font-mono">৳{pkg.price}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Daily Income:</span>
                    <strong className="text-emerald-400 font-mono">৳{pkg.dailyIncome}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Validity Days:</span>
                    <strong className="text-white font-mono">{pkg.validityDays} Days</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Videos / Day:</span>
                    <strong className="text-white font-mono">{pkg.videosPerDay}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex gap-2">
                  <button
                    onClick={() => {
                      const newPrice = prompt('Enter new price (TK):', pkg.price.toString());
                      if (newPrice !== null) {
                        const newDaily = prompt('Enter new daily income (TK):', pkg.dailyIncome.toString());
                        if (newDaily !== null) {
                          handleUpdatePackage(pkg.id, { price: Number(newPrice), dailyIncome: Number(newDaily) });
                        }
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Edit Package Rates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4.6. SLIDERS & MARQUEE MODULE */}
      {activeTab === 'sliders' && siteSettings && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-bold text-white">Marquee Ticker & Announcements</h3>
            <p className="text-xs text-slate-400">Update running announcement banner displayed across the member dashboard.</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRequest('/api/admin/settings', {
                  method: 'POST',
                  body: JSON.stringify(siteSettings),
                });
                showToast('success', 'Marquee Updated', 'Announcement ticker updated successfully live.');
              } catch (err: any) {
                showToast('error', 'Error', err.message);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Marquee Ticker Text (রানিং নোটিশ)</label>
              <textarea
                rows={3}
                value={(siteSettings as any).marqueeText || '🎉 Welcome to EarnHub BD V20 Enterprise! Instant bKash & Nagad automated deposits & fast payouts.'}
                onChange={(e) => setSiteSettings({ ...siteSettings, marqueeText: e.target.value } as any)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              Save Marquee Announcement
            </button>
          </form>
        </div>
      )}

      {/* 5. BROADCAST MODULE */}
      {activeTab === 'broadcast' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 max-w-2xl">
          <h3 className="text-lg font-bold text-white">Real-Time Notification Broadcast</h3>
          <p className="text-xs text-slate-400">
            Dispatches live Socket.IO push alerts and adds records to member notification center.
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Audience</label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              >
                <option value="all">Broadcast to All Users</option>
                {userList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.phone} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Alert Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Scheduled System Upgrade"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Alert Message</label>
              <textarea
                rows={3}
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Write message content here..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              Dispatch Broadcast Alert Now
            </button>
          </form>
        </div>
      )}

      {/* 6. SYSTEM SETTINGS MODULE */}
      {activeTab === 'settings' && siteSettings && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-white">Platform Settings & Operations</h3>
            <p className="text-xs text-slate-400">Updates live branding, WhatsApp support, and withdrawal controls.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={siteSettings.websiteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, websiteName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">WhatsApp Support Number</label>
                <input
                  type="text"
                  value={siteSettings.whatsappNumber}
                  onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Withdraw Start Hour (24h)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={siteSettings.withdrawStartHour}
                  onChange={(e) => setSiteSettings({ ...siteSettings, withdrawStartHour: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Withdraw End Hour (24h)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={siteSettings.withdrawEndHour}
                  onChange={(e) => setSiteSettings({ ...siteSettings, withdrawEndHour: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-xs block">Global Withdrawal Engine</span>
                <span className="text-[11px] text-slate-400">Emergency toggle to lock withdrawals across the platform</span>
              </div>
              <button
                type="button"
                onClick={() => setSiteSettings({ ...siteSettings, isWithdrawDisabled: !siteSettings.isWithdrawDisabled })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  siteSettings.isWithdrawDisabled
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {siteSettings.isWithdrawDisabled ? 'DISABLED (LOCKED)' : 'ACTIVE (OPEN)'}
              </button>
            </div>

            {/* Free User Withdrawal Permission Setting */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs block">Free User Withdrawal Permission (ফ্রি ইউজার উইথড্র অনুমতি)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    siteSettings.allowFreeUserWithdrawal
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {siteSettings.allowFreeUserWithdrawal ? 'Permission Enabled' : 'Restricted (Default)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                  সক্রিয় (Enabled) করলে সকল ফ্রি ইউজার স্বাভাবিকভাবে টাকা উইথড্র করতে পারবে। বন্ধ (Restricted) থাকলে ফ্রি ইউজারদের উইথড্র আটকে থাকবে এবং তাদের সাপোর্ট অথবা রেফারেল মেম্বারের সাথে যোগাযোগ করার নোটিশ দেখানো হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSiteSettings({ ...siteSettings, allowFreeUserWithdrawal: !siteSettings.allowFreeUserWithdrawal })}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  siteSettings.allowFreeUserWithdrawal
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                }`}
              >
                {siteSettings.allowFreeUserWithdrawal ? '✅ ENABLED (অনুমোদিত)' : '🔒 RESTRICTED (বন্ধ)'}
              </button>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              {savingSettings ? 'Saving Settings...' : 'Save & Propagate Platform Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h4 className="font-bold text-white text-base">
              Reject {rejectType === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is rejected..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={rejectType === 'deposit' ? handleRejectDeposit : handleRejectWithdraw}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjust Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h4 className="font-bold text-white text-base">Adjust User Balance</h4>
            <p className="text-xs text-slate-400">User: {balanceModalUser.phone}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBalanceActionType('add')}
                className={`py-2 rounded-xl text-xs font-bold ${
                  balanceActionType === 'add'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                + Credit Balance
              </button>
              <button
                type="button"
                onClick={() => setBalanceActionType('subtract')}
                className={`py-2 rounded-xl text-xs font-bold ${
                  balanceActionType === 'subtract'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                - Debit Balance
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Amount (TK)</label>
              <input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBalanceModalUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjust}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
