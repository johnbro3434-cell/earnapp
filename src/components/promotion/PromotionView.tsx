import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, CheckCircle2, ArrowRight, Tag } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PromotionCampaign } from '../../types';

export function PromotionView() {
  const { wallet, refreshUserData } = useAuth();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    apiRequest('/api/promotions')
      .then((res) => setCampaigns(res.campaigns || []))
      .catch((e) => console.warn(e));
  }, []);

  const handleClaimPromo = async (codeToClaim: string) => {
    if (!codeToClaim) {
      showToast('error', 'প্রমো কোড দিন', 'অনুগ্রহ করে একটি সঠিক প্রমো কোড লিখুন।');
      return;
    }

    try {
      setClaiming(true);
      const res = await apiRequest('/api/promotions/claim-code', {
        method: 'POST',
        body: JSON.stringify({ code: codeToClaim.trim().toUpperCase() }),
      });

      showToast('success', 'প্রমো বোনাস ক্রেডিট হয়েছে!', `৳${res.rewardAmount} আপনার ওয়ালেট ব্যালেন্সে যোগ করা হয়েছে!`);
      setPromoCodeInput('');
      await refreshUserData();
    } catch (err: any) {
      showToast('error', 'প্রমো কোড ব্যর্থ', err.message || 'প্রমো কোডটি সঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে।');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div id="promotion-view-root" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Exclusive Member Rewards
            </span>
            <h2 className="text-2xl font-black text-white">Promotions & Gift Bonuses</h2>
            <p className="text-xs text-slate-400">
              Redeem official promo codes and claim active festive reward drops directly into your wallet.
            </p>
          </div>

          {/* Quick Code Claim Input */}
          <div className="w-full md:w-auto flex gap-2">
            <input
              id="input-promo-code"
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              placeholder="ENTER PROMO CODE"
              className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm uppercase focus:border-amber-500 focus:outline-none"
            />
            <button
              id="btn-claim-promo"
              onClick={() => handleClaimPromo(promoCodeInput)}
              disabled={claiming}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {claiming ? 'Verifying...' : 'Redeem'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Promotion Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            No active promotional campaigns currently.
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={camp.bannerUrl}
                  alt={camp.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 bg-amber-500/90 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow">
                  Bonus: ৳{camp.rewardAmount} TK
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{camp.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{camp.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-white">{camp.code}</span>
                  </div>
                  <button
                    onClick={() => handleClaimPromo(camp.code)}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Claim ৳{camp.rewardAmount} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
