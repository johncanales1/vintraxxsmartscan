'use client';

/**
 * ResetUserPasswordModal — super-admin tool to rotate a user's password.
 *
 * Why this exists:
 *   The "Add Dealer" flow lets an admin set a password at user creation,
 *   but the regular update flow (`PUT /admin/users/:id`) deliberately
 *   omits `password` to avoid silent overwrites. That left admins with
 *   no way to recover a forgotten dealer password short of deleting and
 *   re-creating the user (which would purge their scans, terminals,
 *   appraisals, etc).
 *
 * Flow:
 *   1. Operator types the new password + confirmation locally.
 *   2. The admin's own password is verified via `verifyAdminPassword`
 *      (same pattern as `ConfirmPasswordModal`) — re-uses the existing
 *      audit trail and brute-force lockouts.
 *   3. `POST /admin/users/:id/reset-password` performs the bcrypt-rehash
 *      and invalidates any outstanding PasswordResetToken rows.
 *
 * Gating:
 *   The backend route is `requireSuperAdmin`. The parent component should
 *   only render this modal for super-admins to avoid users tripping a
 *   surprise 403.
 */

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, Lock, Eye, EyeOff, KeyRound, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /** User whose password is being reset. Used for the header sub-line. */
  userId: string;
  userEmail: string;
  onClose: () => void;
  /** Optional refresh hook — the user record itself doesn't expose the
   *  password so most callers leave this undefined. Wired for symmetry
   *  with other admin modals. */
  onSuccess?: () => void;
}

export default function ResetUserPasswordModal({ userId, userEmail, onClose, onSuccess }: Props) {
  // New-password state for the target user.
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);

  // Admin's own password — used to re-verify before issuing the reset,
  // matching the pattern used by `ConfirmPasswordModal` for other
  // destructive admin actions.
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Local validation BEFORE we round-trip to the backend so the operator
    // doesn't burn an admin-password attempt on a typo. Mirrors the same
    // 8-char floor enforced server-side by `resetUserPasswordBodySchema`.
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!adminPassword) {
      setError('Enter your admin password to authorize the reset.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: verify the admin's own password. If this throws we never
      // touch the target user — important so a malicious actor with only
      // an admin session (no password knowledge) can't rotate dealer creds.
      await api.verifyPassword(adminPassword);

      // Step 2: actually reset the target user's password.
      await api.resetUserPassword(userId, newPassword);

      toast.success(`Password reset for ${userEmail}`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      // The backend returns 401 for wrong admin password and 404 for an
      // unknown user. Surface verbatim — they're already operator-friendly.
      const msg = err?.message || 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Reset User Password</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              This will replace this user&rsquo;s current password and invalidate any
              outstanding reset links. They will need to use the new password to sign in.
            </span>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              New password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm new password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-type to confirm"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          {/* Admin password (authorization gate) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Your admin password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showAdmin ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Authorize this action"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowAdmin((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                tabIndex={-1}
              >
                {showAdmin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound size={14} />
              )}
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
