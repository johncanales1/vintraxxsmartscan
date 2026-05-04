'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, Download, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

export default function BackupModal({ onClose }: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error('Please enter your password');
    setLoading(true);
    try {
      await api.verifyPassword(password);
      // Password verified — trigger backup download
      const token = localStorage.getItem('admin_token');
      const backupUrl = api.getBackupUrl();
      const res = await fetch(backupUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Pull the real error out of the response body so the admin knows
        // what happened (e.g. pg_dump missing on server, insufficient disk).
        // Fall back to the status text if the body isn't JSON.
        let errMsg = `Backup failed: ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) errMsg = body.error;
        } catch {
          try {
            const text = await res.text();
            if (text) errMsg = text.slice(0, 300);
          } catch {
            // give up — the status-code message above is good enough.
          }
        }
        throw new Error(errMsg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vintraxx-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Invalid password or backup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Download size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Download Backup</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleDownload} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter your admin password to confirm the backup download.
          </p>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              The backup contains <span className="font-bold">all user data, scans, and reports</span>. Handle with care.
            </p>
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Admin password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={16} />}
              {loading ? 'Verifying...' : 'Download'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
