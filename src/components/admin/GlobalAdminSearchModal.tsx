import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  MessageSquare,
  Gift,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface GlobalAdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string, param?: string) => void;
}

export function GlobalAdminSearchModal({ isOpen, onClose, onNavigateTab }: GlobalAdminSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigateTab('open_search');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/api/admin/search?q=${encodeURIComponent(query.trim())}`);
        if (res && res.results) {
          setResults(res.results);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalHits =
    (results?.users?.length || 0) +
    (results?.deposits?.length || 0) +
    (results?.withdraws?.length || 0) +
    (results?.tickets?.length || 0) +
    (results?.promos?.length || 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Omnibox Search (phone, name, TrxID, ticket ID, referral code...)"
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500 font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <p className="font-semibold text-slate-400">Quick Omnisearch Command Center</p>
              <p>Type a user's phone number, deposit transaction ID, support ticket subject, or promo code.</p>
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">ESC</kbd> to close
              </div>
            </div>
          ) : loading && !results ? (
            <div className="p-8 text-center text-slate-400 text-xs">Searching database records...</div>
          ) : totalHits === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Users Results */}
              {results?.users?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Users ({results.users.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.users.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          onNavigateTab('users', u.phone);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-amber-400 transition">
                            {u.name || 'Member'} • <span className="font-mono text-amber-400">{u.phone}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Balance: ৳{u.balance} | Package: {u.activePackageId || 'Free Trial'} | Ref:{' '}
                            {u.referralCode}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deposits Results */}
              {results?.deposits?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deposits ({results.deposits.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.deposits.map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          onNavigateTab('finance');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-emerald-400 transition">
                            ৳{d.amount} via {d.paymentMethod} • <span className="font-mono">{d.userPhone}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            TrxID: {d.transactionId} | Status: {d.status}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Withdrawals Results */}
              {results?.withdraws?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Withdrawals ({results.withdraws.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.withdraws.map((w: any) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          onNavigateTab('finance');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition">
                            ৳{w.amount} to {w.withdrawNumber} ({w.paymentMethod})
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            User: {w.userPhone} | Status: {w.status}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Tickets Results */}
              {results?.tickets?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Support Tickets ({results.tickets.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.tickets.map((t: any) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigateTab('support');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-purple-400 transition">
                            #{t.id} {t.subject}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            User: {t.userPhone} | Priority: {t.priority} | Status: {t.status}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
