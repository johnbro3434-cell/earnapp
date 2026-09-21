import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, X, Link as LinkIcon, Cloud } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface ImageUploadInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  folder?: string;
  helperText?: string;
  required?: boolean;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'https://res.cloudinary.com/... or paste image URL',
  folder = 'earnhub_bd_uploads',
  helperText,
  required = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setSuccessInfo(null);
    setUploading(true);
    setUploadProgress('Reading file...');

    try {
      // Convert to Base64 data URL
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          setUploadProgress('Uploading to Cloudinary...');

          const res = await apiRequest('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
              image: base64Data,
              folder,
            }),
          });

          if (res && res.url) {
            onChange(res.url);
            if (res.provider === 'cloudinary') {
              setSuccessInfo('Uploaded to Cloudinary successfully!');
            } else if (res.warning) {
              setSuccessInfo('Uploaded (' + res.warning + ')');
            } else {
              setSuccessInfo('Image uploaded successfully!');
            }
          } else {
            setError(res?.error || 'Upload failed without URL response.');
          }
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'Failed to upload image to Cloudinary.');
        } finally {
          setUploading(false);
          setUploadProgress('');
        }
      };

      reader.onerror = () => {
        setError('Error reading local file.');
        setUploading(false);
        setUploadProgress('');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'File processing error.');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
            <Cloud className="w-3 h-3" /> Cloudinary Enabled
          </span>
        </div>
      )}

      {/* Main Input & Upload Button Group */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <LinkIcon className="w-3.5 h-3.5" />
          </div>
          <input
            id={id}
            type="text"
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value);
              setError(null);
              setSuccessInfo(null);
            }}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuccessInfo(null);
                setError(null);
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {/* Upload Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-950 transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadProgress || 'Uploading...'}</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </>
          )}
        </button>
      </div>

      {/* Drag and Drop Zone if empty or dragged */}
      {(!value || dragActive) && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-3.5 rounded-xl border-2 border-dashed transition text-center cursor-pointer ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Drag & drop or <span className="text-cyan-400 font-semibold underline">browse file</span> to upload to Cloudinary (PNG, JPG, WEBP)</span>
          </div>
        </div>
      )}

      {/* Upload Messages */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successInfo && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/50">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}

      {/* Image Preview */}
      {value && (
        <div className="relative inline-block mt-1">
          <div className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-xl max-w-md">
            <img
              src={value}
              alt="Preview"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-mono text-slate-300 truncate block">{value}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3 h-3" /> Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {helperText && <p className="text-[10px] text-slate-500">{helperText}</p>}
    </div>
  );
};
