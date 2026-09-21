import React, { useState, useEffect } from 'react';
import {
  Tv,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Play,
  ExternalLink,
  Coins,
  Clock,
  Layers,
  Sparkles,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { VideoTask, Package } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

export function TasksTab() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<VideoTask | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number>(25);
  const [category, setCategory] = useState('Sponsor Ads');
  const [requiredPackageId, setRequiredPackageId] = useState('all');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Video Preview Modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const fetchTasksAndPackages = async () => {
    try {
      setLoading(true);
      const [tasksRes, pkgsRes] = await Promise.all([
        apiRequest('/api/admin/tasks'),
        apiRequest('/api/admin/packages'),
      ]);

      if (tasksRes && tasksRes.tasks) {
        setTasks(tasksRes.tasks);
      }
      if (pkgsRes && pkgsRes.packages) {
        setPackages(pkgsRes.packages);
      }
    } catch (err: any) {
      showToast('error', 'Load Failed', err.message || 'Could not fetch tasks data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndPackages();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setVideoUrl('');
    setThumbnailUrl('');
    setRewardAmount(25);
    setCategory('Sponsor Ads');
    setRequiredPackageId('all');
    setEnabled(true);
    setShowModal(true);
  };

  const openEditModal = (task: VideoTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setVideoUrl(task.videoUrl);
    setThumbnailUrl(task.thumbnailUrl || '');
    setRewardAmount(task.rewardAmount || 25);
    setCategory(task.category || 'Sponsor Ads');
    setRequiredPackageId(task.requiredPackageId || 'all');
    setEnabled(task.enabled !== undefined ? task.enabled : true);
    setShowModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      showToast('error', 'Missing Information', 'Task title and video URL are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingTask) {
        await apiRequest(`/api/admin/tasks/${editingTask.id}/update`, {
          method: 'POST',
          body: JSON.stringify({
            title,
            videoUrl,
            thumbnailUrl,
            rewardAmount,
            category,
            requiredPackageId,
            enabled,
          }),
        });
        showToast('success', 'Task Updated', 'Sponsored video task updated successfully.');
      } else {
        await apiRequest('/api/admin/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title,
            videoUrl,
            thumbnailUrl,
            rewardAmount,
            category,
            requiredPackageId,
            enabled,
          }),
        });
        showToast('success', 'Task Published', 'New sponsored video task published live.');
      }
      setShowModal(false);
      fetchTasksAndPackages();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Could not save video task.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: boolean, taskTitle: string) => {
    try {
      await apiRequest(`/api/admin/tasks/${id}/toggle`, { method: 'POST' });
      showToast('success', 'Status Changed', `Task is now ${!currentStatus ? 'Active' : 'Disabled'}.`);
      fetchTasksAndPackages();
    } catch (err: any) {
      showToast('error', 'Toggle Failed', err.message || 'Could not toggle task status.');
    }
  };

  const handleDeleteTask = async (id: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete task "${taskTitle}"?`)) return;
    try {
      await apiRequest(`/api/admin/tasks/${id}`, { method: 'DELETE' });
      showToast('success', 'Task Deleted', 'Video task removed successfully.');
      fetchTasksAndPackages();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete task.');
    }
  };

  const getPackageBadgeLabel = (pkgId?: string) => {
    if (!pkgId || pkgId === 'all') {
      return { text: '🌐 All Users (Trial & VIP)', style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    }
    if (pkgId === 'vip_only') {
      return { text: '⭐ VIP Exclusive (Any Tier)', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    const matched = packages.find((p) => p.id === pkgId);
    if (matched) {
      return { text: `💎 ${matched.name} (৳${matched.price}+)`, style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    return { text: `Package: ${pkgId}`, style: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Sponsored Video Tasks & Package Assignment (টাস্ক ম্যানেজমেন্ট)
            </h3>
            <p className="text-xs text-slate-400">
              Publish 10-second video tasks, assign target VIP package membership tiers, and control rewards.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Publish New Video Task</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Tasks</span>
          <p className="text-xl font-black text-white mt-1">{tasks.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Tasks</span>
          <p className="text-xl font-black text-emerald-400 mt-1">
            {tasks.filter((t) => t.enabled !== false).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Task Duration</span>
          <p className="text-xl font-black text-cyan-400 mt-1">10 Seconds (Strict)</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Packages Available</span>
          <p className="text-xl font-black text-amber-400 mt-1">{packages.length} Tiers</p>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
          <p className="text-xs">Loading video tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
          <Tv className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-medium">No video tasks created yet.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            Create Your First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const isEnabled = task.enabled !== false;
            const pkgInfo = getPackageBadgeLabel(task.requiredPackageId);

            return (
              <div
                key={task.id}
                className={`rounded-3xl bg-slate-900/90 border ${
                  isEnabled ? 'border-slate-800' : 'border-rose-900/40 opacity-75'
                } overflow-hidden flex flex-col justify-between shadow-xl transition hover:border-slate-700`}
              >
                {/* Thumbnail & Badges */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                  <img
                    src={task.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'}
                    alt={task.title}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/10 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      10s
                    </span>

                    <button
                      onClick={() => handleToggleTask(task.id, isEnabled, task.title)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-500/80 text-white border-emerald-400'
                          : 'bg-rose-500/80 text-white border-rose-400'
                      }`}
                    >
                      {isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Category & Preview overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 px-2.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700">
                      {task.category || 'Sponsor Ads'}
                    </span>

                    <button
                      onClick={() => setPreviewVideoUrl(task.videoUrl)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] shadow-md transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm line-clamp-2">{task.title}</h4>

                    {/* Assigned Package Badge */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                        Target Membership Tier:
                      </span>
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${pkgInfo.style}`}>
                        {pkgInfo.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                      <span>Per-View Base Rate:</span>
                      <span className="text-emerald-400 font-bold font-mono text-sm">
                        ৳{task.rewardAmount || 25} TK
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit Task</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-cyan-400" />
                  {editingTask ? 'Edit Video Task' : 'Publish New Sponsored Task'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set video stream URL and assign to target VIP package tiers.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Task / Video Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Watch & Earn Promo #1 / Brand Sponsor Spotlight"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Video URL (YouTube or Direct MP4 Stream)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://commondatastorage.googleapis.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-500 outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Strictly 10-second countdown applies automatically to all tasks.
                </span>
              </div>

              {/* Thumbnail with Cloudinary Uploader */}
              <div>
                <ImageUploadInput
                  id="task-thumb-uploader"
                  label="Thumbnail Cover Image"
                  value={thumbnailUrl}
                  onChange={setThumbnailUrl}
                  folder="earnhub_tasks"
                  placeholder="Upload thumbnail or paste image URL"
                  helperText="Leave empty to use high-resolution placeholder cover."
                />
              </div>

              {/* TARGET PACKAGE ASSIGNMENT (THE REQUESTED FEATURE!) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Assign To Package / Membership Tier (প্যাকেজ অ্যাসাইন করুন)
                </label>
                <select
                  value={requiredPackageId}
                  onChange={(e) => setRequiredPackageId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-cyan-500 outline-none"
                >
                  <option value="all">🌐 All Users (Free Trial & All VIP Packages)</option>
                  <option value="vip_only">⭐ VIP Only (Any Paid VIP Package)</option>
                  <optgroup label="Specific VIP Package Tiers:">
                    {packages
                      .filter((p) => p.id !== 'pkg_trial')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          💎 {p.name} (৳{p.price.toLocaleString()} • ৳{p.dailyIncome}/day)
                        </option>
                      ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Assigning a specific package ensures only members on that tier (or all members if set to All) can watch and earn from this task.
                </p>
              </div>

              {/* Reward & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reward (৳ TK)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 text-xs font-mono font-bold focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Note: User's package rate auto-calculates per video
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Sponsor Ads / Tech / Crypto"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-slate-950"
                  />
                  <span className="font-semibold">Active and published to user task queues</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                >
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Publish Task Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                Task Video Preview
              </h3>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <iframe
                src={
                  previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be')
                    ? previewVideoUrl.replace('watch?v=', 'embed/').split('&')[0]
                    : previewVideoUrl
                }
                title="Preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
