import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, ArrowRight, Shield, UserCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (isAdmin: boolean) => void;
}

export function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।');
      return;
    }

    if (!password) {
      setError('অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।');
      return;
    }

    setLoading(true);
    try {
      const res = await login(phone.trim(), password);
      onLoginSuccess(res.isAdmin);
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। মোবাইল নম্বর ও পাসওয়ার্ড সঠিক কিনা পরীক্ষা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (p: string, pw: string) => {
    setPhone(p);
    setPassword(pw);
    setError('');
  };

  return (
    <div id="login-page-root" className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to EarnHub BD</h2>
          <p className="text-xs text-slate-400">
            Access your real-time wallet and daily sponsor video tasks.
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
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="input-login-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
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
                id="input-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In Securely'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Demo Fast Fill Buttons for Testing */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            One-Click Test Credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-demo-admin"
              type="button"
              onClick={() => fillDemo('01700000000', 'admin123')}
              className="px-2 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition text-center"
            >
              Main Admin
            </button>
            <button
              id="btn-demo-paid"
              type="button"
              onClick={() => fillDemo('01711111111', 'user123')}
              className="px-2 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition text-center"
            >
              Golden User
            </button>
            <button
              id="btn-demo-trial"
              type="button"
              onClick={() => fillDemo('01822222222', 'user123')}
              className="px-2 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition text-center"
            >
              Free Trial
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            id="link-to-register"
            onClick={() => onNavigate('register')}
            className="text-emerald-400 font-semibold hover:underline"
          >
            Register for Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
