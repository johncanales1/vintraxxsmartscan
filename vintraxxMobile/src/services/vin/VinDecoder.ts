// VIN Decoder Service for VinTraxx SmartScan
// Decodes VIN to extract Year, Make, Model information

export interface VinDecodeResult {
  year: number;
  make: string;
  model: string;
  valid: boolean;
  error?: string;
}

export class VinDecoder {
  private static instance: VinDecoder;

  private constructor() {}

  static getInstance(): VinDecoder {
    if (!VinDecoder.instance) {
      VinDecoder.instance = new VinDecoder();
    }
    return VinDecoder.instance;
  }

  /**
   * Decode VIN to extract vehicle information
   */
  decodeVIN(vin: string): VinDecodeResult {
    if (!vin || vin.length !== 17) {
      return {
        year: new Date().getFullYear(),
        make: 'Unknown',
        model: 'Unknown',
        valid: false,
        error: 'Invalid VIN length',
      };
    }

    // Validate VIN format (no I, O, Q allowed)
    if (/[IOQ]/i.test(vin)) {
      return {
        year: new Date().getFullYear(),
        make: 'Unknown',
        model: 'Unknown',
        valid: false,
        error: 'Invalid VIN characters (I, O, Q not allowed)',
      };
    }

    try {
      // Extract year from position 10
      const year = this.decodeYear(vin.charAt(9));
      
      // Extract manufacturer from WMI (positions 1-3)
      const make = this.decodeMake(vin.substring(0, 3));

      return {
        year,
        make,
        model: 'Vehicle', // Model requires external API or database
        valid: true,
      };
    } catch (error) {
      return {
        year: new Date().getFullYear(),
        make: 'Unknown',
        model: 'Unknown',
        valid: false,
        error: error instanceof Error ? error.message : 'Decode failed',
      };
    }
  }

  /**
   * Decode year from VIN position 10
   */
  private decodeYear(yearCode: string): number {
    const yearMap: Record<string, number> = {
      // 2000s-2020s
      'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004,
      '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
    };

    return yearMap[yearCode.toUpperCase()] || new Date().getFullYear();
  }

  /**
   * Decode manufacturer from WMI (World Manufacturer Identifier)
   * First 3 characters of VIN
   */
  private decodeMake(wmi: string): string {
    const wmiUpper = wmi.toUpperCase();
    
    // Common WMI patterns
    const wmiMap: Record<string, string> = {
      // USA
      '1G1': 'Chevrolet',
      '1G6': 'Cadillac',
      '1GM': 'Pontiac',
      '1GC': 'Chevrolet',
      '1FA': 'Ford',
      '1FB': 'Ford',
      '1FC': 'Ford',
      '1FD': 'Ford',
      '1FM': 'Ford',
      '1FT': 'Ford',
      '1FU': 'Freightliner',
      '1FV': 'Freightliner',
      '1GY': 'Cadillac',
      '1HG': 'Honda',
      '1J4': 'Jeep',
      '1L1': 'Lincoln',
      '1LN': 'Lincoln',
      '1ME': 'Mercury',
      '1N4': 'Nissan',
      '1VW': 'Volkswagen',
      '1YV': 'Mazda',
      '1ZV': 'Ford',
      
      // Canada (2)
      '2C3': 'Chrysler',
      '2FA': 'Ford',
      '2FM': 'Ford',
      '2FT': 'Ford',
      '2G1': 'Chevrolet',
      '2G2': 'Pontiac',
      '2HG': 'Honda',
      '2HK': 'Honda',
      '2HM': 'Hyundai',
      '2T1': 'Toyota',
      '2T2': 'Toyota',
      
      // Mexico (3)
      '3FA': 'Ford',
      '3FE': 'Ford',
      '3G1': 'Chevrolet',
      '3G7': 'Pontiac',
      '3GN': 'Chevrolet',
      '3HG': 'Honda',
      '3N1': 'Nissan',
      '3VW': 'Volkswagen',
      
      // Japan (J)
      'JA3': 'Mitsubishi',
      'JA4': 'Mitsubishi',
      'JF1': 'Subaru',
      'JF2': 'Subaru',
      'JHM': 'Honda',
      'JM1': 'Mazda',
      'JN1': 'Nissan',
      'JN8': 'Nissan',
      'JT2': 'Toyota',
      'JTE': 'Toyota',
      'JTD': 'Toyota',
      'JTH': 'Lexus',
      'JTJ': 'Lexus',
      'JTK': 'Kawasaki',
      
      // Korea (K)
      'KL1': 'Daewoo',
      'KM8': 'Hyundai',
      'KMH': 'Hyundai',
      'KNA': 'Kia',
      'KND': 'Kia',
      'KNM': 'Kia',
      
      // Europe
      'SAJ': 'Jaguar',
      'SAL': 'Land Rover',
      'SAR': 'Rover',
      'SCA': 'Rolls Royce',
      'SCB': 'Bentley',
      'SCC': 'Lotus',
      'SCE': 'DeLorean',
      'SCF': 'Aston Martin',
      'SDB': 'Peugeot',
      'SHH': 'Honda',
      'SJN': 'Nissan',
      'TRU': 'Audi',
      'TSM': 'Suzuki',
      'VF1': 'Renault',
      'VF3': 'Peugeot',
      'VF7': 'Citroën',
      'VF8': 'Matra',
      'VSS': 'SEAT',
      'VWV': 'Volkswagen',
      'WAU': 'Audi',
      'WBA': 'BMW',
      'WBS': 'BMW',
      'WDB': 'Mercedes-Benz',
      'WDD': 'Mercedes-Benz',
      'WDC': 'DaimlerChrysler',
      'WEB': 'Evobus',
      'WF0': 'Ford',
      'WMA': 'MAN',
      'WME': 'Smart',
      'WMW': 'Mini',
      'WP0': 'Porsche',
      'WP1': 'Porsche',
      'WUA': 'Quattro',
      'WVW': 'Volkswagen',
      'WV1': 'Volkswagen',
      'WV2': 'Volkswagen',
      
      // China (L)
      'LDC': 'Dongfeng',
      'LFM': 'FAW',
      'LFV': 'FAW-Volkswagen',
      'LGB': 'Dongfeng',
      'LGW': 'Great Wall',
      'LGX': 'BYD',
      'LHG': 'Honda',
      'LJD': 'Dongfeng',
      'LKL': 'Suzhou King Long',
      'LLV': 'Lifan',
      'LSG': 'SAIC',
      'LSV': 'SAIC-Volkswagen',
      'LTV': 'Toyota',
      'LVG': 'GAC',
      'LVS': 'Changan Ford',
      'LVV': 'Chery',
      'LZW': 'SAIC-GM-Wuling',
    };

    // Try exact match first
    if (wmiMap[wmiUpper]) {
      return wmiMap[wmiUpper];
    }

    // Try first 2 characters
    const wmi2 = wmiUpper.substring(0, 2);
    for (const [key, value] of Object.entries(wmiMap)) {
      if (key.startsWith(wmi2)) {
        return value;
      }
    }

    // Fallback to country code
    const countryCode = wmiUpper.charAt(0);
    const countryMap: Record<string, string> = {
      '1': 'USA',
      '2': 'Canada',
      '3': 'Mexico',
      '4': 'USA',
      '5': 'USA',
      'J': 'Japan',
      'K': 'Korea',
      'L': 'China',
      'S': 'UK',
      'T': 'Czech/Hungary/Romania',
      'V': 'France/Spain',
      'W': 'Germany',
      'X': 'Russia',
      'Y': 'Sweden/Finland',
      'Z': 'Italy',
    };

    return countryMap[countryCode] || 'Unknown';
  }
}

export const vinDecoder = VinDecoder.getInstance();
