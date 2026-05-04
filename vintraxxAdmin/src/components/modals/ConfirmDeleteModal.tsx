'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * `destructive` (default true) renders the warning banner + requires the
   * user to type `confirmWord`. For non-destructive flows (e.g. "Unpair
   * terminal") pass `false` to skip the typed confirmation and swap the
   * button palette to blue.
   */
  destructive?: boolean;
  /** Overrides the default "delete" confirmation word. Case-insensitive. */
  confirmWord?: string;
  /** Overrides the primary-button label. */
  actionLabel?: string;
}

export default function ConfirmDeleteModal({
  title,
  message,
  onConfirm,
  onCancel,
  destructive = true,
  confirmWord = 'delete',
  actionLabel,
}: Props) {
  const [input, setInput] = useState('');
  // When non-destructive we don't require the typed confirmation at all.
  const isValid = destructive
    ? input.trim().toLowerCase() === confirmWord.toLowerCase()
    : true;

  const headerTone = destructive
    ? { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' }
    : { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' };
  const buttonTone = destructive
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';
  const ringTone = destructive ? 'focus:ring-red-500' : 'focus:ring-blue-500';
  const Icon = destructive ? Trash2 : CheckCircle;
  const effectiveActionLabel = actionLabel ?? (destructive ? 'Delete' : 'Confirm');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${headerTone.bg} flex items-center justify-center ${headerTone.text}`}>
              <AlertTriangle size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>

          {destructive && (
            <>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action <span className="font-bold">cannot be undone</span>. Type <span className="font-mono font-bold">{confirmWord}</span> to confirm.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${ringTone} placeholder-gray-400`}
                  placeholder={`Type "${confirmWord}" to confirm`}
                  autoFocus
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!isValid}
              className={`flex-1 py-2.5 rounded-xl ${buttonTone} text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
            >
              <Icon size={16} />
              {effectiveActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
