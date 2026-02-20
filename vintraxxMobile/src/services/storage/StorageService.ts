// Local Storage Service for VinTraxx SmartScan using MMKV

import { MMKV } from 'react-native-mmkv';
import { logger, LogCategory } from '../../utils/Logger';
import { ConditionReport } from '../../models/ConditionReport';

const storage = new MMKV({
  id: 'vintraxx-smartscan',
  encryptionKey: 'vintraxx-secure-key-2026',
});

const KEYS = {
  REPORTS: 'scan_reports',
  CLEARED_CODES: 'cleared_codes',
  LAST_SCAN_DATE: 'last_scan_date',
  SETTINGS: 'app_settings',
};

export interface ClearedCode {
  code: string;
  clearedAt: Date;
  vehicleId: string;
  mileage?: number;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {
    logger.info(LogCategory.STORAGE, 'Storage service initialized');
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Save a condition report
   */
  saveReport(report: ConditionReport): void {
    try {
      const reports = this.getAllReports();
      
      // Check if report already exists (update) or add new
      const existingIndex = reports.findIndex(r => r.id === report.id);
      if (existingIndex >= 0) {
        reports[existingIndex] = report;
        logger.info(LogCategory.STORAGE, `Updated report ${report.id}`);
      } else {
        reports.push(report);
        logger.info(LogCategory.STORAGE, `Saved new report ${report.id}`);
      }

      // Sort by scan date (newest first)
      reports.sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime());

      storage.set(KEYS.REPORTS, JSON.stringify(reports));
      logger.debug(LogCategory.STORAGE, `Total reports: ${reports.length}`);
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to save report', error);
      throw error;
    }
  }

  /**
   * Get all saved reports
   */
  getAllReports(): ConditionReport[] {
    try {
      const data = storage.getString(KEYS.REPORTS);
      if (!data) {
        return [];
      }

      const reports = JSON.parse(data) as ConditionReport[];
      
      // Convert date strings back to Date objects
      return reports.map(report => ({
        ...report,
        scanDate: new Date(report.scanDate),
        activeDtcCodes: report.activeDtcCodes.map(dtc => ({
          ...dtc,
          detectedAt: dtc.detectedAt ? new Date(dtc.detectedAt) : undefined,
        })),
        pendingDtcCodes: report.pendingDtcCodes.map(dtc => ({
          ...dtc,
          detectedAt: dtc.detectedAt ? new Date(dtc.detectedAt) : undefined,
        })),
        clearedDtcCodes: report.clearedDtcCodes.map(dtc => ({
          ...dtc,
          clearedAt: dtc.clearedAt ? new Date(dtc.clearedAt) : undefined,
        })),
        vehicle: {
          ...report.vehicle,
          lastScanned: report.vehicle.lastScanned ? new Date(report.vehicle.lastScanned) : undefined,
        },
      }));
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get reports', error);
      return [];
    }
  }

  /**
   * Get a specific report by ID
   */
  getReportById(id: string): ConditionReport | null {
    try {
      const reports = this.getAllReports();
      return reports.find(r => r.id === id) || null;
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get report by ID', error);
      return null;
    }
  }

  /**
   * Get reports for a specific vehicle
   */
  getReportsByVehicle(vehicleId: string): ConditionReport[] {
    try {
      const reports = this.getAllReports();
      return reports.filter(r => r.vehicle.id === vehicleId);
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get reports by vehicle', error);
      return [];
    }
  }

  /**
   * Delete a report
   */
  deleteReport(id: string): boolean {
    try {
      const reports = this.getAllReports();
      const filtered = reports.filter(r => r.id !== id);
      
      if (filtered.length === reports.length) {
        logger.warn(LogCategory.STORAGE, `Report ${id} not found`);
        return false;
      }

      storage.set(KEYS.REPORTS, JSON.stringify(filtered));
      logger.info(LogCategory.STORAGE, `Deleted report ${id}`);
      return true;
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to delete report', error);
      return false;
    }
  }

  /**
   * Clear all reports
   */
  clearAllReports(): void {
    try {
      storage.delete(KEYS.REPORTS);
      logger.info(LogCategory.STORAGE, 'Cleared all reports');
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to clear reports', error);
      throw error;
    }
  }

  /**
   * Save cleared codes (for tracking when user manually clears codes)
   */
  saveClearedCodes(codes: ClearedCode[]): void {
    try {
      const existing = this.getClearedCodes();
      const merged = [...existing, ...codes];
      
      // Keep only last 100 cleared codes
      const limited = merged.slice(-100);
      
      storage.set(KEYS.CLEARED_CODES, JSON.stringify(limited));
      logger.info(LogCategory.STORAGE, `Saved ${codes.length} cleared codes`);
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to save cleared codes', error);
      throw error;
    }
  }

  /**
   * Get all cleared codes
   */
  getClearedCodes(): ClearedCode[] {
    try {
      const data = storage.getString(KEYS.CLEARED_CODES);
      if (!data) {
        return [];
      }

      const codes = JSON.parse(data) as ClearedCode[];
      return codes.map(code => ({
        ...code,
        clearedAt: new Date(code.clearedAt),
      }));
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get cleared codes', error);
      return [];
    }
  }

  /**
   * Get cleared codes for a specific vehicle
   */
  getClearedCodesByVehicle(vehicleId: string): ClearedCode[] {
    try {
      const codes = this.getClearedCodes();
      return codes.filter(c => c.vehicleId === vehicleId);
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get cleared codes by vehicle', error);
      return [];
    }
  }

  /**
   * Update last scan date
   */
  setLastScanDate(date: Date): void {
    try {
      storage.set(KEYS.LAST_SCAN_DATE, date.toISOString());
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to set last scan date', error);
    }
  }

  /**
   * Get last scan date
   */
  getLastScanDate(): Date | null {
    try {
      const data = storage.getString(KEYS.LAST_SCAN_DATE);
      return data ? new Date(data) : null;
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get last scan date', error);
      return null;
    }
  }

  /**
   * Save app settings
   */
  saveSettings(settings: Record<string, any>): void {
    try {
      storage.set(KEYS.SETTINGS, JSON.stringify(settings));
      logger.info(LogCategory.STORAGE, 'Settings saved');
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to save settings', error);
      throw error;
    }
  }

  /**
   * Get app settings
   */
  getSettings(): Record<string, any> {
    try {
      const data = storage.getString(KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to get settings', error);
      return {};
    }
  }

  /**
   * Clear all storage
   */
  clearAll(): void {
    try {
      storage.clearAll();
      logger.info(LogCategory.STORAGE, 'Cleared all storage');
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to clear storage', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalReports: number;
    totalClearedCodes: number;
    lastScanDate: Date | null;
  } {
    return {
      totalReports: this.getAllReports().length,
      totalClearedCodes: this.getClearedCodes().length,
      lastScanDate: this.getLastScanDate(),
    };
  }
}

export const storageService = StorageService.getInstance();
