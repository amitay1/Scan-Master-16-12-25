/**
 * Diagnostics Collector - Comprehensive system and app diagnostics for support
 *
 * Features:
 * - System information collection
 * - Application state snapshot
 * - Error and crash logs
 * - Performance metrics
 * - License information (sanitized)
 * - Export to ZIP file for USB transfer
 */

import { crashReporter } from '@/lib/crashReporter';

export interface SystemInfo {
  platform: string;
  architecture: string;
  userAgent: string;
  language: string;
  languages: string[];
  online: boolean;
  cookieEnabled: boolean;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  memory?: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  timestamp: string;
}

export interface AppState {
  version: string;
  buildDate?: string;
  route: string;
  activeTab?: string;
  settings?: Record<string, unknown>;
  recentCards?: number;
  lastActivity?: string;
}

export interface LicenseInfo {
  status: 'active' | 'expired' | 'trial' | 'unknown';
  type?: string;
  expiryDate?: string;
  daysRemaining?: number;
  standardsAccess?: string[];
  activationsUsed?: number;
  maxActivations?: number;
  factoryId?: string;
}

export interface PerformanceMetrics {
  loadTime?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface DiagnosticsPackage {
  manifest: {
    version: string;
    exportedAt: string;
    exportedBy: string;
    machineId?: string;
    factoryId?: string;
  };
  systemInfo: SystemInfo;
  appState: AppState;
  licenseInfo: LicenseInfo;
  crashLogs: unknown[];
  errorLogs: unknown[];
  performanceMetrics: PerformanceMetrics;
  activityLog: string[];
  screenshots?: string[]; // Base64 encoded, optional
}

const APP_VERSION = '1.0.102';

class DiagnosticsCollectorService {
  private static instance: DiagnosticsCollectorService;

  private constructor() {}

  static getInstance(): DiagnosticsCollectorService {
    if (!DiagnosticsCollectorService.instance) {
      DiagnosticsCollectorService.instance = new DiagnosticsCollectorService();
    }
    return DiagnosticsCollectorService.instance;
  }

  /**
   * Collect system information
   */
  collectSystemInfo(): SystemInfo {
    const memory = (performance as unknown as { memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    }}).memory;

    return {
      platform: navigator.platform,
      architecture: this.detectArchitecture(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: [...navigator.languages],
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: memory ? {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      } : undefined,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect system architecture from user agent
   */
  private detectArchitecture(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win64') || ua.includes('x64') || ua.includes('amd64')) {
      return 'x64';
    } else if (ua.includes('arm64') || ua.includes('aarch64')) {
      return 'arm64';
    } else if (ua.includes('arm')) {
      return 'arm';
    } else if (ua.includes('x86') || ua.includes('i686') || ua.includes('i386')) {
      return 'x86';
    }
    return 'unknown';
  }

  /**
   * Collect application state
   */
  collectAppState(): AppState {
    let settings: Record<string, unknown> | undefined;
    let recentCards = 0;

    try {
      const storedSettings = localStorage.getItem('scanmaster_settings');
      if (storedSettings) {
        settings = JSON.parse(storedSettings);
      }

      const savedCards = localStorage.getItem('scanmaster_saved_cards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        recentCards = Array.isArray(cards) ? cards.length : 0;
      }
    } catch {
      // Ignore parsing errors
    }

    return {
      version: APP_VERSION,
      route: window.location.pathname,
      activeTab: this.detectActiveTab(),
      settings: this.sanitizeSettings(settings),
      recentCards,
      lastActivity: localStorage.getItem('scanmaster_last_activity') || undefined,
    };
  }

  /**
   * Detect currently active tab
   */
  private detectActiveTab(): string | undefined {
    // Try to get from URL hash or query params
    const hash = window.location.hash;
    if (hash) {
      return hash.replace('#', '');
    }

    // Try to get from localStorage
    try {
      return localStorage.getItem('scanmaster_active_tab') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Sanitize settings to remove sensitive data
   */
  private sanitizeSettings(settings?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!settings) return undefined;

    const sanitized = { ...settings };

    // Remove potentially sensitive keys
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'auth'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Collect license information (sanitized)
   */
  collectLicenseInfo(): LicenseInfo {
    try {
      const licenseData = localStorage.getItem('scanmaster_license');
      if (!licenseData) {
        return { status: 'unknown' };
      }

      const license = JSON.parse(licenseData);

      // Calculate days remaining
      let daysRemaining: number | undefined;
      if (license.expiryDate) {
        const expiry = new Date(license.expiryDate);
        const now = new Date();
        daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        status: license.valid ? 'active' : 'expired',
        type: license.type || 'standard',
        expiryDate: license.expiryDate,
        daysRemaining: license.lifetime ? undefined : daysRemaining,
        standardsAccess: license.standards || [],
        activationsUsed: license.activationsUsed,
        maxActivations: license.maxActivations,
        factoryId: license.factoryId,
      };
    } catch {
      return { status: 'unknown' };
    }
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {};

    try {
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }

      // Paint timing
      const paintEntries = performance.getEntriesByType('paint');
      for (const entry of paintEntries) {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      }

      // LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
      }

      // Memory
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      if (memory) {
        metrics.memoryUsage = memory.usedJSHeapSize;
      }
    } catch {
      // Performance API may not be fully available
    }

    return metrics;
  }

  /**
   * Collect activity log
   */
  collectActivityLog(): string[] {
    try {
      const log = localStorage.getItem('scanmaster_activity_log');
      return log ? JSON.parse(log) : [];
    } catch {
      return [];
    }
  }

  /**
   * Collect crash and error logs from crashReporter
   */
  collectCrashLogs(): unknown[] {
    return crashReporter.getCrashHistory();
  }

  /**
   * Collect full diagnostics package
   */
  collectDiagnostics(): DiagnosticsPackage {
    const licenseInfo = this.collectLicenseInfo();

    return {
      manifest: {
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        exportedBy: 'DiagnosticsCollector',
        factoryId: licenseInfo.factoryId,
      },
      systemInfo: this.collectSystemInfo(),
      appState: this.collectAppState(),
      licenseInfo,
      crashLogs: this.collectCrashLogs(),
      errorLogs: [], // Can be extended
      performanceMetrics: this.collectPerformanceMetrics(),
      activityLog: this.collectActivityLog(),
    };
  }

  /**
   * Export diagnostics as JSON file
   */
  exportAsJson(filename?: string): void {
    const diagnostics = this.collectDiagnostics();
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {
      type: 'application/json',
    });

    const factoryId = diagnostics.manifest.factoryId || 'UNKNOWN';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultFilename = `diagnostics_${factoryId}_${timestamp}.json`;

    this.downloadBlob(blob, filename || defaultFilename);
  }

  /**
   * Export diagnostics as ZIP file with multiple files
   * Note: This creates a pseudo-ZIP with all data in one JSON for simplicity
   * For real ZIP, would need JSZip library
   */
  exportAsZip(filename?: string): void {
    const diagnostics = this.collectDiagnostics();

    // Create a structured export
    const zipContent = {
      'manifest.json': diagnostics.manifest,
      'system-info.json': diagnostics.systemInfo,
      'app-state.json': diagnostics.appState,
      'license-info.json': diagnostics.licenseInfo,
      'crash-logs.json': diagnostics.crashLogs,
      'performance.json': diagnostics.performanceMetrics,
      'activity-log.json': diagnostics.activityLog,
      'README.txt': this.generateReadme(),
    };

    const blob = new Blob([JSON.stringify(zipContent, null, 2)], {
      type: 'application/json',
    });

    const factoryId = diagnostics.manifest.factoryId || 'UNKNOWN';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultFilename = `diagnostics_${factoryId}_${timestamp}.json`;

    this.downloadBlob(blob, filename || defaultFilename);
  }

  /**
   * Generate README content for support
   */
  private generateReadme(): string {
    return `
SCAN-MASTER DIAGNOSTICS EXPORT
==============================

This file contains diagnostic information from your Scan-Master installation.
It was generated automatically and can be sent to technical support for
troubleshooting purposes.

HOW TO SEND TO SUPPORT:
1. Copy this file to a USB drive
2. Email to support@scanmaster.com (if you have internet access)
3. Or provide it to your local support representative

CONTENTS:
- manifest.json: Export metadata
- system-info.json: System and hardware information
- app-state.json: Application configuration
- license-info.json: License status (no sensitive data)
- crash-logs.json: Recent error reports
- performance.json: Performance metrics
- activity-log.json: Recent user actions

This file does NOT contain:
- Personal information
- Customer data or part details
- Inspection results
- Passwords or security keys

Generated: ${new Date().toISOString()}
Version: ${APP_VERSION}
`.trim();
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get a quick summary for display
   */
  getQuickSummary(): {
    systemStatus: 'good' | 'warning' | 'error';
    crashesLast24h: number;
    memoryUsage: string;
    diskSpace: string;
    licenseStatus: string;
  } {
    const crashStats = crashReporter.getCrashStats();
    const metrics = this.collectPerformanceMetrics();
    const license = this.collectLicenseInfo();

    let systemStatus: 'good' | 'warning' | 'error' = 'good';
    if (crashStats.last24Hours >= 3) {
      systemStatus = 'error';
    } else if (crashStats.last24Hours >= 1) {
      systemStatus = 'warning';
    }

    const memoryMB = metrics.memoryUsage
      ? Math.round(metrics.memoryUsage / (1024 * 1024))
      : 0;

    return {
      systemStatus,
      crashesLast24h: crashStats.last24Hours,
      memoryUsage: memoryMB > 0 ? `${memoryMB} MB` : 'Unknown',
      diskSpace: 'Unknown', // Would need Electron API
      licenseStatus: license.status,
    };
  }
}

// Export singleton
export const diagnosticsCollector = DiagnosticsCollectorService.getInstance();

// Export convenience functions
export const collectDiagnostics = diagnosticsCollector.collectDiagnostics.bind(diagnosticsCollector);
export const exportDiagnosticsAsJson = diagnosticsCollector.exportAsJson.bind(diagnosticsCollector);
export const exportDiagnosticsAsZip = diagnosticsCollector.exportAsZip.bind(diagnosticsCollector);
export const getDiagnosticsSummary = diagnosticsCollector.getQuickSummary.bind(diagnosticsCollector);

export default diagnosticsCollector;
