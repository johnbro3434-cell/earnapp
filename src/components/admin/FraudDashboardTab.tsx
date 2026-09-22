import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Smartphone,
  Search,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Eye,
  Filter,
  ArrowRight,
  ShieldCheck,
  Lock,
  UserX,
  PhoneCall,
  History,
  Check,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FraudLog, VerificationLog, VerifyDevice, DepositRequest } from '../../types';

interface FraudMetrics {
  duplicateTrxCount: number;
  failedVerificationsCount: number;
  duplicateSendersCount: number;
  suspiciousDevicesCount: number;
  blockedTransactionsCount: number;
  blockedDevicesCount: number;
}

export function FraudDashboardTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'duplicate_trx' | 'failed_verifications' | 'duplicate_senders' | 'devices' | 'blocked'>('all');

  const [metrics, setMetrics] = useState<FraudMetrics>({
    duplicateTrxCount: 0,
    failedVerificationsCount: 0,
    duplicateSendersCount: 0,
    suspiciousDevicesCount: 0,
    blockedTransactionsCount: 0,
    blockedDevicesCount: 0,
  });

  const [duplicateTrx, setDuplicateTrx] = useState<FraudLog[]>([]);
  const [failedVerifications, setFailedVerifications] = useState<VerificationLog[]>([]);
  const [duplicateSenders, setDuplicateSenders] = useState<FraudLog[]>([]);
  const [suspiciousDevices, setSuspiciousDevices] = useState<VerifyDevice[]>([]);
  const [blockedTransactions, setBlockedTransactions] = useState<DepositRequest[]>([]);
  const [blockedDevices, setBlockedDevices] = useState<VerifyDevice[]>([]);
  const [allFraudLogs, setAllFraudLogs] = useState<FraudLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/fraud/dashboard');
      if (res) {
        if (res.metrics) setMetrics(res.metrics);
        if (res.duplicateTrx) setDuplicateTrx(res.duplicateTrx);
        if (res.failedVerifications) setFailedVerifications(res.failedVerifications);
        if (res.duplicateSenders) setDuplicateSenders(res.duplicateSenders);
        if (res.suspiciousDevices) setSuspiciousDevices(res.suspiciousDevices);
        if (res.blockedTransactions) setBlockedTransactions(res.blockedTransactions);
        if (res.blockedDevices) setBlockedDevices(res.blockedDevices);
        if (res.allFraudLogs) setAllFraudLogs(res.allFraudLogs);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to load fraud dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, []);

  const handleAction = async (action: string, logId?: string, targetId?: string) => {
    try {
      const res = await apiRequest('/api/admin/fraud/action', {
        method: 'POST',
        body: JSON.stringify({ action, logId, targetId }),
      });
      showToast('success', 'Action Executed', res.message || 'Action executed successfully.');
      fetchFraudData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message || 'Could not complete fraud action.');
    }
  };

  // Filter logs by search query (Phone or TrxID)
  const q = searchQuery.trim().toLowerCase();
  const filterBySearch = (item: any) => {
    if (!q) return true;
    const phone = item.userPhone || item.senderNumber || item.phoneNumber || '';
    const trx = item.trxId || item.transactionId || '';
    const uid = item.userId || '';
    return (
      phone.toLowerCase().includes(q) ||
      trx.toLowerCase().includes(q) ||
      uid.toLowerCase().includes(q)
    );
  };

  const filteredFraudLogs = allFraudLogs.filter(filterBySearch);
  const filteredFailed = failedVerifications.filter(filterBySearch);
  const filteredBlocked = blockedTransactions.filter(filterBySearch);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Fraud & Financial Defense Center
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  V20 Security Patch Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time surveillance of duplicate TrxIDs, sender sharing syndicates, and MFS gateway anomalies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction('resolve_all')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Resolve All
          </button>

          <button
            onClick={fetchFraudData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 6 MANDATORY WIDGETS (PATCH 10) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Widget 1: Duplicate Trx IDs */}
        <div
          onClick={() => setActiveFilter('duplicate_trx')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeFilter === 'duplicate_trx'
              ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">Duplicate TrxID</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{metrics.duplicateTrxCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Attempted re-claims</p>
        </div>

        {/* Widget 2: Failed Auto-Verifications */}
        <div
          onClick={() => setActiveFilter('failed_verifications')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeFilter === 'failed_verifications'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">Failed Verifications</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{metrics.failedVerificationsCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Score &lt; 100% mismatches</p>
        </div>

        {/* Widget 3: Duplicate Sender Numbers */}
        <div
          onClick={() => setActiveFilter('duplicate_senders')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeFilter === 'duplicate_senders'
              ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">Shared Senders</span>
            <PhoneCall className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{metrics.duplicateSendersCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Cross-account reuse</p>
        </div>

        {/* Widget 4: Suspicious Android Devices */}
        <div
          onClick={() => setActiveFilter('devices')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeFilter === 'devices'
              ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">Suspicious Devices</span>
            <Smartphone className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{metrics.suspiciousDevicesCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Offline &gt; 90s / unverified</p>
        </div>

        {/* Widget 5: Blocked Transactions */}
        <div
          onClick={() => setActiveFilter('blocked')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeFilter === 'blocked'
              ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">Blocked Deposits</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{metrics.blockedTransactionsCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Manual/Auto rejected</p>
        </div>

        {/* Widget 6: Blocked Android Devices */}
        <div
          onClick={() => setActiveFilter('devices')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeFilter === 'devices'
              ? 'bg-slate-800 border-slate-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">Blocked Gateways</span>
            <Ban className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.blockedDevicesCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Banned device tokens</p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR (PATCH 10) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Phone (Sender/User) or Transaction ID (TrxID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'duplicate_trx', label: 'Duplicate TRX' },
            { id: 'failed_verifications', label: 'Failed Score' },
            { id: 'duplicate_senders', label: 'Sender Sharing' },
            { id: 'devices', label: 'Devices' },
            { id: 'blocked', label: 'Blocked' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DETAILED TABLES ACCORDING TO FILTER */}
      {/* 1. DUPLICATE TRX & FRAUD LOGS */}
      {(activeFilter === 'all' || activeFilter === 'duplicate_trx' || activeFilter === 'duplicate_senders') && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" />
              Surveillance Incident Logs ({filteredFraudLogs.length})
            </h3>
            <span className="text-xs text-slate-500">Live Trx Lock Enforcement</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Severity & Type</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Sender Phone</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFraudLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No matching fraud incidents detected.
                    </td>
                  </tr>
                ) : (
                  filteredFraudLogs.map((log, idx) => (
                    <tr key={`${log.id || 'log'}_${idx}`} className="hover:bg-slate-850/60 transition">
                      <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.severity === 'critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : log.severity === 'high'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {log.severity}
                          </span>
                          <span className="text-slate-300 font-medium">{log.type.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {log.trxId || 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-cyan-300 font-bold">
                        {log.senderNumber || log.userPhone || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="p-3">
                        {log.resolved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[10px]">
                            Pending Action
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!log.resolved && (
                            <button
                              onClick={() => handleAction('resolve', log.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition"
                            >
                              Resolve
                            </button>
                          )}
                          {log.userId && (
                            <button
                              onClick={() => handleAction('ban_user', log.id, log.userId)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-[11px] font-bold transition"
                            >
                              Ban User
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FAILED AUTO-VERIFICATIONS & SCORE BREAKDOWN */}
      {(activeFilter === 'all' || activeFilter === 'failed_verifications') && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Failed Auto-Verifications & Smart Score Breakdown ({filteredFailed.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transactions routed to manual review queue due to score &lt; 100% threshold.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Deposit ID</th>
                  <th className="p-3">TrxID & Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Score Breakdown (All 7 Must Pass)</th>
                  <th className="p-3">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFailed.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No failed auto-verifications recorded.
                    </td>
                  </tr>
                ) : (
                  filteredFailed.map((v, idx) => (
                    <tr key={`${v.id || 'v'}_${idx}`} className="hover:bg-slate-850/60 transition">
                      <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(v.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{v.depositId}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-amber-400">{v.trxId}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                          {v.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">৳{v.amount?.toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                            v.score === 100
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {v.score ?? 0}%
                        </span>
                      </td>
                      <td className="p-3">
                        {v.scoreBreakdown ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              title="TrxID Match"
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                v.scoreBreakdown.trxIdMatch
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              TRX: {v.scoreBreakdown.trxIdMatch ? '✓' : '✗'}
                            </span>
                            <span
                              title="Amount Match"
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                v.scoreBreakdown.amountMatch
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              AMT: {v.scoreBreakdown.amountMatch ? '✓' : '✗'}
                            </span>
                            <span
                              title="Method Match"
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                v.scoreBreakdown.methodMatch
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              MTH: {v.scoreBreakdown.methodMatch ? '✓' : '✗'}
                            </span>
                            <span
                              title="Unused SMS Check"
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                v.scoreBreakdown.unusedCheck
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              LOCK: {v.scoreBreakdown.unusedCheck ? '✓' : '✗'}
                            </span>
                            <span
                              title="Sender Ownership Check"
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                v.scoreBreakdown.senderOwnershipPassed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              OWNER: {v.scoreBreakdown.senderOwnershipPassed ? '✓' : '✗'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Awaiting gateway sync</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={v.reason}>
                        {v.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUSPICIOUS & BLOCKED ANDROID DEVICES */}
      {(activeFilter === 'all' || activeFilter === 'devices') && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Android SMS Gateway Device Security ({suspiciousDevices.length + blockedDevices.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bearer DeviceToken authentication, 30s heartbeat telemetry, and 90s offline isolation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suspiciousDevices.concat(blockedDevices).length === 0 ? (
              <div className="col-span-full p-6 text-center text-slate-500 bg-slate-950 rounded-2xl">
                All connected Android gateway devices are healthy, authorized, and actively heartbeat streaming.
              </div>
            ) : (
              suspiciousDevices.concat(blockedDevices).map((d, idx) => (
                <div
                  key={`${d.id || 'dev'}_${idx}`}
                  className={`p-4 rounded-2xl border ${
                    d.isBanned
                      ? 'bg-red-950/30 border-red-500/40'
                      : 'bg-slate-950 border-slate-800'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{d.deviceId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        d.isBanned
                          ? 'bg-red-500/20 text-red-400'
                          : d.status === 'online'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {d.isBanned ? 'BANNED' : d.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Model: <span className="text-slate-200">{d.deviceName}</span></div>
                    <div>Phone: <span className="text-slate-200 font-mono">{d.phoneNumber}</span></div>
                    <div>Token: <span className="text-cyan-300 font-mono font-bold">{d.deviceToken?.slice(0, 14)}...</span></div>
                    <div>
                      Heartbeat:{' '}
                      <span className="text-slate-300">
                        {d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    {d.isBanned ? (
                      <button
                        onClick={() => handleAction('unban_device', undefined, d.deviceId)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-xs font-bold transition"
                      >
                        Unban Device
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('ban_device', undefined, d.deviceId)}
                        className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold transition"
                      >
                        Block Device
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
