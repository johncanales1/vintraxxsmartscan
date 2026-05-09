'use client';

/**
 * BulkActionBar — sticky bar rendered above each admin list when at least
 * one item is multi-selected. Provides a Delete action (opens the parent
 * section's password-confirm modal) and a Cancel to clear the selection.
 *
 * Parent sections own the password-verify + API-call plumbing — this bar
 * is a pure UI atom so it can sit inside any list (cards, rows, tables)
 * without dragging in section-specific state.
 */

import { Trash2, X, CheckSquare, Square } from 'lucide-react';

interface Props {
  count: number;
  /** Total items visible — drives the master checkbox state. */
  total: number;
  /** True when every visible id is already in the selection. */
  allSelected: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onToggleAll: () => void;
  /** Noun for the countdown ("dealer", "scan", …). Pluralised with + 's'. */
  itemLabel?: string;
  /** Optional "Select all 37 results" button disabled state (e.g. while
   *  loading). */
  busy?: boolean;
}

export default function BulkActionBar({
  count,
  total,
  allSelected,
  onDelete,
  onCancel,
  onToggleAll,
  itemLabel = 'item',
  busy = false,
}: Props) {
  if (count === 0) return null;
  const plural = count === 1 ? itemLabel : `${itemLabel}s`;
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleAll}
          disabled={busy || total === 0}
          className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors disabled:opacity-50"
          title={allSelected ? 'Clear selection' : `Select all ${total} visible`}
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          <span className="hidden sm:inline">
            {allSelected ? 'Clear' : `Select all ${total}`}
          </span>
        </button>
        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
          {count} {plural} selected
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center gap-1.5"
        >
          <X size={14} />
          <span className="hidden sm:inline">Cancel</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <Trash2 size={14} />
          Delete selected
        </button>
      </div>
    </div>
  );
}
