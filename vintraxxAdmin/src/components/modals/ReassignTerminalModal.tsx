'use client';

/**
 * ReassignTerminalModal — change the owner of a GPS terminal.
 *
 * Backend route: PATCH /admin/gps/terminals/:id/owner with body
 * `{ ownerUserId: string | null }`. Passing null detaches the terminal
 * (equivalent to /unpair but expressed as ownership change).
 */

import { useEffect, useState } from 'react';
import { api, GpsTerminal, User } from '@/lib/api';
import { terminalLabel } from '@/lib/gpsHelpers';
import { X, Save, Search, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  terminal: GpsTerminal;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ReassignTerminalModal({ terminal, onClose, onUpdated }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then((res) => {
        setUsers(res.users);
        if (terminal.ownerUserId) {
          const cur = res.users.find((u) => u.id === terminal.ownerUserId);
          if (cur) setSelected(cur);
        }
      })
      .catch(() => {
        toast.error('Failed to load users');
      });
  }, [terminal.ownerUserId]);

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          (u.fullName && u.fullName.toLowerCase().includes(q))
        );
      })
    : users;

  const submit = async (newOwnerId: string | null) => {
    setSaving(true);
    try {
      await api.reassignGpsTerminal(terminal.id, newOwnerId);
      toast.success(newOwnerId ? 'Terminal reassigned' : 'Terminal unpaired');
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reassign terminal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reassign Terminal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{terminalLabel(terminal)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by email or name..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No users match your search</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelected(u)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-colors ${
                    selected?.id === u.id
                      ? 'bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/40'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.fullName || u.email}</p>
                    {u.fullName && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>}
                  </div>
                  {u.isDealer && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ml-2 flex-shrink-0">
                      DEALER
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {terminal.ownerUserId ? (
            <button
              onClick={() => submit(null)}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all flex items-center gap-2"
            >
              <UserMinus size={16} />
              Unpair
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => selected && submit(selected.id)}
              disabled={!selected || selected.id === terminal.ownerUserId || saving}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
