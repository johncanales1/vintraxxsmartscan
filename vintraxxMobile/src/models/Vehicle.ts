// Vehicle model for VinTraxx SmartScan

export interface Vehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number | null;
  color?: string;
  licensePlate?: string;
  lastScanned?: Date;
  nickname?: string;
}

// Mock vehicles for testing
export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    vin: '1HGBH41JXMN109186',
    year: 2019,
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport',
    mileage: 45230,
    color: 'Silver',
    lastScanned: new Date('2026-01-05'),
    nickname: 'Daily Driver',
  },
  {
    id: 'v2',
    vin: '5YJSA1E26MF123456',
    year: 2021,
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range',
    mileage: 28150,
    color: 'White',
    lastScanned: new Date('2026-01-03'),
  },
  {
    id: 'v3',
    vin: 'WVWZZZ3CZWE123456',
    year: 2018,
    make: 'Volkswagen',
    model: 'Jetta',
    trim: 'SE',
    mileage: 67890,
    color: 'Blue',
    lastScanned: new Date('2025-12-20'),
  },
];

export const getVehicleDisplayName = (vehicle: Vehicle): string => {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
};

export const formatMileage = (mileage: number | null | undefined): string => {
  if (mileage === null || mileage === undefined) {
    return 'N/A';
  }
  return mileage.toLocaleString() + ' mi';
};
