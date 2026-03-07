// Debug Logger for VinTraxx SmartScan
// Captures BLE communication, scan events, network requests, and app lifecycle

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG_LOG_STORAGE_KEY = '@vintraxx_debug_logs';
const DEBUG_LOG_MAX_PERSIST = 500; // persist last N entries to storage

export enum LogDirection {
  TX = 'TX', // Phone → Scanner
  RX = 'RX', // Scanner → Phone
  EVENT = 'EVENT', // State transitions
  ERROR = 'ERROR', // Errors
  WARN = 'WARN', // Warnings
  NETWORK = 'NETWORK', // Network requests/responses
  PERF = 'PERF', // Performance measurements
}

export enum LogCategory {
  BLE = 'BLE',
  SCAN = 'SCAN',
  AUTH = 'AUTH',
  APPRAISAL = 'APPRAISAL',
  BLACKBOOK = 'BLACKBOOK',
  NETWORK = 'NETWORK',
  NAVIGATION = 'NAVIGATION',
  PHOTO = 'PHOTO',
  VIN = 'VIN',
  APP = 'APP',
}

export interface DebugLogEntry {
  timestamp: number; // milliseconds since epoch
  direction: LogDirection;
  category?: LogCategory;
  message: string;
  rawHex?: string;
  parsedText?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NetworkLogEntry {
  url: string;
  method: string;
  status?: number;
  durationMs?: number;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

export interface LogStats {
  totalEntries: number;
  errorCount: number;
  warnCount: number;
  networkCount: number;
  byCategory: Record<string, number>;
  sessionDurationMs: number;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private logs: DebugLogEntry[] = [];
  private sessionStartTime: number = 0;
  private maxLogs: number = 2000; // Increased capacity
  private perfTimers: Map<string, number> = new Map();
  private networkRequests: Map<string, { url: string; method: string; startTime: number }> = new Map();

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * Start a new scan session
   * Note: Does NOT clear existing logs - preserves BLE connection logs
   */
  startSession(): void {
    // If no session has started yet, set the start time
    // Otherwise preserve existing session to keep BLE connection logs
    if (this.sessionStartTime === 0) {
      this.sessionStartTime = Date.now();
    }
    this.logEvent('Scan session started');
  }

  /**
   * Start a completely fresh session (clears all logs)
   * Use this when user explicitly wants to clear logs
   */
  startFreshSession(): void {
    this.sessionStartTime = Date.now();
    this.logs = [];
    this.perfTimers.clear();
    this.networkRequests.clear();
    this.logEvent('Fresh session started');
  }

  /**
   * Log a transmitted command (Phone → Scanner)
   */
  logTX(command: string, metadata?: Record<string, any>): void {
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.TX,
      category: LogCategory.BLE,
      message: `Sending command: ${command}`,
      rawHex: this.stringToHex(command),
      parsedText: command,
      metadata,
    });
  }

  /**
   * Log a received response (Scanner → Phone)
   */
  logRX(response: string, metadata?: Record<string, any>): void {
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.RX,
      category: LogCategory.BLE,
      message: `Received response`,
      rawHex: this.stringToHex(response),
      parsedText: response,
      metadata,
    });
  }

  /**
   * Log an event (state transitions, milestones)
   */
  logEvent(message: string, metadata?: Record<string, any>): void {
    // Auto-detect category from message prefix
    const category = this.detectCategory(message);
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.EVENT,
      category,
      message,
      metadata,
    });
  }

  /**
   * Log a warning
   */
  logWarn(message: string, metadata?: Record<string, any>): void {
    const category = this.detectCategory(message);
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.WARN,
      category,
      message,
      metadata,
    });
  }

  /**
   * Log an error
   */
  logError(message: string, error?: any, metadata?: Record<string, any>): void {
    const category = this.detectCategory(message);
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.ERROR,
      category,
      message,
      error: error instanceof Error ? error.message : error != null ? String(error) : undefined,
      metadata,
    });
  }

  /**
   * Start tracking a network request
   */
  logNetworkStart(requestId: string, method: string, url: string, metadata?: Record<string, any>): void {
    this.networkRequests.set(requestId, { url, method, startTime: Date.now() });
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.NETWORK,
      category: LogCategory.NETWORK,
      message: `→ ${method} ${url}`,
      metadata,
    });
  }

  /**
   * Complete tracking a network request with response info
   */
  logNetworkEnd(requestId: string, status: number, metadata?: Record<string, any>): void {
    const req = this.networkRequests.get(requestId);
    const durationMs = req ? Date.now() - req.startTime : undefined;
    this.networkRequests.delete(requestId);

    const statusLabel = status >= 200 && status < 300 ? 'OK' : status >= 400 ? 'FAIL' : 'REDIR';
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.NETWORK,
      category: LogCategory.NETWORK,
      message: `← ${status} ${statusLabel} ${req?.method || ''} ${req?.url || '(unknown)'}${durationMs != null ? ` [${durationMs}ms]` : ''}`,
      metadata: { ...metadata, status, durationMs },
    });
  }

  /**
   * Log a network request error
   */
  logNetworkError(requestId: string, error: any, metadata?: Record<string, any>): void {
    const req = this.networkRequests.get(requestId);
    const durationMs = req ? Date.now() - req.startTime : undefined;
    this.networkRequests.delete(requestId);

    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.ERROR,
      category: LogCategory.NETWORK,
      message: `✗ NETWORK ERROR ${req?.method || ''} ${req?.url || '(unknown)'}${durationMs != null ? ` [${durationMs}ms]` : ''}`,
      error: error instanceof Error ? error.message : String(error),
      metadata: { ...metadata, durationMs },
    });
  }

  /**
   * Start a performance timer
   */
  perfStart(label: string): void {
    this.perfTimers.set(label, Date.now());
  }

  /**
   * End a performance timer and log the duration
   */
  perfEnd(label: string, metadata?: Record<string, any>): number {
    const start = this.perfTimers.get(label);
    this.perfTimers.delete(label);
    const durationMs = start ? Date.now() - start : 0;

    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.PERF,
      category: this.detectCategory(label),
      message: `⏱ ${label}: ${durationMs}ms`,
      metadata: { ...metadata, durationMs },
    });

    return durationMs;
  }

  /**
   * Get all logs for the current session
   */
  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by direction
   */
  getLogsByDirection(direction: LogDirection): DebugLogEntry[] {
    return this.logs.filter(l => l.direction === direction);
  }

  /**
   * Get logs filtered by category
   */
  getLogsByCategory(category: LogCategory): DebugLogEntry[] {
    return this.logs.filter(l => l.category === category);
  }

  /**
   * Get aggregate statistics about the current log session
   */
  getStats(): LogStats {
    const byCategory: Record<string, number> = {};
    let errorCount = 0;
    let warnCount = 0;
    let networkCount = 0;

    for (const log of this.logs) {
      if (log.category) {
        byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      }
      if (log.direction === LogDirection.ERROR) errorCount++;
      if (log.direction === LogDirection.WARN) warnCount++;
      if (log.direction === LogDirection.NETWORK) networkCount++;
    }

    return {
      totalEntries: this.logs.length,
      errorCount,
      warnCount,
      networkCount,
      byCategory,
      sessionDurationMs: this.getSessionDuration(),
    };
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number {
    return this.sessionStartTime > 0 ? Date.now() - this.sessionStartTime : 0;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.sessionStartTime = 0;
    this.perfTimers.clear();
    this.networkRequests.clear();
  }

  /**
   * Search logs by keyword (case-insensitive)
   */
  searchLogs(query: string): DebugLogEntry[] {
    const lower = query.toLowerCase();
    return this.logs.filter(l =>
      l.message.toLowerCase().includes(lower) ||
      l.error?.toLowerCase().includes(lower) ||
      l.category?.toLowerCase().includes(lower) ||
      (l.metadata && JSON.stringify(l.metadata).toLowerCase().includes(lower))
    );
  }

  /**
   * Persist recent logs to AsyncStorage (call periodically or on important events)
   */
  async persistLogs(): Promise<void> {
    try {
      const toSave = this.logs.slice(-DEBUG_LOG_MAX_PERSIST);
      await AsyncStorage.setItem(DEBUG_LOG_STORAGE_KEY, JSON.stringify({
        sessionStartTime: this.sessionStartTime,
        logs: toSave,
      }));
    } catch (_e) {
      // Silent fail — persistence is best-effort
    }
  }

  /**
   * Restore logs from AsyncStorage (call on app launch)
   */
  async restoreLogs(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(DEBUG_LOG_STORAGE_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw) as { sessionStartTime: number; logs: DebugLogEntry[] };
      if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
        // Prepend restored logs before current session logs
        this.logs = [...data.logs, ...this.logs];
        if (this.sessionStartTime === 0 && data.sessionStartTime) {
          this.sessionStartTime = data.sessionStartTime;
        }
        this.logEvent('Restored persisted logs', { restoredCount: data.logs.length });
        return data.logs.length;
      }
      return 0;
    } catch (_e) {
      return 0;
    }
  }

  /**
   * Clear persisted logs from AsyncStorage
   */
  async clearPersistedLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEBUG_LOG_STORAGE_KEY);
    } catch (_e) {
      // Silent fail
    }
  }

  /**
   * Export logs as structured JSON
   */
  exportLogsAsJSON(): string {
    return JSON.stringify({
      session: {
        startTime: new Date(this.sessionStartTime).toISOString(),
        durationMs: this.getSessionDuration(),
      },
      stats: this.getStats(),
      logs: this.logs.map(l => ({
        ...l,
        timestampISO: new Date(l.timestamp).toISOString(),
        relativeMs: l.timestamp - this.sessionStartTime,
      })),
    }, null, 2);
  }

  /**
   * Export logs as formatted text
   */
  exportLogsAsText(): string {
    const stats = this.getStats();
    const lines: string[] = [];
    lines.push('=== VinTraxx SmartScan Debug Log ===');
    lines.push(`Session Start: ${new Date(this.sessionStartTime).toISOString()}`);
    lines.push(`Duration: ${this.getSessionDuration()}ms`);
    lines.push(`Total Entries: ${stats.totalEntries} (Errors: ${stats.errorCount}, Warns: ${stats.warnCount}, Network: ${stats.networkCount})`);
    if (Object.keys(stats.byCategory).length > 0) {
      lines.push(`Categories: ${Object.entries(stats.byCategory).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    }
    lines.push('');

    for (const log of this.logs) {
      const relativeTime = log.timestamp - this.sessionStartTime;
      const timestamp = `[+${relativeTime}ms]`;
      const direction = `[${log.direction}]`;
      const category = log.category ? `[${log.category}]` : '';
      
      lines.push(`${timestamp} ${direction}${category} ${log.message}`);
      
      if (log.rawHex) {
        lines.push(`  Raw: ${log.rawHex}`);
      }
      
      if (log.parsedText) {
        lines.push(`  Text: ${log.parsedText}`);
      }
      
      if (log.error) {
        lines.push(`  Error: ${log.error}`);
      }
      
      if (log.metadata) {
        lines.push(`  Meta: ${JSON.stringify(log.metadata)}`);
      }
      
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Auto-detect log category from message prefix
   */
  private detectCategory(message: string): LogCategory {
    const lower = message.toLowerCase();
    if (lower.startsWith('ble') || lower.includes('ble ')) return LogCategory.BLE;
    if (lower.includes('black book') || lower.includes('blackbook') || lower.includes('bb ')) return LogCategory.BLACKBOOK;
    if (lower.startsWith('vin scanner:') || lower.includes('vin decode') || lower.includes('vin scan')) return LogCategory.VIN;
    if (lower.startsWith('scan') || lower.includes('scan ')) return LogCategory.SCAN;
    if (lower.startsWith('auth:') || lower.includes('auth ') || lower.includes('login') || lower.includes('logout')) return LogCategory.AUTH;
    if (lower.startsWith('appraiser:') || lower.includes('appraisal') || lower.includes('valuation')) return LogCategory.APPRAISAL;
    if (lower.startsWith('photo') || lower.includes('camera') || lower.includes('photo')) return LogCategory.PHOTO;
    if (lower.includes('navigat')) return LogCategory.NAVIGATION;
    if (lower.includes('network') || lower.includes('api') || lower.includes('fetch')) return LogCategory.NETWORK;
    return LogCategory.APP;
  }

  /**
   * Add a log entry
   */
  private addLog(entry: DebugLogEntry): void {
    this.logs.push(entry);
    
    // Prevent memory issues by limiting log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest entry
    }

    // Auto-persist on errors or every 50 entries
    if (entry.direction === LogDirection.ERROR || this.logs.length % 50 === 0) {
      this.persistLogs().catch(() => {});
    }
  }

  /**
   * Convert string to hex representation
   */
  private stringToHex(str: string): string {
    const hex: string[] = [];
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hex.push(charCode.toString(16).padStart(2, '0').toUpperCase());
    }
    return hex.join(' ');
  }
}

export const debugLogger = DebugLogger.getInstance();
