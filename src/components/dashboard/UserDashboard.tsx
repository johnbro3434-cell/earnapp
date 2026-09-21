import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PlaySquare,
  Users,
  Sparkles,
  Gift,
  Bell,
  User as UserIcon,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Copy,
  Check,
  Share2,
  Link2,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface UserDashboardProps {
  onNavigate: (view: string) => void;
}

export function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { user, wallet, activePackage, settings } = useAuth();
  const { showToast } = useToast();
  const [taskData, setTaskData] = useState<any>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0);

  useEffect(() => {
    // Fetch today tasks progress
    apiRequest('/api/tasks/today')
      .then((data) => setTaskData(data))
      .catch((e) => console.warn('Task data fetch error:', e));

    // Fetch active promotions
    apiRequest('/api/promotions')
      .then((data) => setCampaigns(data.campaigns || []))
      .catch((e) => console.warn('Promotions fetch error:', e));

    // Fetch recent notifications
    apiRequest('/api/notifications')
      .then((data) => setNotifications((data.notifications || []).slice(0, 3)))
      .catch((e) => console.warn('Notifications fetch error:', e));
  }, []);

  const adminSlides = [
    {
      id: 1,
      title: 'Mega 15% bKash & Nagad Deposit Bonus',
      tag: 'Limited Ramadan Offer',
      desc: 'Top up your wallet today with 2,500 TK or more to receive an instant 15% top-up bonus!',
      badgeColor: 'emerald',
      action: 'wallet',
    },
    {
      id: 2,
      title: 'Upgrade to Golden or Diamond Tier',
      tag: 'Earn Up To 750 TK Daily',
      desc: 'Watch up to 15 video tasks daily (10s each) with lifetime 3-tier referral commissions.',
      badgeColor: 'amber',
      action: 'packages',
    },
  ];

  const handleCopyReferral = () => {
    if (!user) return;
    const link = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedRef(true);
    showToast('success', 'Referral Link Copied', 'Share with friends to earn Level A 10% commission!');
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleCopyCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    showToast('success', 'Referral Code Copied', user.referralCode);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = async () => {
    if (!user) return;
    const link = `${window.location.origin}?ref=${user.referralCode}`;
    const text = `Join EarnHub BD using my referral code ${user.referralCode} and start earning daily! (রেজিস্ট্রেশনের জন্য রেফার কোড আবশ্যক): ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EarnHub BD Invitation',
          text,
          url: link,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyReferral();
        }
      }
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const quickGridItems = [
    { id: 'tasks', label: 'Tasks', icon: PlaySquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { id: 'referral', label: 'Referral', icon: Users, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'promotion', label: 'Promotion', icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'salary', label: 'Salary', icon: TrendingUp, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { id: 'account', label: 'My Account', icon: UserIcon, color: 'text-slate-300 bg-slate-700/20 border-slate-600/30' },
  ];

  return (
    <div id="user-dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* 1. ADMIN CONTROLLED SLIDER */}
      <div id="section-admin-slider" className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {adminSlides[sliderIndex].tag}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {adminSlides[sliderIndex].title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {adminSlides[sliderIndex].desc}
            </p>
          </div>
          <button
            onClick={() => onNavigate(adminSlides[sliderIndex].action)}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer min-h-[44px]"
          >
            <span>Explore Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2 & 3. WALLET SUMMARY & TODAY'S INCOME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Wallet Balance */}
        <div id="card-wallet-balance" className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallet Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ৳ {(wallet?.balance || 0).toLocaleString()}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => onNavigate('wallet')}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                + Deposit Funds
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => onNavigate('withdraw')}
                className="text-xs font-semibold text-rose-400 hover:underline flex items-center gap-0.5"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Today's Income */}
        <div id="card-today-income" className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Income</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-teal-400 tracking-tight">
              ৳ {(wallet?.todayIncome || 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">Resets daily at 12:00 AM midnight</p>
          </div>
        </div>

        {/* 4. ACTIVE PACKAGE */}
        <div id="card-active-package" className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Package</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              {user?.isTrial ? 'Trial Tier' : 'VIP Active'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white">
              {activePackage?.name || (user?.isTrial ? 'Free Trial (4-Days)' : 'None')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activePackage
                ? `${activePackage.videosPerDay} Videos/day • ৳${activePackage.dailyIncome} Daily`
                : 'Purchase package with wallet balance to start'}
            </p>
            <button
              onClick={() => onNavigate('packages')}
              className="mt-2 text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Upgrade Package <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 5. TODAY'S TASK PROGRESS */}
        <div id="card-task-progress" className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Progress</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PlaySquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-white">
                {taskData?.completedCount ?? 0} / {taskData?.totalAllowed ?? (activePackage?.videosPerDay || 1)} Videos
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {taskData?.totalAllowed
                  ? Math.round(((taskData.completedCount || 0) / taskData.totalAllowed) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    taskData?.totalAllowed
                      ? Math.min(100, ((taskData.completedCount || 0) / taskData.totalAllowed) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
            >
              Watch Video Tasks (10s) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Free Trial Banner Alert if on active trial */}
      {user?.isTrial && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyan-200">
                Active Free Trial (Day {user.trialDaysUsed + 1} of 4)
              </p>
              <p className="text-xs text-cyan-400/80">
                Earned ৳{user.trialTotalEarned} / ৳100. Withdraw permitted at 100 TK once per device.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 active:scale-95 transition min-h-[40px] flex items-center justify-center"
          >
            Start Task
          </button>
        </div>
      )}

      {/* 6. QUICK GRID MENU */}
      <div id="section-quick-grid" className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
          {quickGridItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`btn-quick-grid-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-95 transition group cursor-pointer min-h-[72px] sm:min-h-[80px]"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border mb-1.5 transition group-hover:scale-105 shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors text-center truncate max-w-full block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. PROMOTION BANNER */}
      {campaigns.length > 0 && (
        <div id="section-promotion-banner" className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Featured Campaign</span>
                <h4 className="text-base font-bold text-white">{campaigns[0].title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{campaigns[0].description}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('promotion')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
            >
              Claim Promotion
            </button>
          </div>
        </div>
      )}

      {/* 8 & 9. RECENT NOTIFICATIONS & REFERRAL SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8. Recent Notifications */}
        <div id="section-recent-notifications" className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Recent Alerts
            </h4>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-400"
            >
              View All
            </button>
          </div>
          <div className="space-y-2.5">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No alerts to display.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex flex-col gap-0.5">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 9. Referral Summary & Sharing Hub */}
        <div id="section-referral-summary" className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Referral Invitation Center
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30 transition cursor-pointer"
                title="Share Invitation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={() => onNavigate('referral')}
                className="text-xs font-semibold text-purple-400 hover:underline"
              >
                Team Tree
              </button>
            </div>
          </div>

          {/* Referral Code Row */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Your Referral Code (রেফার কোড)</span>
              <span className="text-base font-mono font-bold text-purple-400">{user?.referralCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Referral Link Row */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <div className="truncate flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Your Referral Link (রেফারেল লিংক)</span>
              <span className="text-xs text-slate-300 font-mono truncate block mt-0.5">
                {typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode || ''}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyReferral}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>নতুন রেজিস্ট্রেশনের জন্য রেফার কোড আবশ্যক। ইনভাইট লিংক শেয়ার করলে কোড অটো যুক্ত হবে।</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-xs text-slate-500 block">Level A (10%)</span>
              <span className="text-sm font-bold text-white">Direct</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-xs text-slate-500 block">Level B (5%)</span>
              <span className="text-sm font-bold text-white">Sub-Team</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-xs text-slate-500 block">Level C (2%)</span>
              <span className="text-sm font-bold text-white">Extended</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
