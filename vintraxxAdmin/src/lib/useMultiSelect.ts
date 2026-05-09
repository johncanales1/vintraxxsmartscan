'use client';

/**
 * useMultiSelect — tiny reusable hook powering the multi-select + bulk
 * delete UX across admin sections.
 *
 * The hook stores ids in a Set so toggles are O(1) regardless of list size,
 * and exposes a handful of composable helpers. It intentionally does NOT
 * perform any API work itself — sections own the delete logic and use the
 * hook only for selection state. That keeps the hook trivially testable
 * and reusable across resources with different delete verbs (deleteUser vs
 * deleteScan vs deleteAuditLog).
 *
 * Typical wiring in a section:
 *
 *   const sel = useMultiSelect();
 *
 *   {rows.map(r => (
 *     <Row
 *       key={r.id}
 *       selectable={sel.active}
 *       selected={sel.isSelected(r.id)}
 *       onToggle={() => sel.toggle(r.id)}
 *       …
 *     />
 *   ))}
 *
 *   <BulkActionBar
 *     count={sel.selectedIds.size}
 *     onDelete={() => setConfirmOpen(true)}
 *     onCancel={sel.clear}
 *   />
 */

import { useCallback, useMemo, useState } from 'react';

export interface UseMultiSelect {
  /** Backing selection set — exposed so consumers can .size / .forEach it. */
  selectedIds: Set<string>;
  /** True once at least one item is selected. Drives whether checkboxes
   *  are always visible vs hover-only on card grids. */
  active: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  /** Replace the selection with every id in `ids`. Used by the "select
   *  everything on this page" toolbar toggle. */
  selectAll: (ids: string[]) => void;
  /** Convenience: true when every id in `ids` is currently selected. */
  allSelected: (ids: string[]) => boolean;
  /** Toggles between "all selected" and "none selected" based on current
   *  state — wires cleanly into a master checkbox. */
  toggleAll: (ids: string[]) => void;
}

export function useMultiSelect(): UseMultiSelect {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const allSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  const toggleAll = useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        const every = ids.length > 0 && ids.every((id) => prev.has(id));
        if (every) return new Set();
        return new Set(ids);
      });
    },
    [],
  );

  return useMemo(
    () => ({
      selectedIds,
      active: selectedIds.size > 0,
      isSelected,
      toggle,
      clear,
      selectAll,
      allSelected,
      toggleAll,
    }),
    [selectedIds, isSelected, toggle, clear, selectAll, allSelected, toggleAll],
  );
}
