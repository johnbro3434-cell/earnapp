import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  CheckCircle,
  X,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { AdminUser, AdminRole } from '../../types';

export function AdminUsersTab() {
  const { admin: currentAdmin } = useAuth();
  const { showToast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('Manager Admin');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([
    'dashboard',
    'users',
    'support',
  ]);
  const [creating, setCreating] = useState(false);

  // Edit / Password Reset Modal
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('Manager Admin');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  const availablePermissions = [
    { key: 'dashboard', label: 'Dashboard & Live KPIs' },
    { key: 'users', label: 'User CRM & Wallets' },
    { key: 'deposits', label: 'Deposits Review & Approvals' },
    { key: 'withdrawals', label: 'Withdrawals Review & Paid' },
    { key: 'wallet', label: 'Direct Wallet Adjustments' },
    { key: 'packages', label: 'Package Management' },
    { key: 'tasks', label: 'Video Tasks & Cloudinary' },
    { key: 'referrals', label: 'Referral Team Commissions' },
    { key: 'salary', label: 'Monthly Leadership Salary' },
    { key: 'campaigns', label: 'Campaigns & Banners' },
    { key: 'promocodes', label: 'Promo Codes & Gifts' },
    { key: 'holidays', label: 'Holidays & Off Days' },
    { key: 'sliders', label: 'Homepage Sliders' },
    { key: 'notifications', label: 'Push Notifications' },
    { key: 'analytics', label: 'Financial Analytics' },
    { key: 'security', label: 'Anti-Fraud & Device Ban' },
    { key: 'payment_numbers', label: 'Payment Numbers Pool' },
    { key: 'cloudinary', label: 'Cloudinary Configuration' },
    { key: 'branding', label: 'Branding & Social Links' },
    { key: 'settings', label: 'Global Emergency Switches' },
    { key: 'support', label: 'Support Ticket CRM' },
    { key: 'system_health', label: 'System Health Diagnostics' },
    { key: 'activity_logs', label: 'Immutable Audit Logs' },
  ];

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/admin-users');
      if (res && res.adminUsers) {
        setAdminUsers(res.adminUsers);
      }
    } catch (err: any) {
      showToast('error', 'Load Failed', err.message || 'Could not fetch admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone || !newName || !newPassword) {
      showToast('error', 'Missing Fields', 'Phone, Name, and Password are required.');
      return;
    }

    try {
      setCreating(true);
      const res = await apiRequest('/api/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify({
          phone: newPhone,
          name: newName,
          role: newRole,
          password: newPassword,
          email: newEmail,
          permissions: newPermissions,
        }),
      });

      showToast('success', 'Admin Created', res.message || 'New admin account created.');
      setShowCreateModal(false);
      setNewPhone('');
      setNewName('');
      setNewPassword('');
      setNewEmail('');
      fetchAdminUsers();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.message || 'Could not create admin account.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditName(admin.name);
    setEditRole(admin.role);
    setEditStatus(admin.status || 'active');
    setEditEmail(admin.email || '');
    setEditPassword('');
    setEditPermissions(admin.permissions || []);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    try {
      setUpdating(true);
      const res = await apiRequest(`/api/admin/admin-users/${editingAdmin.id}/update`, {
        method: 'POST',
        body: JSON.stringify({
          name: editName,
          role: editRole,
          status: editStatus,
          email: editEmail,
          newPassword: editPassword || undefined,
          permissions: editPermissions,
        }),
      });

      showToast('success', 'Admin Updated', res.message || 'Admin settings updated.');
      setEditingAdmin(null);
      fetchAdminUsers();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Failed to update admin user.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete administrator "${name}"?`)) return;

    try {
      const res = await apiRequest(`/api/admin/admin-users/${id}`, {
        method: 'DELETE',
      });
      showToast('success', 'Admin Deleted', res.message || 'Admin account deleted.');
      fetchAdminUsers();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete admin account.');
    }
  };

  const togglePermission = (permKey: string, isEdit = false) => {
    if (isEdit) {
      setEditPermissions((prev) =>
        prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
      );
    } else {
      setNewPermissions((prev) =>
        prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Administrator Personnel & Access Control</h2>
              <p className="text-xs text-slate-400">
                Manage executive staff, finance officers, support staff, and granular permissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdminUsers}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {currentAdmin?.role === 'Main Admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-amber-950/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Active Staff & Administrators ({adminUsers.length})</span>
          <span className="text-slate-500">Only Main Admin can create or delete administrative staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-800">
              <tr>
                <th className="p-4">Administrator</th>
                <th className="p-4">Phone / Contact</th>
                <th className="p-4">Role Badge</th>
                <th className="p-4">Status</th>
                <th className="p-4">Permissions</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {adminUsers.map((a) => {
                const isSuper = a.role === 'Main Admin';
                return (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xs">
                          {a.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{a.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">ID: {a.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-medium text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span>{a.phone}</span>
                      </div>
                      {a.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{a.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                          isSuper
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : a.role === 'Finance Admin'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : a.role === 'Marketing Admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : a.role === 'Support Admin'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.status === 'disabled'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {a.status || 'active'}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {isSuper ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                            Full Master Access (All Modules)
                          </span>
                        ) : a.permissions && a.permissions.length > 0 ? (
                          a.permissions.slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">Standard</span>
                        )}
                        {!isSuper && a.permissions && a.permissions.length > 4 && (
                          <span className="text-[10px] text-amber-400 font-bold">
                            +{a.permissions.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      {currentAdmin?.role === 'Main Admin' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                            title="Edit Permissions & Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {a.id !== currentAdmin?.id && (
                            <button
                              onClick={() => handleDeleteAdmin(a.id, a.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Delete Administrator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">View Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white">Create New Administrator</h3>
                <p className="text-xs text-slate-400">
                  Provision an executive role with custom permission matrix
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Number (Login ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Administrative Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Manager Admin">Manager Admin (CRM & Team)</option>
                    <option value="Finance Admin">Finance Admin (Deposits & Withdrawals)</option>
                    <option value="Marketing Admin">Marketing Admin (Banners & Promos)</option>
                    <option value="Support Admin">Support Admin (Tickets & Inquiries)</option>
                    <option value="Main Admin">Main Admin (Master Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Email (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@earnhubbd.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Permission Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Select Granular Module Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={newPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key, false)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-50"
                >
                  {creating ? 'Creating Account...' : 'Confirm & Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setEditingAdmin(null)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white">Edit Admin: {editingAdmin.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Phone: {editingAdmin.phone}</p>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="disabled">Disabled (Access Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Manager Admin">Manager Admin</option>
                    <option value="Finance Admin">Finance Admin</option>
                    <option value="Marketing Admin">Marketing Admin</option>
                    <option value="Support Admin">Support Admin</option>
                    <option value="Main Admin">Main Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave empty to keep unchanged"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Module Permissions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Update Permissions Matrix
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={editPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key, true)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Admin Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
