import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Phone,
  Calendar,
  Smartphone,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Check,
  Share2,
  Link2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDeviceFingerprint } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export function MyAccountView() {
  const { user, wallet, logout } = useAuth();
  const { showToast } = useToast();
  const deviceFp = getDeviceFingerprint();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode || ''}` : '';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('success', 'রেফারেল লিংক কপি সম্পন্ন!', 'বন্ধুদের সাথে শেয়ার করে রেফারেল বোনাস উপার্জন করুন!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    showToast('success', 'রেফার কোড কপি সম্পন্ন!', `রেফার কোড: ${user.referralCode}`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = async () => {
    if (!user) return;
    const text = `Join EarnHub BD using my referral code ${user.referralCode} and start earning daily! (রেজিস্ট্রেশনের জন্য রেফার কোড আবশ্যক): ${referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EarnHub BD Invitation',
          text,
          url: referralLink,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div id="my-account-view-root" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Profile Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {user?.phone ? user.phone.slice(-4) : 'USER'}
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">{user?.phone}</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {user?.role || 'Member'}
            </span>
            {user?.isTrial && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Trial Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Referral Code: <span className="text-purple-400 font-bold">{user?.referralCode}</span>
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 font-bold text-xs transition active:scale-95 cursor-pointer min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Referral Link & Share Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Your Referral Link & Sharing
          </h3>
          <button
            onClick={handleShare}
            className="w-full xs:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition active:scale-95 cursor-pointer min-h-[40px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Invitation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Your Referral Code (রেফার কোড)</span>
              <span className="font-mono font-bold text-base text-purple-400">{user?.referralCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <div className="truncate flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Your Referral Link (রেফারেল লিংক)</span>
              <span className="font-mono text-slate-300 truncate block text-[11px] mt-0.5">{referralLink}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Device & Security */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Security & Device Verification
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Account Phone:</span>
              <span className="font-mono font-bold text-white">{user?.phone}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Device Fingerprint:</span>
              <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">{deviceFp}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Registration Date:</span>
              <span className="text-slate-300">
                {user ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Device Free Trial Status:</span>
              <span className={`font-semibold ${user?.deviceUsedFreeTrial ? 'text-amber-400' : 'text-emerald-400'}`}>
                {user?.deviceUsedFreeTrial ? 'Used Once (Locked)' : 'Eligible'}
              </span>
            </div>
          </div>
        </div>

        {/* Permanent Withdraw Setup Details */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            Permanent Withdraw Destination
          </h3>

          {user?.withdrawSetupDone ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-bold text-white">{user.withdrawMethod}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Registered Withdraw Number:</span>
                <span className="font-mono font-bold text-emerald-400">{user.withdrawNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Withdraw Password Protection:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Active & Locked
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Notice: In accordance with anti-fraud rules, withdrawal credentials cannot be changed.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">Withdraw credentials not configured yet.</p>
              <p className="text-[11px] text-slate-500">
                You can setup your one-time permanent withdraw method when submitting your first withdrawal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
