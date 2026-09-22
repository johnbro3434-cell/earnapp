import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, Share2, ArrowRight, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
  onRegisterSuccess: () => void;
}

export function RegisterPage({ onNavigate, onRegisterSuccess }: RegisterPageProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    return ref ? ref.trim().toUpperCase() : '';
  });
  const [fromUrl] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return Boolean(urlParams.get('ref'));
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      setError('অনুগ্রহ করে আপনার বাংলাদেশি মোবাইল নম্বর লিখুন।');
      return;
    }

    if (!/^(?:\+8801|8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
      setError('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (!password || password.length < 6) {
      setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না। একই পাসওয়ার্ড দিন।');
      return;
    }

    if (!referralCode || !referralCode.trim()) {
      setError('রেফার কোড আবশ্যক! রেফার কোড ছাড়া অ্যাকাউন্ট তৈরি করা সম্ভব নয়।');
      return;
    }

    setLoading(true);
    try {
      await register(cleanPhone, password, referralCode.trim().toUpperCase());
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'রেজিস্ট্রেশন সম্পন্ন হতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-page-root" className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="max-w-md w-full space-y-7 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            4-Day Free Trial Included
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Your Account</h2>
          <p className="text-xs text-slate-400">
            Start earning 25 TK daily for your first 4 days with zero upfront payment.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Bangladesh Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="input-register-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">One account per mobile number.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Referral Code <span className="text-rose-400">* (আবশ্যক / Required)</span>
              </label>
              {fromUrl && referralCode && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Link Applied ✓
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Share2 className="w-4 h-4 text-purple-400" />
              </div>
              <input
                id="input-register-referral-code"
                type="text"
                required
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter sponsor referral code (e.g. EHBD1001)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              রেফার কোড ছাড়া একাউন্ট খোলা যাবে না। রেফার কোড না থাকলে ইনভাইটকারীর থেকে সংগ্রহ করুন বা অফিসিয়াল কোড <button type="button" onClick={() => setReferralCode('EHBD1001')} className="text-purple-400 font-semibold underline hover:text-purple-300">EHBD1001</button> ব্যবহার করুন।
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>4-Day Free Trial Activated Automatically</span>
            </div>
            <p>1 video task daily (25 TK/day) = 100 TK total. Single trial withdrawal permitted per device.</p>
          </div>

          <button
            id="btn-submit-register"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Agree & Start Free Trial'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            id="link-to-login"
            onClick={() => onNavigate('login')}
            className="text-emerald-400 font-semibold hover:underline"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
}
