// Global Console Log Collection Service
class ConsoleLogService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Limit to prevent memory issues
    this.isCapturing = false;
    this.originalConsole = {};
    
    this.init();
  }

  init() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Don't start capturing by default - disabled by default for performance
    // this.startCapturing();
  }

  startCapturing() {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    
    // Override console methods
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.captureLog('log', ...args);
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.captureLog('error', ...args);
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.captureLog('warn', ...args);
    };

    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.captureLog('info', ...args);
    };

    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      this.captureLog('debug', ...args);
    };
  }

  stopCapturing() {
    if (!this.isCapturing) return;
    
    // Restore original console methods
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
    
    this.isCapturing = false;
  }

  captureLog(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('consoleLogCaptured', {
      detail: { logEntry, totalLogs: this.logs.length }
    }));
  }

  getLogs() {
    return [...this.logs];
  }

  getLogCount() {
    return this.logs.length;
  }

  clearLogs() {
    this.logs = [];
    window.dispatchEvent(new CustomEvent('consoleLogsCleared'));
  }

  downloadLogs() {
    const logText = this.logs.map(log => 
      `[${log.timestamp}] [${log.level}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return `Downloaded ${this.logs.length} log entries`;
  }

  getLogsSummary() {
    const summary = {
      total: this.logs.length,
      byLevel: {}
    };

    this.logs.forEach(log => {
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
    });

    return summary;
  }
}

// Create global instance
const consoleLogService = new ConsoleLogService();

// Make it globally accessible
window.ConsoleLogService = consoleLogService;

export default consoleLogService;
