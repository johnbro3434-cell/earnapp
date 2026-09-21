import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowUpDown,
  RefreshCw,
  X,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { HomeSlider } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

export function SlidersTab() {
  const { showToast } = useToast();
  const [sliders, setSliders] = useState<HomeSlider[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState<HomeSlider | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Now');
  const [buttonLink, setButtonLink] = useState('/');
  const [sortOrder, setSortOrder] = useState(1);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/sliders');
      if (res && res.sliders) {
        setSliders(res.sliders);
      }
    } catch (err: any) {
      showToast('error', 'Load Failed', err.message || 'Could not fetch homepage sliders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const openCreateModal = () => {
    setEditingSlider(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setButtonText('Explore Now');
    setButtonLink('/');
    setSortOrder(sliders.length + 1);
    setStatus('active');
    setShowModal(true);
  };

  const openEditModal = (slider: HomeSlider) => {
    setEditingSlider(slider);
    setTitle(slider.title);
    setSubtitle(slider.subtitle || '');
    setImageUrl(slider.imageUrl);
    setButtonText(slider.buttonText || 'Explore Now');
    setButtonLink(slider.buttonLink || '/');
    setSortOrder(slider.sortOrder);
    setStatus(slider.status);
    setShowModal(true);
  };

  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast('error', 'Missing Information', 'Slider title and image URL are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingSlider) {
        await apiRequest(`/api/admin/sliders/${editingSlider.id}/update`, {
          method: 'POST',
          body: JSON.stringify({
            title,
            subtitle,
            imageUrl,
            buttonText,
            buttonLink,
            sortOrder,
            status,
          }),
        });
        showToast('success', 'Slider Updated', 'Homepage slider updated successfully.');
      } else {
        await apiRequest('/api/admin/sliders', {
          method: 'POST',
          body: JSON.stringify({
            title,
            subtitle,
            imageUrl,
            buttonText,
            buttonLink,
            sortOrder,
            status,
          }),
        });
        showToast('success', 'Slider Created', 'New homepage slider added live.');
      }
      setShowModal(false);
      fetchSliders();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Could not save slider.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSlider = async (id: string) => {
    try {
      await apiRequest(`/api/admin/sliders/${id}/toggle`, { method: 'POST' });
      showToast('success', 'Status Toggled', 'Slider visibility updated.');
      fetchSliders();
    } catch (err: any) {
      showToast('error', 'Toggle Failed', err.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteSlider = async (id: string, slideTitle: string) => {
    if (!confirm(`Are you sure you want to delete slider "${slideTitle}"?`)) return;
    try {
      await apiRequest(`/api/admin/sliders/${id}`, { method: 'DELETE' });
      showToast('success', 'Slider Deleted', 'Slider removed from homepage carousel.');
      fetchSliders();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete slider.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Homepage Carousel & Slider Manager</h2>
              <p className="text-xs text-slate-400">
                Upload Cloudinary banners, configure promotional call-to-actions, and reorder slides
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSliders}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-amber-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Slider</span>
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sliders.map((slide) => (
          <div
            key={slide.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-slate-700 transition"
          >
            {/* Banner Preview */}
            <div className="relative h-44 bg-slate-950 overflow-hidden">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white border border-slate-700">
                  Order: #{slide.sortOrder}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                    slide.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {slide.status}
                </span>
              </div>

              {slide.buttonText && (
                <div className="absolute bottom-3 left-3">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-md">
                    {slide.buttonText} →
                  </span>
                </div>
              )}
            </div>

            {/* Slider Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1">{slide.title}</h3>
                {slide.subtitle && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{slide.subtitle}</p>
                )}
                {slide.buttonLink && (
                  <p className="text-[11px] text-slate-500 font-mono truncate mt-2">
                    Target: {slide.buttonLink}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleToggleSlider(slide.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    slide.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {slide.status === 'active' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(slide)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSlider(slide.id, slide.title)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Slider Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {editingSlider ? 'Edit Homepage Slider' : 'Add New Homepage Slider'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlider} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Slider Main Heading / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Earn Daily Micro-Task Rewards"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subtitle / Promo Description (Optional)
                </label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Watch 10-second sponsor videos and get instant bKash & Nagad payments"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Image with Cloudinary uploader */}
              <div>
                <ImageUploadInput
                  label="Slider Banner Image (Cloudinary Supported)"
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="homepage_sliders"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Start Free Trial"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Button Destination Link
                  </label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="/packages or /tasks"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active (Visible on Homepage)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSlider ? 'Update Slider' : 'Publish Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
