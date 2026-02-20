import { APP_CONSTANTS } from '../config/constants';
import { VinDecodeResult } from '../types';
import logger from '../utils/logger';

const vinCache = new Map<string, VinDecodeResult>();

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cached = vinCache.get(vin.toUpperCase());
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
      vinCache.set(vin.toUpperCase(), decoded);
    }

    logger.info(`VIN decoded: ${year} ${make} ${model} (${engine})`);
    return decoded;
  } catch (error) {
    logger.error(`VIN decode failed for ${vin}`, { error: (error as Error).message });
    return { year: null, make: null, model: null, engine: null };
  }
}
