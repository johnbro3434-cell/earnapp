import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Link2,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export function ReferralView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<any>(null);
  const [activeLevelTab, setActiveLevelTab] = useState<'A' | 'B' | 'C'>('A');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    apiRequest('/api/referral/team')
      .then((res) => setReferralData(res))
      .catch((e) => console.warn('Referral team error:', e))
      .finally(() => setLoading(false));
  }, []);

  const referralLink = `${window.location.origin}?ref=${user?.referralCode || ''}`;
  const shareMessage = `EarnHub BD V20 Enterprise এ আমার রেফারেল কোড (${user?.referralCode}) দিয়ে যুক্ত হয়ে প্রতিদিন ভিডিও দেখে আয় করুন! রেজিস্ট্রেশন লিংক: ${referralLink}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('success', 'Copied!', 'Referral link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    showToast('success', 'Copied!', 'Referral code copied.');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EarnHub BD V20 Enterprise Invitation',
          text: `Join EarnHub BD using my referral code ${user?.referralCode} and start earning today! (রেফারেল কোড ছাড়া রেজিস্ট্রেশন করা যায় না)`,
          url: referralLink,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyLink();
        }
      }
    } else {
      copyLink();
    }
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join EarnHub BD using sponsor code: ${user?.referralCode}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentLevelMembers =
    activeLevelTab === 'A'
      ? referralData?.levelA || []
      : activeLevelTab === 'B'
      ? referralData?.levelB || []
      : referralData?.levelC || [];

  return (
    <div id="referral-view-root" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header Box */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
              Enterprise 3-Tier Affiliate System
            </span>
            <h2 className="text-2xl font-black text-white">Team & Commission Center</h2>
            <p className="text-xs text-slate-400">
              Build your 3-Tier team network to receive daily video watch commissions and direct package bonuses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invitation</span>
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Highlight Notice: Referral Code Mandatory */}
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-xs text-purple-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>রেজিস্ট্রেশনের জন্য রেফার কোড বাধ্যতামূলক:</strong> আপনার ইনভাইট লিংকে ক্লিক করে একাউন্ট খুললে আপনার রেফার কোড স্বয়ংক্রিয়ভাবে বসে যাবে।
            </span>
          </div>
        </div>

        {/* Referral Credentials Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Referral Code Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Your Referral Code (রেফার কোড)</span>
              <span className="text-lg font-mono font-black text-purple-400 tracking-wider">{user?.referralCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Referral Link Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <div className="truncate flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Your Invitation Link (রেফারেল লিংক)</span>
              <span className="text-xs text-slate-300 font-mono truncate block mt-0.5">{referralLink}</span>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0 transition cursor-pointer"
              title="Copy Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Share via Social Apps (সরাসরি শেয়ার করুন)
          </span>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={shareToTelegram}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Send className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Share on Telegram</span>
            </button>

            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Share on Facebook</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Share2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>More Options</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Rates & Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveLevelTab('A')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeLevelTab === 'A'
              ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Level A (Direct)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
              10% Commission
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">
              {referralData?.levelA?.length || 0} Members
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">
              Active Paid: {referralData?.levelA?.filter((m: any) => m.hasActivePackage).length || 0}
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveLevelTab('B')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeLevelTab === 'B'
              ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Level B (Sub-Team)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
              5% Commission
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">
              {referralData?.levelB?.length || 0} Members
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">Invited by your Level A team</span>
          </div>
        </div>

        <div
          onClick={() => setActiveLevelTab('C')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeLevelTab === 'C'
              ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Level C (Extended)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
              2% Commission
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">
              {referralData?.levelC?.length || 0} Members
            </h3>
            <span className="text-[11px] text-slate-400 block mt-1">Invited by your Level B team</span>
          </div>
        </div>
      </div>

      {/* Team Member Tree Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Level {activeLevelTab} Team Tree ({currentLevelMembers.length} Members)
          </h3>
          <span className="text-xs text-slate-400">
            Commission Rate: {activeLevelTab === 'A' ? '10%' : activeLevelTab === 'B' ? '5%' : '2%'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Member Mobile</th>
                <th className="p-3">Rank / Status</th>
                <th className="p-3">Active Tier</th>
                <th className="p-3">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentLevelMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No registered members in Level {activeLevelTab} yet. Share your invitation link!
                  </td>
                </tr>
              ) : (
                currentLevelMembers.map((member: any) => (
                  <tr key={member.id} className="hover:bg-slate-850/50">
                    <td className="p-3 font-semibold text-white">
                      {member.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        member.hasActivePackage
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {member.hasActivePackage ? 'Active Paid' : 'Trial / Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">
                      {member.packageName || (member.isTrial ? 'Free Trial' : 'None')}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
