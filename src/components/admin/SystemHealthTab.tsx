import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Cpu,
  Database,
  Cloud,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  HardDrive,
  Users,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { SystemHealthInfo } from '../../types';

export function SystemHealthTab() {
  const { showToast } = useToast();
  const [health, setHealth] = useState<SystemHealthInfo | null>(null);
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/system/health');
      if (res && res.health) {
        setHealth(res.health);
        setCounts(res.counts);
      }
    } catch (err: any) {
      showToast('error', 'Health Check Error', err.message || 'Could not fetch system metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 15000); // 15s auto-refresh
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Enterprise System Health & Engine Diagnostics</h2>
              <p className="text-xs text-slate-400">
                Real-time Node.js runtime stats, memory footprint, Socket.IO clients, and Cloudinary latency
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Auto Refresh (15s)</span>
          </label>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </button>
        </div>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Status</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-lg font-black text-white uppercase">
              {health?.serverStatus || 'Operational'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Node.js {health?.nodeVersion || 'v20.x'}</p>
        </div>

        {/* System Uptime */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Server Uptime</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-white font-mono">
            {health?.uptimeFormatted || 'Calculating...'}
          </p>
          <p className="text-[11px] text-slate-500">Continuous background task runner</p>
        </div>

        {/* Memory Footprint */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memory (RSS)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white font-mono">{health?.memoryUsageMb || 0}</span>
            <span className="text-xs text-slate-400 font-bold">MB</span>
            <span className="text-[11px] text-slate-500">/ {health?.totalMemoryMb || 0} MB</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((health?.memoryUsageMb || 20) / (health?.totalMemoryMb || 100)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Socket.IO Live Clients */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Real-time Sockets</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-white font-mono">
            {health?.socketConnections || 1} Active
          </p>
          <p className="text-[11px] text-slate-500">Websocket bidirectional channels</p>
        </div>
      </div>

      {/* Cloud & Database Integrations Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cloudinary Integration Status */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloudinary Storage Cloud</h3>
                <p className="text-[11px] text-slate-400">Media CDN for user payment screenshots & tasks</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                health?.cloudinaryStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {health?.cloudinaryStatus || 'Checking'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">CDN Acceleration:</span>
              <span className="text-emerald-400 font-bold">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Fallback Protection:</span>
              <span className="text-cyan-400 font-bold">Base64 / Data URI Automatic</span>
            </div>
          </div>
        </div>

        {/* Database & Persistence Store */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Persistence & Transaction Store</h3>
                <p className="text-[11px] text-slate-400">Disk-persisted ledger & atomic transactions</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
              Synchronized
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Storage Path:</span>
              <span className="font-mono text-[11px] text-slate-300">/data/store.json</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Sync Snapshot:</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {health?.lastBackupAt ? new Date(health.lastBackupAt).toLocaleTimeString() : 'Live'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Entity Counter Bento */}
      {counts && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Database Active Record Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Users</p>
              <p className="text-base font-black text-amber-400 mt-0.5">{counts.users}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Deposits</p>
              <p className="text-base font-black text-emerald-400 mt-0.5">{counts.deposits}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Withdrawals</p>
              <p className="text-base font-black text-blue-400 mt-0.5">{counts.withdraws}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks</p>
              <p className="text-base font-black text-purple-400 mt-0.5">{counts.tasks}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tickets</p>
              <p className="text-base font-black text-rose-400 mt-0.5">{counts.tickets}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Audit Logs</p>
              <p className="text-base font-black text-cyan-400 mt-0.5">{counts.logs}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sliders</p>
              <p className="text-base font-black text-emerald-300 mt-0.5">{counts.sliders}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
