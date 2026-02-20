// Cleared Codes History Storage Service
// Stores locally cleared DTC codes with VIN and timestamp

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger, LogCategory } from '../../utils/Logger';

export interface ClearedCodeEntry {
  code: string;
  description: string;
  clearedAt: number; // timestamp in ms
  vin: string;
}

export interface ClearedCodesRecord {
  vin: string;
  codes: ClearedCodeEntry[];
  lastUpdated: number;
}

const STORAGE_KEY = '@vintraxx_cleared_codes_history';

export class ClearedCodesHistory {
  private static instance: ClearedCodesHistory;

  private constructor() {}

  static getInstance(): ClearedCodesHistory {
    if (!ClearedCodesHistory.instance) {
      ClearedCodesHistory.instance = new ClearedCodesHistory();
    }
    return ClearedCodesHistory.instance;
  }

  /**
   * Save cleared codes for a specific VIN
   */
  async saveClearedCodes(vin: string, codes: Array<{ code: string; description: string }>): Promise<void> {
    try {
      logger.info(LogCategory.APP, 'Saving cleared codes to history', { vin, count: codes.length });

      const timestamp = Date.now();
      const entries: ClearedCodeEntry[] = codes.map(code => ({
        ...code,
        clearedAt: timestamp,
        vin,
      }));

      // Get existing records
      const allRecords = await this.getAllRecords();
      
      // Find or create record for this VIN
      let vinRecord = allRecords.find(r => r.vin === vin);
      
      if (vinRecord) {
        // Append new codes to existing record
        vinRecord.codes.push(...entries);
        vinRecord.lastUpdated = timestamp;
      } else {
        // Create new record
        vinRecord = {
          vin,
          codes: entries,
          lastUpdated: timestamp,
        };
        allRecords.push(vinRecord);
      }

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
      
      logger.info(LogCategory.APP, 'Cleared codes saved successfully');
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to save cleared codes', error);
      throw error;
    }
  }

  /**
   * Get cleared codes for a specific VIN
   */
  async getClearedCodesForVIN(vin: string): Promise<ClearedCodeEntry[]> {
    try {
      const allRecords = await this.getAllRecords();
      const vinRecord = allRecords.find(r => r.vin === vin);
      
      if (!vinRecord) {
        return [];
      }

      // Sort by cleared date (most recent first)
      return vinRecord.codes.sort((a, b) => b.clearedAt - a.clearedAt);
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to get cleared codes', error);
      return [];
    }
  }

  /**
   * Get most recent cleared codes for a VIN (last 30 days)
   */
  async getRecentClearedCodes(vin: string, daysBack: number = 30): Promise<ClearedCodeEntry[]> {
    try {
      const allCodes = await this.getClearedCodesForVIN(vin);
      const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
      
      return allCodes.filter(code => code.clearedAt >= cutoffTime);
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to get recent cleared codes', error);
      return [];
    }
  }

  /**
   * Clear all history for a specific VIN
   */
  async clearHistoryForVIN(vin: string): Promise<void> {
    try {
      const allRecords = await this.getAllRecords();
      const filteredRecords = allRecords.filter(r => r.vin !== vin);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
      logger.info(LogCategory.APP, 'Cleared history for VIN', { vin });
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to clear history', error);
      throw error;
    }
  }

  /**
   * Clear all history
   */
  async clearAllHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      logger.info(LogCategory.APP, 'Cleared all history');
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to clear all history', error);
      throw error;
    }
  }

  /**
   * Get all records from storage
   */
  private async getAllRecords(): Promise<ClearedCodesRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!data) {
        return [];
      }

      return JSON.parse(data) as ClearedCodesRecord[];
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to get all records', error);
      return [];
    }
  }
}

export const clearedCodesHistory = ClearedCodesHistory.getInstance();
