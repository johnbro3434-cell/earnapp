import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, Check, ShieldCheck, Zap, Sparkles, ArrowRight, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Package } from '../../types';

interface PackagesViewProps {
  onNavigate: (view: string) => void;
}

export function PackagesView({ onNavigate }: PackagesViewProps) {
  const { user, wallet, activePackage, refreshUserData } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    apiRequest('/api/packages')
      .then((res) => setPackages(res.packages || []))
      .catch((e) => console.warn('Packages error:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleBuyPackage = async (pkg: Package) => {
    if (!wallet || wallet.balance < pkg.price) {
      showToast(
        'error',
        'অপর্যাপ্ত ব্যালেন্স',
        `এই প্যাকেজটি কেনার জন্য আপনার ওয়ালেটে ৳${pkg.price.toLocaleString()} টাকা প্রয়োজন। অনুগ্রহ করে প্রথমে ডিপোজিট করুন।`
      );
      onNavigate('wallet');
      return;
    }

    try {
      setPurchasingId(pkg.id);
      await apiRequest('/api/packages/purchase', {
        method: 'POST',
        body: JSON.stringify({ packageId: pkg.id }),
      });

      showToast(
        'success',
        'প্যাকেজ সক্রিয় হয়েছে!',
        `অভিনন্দন! আপনার ${pkg.name} প্যাকেজ সফলভাবে চালু হয়েছে (প্রতিদিন ${pkg.videosPerDay}টি ভিডিও টাস্ক)।`
      );
      await refreshUserData();
    } catch (err: any) {
      showToast('error', 'প্যাকেজ ক্রয় ব্যর্থ', err.message || 'প্যাকেজ সক্রিয় করা যায়নি।');
    } finally {
      setPurchasingId(null);
    }
  };

  const getTierColor = (name: string) => {
    switch (name) {
      case 'Bronze':
        return {
          border: 'border-amber-700/50 hover:border-amber-600',
          bg: 'bg-gradient-to-b from-slate-900 to-amber-950/20',
          badge: 'bg-amber-700/20 text-amber-300 border-amber-700/40',
          btn: 'bg-amber-600 hover:bg-amber-500 text-white',
        };
      case 'Golden':
        return {
          border: 'border-amber-500/50 hover:border-amber-400',
          bg: 'bg-gradient-to-b from-slate-900 to-amber-950/30',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
        };
      case 'Diamond':
        return {
          border: 'border-cyan-500/50 hover:border-cyan-400',
          bg: 'bg-gradient-to-b from-slate-900 to-cyan-950/30',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          btn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold',
        };
      case 'Platinum':
        return {
          border: 'border-purple-500/50 hover:border-purple-400',
          bg: 'bg-gradient-to-b from-slate-900 to-purple-950/30',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          btn: 'bg-purple-500 hover:bg-purple-400 text-white font-bold',
        };
      default:
        return {
          border: 'border-slate-800',
          bg: 'bg-slate-900',
          badge: 'bg-slate-800 text-slate-300',
          btn: 'bg-emerald-500 text-slate-950',
        };
    }
  };

  return (
    <div id="packages-view-root" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Authorized Member Tiers
            </span>
            <span className="text-xs text-slate-400 font-medium">365 Days Validity</span>
          </div>
          <h2 className="text-2xl font-black text-white">Membership Packages</h2>
          <p className="text-xs text-slate-400">
            Packages are purchased strictly with your verified wallet balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Your Wallet</span>
              <span className="text-sm font-black text-white">৳ {(wallet?.balance || 0).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('wallet')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            + Add Funds
          </button>
        </div>
      </div>

      {/* Package Cards Grid (Locked Specifications) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const colors = getTierColor(pkg.name);
          const isCurrentActive = activePackage?.id === pkg.id;
          const isLowerTier = activePackage && activePackage.price > pkg.price;

          return (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -4 }}
              className={`rounded-3xl border p-6 flex flex-col justify-between shadow-xl transition-all ${colors.border} ${colors.bg}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${colors.badge}`}>
                    {pkg.name}
                  </span>
                  {isCurrentActive && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950 shadow">
                      Current
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Package Price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">৳{pkg.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">/ 365 Days</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Guaranteed Daily Return</span>
                  <span className="text-xl font-bold text-emerald-400">৳{pkg.dailyIncome} TK / Day</span>
                  <span className="text-[10px] text-slate-500 block">
                    (৳{pkg.incomePerVideo} TK x {pkg.videosPerDay} videos)
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{pkg.videosPerDay} Video Tasks Daily (10s each)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>365 Days Guaranteed Validity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3-Tier Referral Commissions (10%-5%-2%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Manager Salary Eligibility</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {isCurrentActive ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Active Package</span>
                  </button>
                ) : isLowerTier ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl bg-slate-800 text-slate-500 font-semibold text-xs cursor-not-allowed"
                  >
                    Lower Tier Locked
                  </button>
                ) : (
                  <button
                    id={`btn-buy-package-${pkg.name.toLowerCase()}`}
                    onClick={() => handleBuyPackage(pkg)}
                    disabled={purchasingId === pkg.id}
                    className={`w-full py-3 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${colors.btn}`}
                  >
                    {purchasingId === pkg.id ? (
                      'Activating...'
                    ) : (
                      <>
                        <span>Activate {pkg.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
