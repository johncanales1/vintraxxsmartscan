// Diagnostic Trouble Code (DTC) model for VinTraxx SmartScan

export type DtcStatus = 'active' | 'pending' | 'cleared' | 'history';
export type DtcSeverity = 'critical' | 'warning' | 'info';
export type DtcCategory = 'powertrain' | 'chassis' | 'body' | 'network';

export interface DtcCode {
  id: string;
  code: string;
  description: string;
  status: DtcStatus;
  severity: DtcSeverity;
  category: DtcCategory;
  possibleCauses?: string[];
  estimatedRepairCost?: {
    min: number;
    max: number;
  };
  detectedAt?: Date;
  clearedAt?: Date;
}

// Mock DTC codes for testing
export const mockDtcCodes: DtcCode[] = [
  {
    id: 'dtc1',
    code: 'P0300',
    description: 'Random/Multiple Cylinder Misfire Detected',
    status: 'active',
    severity: 'critical',
    category: 'powertrain',
    possibleCauses: [
      'Worn spark plugs',
      'Faulty ignition coils',
      'Vacuum leak',
      'Low fuel pressure',
    ],
    estimatedRepairCost: { min: 150, max: 400 },
    detectedAt: new Date('2026-01-10'),
  },
  {
    id: 'dtc2',
    code: 'P0171',
    description: 'System Too Lean (Bank 1)',
    status: 'pending',
    severity: 'warning',
    category: 'powertrain',
    possibleCauses: [
      'Vacuum leak',
      'Faulty MAF sensor',
      'Clogged fuel filter',
      'Weak fuel pump',
    ],
    estimatedRepairCost: { min: 100, max: 300 },
    detectedAt: new Date('2026-01-09'),
  },
  {
    id: 'dtc3',
    code: 'P0420',
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    status: 'active',
    severity: 'warning',
    category: 'powertrain',
    possibleCauses: [
      'Failing catalytic converter',
      'Exhaust leak',
      'Faulty oxygen sensor',
    ],
    estimatedRepairCost: { min: 500, max: 2500 },
    detectedAt: new Date('2026-01-08'),
  },
  {
    id: 'dtc4',
    code: 'C0035',
    description: 'Left Front Wheel Speed Sensor Circuit',
    status: 'cleared',
    severity: 'info',
    category: 'chassis',
    possibleCauses: [
      'Damaged wheel speed sensor',
      'Wiring issue',
      'ABS module failure',
    ],
    estimatedRepairCost: { min: 80, max: 200 },
    clearedAt: new Date('2026-01-05'),
  },
];

export const mockClearedCodes: DtcCode[] = [
  {
    id: 'dtc5',
    code: 'P0442',
    description: 'Evaporative Emission Control System Leak Detected (Small Leak)',
    status: 'cleared',
    severity: 'info',
    category: 'powertrain',
    clearedAt: new Date('2026-01-02'),
  },
  {
    id: 'dtc6',
    code: 'P0456',
    description: 'Evaporative Emission System Leak Detected (Very Small Leak)',
    status: 'cleared',
    severity: 'info',
    category: 'powertrain',
    clearedAt: new Date('2025-12-28'),
  },
];

export const getDtcStatusLabel = (status: DtcStatus): string => {
  const labels: Record<DtcStatus, string> = {
    active: 'Active',
    pending: 'Pending',
    cleared: 'Cleared',
    history: 'History',
  };
  return labels[status];
};

export const getDtcCategoryPrefix = (code: string): DtcCategory => {
  const prefix = code.charAt(0).toUpperCase();
  const categoryMap: Record<string, DtcCategory> = {
    P: 'powertrain',
    C: 'chassis',
    B: 'body',
    U: 'network',
  };
  return categoryMap[prefix] || 'powertrain';
};
