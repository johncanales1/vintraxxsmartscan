'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { X, UserPlus, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isDealer: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateUserModal({ isDealer, onClose, onCreated }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pricePerLaborHour, setPricePerLaborHour] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const qrCameraRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (file: File, type: 'logo' | 'qr') => {
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be less than 10MB');
    const base64 = await fileToBase64(file);
    if (type === 'logo') {
      setLogoPreview(base64);
      setLogoBase64(base64);
    } else {
      setQrPreview(base64);
      setQrBase64(base64);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password are required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.createUser({
        email,
        password,
        isDealer,
        pricePerLaborHour: pricePerLaborHour ? parseFloat(pricePerLaborHour) : undefined,
        logoUrl: logoBase64 || undefined,
        qrCodeUrl: qrBase64 || undefined,
      });
      toast.success(`${isDealer ? 'Dealer' : 'User'} created successfully`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserPlus size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Add {isDealer ? 'Dealer' : 'User'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
              required
            />
          </div>
          {isDealer && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price Per Labor Hour ($)</label>
                <input
                  type="number"
                  value={pricePerLaborHour}
                  onChange={(e) => setPricePerLaborHour(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="199"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dealer Logo</label>
                <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'logo')} />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <Upload size={14} /> Upload
                  </button>
                  {logoPreview && (
                    <div className="flex items-center gap-2">
                      <img src={logoPreview} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-gray-200 dark:border-gray-600" />
                      <button type="button" onClick={() => { setLogoPreview(null); setLogoBase64(null); }} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">QR Code</label>
                <input type="file" ref={qrInputRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'qr')} />
                <input type="file" ref={qrCameraRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'qr')} />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => qrInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <Upload size={14} /> Upload
                  </button>
                  <button type="button" onClick={() => qrCameraRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <Camera size={14} /> Camera
                  </button>
                  {qrPreview && (
                    <div className="flex items-center gap-2">
                      <img src={qrPreview} alt="QR" className="w-10 h-10 rounded-lg object-contain border border-gray-200 dark:border-gray-600" />
                      <button type="button" onClick={() => { setQrPreview(null); setQrBase64(null); }} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
              {loading ? 'Creating...' : `Create ${isDealer ? 'Dealer' : 'User'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
