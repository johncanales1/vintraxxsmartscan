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
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private enabled = __DEV__;

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

  private log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enabled) {
      const prefix = `[${category}] ${level}:`;
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
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
        return `${timestamp} [${log.category}] ${log.level}: ${log.message}${dataStr}`;
      })
      .join('\n');
  }

  exportLogs(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
        return `${timestamp} [${log.category}] ${log.level}: ${log.message}${dataStr}`;
      })
      .join('\n');
  }
}

export const logger = Logger.getInstance();
