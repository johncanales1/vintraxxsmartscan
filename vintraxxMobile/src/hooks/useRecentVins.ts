import { useCallback, useEffect, useState } from 'react';
import { storageService, RecentVinEntry } from '../services/storage/StorageService';

/**
 * Hook exposing the recent-VIN list for Schedule + Appraiser "Recent VINs"
 * chip row. Loads once on mount, and exposes `add`/`remove`/`refresh` so
 * callers can update the list (e.g. after a successful scan/OCR).
 *
 * Data is persisted through `StorageService` (MMKV) — survives app restarts.
 */
export function useRecentVins() {
  const [vins, setVins] = useState<RecentVinEntry[]>([]);

  const refresh = useCallback(() => {
    setVins(storageService.getRecentVins());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    (entry: Omit<RecentVinEntry, 'lastUsedAt'> & { lastUsedAt?: string }) => {
      storageService.addRecentVin(entry);
      refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    (vin: string) => {
      storageService.removeRecentVin(vin);
      refresh();
    },
    [refresh],
  );

  return { vins, add, remove, refresh };
}
