/**
 * Client-side logger utility
 * Replaces console.log/error/warn with proper logging
 * In production: logs to server or external service
 * In development: logs to console with colors
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Log levels
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Send logs to server in production
 */
async function sendToServer(entry: LogEntry): Promise<void> {
  if (!isProduction) return;
  
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    // Silently fail - don't break the app if logging fails
    console.error('Failed to send log to server:', error);
  }
}

/**
 * Create log entry
 */
function createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    stack: level === 'error' ? new Error().stack : undefined,
  };
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  const entry = createLogEntry('info', message, context);
  
  if (isDevelopment) {
    console.log(`ℹ️ [INFO] ${message}`, context || '');
  }
  
  sendToServer(entry);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: Record<string, unknown>): void {
  const entry = createLogEntry('warn', message, context);
  
  if (isDevelopment) {
    console.warn(`⚠️ [WARN] ${message}`, context || '');
  }
  
  sendToServer(entry);
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error | unknown): void {
  const context = error instanceof Error 
    ? { message: error.message, stack: error.stack, name: error.name }
    : error ? { error: String(error) } : undefined;
  const entry = createLogEntry('error', message, context);
  
  if (isDevelopment) {
    console.error(`❌ [ERROR] ${message}`, error || '');
  }
  
  sendToServer(entry);
}

/**
 * Log debug message (development only)
 */
export function logDebug(message: string, context?: Record<string, unknown>): void {
  if (!isDevelopment) return;
  
  const entry = createLogEntry('debug', message, context);
  console.log(`🐛 [DEBUG] ${message}`, context || '');
}

/**
 * Performance monitoring
 */
export function logPerformance(operationName: string, durationMs: number): void {
  const entry = createLogEntry('info', `Performance: ${operationName}`, {
    operation: operationName,
    duration: durationMs,
    unit: 'ms',
  });
  
  if (isDevelopment) {
    console.log(`⏱️ [PERF] ${operationName}: ${durationMs}ms`);
  }
  
  sendToServer(entry);
}

/**
 * User action tracking
 */
export function logUserAction(action: string, details?: Record<string, unknown>): void {
  const entry = createLogEntry('info', `User action: ${action}`, details);
  
  if (isDevelopment) {
    console.log(`👤 [USER] ${action}`, details || '');
  }
  
  sendToServer(entry);
}
