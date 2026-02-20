// Repair Item model for VinTraxx SmartScan

export type RepairPriority = 'urgent' | 'recommended' | 'optional';
export type RepairCategory = 'engine' | 'transmission' | 'brakes' | 'suspension' | 'electrical' | 'emissions' | 'body' | 'other';

export interface RepairItem {
  id: string;
  name: string;
  description?: string;
  category: RepairCategory;
  priority: RepairPriority;
  estimatedCost: {
    labor: number;
    parts: number;
    total: number;
  };
  relatedDtcCodes?: string[];
  notes?: string;
}

// Mock repair items for testing
export const mockRepairItems: RepairItem[] = [
  {
    id: 'r1',
    name: 'Catalytic Converter Replacement',
    description: 'Replace failing catalytic converter to restore emissions compliance',
    category: 'emissions',
    priority: 'urgent',
    estimatedCost: {
      labor: 250,
      parts: 1200,
      total: 1450,
    },
    relatedDtcCodes: ['P0420'],
    notes: 'OEM or quality aftermarket recommended',
  },
  {
    id: 'r2',
    name: 'Spark Plug Replacement',
    description: 'Replace all spark plugs to address misfire condition',
    category: 'engine',
    priority: 'urgent',
    estimatedCost: {
      labor: 80,
      parts: 60,
      total: 140,
    },
    relatedDtcCodes: ['P0300'],
  },
  {
    id: 'r3',
    name: 'MAF Sensor Cleaning/Replacement',
    description: 'Clean or replace mass air flow sensor',
    category: 'engine',
    priority: 'recommended',
    estimatedCost: {
      labor: 50,
      parts: 120,
      total: 170,
    },
    relatedDtcCodes: ['P0171'],
  },
  {
    id: 'r4',
    name: 'Vacuum Leak Inspection & Repair',
    description: 'Locate and repair vacuum system leaks',
    category: 'engine',
    priority: 'recommended',
    estimatedCost: {
      labor: 100,
      parts: 50,
      total: 150,
    },
    relatedDtcCodes: ['P0171', 'P0300'],
  },
];

export const getRepairPriorityLabel = (priority: RepairPriority): string => {
  const labels: Record<RepairPriority, string> = {
    urgent: 'Urgent',
    recommended: 'Recommended',
    optional: 'Optional',
  };
  return labels[priority];
};

export const calculateTotalRepairCost = (repairs: RepairItem[]): number => {
  return repairs.reduce((total, repair) => total + repair.estimatedCost.total, 0);
};
