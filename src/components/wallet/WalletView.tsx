import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Upload,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Lock,
  Phone,
  Layers,
  History,
  Info,
  MessageCircle,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, getDeviceFingerprint } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { DepositRequest, WithdrawRequest, Transaction, PaymentNumber, WithdrawCard } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface WalletViewProps {
  initialTab?: 'overview' | 'deposit' | 'withdraw' | 'passbook' | 'tracker';
  onNavigate?: (view: string) => void;
}

export function WalletView({ initialTab = 'overview', onNavigate }: WalletViewProps) {
  const { user, wallet, settings, refreshUserData } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'passbook' | 'deposit-history' | 'withdraw-history' | 'tracker'>(initialTab);

  // Free User Withdrawal Logic
  const isFreeUser = Boolean(user?.isTrial || !user?.activePackageId || user?.activePackageId === 'pkg_trial');
  const isFreeWithdrawPermitted = Boolean(settings?.allowFreeUserWithdrawal || user?.freeWithdrawAllowed);
  const isFreeWithdrawBlocked = isFreeUser && !isFreeWithdrawPermitted;
  const [showFreeWithdrawModal, setShowFreeWithdrawModal] = useState(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number | ''>(1000);
  const [depositMethod, setDepositMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [assignedNumber, setAssignedNumber] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>(
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80'
  );
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [copiedAssigned, setCopiedAssigned] = useState(false);

  // Withdraw Form State
  const [selectedWithdrawCard, setSelectedWithdrawCard] = useState<number>(user?.isTrial ? 100 : 460);
  const [dynamicWithdrawCards, setDynamicWithdrawCards] = useState<WithdrawCard[]>([]);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Withdraw Setup (Once only) State
  const [setupMethod, setSetupMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [setupNumber, setSetupNumber] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSubmitting, setSetupSubmitting] = useState(false);

  // Histories & Passbook
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    // Load payment numbers
    apiRequest('/api/wallet/payment-numbers')
      .then((res) => {
        const nums = res.paymentNumbers || [];
        setPaymentNumbers(nums);
        const match = nums.find((n: PaymentNumber) => n.method === depositMethod);
        if (match) setAssignedNumber(match.number);
      })
      .catch((e) => console.warn(e));

    // Load dynamic withdraw denomination cards
    apiRequest('/api/withdraw-cards')
      .then((res) => {
        if (res && res.withdrawCards && res.withdrawCards.length > 0) {
          setDynamicWithdrawCards(res.withdrawCards);
          const activeList = res.withdrawCards;
          if (user?.isTrial) {
            const trialCard = activeList.find((c: WithdrawCard) => c.isTrialAllowed || c.amount === 100);
            if (trialCard) {
              setSelectedWithdrawCard(trialCard.amount);
            } else if (activeList[0]) {
              setSelectedWithdrawCard(activeList[0].amount);
            }
          } else {
            const defaultPaid = activeList.find((c: WithdrawCard) => !c.isTrialAllowed && c.amount >= 460) || activeList[0];
            if (defaultPaid) {
              setSelectedWithdrawCard(defaultPaid.amount);
            }
          }
        }
      })
      .catch((e) => console.warn('Withdraw cards load error:', e));

    loadHistories();
  }, [user?.isTrial]);

  useEffect(() => {
    const match = paymentNumbers.find((n) => n.method === depositMethod);
    if (match) {
      setAssignedNumber(match.number);
    }
  }, [depositMethod, paymentNumbers]);

  const loadHistories = async () => {
    try {
      setLoadingData(true);
      const [txRes, depRes, wdrRes] = await Promise.all([
        apiRequest('/api/wallet/passbook'),
        apiRequest('/api/wallet/deposit-history'),
        apiRequest('/api/wallet/withdraw-history'),
      ]);
      setTransactions(txRes.transactions || []);
      setDeposits(depRes.deposits || []);
      setWithdraws(wdrRes.withdraws || []);
    } catch (e) {
      console.warn('History load error:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCopyAssigned = () => {
    if (!assignedNumber) return;
    navigator.clipboard.writeText(assignedNumber);
    setCopiedAssigned(true);
    showToast('success', 'কপি সম্পন্ন!', `${depositMethod} নম্বরটি ক্লিপবোর্ডে কপি করা হয়েছে।`);
    setTimeout(() => setCopiedAssigned(false), 2500);
  };

  // Submit Deposit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt < 100 || amt > 25000) {
      showToast('error', 'ভুল পরিমাণ', 'ডিপোজিট পরিমাণ ১০০ টাকা থেকে ২৫,০০০ টাকার মধ্যে হতে হবে।');
      return;
    }
    if (!senderNumber) {
      showToast('error', 'প্রেরক নম্বর দিন', 'অনুগ্রহ করে আপনার প্রেরক (Sender) মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!transactionId || transactionId.trim().length < 6) {
      showToast('error', 'সঠিক TrxID দিন', 'অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন।');
      return;
    }

    try {
      setDepositSubmitting(true);
      const res: any = await apiRequest('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          paymentMethod: depositMethod,
          assignedNumber,
          senderNumber,
          transactionId,
          screenshotUrl: screenshotPreview || '',
        }),
      });

      if (res && res.autoVerified) {
        showToast('success', '⚡ ইনস্ট্যান্ট ডিপোজিট সফল!', res.message || 'আপনার ডিপোজিট অটো ভেরিফাই হয়েছে এবং ওয়ালেটে টাকা জমা হয়েছে!');
      } else {
        showToast('info', 'ডিপোজিট রিকোয়েস্ট গৃহীত', res?.message || 'পেমেন্ট গেটওয়ে এসএমএস মিললেই ব্যালেন্স সাথে সাথে যুক্ত হবে।');
      }

      setSenderNumber('');
      setTransactionId('');
      setScreenshotPreview('');
      await refreshUserData();
      await loadHistories();
      setActiveTab('deposit-history');
    } catch (err: any) {
      showToast('error', 'ডিপোজিট ব্যর্থ', err.message || 'ডিপোজিট সম্পন্ন করা যায়নি।');
    } finally {
      setDepositSubmitting(false);
    }
  };

  // Submit Withdraw Setup (Locked Once Forever)
  const handleWithdrawSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupNumber || setupNumber.length < 11) {
      showToast('error', 'ভুল মোবাইল নম্বর', 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (!setupPassword || setupPassword.length < 4) {
      showToast('error', 'পাসওয়ার্ড প্রয়োজন', 'উইথড্র পাসওয়ার্ড অন্তত ৪ সংখ্যার হতে হবে।');
      return;
    }

    try {
      setSetupSubmitting(true);
      await apiRequest('/api/wallet/withdraw-setup', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: setupMethod,
          withdrawNumber: setupNumber,
          withdrawPassword: setupPassword,
        }),
      });
      showToast('success', 'সেটআপ সম্পন্ন!', 'আপনার উইথড্র অ্যাকাউন্ট স্থায়ীভাবে লক করা হয়েছে।');
      await refreshUserData();
    } catch (err: any) {
      showToast('error', 'সেটআপ ব্যর্থ', err.message || 'উইথড্র সেটআপ সম্পন্ন করা যায়নি।');
    } finally {
      setSetupSubmitting(false);
    }
  };

  // Submit Withdraw Request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFreeWithdrawBlocked) {
      setShowFreeWithdrawModal(true);
      showToast(
        'error',
        'উইথড্র অনুমতি সীমাবদ্ধ',
        'আপনার নিয়োগ ব্যবস্থাপকের সঙ্গে যোগাযোগ করুন'
      );
      return;
    }
    if (!user?.withdrawSetupDone) {
      showToast('error', 'সেটআপ প্রয়োজন', 'প্রথমে আপনার উইথড্র মেথড এবং পাসওয়ার্ড সেটআপ সম্পন্ন করুন।');
      return;
    }
    if (!withdrawPassword) {
      showToast('error', 'পাসওয়ার্ড দিন', 'অনুগ্রহ করে আপনার উইথড্র পাসওয়ার্ড লিখুন।');
      return;
    }

    try {
      setWithdrawSubmitting(true);
      const fp = getDeviceFingerprint();
      await apiRequest('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: selectedWithdrawCard,
          withdrawPassword,
          deviceFingerprint: fp,
        }),
      });

      showToast('success', 'উইথড্র রিকোয়েস্ট গৃহীত!', `৳${selectedWithdrawCard} উইথড্রল রিকোয়েস্ট (${user.withdrawMethod}) প্রক্রিয়াধীন রয়েছে।`);
      setWithdrawPassword('');
      await refreshUserData();
      await loadHistories();
      setActiveTab('tracker');
    } catch (err: any) {
      if (err.message && (err.message.includes('ফ্রি ইউজার') || err.message.includes('Free users') || err.message.includes('referral member'))) {
        setShowFreeWithdrawModal(true);
      }
      showToast('error', 'উইথড্র ব্যর্থ', err.message || 'উইথড্র প্রক্রিয়া সম্পন্ন করা যায়নি।');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Available Dynamic Withdraw Cards (with fallback):
  const fallbackDefaultCards: WithdrawCard[] = [
    { id: 'wcard_100', amount: 100, label: 'ফ্রি ট্রায়াল কার্ড', badge: 'TRIAL', badgeColor: 'cyan', minRole: 'Trial', isTrialAllowed: true, enabled: true, order: 1 },
    { id: 'wcard_460', amount: 460, label: 'স্ট্যান্ডার্ড পেআউট', badge: 'INSTANT', badgeColor: 'emerald', minRole: 'Member', isTrialAllowed: false, enabled: true, order: 2 },
    { id: 'wcard_1680', amount: 1680, label: 'পপুলার পেআউট', badge: 'POPULAR', badgeColor: 'purple', minRole: 'Member', isTrialAllowed: false, enabled: true, order: 3 },
    { id: 'wcard_5800', amount: 5800, label: 'প্রিমিয়াম পেআউট', badge: 'HOT', badgeColor: 'amber', minRole: 'Member', isTrialAllowed: false, enabled: true, order: 4 },
    { id: 'wcard_16800', amount: 16800, label: 'ভিআইপি পেআউট', badge: 'VIP ONLY', badgeColor: 'amber', minRole: 'VIP', isTrialAllowed: false, enabled: true, order: 5 },
    { id: 'wcard_49999', amount: 49999, label: 'এলিট পেআউট', badge: 'HIGH LIMIT', badgeColor: 'blue', minRole: 'VIP', isTrialAllowed: false, enabled: true, order: 6 },
    { id: 'wcard_150000', amount: 150000, label: 'রয়্যাল পেআউট', badge: 'MAX LIMIT', badgeColor: 'rose', minRole: 'VIP', isTrialAllowed: false, enabled: true, order: 7 },
  ];

  const rawCards = dynamicWithdrawCards.length > 0 ? dynamicWithdrawCards : fallbackDefaultCards;
  const activeWithdrawCards = rawCards
    .filter((c) => c.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.amount - b.amount);

  const withdrawFee = (selectedWithdrawCard * 10) / 100;
  const withdrawNet = selectedWithdrawCard - withdrawFee;

  const getCardBadgeTheme = (color?: string) => {
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

  return (
    <div id="wallet-view-root" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Wallet Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'overview', label: 'Wallet Overview', icon: Wallet },
          { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
          { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
          { id: 'passbook', label: 'Passbook', icon: FileText },
          { id: 'deposit-history', label: 'Deposit Logs', icon: History },
          { id: 'withdraw-history', label: 'Withdraw Logs', icon: History },
          { id: 'tracker', label: 'Live Tracker', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-wallet-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Balance Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-950/60 border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Available Balance</span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ৳ {(wallet?.balance || 0).toLocaleString()}
              </h2>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  Deposit
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Total Deposited */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Total Deposited</span>
                <ArrowDownLeft className="w-5 h-5 text-blue-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  ৳ {(wallet?.totalDeposit || 0).toLocaleString()}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block">Lifetime verified deposits</span>
              </div>
            </div>

            {/* Total Withdrawn */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Total Withdrawn</span>
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  ৳ {(wallet?.totalWithdraw || 0).toLocaleString()}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block">Paid via bKash / Nagad</span>
              </div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Task Earnings</span>
              <span className="text-lg font-bold text-emerald-400">৳{(wallet?.totalEarned || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Referral Bonus</span>
              <span className="text-lg font-bold text-purple-400">৳{(wallet?.referralIncome || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Salary Credited</span>
              <span className="text-lg font-bold text-teal-400">৳{(wallet?.salaryIncome || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Gift / Promo Balance</span>
              <span className="text-lg font-bold text-amber-400">৳{(wallet?.giftIncome || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPOSIT */}
      {activeTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Deposit Wallet Balance</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Smart Auto-Verify Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Range: 100 TK to 25,000 TK. Instant automatic verification via bKash / Nagad gateway SMS.
                </p>
              </div>

              {/* Smart Auto Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200/90 flex items-start gap-2.5">
                <span className="text-base leading-none">⚡</span>
                <div>
                  <span className="font-bold text-emerald-300">স্বয়ংক্রিয় ডিপোজিট সিস্টেম:</span> টাকা সেন্ড মানি করে শুধুমাত্র ট্রানজেকশন আইডি (TrxID) ও প্রেরক নম্বর দিয়ে সাবমিট করুন। সিস্টেম সরাসরি গেটওয়ে থেকে মিলিয়ে সাথে সাথে আপনার ওয়ালেটে ব্যালেন্স জমা করবে!
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Mobile Banking
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('bKash')}
                    className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition cursor-pointer ${
                      depositMethod === 'bKash'
                        ? 'bg-pink-950/50 border-pink-500 text-pink-300 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>bKash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('Nagad')}
                    className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition cursor-pointer ${
                      depositMethod === 'Nagad'
                        ? 'bg-orange-950/50 border-orange-500 text-orange-300 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Nagad</span>
                  </button>
                </div>
              </div>

              {/* Assigned Number Display Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Assigned {depositMethod} Number (Send Money)
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                    Personal
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider">
                    {assignedNumber || '01712345678'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAssigned}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {copiedAssigned ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAssigned ? 'Copied' : 'Copy Number'}</span>
                  </button>
                </div>
              </div>

              {/* Deposit Form */}
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Deposit Amount (TK)
                  </label>
                  <input
                    id="input-deposit-amount"
                    type="number"
                    min="100"
                    max="25000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value) || '')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
                    placeholder="1000"
                  />
                  <div className="flex gap-2 mt-2">
                    {[500, 2500, 7500, 22500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your {depositMethod} Mobile Number (Sender)
                  </label>
                  <input
                    id="input-deposit-sender"
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    id="input-deposit-trxid"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder="e.g. BK89AJ92KD"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm uppercase font-mono tracking-wider focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <ImageUploadInput
                    id="deposit-screenshot-upload"
                    label="Payment Proof Screenshot (Optional)"
                    value={screenshotPreview}
                    onChange={setScreenshotPreview}
                    folder="earnhub_deposits"
                    placeholder="Upload payment receipt / screenshot to Cloudinary"
                    helperText="Upload your bKash/Nagad payment success SMS or screenshot for instant manual admin approval."
                  />
                </div>

                <button
                  id="btn-submit-deposit"
                  type="submit"
                  disabled={depositSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950/50 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {depositSubmitting ? (
                    <span>অটো ভেরিফিকেশন চলছে...</span>
                  ) : (
                    <span>⚡ ইনস্ট্যান্ট ভেরিফাই ও ব্যালেন্স জমা করুন</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Deposit Instructions Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                Deposit Guidelines
              </h4>
              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">1.</span>
                  <span>Copy the official assigned {depositMethod} number shown above.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">2.</span>
                  <span>Open your {depositMethod} app and perform "Send Money" for the exact intended amount.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">3.</span>
                  <span>Copy the generated Transaction ID (TrxID) and paste it into the form.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">4.</span>
                  <span>Finance team verifies deposits manually within 10-30 minutes. Once approved, funds reflect instantly.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* If withdraw setup is NOT done: show setup card */}
            {!user?.withdrawSetupDone ? (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Setup Locked Once Forever
                  </span>
                  <h3 className="text-xl font-bold text-white">Setup Withdraw Method & Password</h3>
                  <p className="text-xs text-slate-400">
                    Rule: Once submitted, your withdraw phone number and password can never be altered. Same withdraw number cannot be registered by another account.
                  </p>
                </div>

                <form onSubmit={handleWithdrawSetupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSetupMethod('bKash')}
                        className={`py-2.5 rounded-xl border text-sm font-bold ${
                          setupMethod === 'bKash'
                            ? 'bg-pink-950/50 border-pink-500 text-pink-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        bKash
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupMethod('Nagad')}
                        className={`py-2.5 rounded-xl border text-sm font-bold ${
                          setupMethod === 'Nagad'
                            ? 'bg-orange-950/50 border-orange-500 text-orange-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Nagad
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Withdraw {setupMethod} Number (Unique)
                    </label>
                    <input
                      id="input-setup-withdraw-number"
                      type="text"
                      value={setupNumber}
                      onChange={(e) => setSetupNumber(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Create Secret Withdraw Password
                    </label>
                    <input
                      id="input-setup-withdraw-password"
                      type="password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Secret 4+ digit PIN / Password"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    id="btn-submit-withdraw-setup"
                    type="submit"
                    disabled={setupSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950 transition disabled:opacity-50 cursor-pointer"
                  >
                    {setupSubmitting ? 'Locking Credentials...' : 'Lock Withdraw Credentials Forever'}
                  </button>
                </form>
              </div>
            ) : (
              // Active Withdraw Form with LOCKED AMOUNT CARDS
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                {/* Status Alert Banner: Free User Restriction / Admin Permission Granted / VIP Paid */}
                {isFreeWithdrawBlocked ? (
                  <div className="p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 shadow-xl space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white">ফ্রি একাউন্ট উইথড্রয়াল সীমাবদ্ধতা</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Permission Required
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/90 leading-relaxed">
                          ফ্রি ইউজাররা সরাসরি টাকা উইথড্র করতে পারবেন না। টাকা উইথড্র করার অনুমতি পেতে অনুগ্রহ করে সাপোর্ট টিমে অথবা আপনার রেফারেল মেম্বারের সাথে যোগাযোগ করুন। প্যানেল থেকে এডমিন ফ্রি ইউজারদের টাকা উইথড্র করার পারমিশন এনাবল (Enable) করলে আপনি টাকা উইথড্র করতে পারবেন।
                        </p>
                      </div>
                    </div>

                    {/* Quick Action Buttons for Free Users */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-500/20">
                      <a
                        href={`https://wa.me/${(settings?.whatsappNumber || '8801700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello Support Team, I am a free user on EarnHub BD (Phone: ${user?.phone}). I would like to request permission to withdraw my earnings. Please enable permission for my account.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Contact Support</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setShowFreeWithdrawModal(true)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-xs transition cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Contact Referral</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('packages');
                          } else {
                            setActiveTab('deposit');
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Deposit & Buy Package</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between text-xs text-slate-300">
                      <span className="text-[11px]">ডিপোজিট করে যেকোনো প্যাকেজ কিনলে কোনো বাধা ছাড়াই স্বাভাবিকভাবে কাজ ও আনলিমিটেড উইথড্র করতে পারবেন।</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('deposit')}
                        className="font-bold text-amber-400 hover:text-amber-300 underline shrink-0 ml-2"
                      >
                        ডিপোজিট করুন →
                      </button>
                    </div>
                  </div>
                ) : isFreeUser && isFreeWithdrawPermitted ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">✅ ফ্রি উইথড্র অনুমতি সক্রিয় (Admin Permitted)</h4>
                      </div>
                      <p className="text-xs text-emerald-300/90">
                        এডমিন আপনার ফ্রি একাউন্টের জন্য উইথড্র করার অনুমতি সক্রিয় করেছেন। আপনি এখন আপনার ১০০ টাকা বা ব্যালেন্স উইথড্র করতে পারবেন।
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">VIP Paid Member Account</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">স্বাভাবিক উইথড্র সচল (Unrestricted)</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
                    <p className="text-xs text-slate-400">
                      Destination: <span className="text-emerald-400 font-semibold">{user.withdrawMethod} {user.withdrawNumber}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    Fee: 10%
                  </span>
                </div>

                {/* Amount Cards Selector (LOCKED - MUST BE CARDS, NOT DROPDOWN!) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      উইথড্রল কার্ড নির্বাচন করুন (Select Amount Card)
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      মোট {activeWithdrawCards.length} টি কার্ড সক্রিয়
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activeWithdrawCards.map((card) => {
                      const isSelected = selectedWithdrawCard === card.amount;
                      const cardFee = (card.amount * 10) / 100;
                      const cardNet = card.amount - cardFee;

                      return (
                        <button
                          key={card.id || card.amount}
                          type="button"
                          id={`card-withdraw-${card.amount}`}
                          onClick={() => setSelectedWithdrawCard(card.amount)}
                          className={`relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer min-h-[110px] group ${
                            isSelected
                              ? 'bg-gradient-to-b from-emerald-950/80 to-slate-950 border-emerald-500 text-white shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                              : 'bg-slate-950/90 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Top Badges & Status */}
                          <div className="flex items-center justify-between gap-1 w-full">
                            {card.badge ? (
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCardBadgeTheme(
                                  card.badgeColor
                                )}`}
                              >
                                {card.badge}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Card</span>
                            )}

                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-700 bg-slate-900/60'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Card Amount Display */}
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-medium block truncate">
                              {card.label || 'কার্ড ভ্যালু'}
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition">
                                ৳ {card.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Net Payout Footnote */}
                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">পাবেন (Net):</span>
                            <span className="font-bold text-emerald-400">৳ {cardNet.toLocaleString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Net Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Withdrawal Amount:</span>
                    <span className="font-bold text-white">৳ {selectedWithdrawCard.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform Fee (10%):</span>
                    <span className="font-bold text-rose-400">- ৳ {withdrawFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800 text-sm">
                    <span>You Receive in {user.withdrawMethod}:</span>
                    <span className="text-emerald-400 font-black">৳ {withdrawNet.toLocaleString()}</span>
                  </div>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Withdraw Password (Required)
                    </label>
                    <input
                      id="input-withdraw-password"
                      type="password"
                      value={withdrawPassword}
                      onChange={(e) => setWithdrawPassword(e.target.value)}
                      placeholder="Enter your confidential withdraw password"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {isFreeWithdrawBlocked ? (
                    <button
                      id="btn-submit-withdraw-card-blocked"
                      type="button"
                      onClick={() => setShowFreeWithdrawModal(true)}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-amber-950/50 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Contact Support or Referral Member to Enable Withdrawal</span>
                    </button>
                  ) : (
                    <button
                      id="btn-submit-withdraw-card"
                      type="submit"
                      disabled={withdrawSubmitting}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950 transition disabled:opacity-50 cursor-pointer"
                    >
                      {withdrawSubmitting ? 'Submitting Request...' : `Request ৳${selectedWithdrawCard.toLocaleString()} Withdrawal`}
                    </button>
                  )}
                </form>
              </div>
            )}
        </div>
      )}

      {/* TAB 4: PASSBOOK */}
      {activeTab === 'passbook' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Wallet Passbook</h3>
            <span className="text-xs text-slate-400">{transactions.length} Total Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">No transaction entries found.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-semibold uppercase text-slate-300">{tx.type}</td>
                      <td className="p-3 text-slate-300">{tx.description}</td>
                      <td className={`p-3 font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount >= 0 ? `+৳${tx.amount}` : `-৳${Math.abs(tx.amount)}`}
                      </td>
                      <td className="p-3 font-semibold text-white">৳{(tx.balanceAfter || 0).toLocaleString()}</td>
                      <td className="p-3 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DEPOSIT HISTORY */}
      {activeTab === 'deposit-history' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Deposit History</h3>
            <span className="text-xs text-slate-400">{deposits.length} Requests</span>
          </div>

          <div className="space-y-3">
            {deposits.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs">No deposit requests recorded yet.</p>
            ) : (
              deposits.map((dep) => (
                <div key={dep.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">৳ {dep.amount.toLocaleString()}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">{dep.paymentMethod}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                        dep.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : dep.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {dep.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      TrxID: {dep.transactionId} • Sender: {dep.senderNumber}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(dep.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: WITHDRAW HISTORY */}
      {activeTab === 'withdraw-history' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Withdrawal History</h3>
            <span className="text-xs text-slate-400">{withdraws.length} Requests</span>
          </div>

          <div className="space-y-3">
            {withdraws.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs">No withdrawal records found.</p>
            ) : (
              withdraws.map((wdr) => (
                <div key={wdr.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">৳ {wdr.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">Net: ৳{wdr.netAmount.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                        wdr.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : wdr.status === 'approved'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : wdr.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {wdr.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Destination: {wdr.paymentMethod} {wdr.withdrawNumber}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(wdr.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: WITHDRAW TRACKER */}
      {activeTab === 'tracker' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Live Withdrawal Tracker</h3>
            <p className="text-xs text-slate-400">Real-time status tracking for your latest payouts.</p>
          </div>

          {withdraws.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No active withdrawal in transit.
            </div>
          ) : (
            <div className="space-y-6">
              {withdraws.slice(0, 3).map((wdr) => (
                <div key={wdr.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Withdrawal ID #{wdr.id}</span>
                      <h4 className="text-base font-bold text-white">
                        ৳ {wdr.amount.toLocaleString()} via {wdr.paymentMethod} ({wdr.withdrawNumber})
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Net: ৳{wdr.netAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Step Timeline: Pending -> Approved -> Paid */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className={`p-3 rounded-xl border ${
                      ['pending', 'approved', 'paid'].includes(wdr.status)
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <span className="text-xs font-bold block">1. Pending</span>
                      <span className="text-[10px] opacity-80">Queued in Engine</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      ['approved', 'paid'].includes(wdr.status)
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <span className="text-xs font-bold block">2. Approved</span>
                      <span className="text-[10px] opacity-80">Finance Verification</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      wdr.status === 'paid'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : wdr.status === 'rejected'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <span className="text-xs font-bold block">
                        {wdr.status === 'rejected' ? '3. Rejected' : '3. Paid'}
                      </span>
                      <span className="text-[10px] opacity-80">Sent to Wallet</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Free User Withdrawal Support & Referral Modal */}
      <AnimatePresence>
        {showFreeWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 relative"
            >
              <button
                type="button"
                onClick={() => setShowFreeWithdrawModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">ফ্রি একাউন্ট উইথড্রয়াল সীমাবদ্ধতা</h3>
                  <p className="text-xs text-slate-400">Withdrawal Permission Notice for Free Users</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-300">
                <p className="font-bold text-amber-300 text-sm">
                  আপনার নিয়োগ ব্যবস্থাপকের সঙ্গে যোগাযোগ করুন
                </p>
                <p>
                  ফ্রি একাউন্ট থেকে টাকা উইথড্র করার জন্য আপনার নিয়োগ ব্যবস্থাপকের অনুমতি প্রয়োজন। এডমিন প্যানেল থেকে আপনার অ্যাকাউন্টের উইথড্র পারমিশন এনাবল করার পর আপনি কোনো সমস্যা ছাড়াই সহজে টাকা উইথড্র করতে পারবেন।
                </p>
                <p className="text-emerald-400 pt-1 border-t border-slate-800">
                  💡 বিকল্প স্থায়ী সমাধান: আপনি ডিপোজিট করে যেকোনো মেম্বারশিপ প্যাকেজ ক্রয় করলে কোনো আলাদা অনুমতি ছাড়াই রোল বা শর্ত ছাড়া স্বাভাবিকভাবে টাকা উইথড্র করতে পারবেন।
                </p>
              </div>

              <div className="space-y-3">
                {/* Action 1: Contact Support */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Official Support</span>
                      <span className="text-[11px] text-slate-400">সাপোর্টে যোগাযোগ করে পারমিশন রিকোয়েস্ট করুন</span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${(settings?.whatsappNumber || '8801700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello Support Team, I am a free user on EarnHub BD (Phone: ${user?.phone}). I would like to request permission to withdraw my earnings. Please check and enable permission for my account.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
                  >
                    WhatsApp Support
                  </a>
                </div>

                {/* Action 2: Contact Referral Member */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Your Referral Member</span>
                        <span className="text-[11px] text-slate-400">আপনার আপলাইন মেম্বার</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/30">
                      {user?.referredBy || 'Official Admin'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    আপনার রেফারেল মেম্বারকে জানান যাতে তিনি এডমিনের সাথে যোগাযোগ করে আপনার একাউন্টে উইথড্র পারমিশন সক্রিয় করার সুপারিশ করেন।
                  </p>

                  {user?.uplineInfo?.phone && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <span className="text-xs font-mono text-slate-300 font-semibold">
                        📞 {user.uplineInfo.phone}
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${user.uplineInfo.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
                        >
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${user.uplineInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `আসসালামু আলাইকুম, আমি আপনার রেফারেল মেম্বার (ফোন: ${user?.phone})। আমার ফ্রি একাউন্টে উইথড্র পারমিশন প্রয়োজন। অনুগ্রহ করে এডমিনকে বলে সহায়তা করবেন কি?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action 3: Deposit & Purchase Package */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">ডিপোজিট করে প্যাকেজ চালু করুন</span>
                      <span className="text-[11px] text-slate-400">প্যাকেজ কিনলে আজীবন যেকোনো সময় উইথড্র সুবিধা</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFreeWithdrawModal(false);
                      if (onNavigate) {
                        onNavigate('packages');
                      } else {
                        setActiveTab('deposit');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0 cursor-pointer"
                  >
                    Deposit & Buy
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFreeWithdrawModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Close Notice
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
