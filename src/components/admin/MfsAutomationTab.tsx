import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  ShieldAlert,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Send,
  Terminal,
  Sliders,
  Cpu,
  Layers,
  Clock,
  QrCode,
  Eye,
  ShieldCheck,
  History,
  FileText,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { getSocket } from '../../lib/socket';
import {
  SmsTransaction,
  VerifyDevice,
  MfsVerificationSettings,
  VerificationLog,
  FraudLog,
  PaymentNumber,
  ApkVersionRecord,
  WalletTransactionLedger,
  AuditLog,
} from '../../types';
import { FraudDashboardTab } from './FraudDashboardTab';

export function MfsAutomationTab() {
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'devices' | 'sms' | 'simulator' | 'numbers' | 'apk_manager' | 'ledger' | 'fraud'
  >('overview');
  const [loading, setLoading] = useState(false);

  // Settings
  const [settings, setSettings] = useState<MfsVerificationSettings>({
    autoVerificationEnabled: true,
    manualVerificationEnabled: false,
    fallbackManualReview: true,
    verificationTimeoutMinutes: 10,
    allowedSmsAgeHours: 24,
    enableDeviceSync: true,
    deviceSecretToken: 'ehbd_sec_verify_token_2026',
    apkDownloadUrl: '/downloads/EarnHubVerify.apk',
    latestApkVersion: '2.0.4',
    forceUpdateApk: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Devices & SMS & Numbers
  const [devices, setDevices] = useState<VerifyDevice[]>([]);
  const [smsList, setSmsList] = useState<SmsTransaction[]>([]);
  const [numbers, setNumbers] = useState<PaymentNumber[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);

  // APK Version Manager State (PATCH 11 & 12)
  const [apkVersions, setApkVersions] = useState<ApkVersionRecord[]>([]);
  const [newApkVersion, setNewApkVersion] = useState('');
  const [newApkNotes, setNewApkNotes] = useState('');
  const [newApkSize, setNewApkSize] = useState('1.8 MB');
  const [newApkUrl, setNewApkUrl] = useState('/downloads/EarnHubVerify.apk');
  const [newApkForce, setNewApkForce] = useState(false);
  const [uploadingApk, setUploadingApk] = useState(false);

  // Financial Ledger & Audit State (PATCH 2 & 13)
  const [ledgerEntries, setLedgerEntries] = useState<WalletTransactionLedger[]>([]);
  const [auditLogEntries, setAuditLogEntries] = useState<AuditLog[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Retrying SMS Queue
  const [retryingQueue, setRetryingQueue] = useState(false);

  // Simulator Form
  const [simRawSms, setSimRawSms] = useState(
    'You have received Tk 500.00 from 01711111111. Ref . Fee Tk 0.00. Balance Tk 1,250.00. TrxID 9K28SA710P at 22/09/2026 14:30'
  );
  const [simMethod, setSimMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Add Number Form
  const [showAddNumModal, setShowAddNumModal] = useState(false);
  const [newNumMethod, setNewNumMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [newNumPhone, setNewNumPhone] = useState('');
  const [newNumType, setNewNumType] = useState('Personal');
  const [newNumLimit, setNewNumLimit] = useState(50000);

  // Copy helper
  const [copiedToken, setCopiedToken] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [settRes, devRes, smsRes, numRes, logRes, apkRes] = await Promise.all([
        apiRequest('/api/admin/mfs/settings'),
        apiRequest('/api/admin/verify-app/devices'),
        apiRequest('/api/admin/sms/transactions'),
        apiRequest('/api/admin/mfs/numbers'),
        apiRequest('/api/admin/mfs/logs'),
        apiRequest('/api/admin/apk/versions'),
      ]);

      if (settRes && settRes.settings) setSettings(settRes.settings);
      if (devRes && devRes.devices) setDevices(devRes.devices);
      if (smsRes && smsRes.transactions) setSmsList(smsRes.transactions);
      if (numRes && numRes.numbers) setNumbers(numRes.numbers);
      if (logRes) {
        setVerificationLogs(logRes.verificationLogs || []);
        setFraudLogs(logRes.fraudLogs || []);
      }
      if (apkRes && apkRes.versions) {
        setApkVersions(apkRes.versions);
      }
    } catch (err: any) {
      showToast('error', 'Failed to load MFS Data', err.message || 'Error fetching details');
    } finally {
      setLoading(false);
    }
  };

  const loadLedgerData = async () => {
    try {
      setLedgerLoading(true);
      const [ledgerRes, auditRes] = await Promise.all([
        apiRequest('/api/admin/financial/ledger'),
        apiRequest('/api/admin/financial/audit-logs'),
      ]);
      if (ledgerRes && ledgerRes.ledger) setLedgerEntries(ledgerRes.ledger);
      if (auditRes && auditRes.auditLogs) setAuditLogEntries(auditRes.auditLogs);
    } catch (err: any) {
      showToast('error', 'Ledger Error', err.message || 'Failed to load financial ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'ledger') {
      loadLedgerData();
    }
  }, [activeSubTab]);

  useEffect(() => {
    loadAllData();

    // Listen for realtime Socket.IO updates
    const socket = getSocket();
    if (socket) {
      const handleSmsSynced = (newSms: SmsTransaction) => {
        setSmsList((prev) => [newSms, ...prev.filter((s) => s.id !== newSms.id)]);
        showToast('info', 'Incoming Gateway SMS', `Received ৳${newSms.amount} via ${newSms.method} (TrxID: ${newSms.trxId})`);
      };

      const handleDeviceStatus = (updatedDev: VerifyDevice) => {
        setDevices((prev) => {
          const idx = prev.findIndex((d) => d.deviceId === updatedDev.deviceId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = updatedDev;
            return next;
          }
          return [updatedDev, ...prev];
        });
      };

      const handleFraud = (fraud: FraudLog) => {
        setFraudLogs((prev) => [fraud, ...prev]);
        showToast('error', 'Fraud Attempt Blocked', `${fraud.type.toUpperCase()}: ${fraud.details}`);
      };

      socket.on('mfs:sms_synced', handleSmsSynced);
      socket.on('mfs:device_status', handleDeviceStatus);
      socket.on('mfs:fraud_alert', handleFraud);

      return () => {
        socket.off('mfs:sms_synced', handleSmsSynced);
        socket.off('mfs:device_status', handleDeviceStatus);
        socket.off('mfs:fraud_alert', handleFraud);
      };
    }
  }, []);

  const handleSaveSettings = async (override?: Partial<MfsVerificationSettings>) => {
    try {
      setSavingSettings(true);
      const payload = { ...settings, ...(override || {}) };
      const res = await apiRequest('/api/admin/mfs/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res && res.settings) {
        setSettings(res.settings);
        showToast('success', 'Settings Saved', 'MFS Auto-Verification rules updated successfully.');
      }
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Could not update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleDeviceBan = async (id: string) => {
    try {
      const res = await apiRequest(`/api/admin/verify-app/devices/${id}/ban`, {
        method: 'POST',
      });
      if (res && res.success) {
        setDevices((prev) => prev.map((d) => (d.id === id ? res.device : d)));
        showToast('info', 'Device Status', `Device ban status updated.`);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Could not toggle ban');
    }
  };

  const handleSimulateSms = async () => {
    try {
      setSimulating(true);
      setSimResult(null);
      const res = await apiRequest('/api/admin/sms/simulate', {
        method: 'POST',
        body: JSON.stringify({
          rawSms: simRawSms,
          method: simMethod,
        }),
      });

      setSimResult(res);
      if (res.sms) {
        setSmsList((prev) => [res.sms, ...prev]);
      }
      showToast('success', 'SMS Simulator Executed', 'SMS successfully received, parsed, and checked for pending deposits!');
    } catch (err: any) {
      showToast('error', 'Simulation Failed', err.message || 'Could not parse test SMS');
    } finally {
      setSimulating(false);
    }
  };

  const handleAddPaymentNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumPhone || newNumPhone.length < 11) {
      showToast('error', 'Invalid Phone', 'Please provide a valid 11-digit phone number');
      return;
    }

    try {
      const res = await apiRequest('/api/admin/mfs/numbers', {
        method: 'POST',
        body: JSON.stringify({
          method: newNumMethod,
          number: newNumPhone,
          accountType: newNumType,
          dailyLimit: newNumLimit,
        }),
      });

      if (res && res.number) {
        setNumbers((prev) => [...prev, res.number]);
        setShowAddNumModal(false);
        setNewNumPhone('');
        showToast('success', 'Number Added', `New ${newNumMethod} payment number registered in pool.`);
      }
    } catch (err: any) {
      showToast('error', 'Failed', err.message || 'Could not add payment number');
    }
  };

  const handleToggleNumber = async (id: string) => {
    try {
      const res = await apiRequest(`/api/admin/mfs/numbers/${id}/toggle`, {
        method: 'POST',
      });
      if (res && res.number) {
        setNumbers((prev) => prev.map((n) => (n.id === id ? res.number : n)));
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment number from rotation?')) return;
    try {
      await apiRequest(`/api/admin/mfs/numbers/${id}`, {
        method: 'DELETE',
      });
      setNumbers((prev) => prev.filter((n) => n.id !== id));
      showToast('info', 'Deleted', 'Payment number removed.');
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleRetryQueue = async () => {
    try {
      setRetryingQueue(true);
      const res = await apiRequest('/api/admin/sms/retry-queue', { method: 'POST' });
      showToast('success', 'Queue Retried', res.message || `Reprocessed queued SMS entries.`);
      loadAllData();
    } catch (err: any) {
      showToast('error', 'Retry Failed', err.message || 'Could not retry SMS queue');
    } finally {
      setRetryingQueue(false);
    }
  };

  const handleUploadApk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApkVersion || !newApkVersion.trim()) {
      showToast('error', 'Validation Error', 'Version number is required (e.g. 2.0.5)');
      return;
    }
    try {
      setUploadingApk(true);
      const res = await apiRequest('/api/admin/apk/upload', {
        method: 'POST',
        body: JSON.stringify({
          version: newApkVersion.trim(),
          releaseNotes: newApkNotes.trim() || 'Official EarnHub Verify APK update with enhanced MFS verification.',
          fileSize: newApkSize.trim() || '1.8 MB',
          downloadUrl: newApkUrl.trim() || '/downloads/EarnHubVerify.apk',
          forceUpdate: newApkForce,
        }),
      });
      if (res && res.version) {
        showToast('success', 'APK Released', `Version ${res.version.version} registered as current active APK.`);
        setNewApkVersion('');
        setNewApkNotes('');
        loadAllData();
      }
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message || 'Failed to upload APK metadata');
    } finally {
      setUploadingApk(false);
    }
  };

  const handleToggleForceUpdate = async () => {
    try {
      const nextForce = !settings.forceUpdateApk;
      const res = await apiRequest('/api/admin/apk/toggle-force-update', {
        method: 'POST',
        body: JSON.stringify({ forceUpdate: nextForce }),
      });
      setSettings(prev => ({ ...prev, forceUpdateApk: res.forceUpdate }));
      showToast('info', 'Force Update Toggled', `Force update is now ${res.forceUpdate ? 'ENABLED (Strict lock)' : 'DISABLED (Optional)'}`);
      loadAllData();
    } catch (err: any) {
      showToast('error', 'Failed', err.message);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(settings.deviceSecretToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    showToast('success', 'Copied', 'Device Secret Token copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Smart Auto Deposit Verification
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              V20 Locked
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Realtime bKash & Nagad Android SMS Gateway with instant regex parsing, zero-delay wallet credits, and duplicate fraud prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Engine Overview & Rules', icon: Sliders },
          { id: 'devices', label: `Gateways (${devices.filter(d => d.status === 'online').length}/${devices.length})`, icon: Smartphone },
          { id: 'sms', label: `Gateway SMS (${smsList.length})`, icon: Radio },
          { id: 'apk_manager', label: `APK Manager (v${settings.latestApkVersion})`, icon: Download },
          { id: 'ledger', label: 'Financial Ledger & Audit', icon: FileText },
          { id: 'simulator', label: 'SMS Simulator', icon: Terminal },
          { id: 'numbers', label: `Numbers Pool (${numbers.length})`, icon: Layers },
          { id: 'fraud', label: `Fraud & Security Center (${fraudLogs.length})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/40 font-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: SYSTEM OVERVIEW & PRIMARY ENGINE RULES */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rules Card (Mandatory Specification) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Verification Engine Modes</h3>
                  <p className="text-xs text-slate-400">Strictly locked primary rules of EarnNetwork BD</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Rule v20.0
                </span>
              </div>

              {/* Mode 1: Automatic Verification */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Automatic Deposit Verification</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      Default ON (Mandatory)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Matches Amount, Sender Number, TrxID against incoming device SMS and auto-credits wallet atomically in under 2 seconds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.autoVerificationEnabled;
                    setSettings((s) => ({ ...s, autoVerificationEnabled: next }));
                    handleSaveSettings({ autoVerificationEnabled: next });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.autoVerificationEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.autoVerificationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mode 2: Manual Verification */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Manual Deposit Verification</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold border border-slate-700">
                      Default OFF (Optional Fallback)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    If enabled, unmatched transactions route to Admin Finance queue for manual review with optional screenshot preview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.manualVerificationEnabled;
                    setSettings((s) => ({ ...s, manualVerificationEnabled: next }));
                    handleSaveSettings({ manualVerificationEnabled: next });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.manualVerificationEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.manualVerificationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Fallback to Review */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-white">Fallback Unmatched to Manual Review</span>
                  <p className="text-xs text-slate-400">
                    If user submits before SMS arrives or network lags, keep in pending rather than rejecting immediately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.fallbackManualReview;
                    setSettings((s) => ({ ...s, fallbackManualReview: next }));
                    handleSaveSettings({ fallbackManualReview: next });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.fallbackManualReview ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.fallbackManualReview ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Additional Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Timeout Window (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.verificationTimeoutMinutes}
                    onChange={(e) => setSettings({ ...settings, verificationTimeoutMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Max time to wait for matching SMS</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Allowed SMS Age (Hours)
                  </label>
                  <input
                    type="number"
                    value={settings.allowedSmsAgeHours}
                    onChange={(e) => setSettings({ ...settings, allowedSmsAgeHours: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Prevents re-using old SMS</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Update Engine Parameters'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Setup & Android App Pairing Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Android Verify App Gateway</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                The official EarnNetwork BD Android SMS Forwarder runs as a foreground service on the SIM-bearing device. It listens for incoming bKash (16247) and Nagad (16167) messages, parses them in real-time, and posts them to <code className="text-emerald-400 font-mono">/api/admin/sms/sync</code>.
              </p>

              {/* Secret Token Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Device Authorization Secret Token
                </span>
                <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="font-mono text-xs text-emerald-400 truncate">
                    {settings.deviceSecretToken}
                  </span>
                  <button
                    onClick={copyToken}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
                    title="Copy Token"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500">
                  Paste this token into the Android Verify App settings upon initial installation.
                </span>
              </div>

              {/* Download APK Box */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">EarnHub Verify APK</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    v{settings.latestApkVersion}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Native Android application with auto-reconnect, 30s heartbeat telemetry, battery monitor, and foreground SMS listener.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={settings.apkDownloadUrl}
                    download
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center shadow transition"
                  >
                    Download APK
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const newVer = prompt('Enter new APK version string:', settings.latestApkVersion);
                      if (newVer) {
                        setSettings((s) => ({ ...s, latestApkVersion: newVer }));
                        handleSaveSettings({ latestApkVersion: newVer });
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Edit Version
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONNECTED DEVICES */}
      {activeSubTab === 'devices' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Active Android SMS Gateways</h3>
              <p className="text-xs text-slate-400">All registered devices sending bKash/Nagad transactional SMS</p>
            </div>
            <span className="text-xs text-slate-400">{devices.length} Total Devices</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((dev) => {
              const isOnline = dev.status === 'online' && !dev.isBanned;
              return (
                <div
                  key={dev.id}
                  className={`p-5 rounded-2xl border transition space-y-4 ${
                    isOnline
                      ? 'bg-slate-950 border-slate-800'
                      : dev.isBanned
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{dev.deviceName}</h4>
                        <span className="text-xs text-slate-400 font-mono">{dev.deviceId}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase flex items-center gap-1.5 ${
                        isOnline
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : dev.isBanned
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : dev.isBanned ? 'bg-rose-400' : 'bg-amber-400'
                        }`}
                      />
                      {dev.isBanned ? 'Banned' : dev.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">SIM Phone</span>
                      <span className="font-bold text-slate-200">{dev.phoneNumber || '01712345678'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Battery</span>
                      <span className="font-bold text-emerald-400">{dev.batteryPercent}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Network</span>
                      <span className="font-bold text-slate-300">{dev.networkType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">SMS Synced</span>
                      <span className="font-bold text-teal-300">{dev.totalSmsForwarded}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-500">
                    <span>Last Heartbeat: {new Date(dev.lastHeartbeatAt).toLocaleTimeString()}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDeviceBan(dev.id)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                        dev.isBanned
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'
                      }`}
                    >
                      {dev.isBanned ? 'Unban Device' : 'Ban Device'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GATEWAY SMS STREAM & RETRY QUEUE */}
      {activeSubTab === 'sms' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Synced SMS Stream & Processing Queue
              </h3>
              <p className="text-xs text-slate-400">
                Incoming raw SMS parsed into structured MFS transactions: Received → Parsed → Synced → Verified → Used
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetryQueue}
                disabled={retryingQueue}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${retryingQueue ? 'animate-spin' : ''}`} />
                <span>Retry Failed Queue</span>
              </button>
              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold">
                {smsList.length} Messages
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {smsList.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs">No SMS forwarded yet.</p>
            ) : (
              smsList.map((sms, idx) => (
                <div
                  key={`${sms.id || 'sms'}_${idx}`}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                          sms.method === 'bKash'
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        {sms.method}
                      </span>
                      <span className="font-bold text-white text-base">৳ {sms.amount.toLocaleString()}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-bold">
                        TrxID: {sms.trxId}
                      </span>

                      {/* Queue Status Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          sms.used
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : sms.verified
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : sms.queueStatus === 'Failed'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        Queue: {sms.queueStatus || (sms.used ? 'Used' : sms.verified ? 'Verified' : 'Synced')}
                      </span>

                      {sms.usedByUser && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Credited: {sms.usedByUser}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                      {sms.rawSms}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>Sender: <strong className="text-slate-300">{sms.senderNumber || 'Unknown'}</strong></span>
                      <span>Balance After: <strong className="text-slate-300">Tk {sms.balanceAfter || 'N/A'}</strong></span>
                      <span>Device: <strong className="text-slate-300 font-mono">{sms.deviceId}</strong></span>
                      {sms.retryCount ? <span>Retries: <strong className="text-amber-400">{sms.retryCount}</strong></span> : null}
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 shrink-0">
                    <span>{new Date(sms.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: APK VERSION MANAGER (PATCH 11 & 12) */}
      {activeSubTab === 'apk_manager' && (
        <div className="space-y-6">
          {/* Top Status & Force Update Control */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Public APK</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  v{settings.latestApkVersion}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                  Production
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">URL: {settings.apkDownloadUrl}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Force Update Enforcement</span>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${settings.forceUpdateApk ? 'text-rose-400' : 'text-slate-400'}`}>
                  {settings.forceUpdateApk ? 'Strict Lock (Enforced)' : 'Optional Updates'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleForceUpdate}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    settings.forceUpdateApk
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title="Toggle Force Update"
                >
                  {settings.forceUpdateApk ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                When enabled, outdated APKs are refused connection until updated.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Download & Distribute</span>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={settings.apkDownloadUrl}
                  download
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const fullUrl = `${window.location.origin}${settings.apkDownloadUrl}`;
                    navigator.clipboard.writeText(fullUrl);
                    showToast('success', 'Copied Link', 'Direct APK link copied to clipboard.');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Total Versions: {apkVersions.length}</p>
            </div>
          </div>

          {/* Upload & Register New APK Version Form */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Publish New EarnHub Verify APK Version
            </h3>

            <form onSubmit={handleUploadApk} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Version Code (e.g. 2.0.5)
                  </label>
                  <input
                    type="text"
                    value={newApkVersion}
                    onChange={(e) => setNewApkVersion(e.target.value)}
                    placeholder="2.0.5"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    APK File Size
                  </label>
                  <input
                    type="text"
                    value={newApkSize}
                    onChange={(e) => setNewApkSize(e.target.value)}
                    placeholder="1.8 MB"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Download Path or Cloud URL
                  </label>
                  <input
                    type="text"
                    value={newApkUrl}
                    onChange={(e) => setNewApkUrl(e.target.value)}
                    placeholder="/downloads/EarnHubVerify.apk"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Release Notes / Change Log
                </label>
                <textarea
                  value={newApkNotes}
                  onChange={(e) => setNewApkNotes(e.target.value)}
                  placeholder="Official APK update with automated MFS background syncing and offline queue retry..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newApkForce}
                    onChange={(e) => setNewApkForce(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Force users on older versions to update immediately</span>
                </label>

                <button
                  type="submit"
                  disabled={uploadingApk}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  {uploadingApk ? 'Publishing...' : 'Publish & Broadcast APK'}
                </button>
              </div>
            </form>
          </div>

          {/* Release History Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              APK Release Registry & Version History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Version</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Release Notes</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Force Update</th>
                    <th className="p-3">Released By</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {apkVersions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No previous APK versions recorded.
                      </td>
                    </tr>
                  ) : (
                    apkVersions.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-850/60 transition">
                        <td className="p-3 font-mono font-bold text-emerald-400">v{v.version}</td>
                        <td className="p-3">
                          {v.isCurrent ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                              CURRENT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300 max-w-sm">{v.releaseNotes}</td>
                        <td className="p-3 text-slate-400">{v.fileSize}</td>
                        <td className="p-3">
                          {v.forceUpdate ? (
                            <span className="text-rose-400 font-bold">Yes</span>
                          ) : (
                            <span className="text-slate-500">No</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">{v.uploadedBy}</td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(v.releasedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: FINANCIAL LEDGER & AUDIT (PATCH 2 & 13) */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Mandatory Wallet Transaction Ledger (wallet_transactions)
                </h3>
                <p className="text-xs text-slate-400">
                  Every wallet balance alteration must be immutably recorded with before/after state.
                </p>
              </div>
              <button
                type="button"
                onClick={loadLedgerData}
                disabled={ledgerLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Balance Before</th>
                    <th className="p-3">Balance After</th>
                    <th className="p-3">Reason / Ref</th>
                    <th className="p-3">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No ledger entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-850/60 transition">
                        <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-slate-300">{l.userId}</td>
                        <td className="p-3">
                          <span className="font-bold text-white">{l.transactionType}</span>
                        </td>
                        <td className="p-3 font-bold">
                          <span className={l.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {l.amount >= 0 ? `+৳${l.amount.toLocaleString()}` : `-৳${Math.abs(l.amount).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">৳{l.balanceBefore?.toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-white">৳{l.balanceAfter?.toLocaleString()}</td>
                        <td className="p-3 text-slate-300">
                          <div>{l.reason}</div>
                          {l.referenceId && <div className="text-[10px] text-slate-500 font-mono">Ref: {l.referenceId}</div>}
                        </td>
                        <td className="p-3 text-slate-400">{l.createdBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immutable Financial Audit Logs */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Immutable Financial Audit Trail (audit_logs)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor (Admin/System)</th>
                    <th className="p-3">Target User</th>
                    <th className="p-3">Action Code</th>
                    <th className="p-3">Delta / Changes</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {auditLogEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No financial audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogEntries.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-850/60 transition">
                        <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-200 font-bold">{a.adminId}</td>
                        <td className="p-3 font-mono text-slate-300">{a.userId}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                            {a.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          ৳{a.oldBalance?.toLocaleString()} → <strong className="text-white">৳{a.newBalance?.toLocaleString()}</strong>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] font-mono">{a.reference}</td>
                        <td className="p-3 text-slate-500 font-mono">{a.ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SMS GATEWAY SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Test SMS Parser & Instant Matcher</h3>
                <p className="text-xs text-slate-400">
                  Simulate an incoming SMS from bKash or Nagad to verify that regex parsing and instant wallet crediting work without an actual phone.
                </p>
              </div>

              {/* Sample Buttons */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Click to load sample SMS:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimMethod('bKash');
                      setSimRawSms(
                        `You have received Tk 500.00 from 01711111111. Ref . Fee Tk 0.00. Balance Tk 1,250.00. TrxID 9K28SA710P at ${new Date().toLocaleDateString('en-GB')} 14:30`
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-300 font-bold text-xs hover:bg-pink-950/70 transition cursor-pointer"
                  >
                    Load bKash Sample (৳500)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimMethod('Nagad');
                      setSimRawSms(
                        `Cash In of Tk 1,000.00 from 01822222222 received. Balance: Tk 2,300.00. TxnID: 72KB901P at ${new Date().toLocaleDateString('en-GB')} 15:45`
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-300 font-bold text-xs hover:bg-orange-950/70 transition cursor-pointer"
                  >
                    Load Nagad Sample (৳1,000)
                  </button>
                </div>
              </div>

              {/* Raw SMS Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Raw SMS Text
                </label>
                <textarea
                  rows={4}
                  value={simRawSms}
                  onChange={(e) => setSimRawSms(e.target.value)}
                  placeholder="Paste bKash or Nagad SMS here..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulateSms}
                disabled={simulating}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>{simulating ? 'Parsing & Matching...' : 'Simulate Incoming SMS'}</span>
              </button>
            </div>
          </div>

          {/* Simulation Output */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Parser & Verification Output</h3>
              </div>

              {simResult ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Status: Processed</span>
                      <span>Method: {simResult.sms?.method}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>TrxID: <span className="font-mono text-white font-bold">{simResult.sms?.trxId}</span></div>
                      <div>Amount: <span className="font-bold text-emerald-300">৳{simResult.sms?.amount}</span></div>
                      <div>Sender: <span className="text-white">{simResult.sms?.senderNumber}</span></div>
                      <div>Balance: <span className="text-white">Tk {simResult.sms?.balanceAfter}</span></div>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Run simulation to see real-time regex extraction and atomic wallet match results.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PAYMENT NUMBERS POOL */}
      {activeSubTab === 'numbers' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Payment Numbers Pool</h3>
              <p className="text-xs text-slate-400">
                Unlimited bKash and Nagad numbers rotated for deposits with daily volume tracking
              </p>
            </div>
            <button
              onClick={() => setShowAddNumModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Number</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {numbers.map((num) => (
              <div key={num.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                      num.method === 'bKash'
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}
                  >
                    {num.method}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      num.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {num.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <span className="text-lg font-mono font-bold text-white block">{num.number}</span>
                  <span className="text-xs text-slate-400">{num.accountType} Account</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <span className="text-white font-bold">৳{num.dailyLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Count:</span>
                    <span className="text-white font-bold">{num.usageCount} times</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleToggleNumber(num.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    {num.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteNumber(num.id)}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: FRAUD & SECURITY CENTER (PATCH 10) */}
      {activeSubTab === 'fraud' && (
        <FraudDashboardTab />
      )}

      {/* Modal: Add Payment Number */}
      {showAddNumModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add MFS Payment Number</h3>
            <form onSubmit={handleAddPaymentNumber} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewNumMethod('bKash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newNumMethod === 'bKash' ? 'bg-pink-950 border-pink-500 text-pink-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNumMethod('Nagad')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newNumMethod === 'Nagad' ? 'bg-orange-950 border-orange-500 text-orange-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Nagad
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Number (11 digits)</label>
                <input
                  type="text"
                  value={newNumPhone}
                  onChange={(e) => setNewNumPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Account Type</label>
                  <select
                    value={newNumType}
                    onChange={(e) => setNewNumType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Agent">Agent</option>
                    <option value="Merchant">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Daily Limit (TK)</label>
                  <input
                    type="number"
                    value={newNumLimit}
                    onChange={(e) => setNewNumLimit(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNumModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Save Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
