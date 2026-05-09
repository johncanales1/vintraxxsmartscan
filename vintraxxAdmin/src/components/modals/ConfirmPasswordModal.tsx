'use client';

/**
 * ConfirmPasswordModal — reusable password-gated confirmation prompt for
 * destructive admin actions (delete user, delete terminal, bulk delete,
 * delete audit log, etc.).
 *
 * Shaped after `BackupModal`: the admin types their current password, we
 * verify it via `POST /admin/verify-password` first, and only invoke the
 * parent-supplied `onConfirm` callback once verification succeeds. If
 * verification fails we surface the backend error (wrong password / locked
 * admin) and keep the modal open so the operator can retry.
 *
 * The `onConfirm` callback owns the actual destructive API call. Any error
 * it throws is surfaced via `toast.error` and the modal stays open — this
 * mirrors how BackupModal handles its backup-download errors.
 */

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, Lock, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title: string;
  /** Free-form summary the admin must confirm. Accepts markup so callers
   *  can bold counts or item names. */
  message: React.ReactNode;
  actionLabel?: string;
  /** When true (default) the confirm button is red + shows a warning banner. */
  destructive?: boolean;
  /** Parent-owned destructive call. Rejected promises show their message in
   *  a toast and keep the modal open. Resolving closes the modal. */
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export default function ConfirmPasswordModal({
  title,
  message,
  actionLabel = 'Delete',
  destructive = true,
  onConfirm,
  onClose,
}: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    setLoading(true);
    try {
      // Verify first — this way an incorrect password never fires the
      // destructive callback, regardless of what onConfirm does.
      await api.verifyPassword(password);
    } catch (err: any) {
      toast.error(err?.message || 'Invalid password');
      setLoading(false);
      return;
    }
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${actionLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const accentBg = destructive
    ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
  const confirmBtn = destructive
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentBg}`}>
              {destructive ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>

          {destructive && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This action is <span className="font-bold">irreversible</span>. Enter your admin password to confirm.
              </p>
            </div>
          )}

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Admin password"
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
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
              className={`flex-1 py-2.5 rounded-xl ${confirmBtn} text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : destructive ? (
                <Trash2 size={16} />
              ) : null}
              {loading ? 'Verifying...' : actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
