import { toast } from 'sonner';

/**
 * runBulkDelete — helper that fans out a list of delete promises in
 * parallel, aggregates per-id outcomes, and surfaces a single success +
 * optional failure toast to the operator.
 *
 * Sections supply the resource noun (used for the toast copy) and a
 * per-id `delete(id)` function. The password-verify step is owned by the
 * parent (`ConfirmPasswordModal`) and runs ONCE before the batch, so this
 * helper doesn't re-verify — it just races the deletes and reports.
 *
 *   await runBulkDelete({
 *     ids,
 *     itemLabel: 'dealer',
 *     delete: (id) => api.deleteUser(id),
 *   });
 */

export interface BulkDeleteOptions {
  ids: string[];
  itemLabel: string; // singular noun, pluralised with + 's'
  delete: (id: string) => Promise<unknown>;
}

export interface BulkDeleteResult {
  ok: string[];
  failed: Array<{ id: string; error: string }>;
}

export async function runBulkDelete(
  opts: BulkDeleteOptions,
): Promise<BulkDeleteResult> {
  const { ids, itemLabel, delete: del } = opts;
  if (ids.length === 0) return { ok: [], failed: [] };

  const settled = await Promise.allSettled(ids.map((id) => del(id)));

  const ok: string[] = [];
  const failed: BulkDeleteResult['failed'] = [];
  settled.forEach((r, i) => {
    const id = ids[i];
    if (r.status === 'fulfilled') ok.push(id);
    else failed.push({ id, error: (r.reason as Error)?.message ?? 'Unknown error' });
  });

  const plural = ids.length === 1 ? itemLabel : `${itemLabel}s`;
  if (ok.length > 0) {
    toast.success(`Deleted ${ok.length} of ${ids.length} ${plural}`);
  }
  if (failed.length > 0) {
    // Keep the toast short — full per-id detail is in the browser console
    // for triage (e.g. "terminal X still has live bindings").
    // eslint-disable-next-line no-console
    console.warn('Bulk delete partial failure', failed);
    toast.error(
      `${failed.length} of ${ids.length} ${plural} could not be deleted. See console for details.`,
    );
  }

  return { ok, failed };
}
