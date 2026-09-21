import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, KeyRound, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onReturnHome: () => void;
}

export function AdminLoginPage({ onLoginSuccess, onReturnHome }: AdminLoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Admin identifier or phone number is required.');
      return;
    }
    if (!password) {
      setError('Master admin password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      if (!res.isAdmin) {
        throw new Error('Access denied. Provided credentials do not have administrator privileges.');
      }
      showToast('success', 'Admin Portal Access Granted', 'Welcome to EarnHub Enterprise CRM & Control Center.');
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check your admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillMasterDemo = () => {
    setIdentifier('01712345678');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-8 p-6 sm:p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-950">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Restricted Area • Secret Portal
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Enterprise Admin Login</h1>
            <p className="text-xs text-slate-400">
              Authorized personnel only. All access attempts are monitored and logged.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Phone or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="01712345678 or admin"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Authenticating Secure Node...
              </span>
            ) : (
              <>
                <span>Access Admin Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={fillMasterDemo}
            className="text-slate-400 hover:text-emerald-400 transition font-medium flex items-center gap-1"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Demo Master Credentials</span>
          </button>

          <button
            type="button"
            onClick={onReturnHome}
            className="text-slate-500 hover:text-slate-300 transition"
          >
            Return to Public Site
          </button>
        </div>
      </div>
    </div>
  );
}
