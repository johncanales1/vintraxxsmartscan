import { APP_CONSTANTS } from '../config/constants';
import { VinDecodeResult } from '../types';
import logger from '../utils/logger';

/**
 * HIGH #15: bounded VIN decode cache. Map preserves insertion order, so
 * deleting+re-inserting a key on hit gives us LRU semantics. Cap at 5000
 * entries — at ~120 bytes/entry that's <1 MB resident, plenty for the
 * working-set size we see in production.
 */
const VIN_CACHE_MAX = 5000;
const vinCache = new Map<string, VinDecodeResult>();

function vinCacheGet(key: string): VinDecodeResult | undefined {
  const v = vinCache.get(key);
  if (v !== undefined) {
    // Refresh LRU position by re-inserting at the tail.
    vinCache.delete(key);
    vinCache.set(key, v);
  }
  return v;
}

function vinCacheSet(key: string, value: VinDecodeResult): void {
  if (vinCache.has(key)) vinCache.delete(key);
  vinCache.set(key, value);
  if (vinCache.size > VIN_CACHE_MAX) {
    // Evict oldest (first key in insertion order).
    const oldest = vinCache.keys().next().value;
    if (oldest !== undefined) vinCache.delete(oldest);
  }
}

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cached = vinCacheGet(vin.toUpperCase());
  if (cached) {
    logger.info(`VIN cache hit for ${vin}`);
    return cached;
  }

  const url = `${APP_CONSTANTS.NHTSA_BASE_URL}/${vin}?format=json`;

  try {
    logger.info(`Decoding VIN: ${vin} via NHTSA API`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NHTSA API returned status ${response.status}`);
    }

    const data = await response.json() as {
      Results: Array<{
        ModelYear: string;
        Make: string;
        Model: string;
        DisplacementL: string;
        FuelTypePrimary: string;
      }>;
    };

    const result = data.Results?.[0];
    if (!result) {
      throw new Error('No results from NHTSA API');
    }

    const year = result.ModelYear ? parseInt(result.ModelYear, 10) : null;
    const make = result.Make || null;
    const model = result.Model || null;

    let engine: string | null = null;
    if (result.DisplacementL && result.DisplacementL !== '0') {
      engine = `${result.DisplacementL}L`;
      if (result.FuelTypePrimary) {
        engine += ` ${result.FuelTypePrimary}`;
      }
    }

    const decoded: VinDecodeResult = { year, make, model, engine };

    if (year && make && model) {
      vinCacheSet(vin.toUpperCase(), decoded);
    }

    logger.info(`VIN decoded: ${year} ${make} ${model} (${engine})`);
    return decoded;
  } catch (error) {
    logger.error(`VIN decode failed for ${vin}`, { error: (error as Error).message });
    return { year: null, make: null, model: null, engine: null };
  }
}
