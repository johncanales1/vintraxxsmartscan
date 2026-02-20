// Debug Logger for VinTraxx SmartScan
// Captures all BLE communication and scan events with timestamps

export enum LogDirection {
  TX = 'TX', // Phone → Scanner
  RX = 'RX', // Scanner → Phone
  EVENT = 'EVENT', // State transitions
  ERROR = 'ERROR', // Errors
}

export interface DebugLogEntry {
  timestamp: number; // milliseconds since epoch
  direction: LogDirection;
  message: string;
  rawHex?: string;
  parsedText?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private logs: DebugLogEntry[] = [];
  private sessionStartTime: number = 0;
  private maxLogs: number = 1000; // Prevent memory issues

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
    this.logEvent('Fresh session started');
  }

  /**
   * Log a transmitted command (Phone → Scanner)
   */
  logTX(command: string, metadata?: Record<string, any>): void {
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.TX,
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
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.EVENT,
      message,
      metadata,
    });
  }

  /**
   * Log an error
   */
  logError(message: string, error?: any, metadata?: Record<string, any>): void {
    this.addLog({
      timestamp: Date.now(),
      direction: LogDirection.ERROR,
      message,
      error: error instanceof Error ? error.message : String(error),
      metadata,
    });
  }

  /**
   * Get all logs for the current session
   */
  getLogs(): DebugLogEntry[] {
    return [...this.logs];
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
  }

  /**
   * Export logs as formatted text
   */
  exportLogsAsText(): string {
    const lines: string[] = [];
    lines.push('=== VinTraxx SmartScan Debug Log ===');
    lines.push(`Session Start: ${new Date(this.sessionStartTime).toISOString()}`);
    lines.push(`Duration: ${this.getSessionDuration()}ms`);
    lines.push(`Total Entries: ${this.logs.length}`);
    lines.push('');

    for (const log of this.logs) {
      const relativeTime = log.timestamp - this.sessionStartTime;
      const timestamp = `[+${relativeTime}ms]`;
      const direction = `[${log.direction}]`;
      
      lines.push(`${timestamp} ${direction} ${log.message}`);
      
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
   * Add a log entry
   */
  private addLog(entry: DebugLogEntry): void {
    this.logs.push(entry);
    
    // Prevent memory issues by limiting log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest entry
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
