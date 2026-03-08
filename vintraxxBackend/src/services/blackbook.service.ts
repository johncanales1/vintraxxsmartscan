import { env } from '../config/env';
import logger from '../utils/logger';

// ================================================================
// BLACK BOOK API TYPES
// ================================================================

export interface BlackBookVehicleInfo {
  year: number;
  make: string;
  model: string;
  series: string;
  style: string;
  uvc: string;
}

export interface BlackBookPricing {
  // Trade-in values by condition
  tradeInClean: number;
  tradeInAverage: number;
  tradeInRough: number;
  // Retail values by condition
  retailClean: number;
  retailAverage: number;
  retailRough: number;
  // Wholesale
  wholesale: number;
  // Private party (estimated from BB data)
  privatePartyClean: number;
  privatePartyAverage: number;
  privatePartyRough: number;
}

export interface BlackBookResult {
  success: boolean;
  vehicle?: BlackBookVehicleInfo;
  pricing?: BlackBookPricing;
  rawStyles?: BlackBookStyleData[];
  error?: string;
}

interface BlackBookStyleData {
  uvc: string;
  year: string;
  make: string;
  model: string;
  series: string;
  style: string;
  adjusted_tradein_clean?: number;
  adjusted_tradein_avg?: number;
  adjusted_tradein_rough?: number;
  adjusted_retail_clean?: number;
  adjusted_retail_avg?: number;
  adjusted_retail_rough?: number;
  adjusted_wholesale?: number;
  base_tradein_clean?: number;
  base_tradein_avg?: number;
  base_tradein_rough?: number;
  base_retail_clean?: number;
  base_retail_avg?: number;
  base_retail_rough?: number;
  base_wholesale?: number;
  // Fallback field names (BB may use different naming)
  adjusted_whole_clean?: number;
  adjusted_whole_avg?: number;
}

// ================================================================
// FETCH BLACK BOOK DATA BY VIN
// ================================================================

function buildBlackBookUrl(vin: string, mileage: number): string {
  const normalizedBaseUrl = env.BLACKBOOK_BASE_URL.replace(/\/+$/, '').replace(/\/UsedVehicle$/, '');
  return `${normalizedBaseUrl}/UsedVehicle/${encodeURIComponent('VIN')}/${encodeURIComponent(vin)}?language=${encodeURIComponent('en')}&customerid=${encodeURIComponent(env.BLACKBOOK_CUSTOMER_ID)}&mileage=${Math.round(mileage)}`;
}

export async function fetchBlackBookByVin(
  vin: string,
  mileage: number,
): Promise<BlackBookResult> {
  const url = buildBlackBookUrl(vin, mileage);
  const hasBasicAuth = Boolean(env.BLACKBOOK_USERNAME && env.BLACKBOOK_PASSWORD);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!hasBasicAuth) {
    logger.error('Black Book credentials missing', {
      hasUsername: Boolean(env.BLACKBOOK_USERNAME),
      hasPassword: Boolean(env.BLACKBOOK_PASSWORD),
    });
    return { success: false, error: 'Black Book credentials are missing. Set BLACKBOOK_USERNAME and BLACKBOOK_PASSWORD.' };
  }

  const credentials = Buffer.from(`${env.BLACKBOOK_USERNAME}:${env.BLACKBOOK_PASSWORD}`).toString('base64');
  headers.Authorization = `Basic ${credentials}`;

  logger.info('Black Book API request', {
    vin,
    mileage,
    url: url.replace(env.BLACKBOOK_CUSTOMER_ID, '***'),
    authMode: 'basic+customerid',
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      logger.error('Black Book API HTTP error', {
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 500),
        authMode: 'basic+customerid',
      });
      return { success: false, error: `Black Book API returned ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();

    logger.debug('Black Book API raw response', {
      hasUsedVehicles: !!data?.used_vehicles,
      usedVehiclesCount: data?.used_vehicles?.used_vehicle_list?.length ?? 0,
    });

    // Parse the BB response structure
    const vehicleList = data?.used_vehicles?.used_vehicle_list;
    if (!vehicleList || !Array.isArray(vehicleList) || vehicleList.length === 0) {
      logger.warn('Black Book API returned no vehicle data', { vin });
      return { success: false, error: 'No vehicle data found in Black Book for this VIN' };
    }

    // Use the first style (primary/best match)
    const primary = vehicleList[0] as BlackBookStyleData;

    const vehicle: BlackBookVehicleInfo = {
      year: parseInt(primary.year, 10) || 0,
      make: primary.make || '',
      model: primary.model || '',
      series: primary.series || '',
      style: primary.style || '',
      uvc: primary.uvc || '',
    };

    // Extract adjusted pricing (preferred) with fallback to base pricing
    const tradeInClean = primary.adjusted_tradein_clean ?? primary.base_tradein_clean ?? 0;
    const tradeInAverage = primary.adjusted_tradein_avg ?? primary.base_tradein_avg ?? 0;
    const tradeInRough = primary.adjusted_tradein_rough ?? primary.base_tradein_rough ?? 0;
    const retailClean = primary.adjusted_retail_clean ?? primary.base_retail_clean ?? 0;
    const retailAverage = primary.adjusted_retail_avg ?? primary.base_retail_avg ?? 0;
    const retailRough = primary.adjusted_retail_rough ?? primary.base_retail_rough ?? 0;
    const wholesale = primary.adjusted_wholesale ?? primary.base_wholesale ?? primary.adjusted_whole_clean ?? 0;

    // Private party: estimate as midpoint between trade-in and retail
    const privatePartyClean = Math.round((tradeInClean + retailClean) / 2 / 100) * 100;
    const privatePartyAverage = Math.round((tradeInAverage + retailAverage) / 2 / 100) * 100;
    const privatePartyRough = Math.round((tradeInRough + retailRough) / 2 / 100) * 100;

    const pricing: BlackBookPricing = {
      tradeInClean,
      tradeInAverage,
      tradeInRough,
      retailClean,
      retailAverage,
      retailRough,
      wholesale,
      privatePartyClean,
      privatePartyAverage,
      privatePartyRough,
    };

    logger.info('Black Book pricing extracted', {
      vin,
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      tradeInClean,
      tradeInAverage,
      retailClean,
      wholesale,
    });

    return {
      success: true,
      vehicle,
      pricing,
      rawStyles: vehicleList as BlackBookStyleData[],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Black Book API call failed', { vin, error: message });
    return { success: false, error: `Black Book API error: ${message}` };
  }
}

// ================================================================
// MAP BB PRICING TO VALUATION OUTPUT BY CONDITION
// ================================================================

export function mapBlackBookToValuation(
  pricing: BlackBookPricing,
  condition: 'clean' | 'average' | 'rough',
) {
  // Select pricing tier based on condition
  let tradeIn: number;
  let retail: number;
  let privateParty: number;

  switch (condition) {
    case 'clean':
      tradeIn = pricing.tradeInClean;
      retail = pricing.retailClean;
      privateParty = pricing.privatePartyClean;
      break;
    case 'average':
      tradeIn = pricing.tradeInAverage;
      retail = pricing.retailAverage;
      privateParty = pricing.privatePartyAverage;
      break;
    case 'rough':
      tradeIn = pricing.tradeInRough;
      retail = pricing.retailRough;
      privateParty = pricing.privatePartyRough;
      break;
  }

  const wholesale = pricing.wholesale;

  // Build spreads: clean gets +spread, rough gets -spread
  const spreadFactor = condition === 'clean' ? 0.04 : condition === 'rough' ? 0.06 : 0.05;

  const round100 = (v: number) => Math.round(v / 100) * 100;
  const minVal = 1500;

  const wholesaleLow = Math.max(minVal, round100(wholesale * (1 - spreadFactor)));
  const wholesaleHigh = Math.max(minVal, round100(wholesale * (1 + spreadFactor)));
  const tradeInLow = Math.max(minVal, round100(tradeIn * (1 - spreadFactor)));
  const tradeInHigh = Math.max(minVal, round100(tradeIn * (1 + spreadFactor)));
  const retailLow = Math.max(minVal, round100(retail * (1 - spreadFactor)));
  const retailHigh = Math.max(minVal, round100(retail * (1 + spreadFactor)));
  const privatePartyLow = Math.max(minVal, round100(privateParty * (1 - spreadFactor)));
  const privatePartyHigh = Math.max(minVal, round100(privateParty * (1 + spreadFactor)));

  return {
    wholesaleLow,
    wholesaleHigh,
    tradeInLow,
    tradeInHigh,
    retailLow,
    retailHigh,
    privatePartyLow,
    privatePartyHigh,
  };
}
