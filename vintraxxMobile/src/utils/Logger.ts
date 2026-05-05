// Centralized logging utility for VinTraxx SmartScan
// Provides structured logging for BLE, OBD, and general app operations

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  BLE = 'BLE',
  OBD = 'OBD',
  STORAGE = 'STORAGE',
  APP = 'APP',
  API = 'API',
  VIN = 'VIN',
  // New categories — make filtering specific user-reported flows trivial
  // in the DebugData screen and in backend client-log uploads.
  SCHEDULE = 'SCHEDULE',
  APPRAISAL = 'APPRAISAL',
  CLEAR_DTC = 'CLEAR_DTC',
  VIN_SCANNER = 'VIN_SCANNER',
  OCR = 'OCR',
  PUSH = 'PUSH',
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  /**
   * Correlation ID (UUID). When set, the same ID is sent as `X-Request-Id`
   * on any outbound API call that originated from this flow, so server logs
   * can be joined with client logs end-to-end.
   */
  requestId?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private enabled = __DEV__;
  /** Current correlation ID — auto-prefixed onto every log entry. */
  private activeRequestId: string | null = null;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Generate a new correlation ID (RFC-4122 v4-style, pseudo-random so we
   * don't pull a uuid dep). Useful at the start of a user flow so both
   * mobile logs and backend logs share the same `X-Request-Id`.
   */
  generateRequestId(): string {
    // Lightweight uuidv4-ish without external deps. Good enough for
    // debugging correlation (no cryptographic requirement).
    const hex = (n: number) => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    const uuid = `${hex(1)}${hex(1)}-${hex(1)}-4${hex(1).slice(1)}-${((Math.random() * 4) | 8).toString(16)}${hex(1).slice(1)}-${hex(1)}${hex(1)}${hex(1)}`;
    return uuid;
  }

  /** Mark the beginning of a correlated flow. All subsequent log entries are
   * tagged with this id until `clearRequestId()` is called. */
  setRequestId(id: string | null) {
    this.activeRequestId = id;
  }

  getRequestId(): string | null {
    return this.activeRequestId;
  }

  clearRequestId() {
    this.activeRequestId = null;
  }

  /**
   * Convenience wrapper: runs `fn` under a correlation ID and clears it
   * when done (even on error). The id is generated if not supplied.
   */
  async withRequestId<T>(fn: (requestId: string) => Promise<T>, id?: string): Promise<T> {
    const requestId = id ?? this.generateRequestId();
    const prior = this.activeRequestId;
    this.activeRequestId = requestId;
    try {
      return await fn(requestId);
    } finally {
      this.activeRequestId = prior;
    }
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      requestId: this.activeRequestId ?? undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enabled) {
      const rid = entry.requestId ? ` [rid=${entry.requestId.slice(0, 8)}]` : '';
      const prefix = `[${category}]${rid} ${level}:`;
      const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;

      switch (level) {
        case LogLevel.DEBUG:
          console.log(prefix, logMessage);
          break;
        case LogLevel.INFO:
          console.info(prefix, logMessage);
          break;
        case LogLevel.WARN:
          console.warn(prefix, logMessage);
          break;
        case LogLevel.ERROR:
          console.error(prefix, logMessage);
          break;
      }
    }
  }

  debug(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.ERROR, category, message, data);
  }

  getLogs(category?: LogCategory, limit = 200): LogEntry[] {
    let filtered = this.logs;
    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }
    return filtered.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
  }

  getApiLogs(limit = 100): LogEntry[] {
    return this.getLogs(LogCategory.API, limit);
  }

  exportApiLogs(): string {
    return this.getApiLogs()
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const rid = log.requestId ? ` [rid=${log.requestId}]` : '';
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
        return `${timestamp} [${log.category}]${rid} ${log.level}: ${log.message}${dataStr}`;
      })
      .join('\n');
  }

  exportLogs(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const rid = log.requestId ? ` [rid=${log.requestId}]` : '';
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
        return `${timestamp} [${log.category}]${rid} ${log.level}: ${log.message}${dataStr}`;
      })
      .join('\n');
  }

  /**
   * Shape every in-memory log entry for upload to the backend
   * `/api/v1/debug/client-log` endpoint. Keeps the raw structure so server
   * side can filter by category / level / requestId.
   */
  exportForUpload(): Array<{ timestamp: string; level: string; category: string; message: string; meta?: any; requestId?: string }> {
    return this.logs.map(l => ({
      timestamp: l.timestamp.toISOString(),
      level: l.level,
      category: l.category,
      message: l.message,
      meta: l.data,
      requestId: l.requestId,
    }));
  }
}

export const logger = Logger.getInstance();
