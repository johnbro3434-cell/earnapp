import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Tag,
  Eye,
  X,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { WithdrawCard } from '../../types';

export function WithdrawCardsTab() {
  const { showToast } = useToast();
  const [cards, setCards] = useState<WithdrawCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<WithdrawCard | null>(null);

  // Form Fields
  const [amount, setAmount] = useState<number>(460);
  const [label, setLabel] = useState<string>('');
  const [badge, setBadge] = useState<string>('POPULAR');
  const [badgeColor, setBadgeColor] = useState<'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'blue'>('emerald');
  const [order, setOrder] = useState<number>(1);
  const [isTrialAllowed, setIsTrialAllowed] = useState<boolean>(false);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/withdraw-cards');
      if (res && res.withdrawCards) {
        setCards(res.withdrawCards);
      }
    } catch (err: any) {
      showToast('error', 'লোড করতে ব্যর্থ', err.message || 'উইথড্র কার্ড তালিকা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const openCreateModal = () => {
    setEditingCard(null);
    setAmount(1000);
    setLabel('কাস্টম পেআউট কার্ড');
    setBadge('NEW');
    setBadgeColor('emerald');
    setOrder(cards.length + 1);
    setIsTrialAllowed(false);
    setEnabled(true);
    setDescription('ব্যবহারকারীদের জন্য উইথড্র কার্ড');
    setShowModal(true);
  };

  const openEditModal = (card: WithdrawCard) => {
    setEditingCard(card);
    setAmount(card.amount);
    setLabel(card.label || '');
    setBadge(card.badge || '');
    setBadgeColor(card.badgeColor || 'emerald');
    setOrder(card.order || 1);
    setIsTrialAllowed(Boolean(card.isTrialAllowed));
    setEnabled(card.enabled);
    setDescription(card.description || '');
    setShowModal(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      showToast('error', 'ভুল পরিমাণ', 'সঠিক পজিটিভ উইথড্র পরিমাণ (TK) প্রদান করুন।');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        amount,
        label: label.trim() || `৳${amount} পেআউট কার্ড`,
        badge: badge.trim(),
        badgeColor,
        order: Number(order) || 1,
        isTrialAllowed,
        enabled,
        description: description.trim(),
      };

      if (editingCard) {
        await apiRequest(`/api/admin/withdraw-cards/${editingCard.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('success', 'আপডেট সফল', `৳${amount} টাকার উইথড্র কার্ড সফলভাবে আপডেট হয়েছে।`);
      } else {
        await apiRequest('/api/admin/withdraw-cards', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'তৈরি সম্পন্ন', `৳${amount} টাকার নতুন উইথড্র কার্ড সফলভাবে যুক্ত হয়েছে।`);
      }

      setShowModal(false);
      fetchCards();
    } catch (err: any) {
      showToast('error', 'অপারেশন ব্যর্থ', err.message || 'উইথড্র কার্ড সংরক্ষণ করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (card: WithdrawCard) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ৳${card.amount} টাকার কার্ডটি ডিলিট করতে চান?`)) {
      return;
    }

    try {
      await apiRequest(`/api/admin/withdraw-cards/${card.id}`, {
        method: 'DELETE',
      });
      showToast('success', 'ডিলিট সম্পন্ন', `৳${card.amount} টাকার কার্ডটি মুছে ফেলা হয়েছে।`);
      fetchCards();
    } catch (err: any) {
      showToast('error', 'ডিলিট ব্যর্থ', err.message || 'কার্ডটি মোছা যায়নি।');
    }
  };

  const handleToggleCard = async (card: WithdrawCard) => {
    try {
      await apiRequest(`/api/admin/withdraw-cards/${card.id}/toggle`, {
        method: 'POST',
      });
      showToast(
        'info',
        'স্ট্যাটাস পরিবর্তন',
        `৳${card.amount} টাকার কার্ডটি ${!card.enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে।`
      );
      fetchCards();
    } catch (err: any) {
      showToast('error', 'ব্যর্থ', err.message || 'স্ট্যাটাস আপডেট করা যায়নি।');
    }
  };

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'cyan':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'blue':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'emerald':
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const activeCount = cards.filter((c) => c.enabled).length;
  const minCard = cards.length ? Math.min(...cards.map((c) => c.amount)) : 0;
  const maxCard = cards.length ? Math.max(...cards.map((c) => c.amount)) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Withdrawal Amount Cards Management
              </h2>
              <p className="text-xs text-slate-400">
                Create, edit, activate/deactivate, and delete withdrawal denomination cards shown to users in the Wallet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchCards}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-add-withdraw-card"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কার্ড তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">মোট কার্ড</span>
          <span className="text-xl font-bold text-white">{cards.length} টি</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">সক্রিয় কার্ড</span>
          <span className="text-xl font-bold text-emerald-400">{activeCount} টি</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">সর্বনিম্ন পেআউট</span>
          <span className="text-xl font-bold text-cyan-400">৳ {minCard.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">সর্বোচ্চ পেআউট</span>
          <span className="text-xl font-bold text-amber-400">৳ {maxCard.toLocaleString()}</span>
        </div>
      </div>

      {/* Live Visual Preview of Cards (As shown on User's Wallet) */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            Live Preview (ইউজার ওয়ালেটে যেভাবে প্রদর্শিত হবে)
          </h3>
          <span className="text-[11px] text-slate-400">10% Platform Fee Calculated Automatically</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map((c) => {
            const netAmount = c.amount * 0.9;
            return (
              <div
                key={c.id}
                className={`relative p-4 rounded-2xl border transition flex flex-col justify-between overflow-hidden ${
                  c.enabled
                    ? 'bg-slate-950/90 border-slate-700/80 shadow-md hover:border-emerald-500/60'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-50 grayscale'
                }`}
              >
                {/* Badge & Order */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">#{c.order}</span>
                  {c.badge && (
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${getBadgeStyle(
                        c.badgeColor
                      )}`}
                    >
                      {c.badge}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div className="my-1">
                  <span className="text-xs text-slate-400 font-medium block truncate">{c.label || 'Payout Card'}</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight flex items-baseline gap-1">
                    <span className="text-sm font-bold text-emerald-500">৳</span>
                    <span>{c.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Net Breakdown */}
                <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Net Receive:</span>
                  <span className="font-bold text-white">৳ {netAmount.toLocaleString()}</span>
                </div>

                {/* Status Indicator */}
                {!c.enabled && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 rounded-lg">
                      Disabled
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards Data Table with CRUD Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Withdrawal Cards List ({cards.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="p-3.5 pl-4">Order</th>
                <th className="p-3.5">Amount (TK)</th>
                <th className="p-3.5">Card Title</th>
                <th className="p-3.5">Badge & Theme</th>
                <th className="p-3.5">Net Receive (90%)</th>
                <th className="p-3.5">Free Trial Allowed</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 pl-4 font-mono text-slate-400 font-bold">{card.order}</td>
                  <td className="p-3.5">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      ৳ {card.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3.5 text-white font-medium">{card.label || `৳${card.amount} কার্ড`}</td>
                  <td className="p-3.5">
                    {card.badge ? (
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(
                          card.badgeColor
                        )}`}
                      >
                        {card.badge}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-slate-200">
                    ৳ {(card.amount * 0.9).toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-500">(Fee: ৳{card.amount * 0.1})</span>
                  </td>
                  <td className="p-3.5">
                    {card.isTrialAllowed ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        Yes (ফ্রি ট্রায়াল)
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">VIP Only</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleCard(card)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                        card.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${card.enabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{card.enabled ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCard ? 'উইথড্র কার্ড সম্পাদনা' : 'নতুন উইথড্র কার্ড তৈরি'}
                  </h3>
                  <p className="text-xs text-slate-400">কনফিগার করুন উইথড্রল পরিমাণ ও ব্যাজ স্টাইল</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    উইথড্র পরিমাণ (TK) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    placeholder="যেমন: 460"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Net: ৳{(amount * 0.9).toLocaleString()} (10% ফি কর্তন)
                  </span>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    ডিসপ্লে ক্রম (Order)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Title / Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  কার্ড শিরোনাম (Title / Label)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="যেমন: স্ট্যান্ডার্ড পেআউট / মিনি ক্যাশআউট"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Badge Text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    ব্যাজ টেক্সট (Badge Text)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="যেমন: POPULAR / HOT / VIP ONLY"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm uppercase tracking-wider focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Badge Color Theme */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    ব্যাজ থিম কালার
                  </label>
                  <select
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="emerald">Emerald (সবুজ)</option>
                    <option value="amber">Amber (সোনালী)</option>
                    <option value="purple">Purple (বেগুনি)</option>
                    <option value="rose">Rose (গোলাপি/লাল)</option>
                    <option value="cyan">Cyan (আকাশি)</option>
                    <option value="blue">Blue (নীল)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  কার্ড বিবরণ (Description)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: দ্রুত প্রসেসিং সম্পন্ন নিয়মিত পেআউট কার্ড"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTrialAllowed}
                    onChange={(e) => setIsTrialAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">ফ্রি ট্রায়াল অনুমোদন</span>
                    <span className="text-[10px] text-slate-400">ফ্রি ইউজাররা এই কার্ড ব্যবহার করতে পারবে</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">কার্ড সক্রিয় রাখুন (Active)</span>
                    <span className="text-[10px] text-slate-400">ওয়ালেটে ইউজারদের কাছে দৃশ্যমান হবে</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950 transition cursor-pointer"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingCard ? 'আপডেট করুন' : 'কার্ড যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
