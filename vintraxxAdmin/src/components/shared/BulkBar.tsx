'use client';

/**
 * BulkBar — header strip used by every list view that supports
 * multi-select + bulk-delete. Split into its own file so both the GPS
 * Telemetry sections AND the per-terminal modal panes can share the
 * exact same UX (master checkbox, count, refresh, red Delete N button,
 * and a typed-confirmation `ConfirmDeleteModal`).
 *
 * Caller-side responsibilities:
 *   - track its own `selectedIds` Set + the visible row ids;
 *   - implement `onConfirmDelete` which actually calls `api.bulkDelete<…>`
 *     and refreshes the list on success;
 *   - decide what `resourceLabel` to display ("locations", "terminals", …).
 *
 * The bulk-delete endpoints are super-admin only on the backend; a
 * non-super-admin pressing the button will get a 403 toast — the UI
 * surfaces every error from `onConfirmDelete` via `toast.error` already.
 */

import { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';

interface Props {
  total: number;
  selected: number;
  allSelected: boolean;
  resourceLabel: string;
  onToggleAll: () => void;
  onReload: () => void;
  onConfirmDelete: () => Promise<void>;
  /** Optional inline content rendered to the LEFT of the action buttons. */
  extraActions?: React.ReactNode;
}

export default function BulkBar({
  total,
  selected,
  allSelected,
  resourceLabel,
  onToggleAll,
  onReload,
  onConfirmDelete,
  extraActions,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirmDelete();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected && total > 0}
            onChange={onToggleAll}
            disabled={total === 0}
            aria-label={`Select all ${resourceLabel}`}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selected > 0
              ? `${selected} of ${total} selected`
              : `${total} ${resourceLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {selected > 0 && (
            <button
              onClick={() => setConfirming(true)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium transition-all"
            >
              <Trash2 size={14} />
              Delete {selected}
            </button>
          )}
          <button
            onClick={onReload}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {confirming && (
        <ConfirmDeleteModal
          title={`Delete ${selected} ${resourceLabel}?`}
          message={`This permanently removes ${selected} ${resourceLabel} from the database. The action cannot be undone and is recorded in the admin audit log.`}
          onCancel={() => setConfirming(false)}
          onConfirm={handleConfirm}
          actionLabel={deleting ? 'Deleting…' : `Delete ${selected}`}
        />
      )}
    </>
  );
}
