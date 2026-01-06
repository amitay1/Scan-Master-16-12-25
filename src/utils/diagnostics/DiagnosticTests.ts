/**
 * Diagnostic Tests - Self-diagnostic system for Scan-Master
 *
 * Runs various health checks on:
 * - System resources (disk, memory, CPU)
 * - Application health (database, file system, WebGL)
 * - License status
 * - Performance benchmarks
 */

import { crashReporter } from '@/lib/crashReporter';

export type TestStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed';

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'system' | 'application' | 'license' | 'performance';
  description: string;
  status: TestStatus;
  result?: string;
  details?: string;
  duration?: number;
}

export interface DiagnosticReport {
  timestamp: string;
  appVersion: string;
  overallStatus: 'healthy' | 'warning' | 'unhealthy';
  tests: DiagnosticTest[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

const APP_VERSION = '1.0.102';

// Thresholds
const MEMORY_WARNING_MB = 1500;
const MEMORY_CRITICAL_MB = 2000;
const CRASH_WARNING_COUNT = 2;
const CRASH_CRITICAL_COUNT = 5;

class DiagnosticTestRunner {
  private tests: DiagnosticTest[] = [];
  private onProgress?: (test: DiagnosticTest) => void;

  constructor(onProgress?: (test: DiagnosticTest) => void) {
    this.onProgress = onProgress;
    this.initializeTests();
  }

  private initializeTests() {
    this.tests = [
      // System Resources
      {
        id: 'memory',
        name: 'Memory Usage',
        category: 'system',
        description: 'Check available memory',
        status: 'pending',
      },
      {
        id: 'storage',
        name: 'Storage Access',
        category: 'system',
        description: 'Verify localStorage access',
        status: 'pending',
      },
      {
        id: 'network',
        name: 'Network Status',
        category: 'system',
        description: 'Check network connectivity',
        status: 'pending',
      },

      // Application Health
      {
        id: 'webgl',
        name: 'WebGL Support',
        category: 'application',
        description: 'Check 3D rendering capability',
        status: 'pending',
      },
      {
        id: 'indexeddb',
        name: 'IndexedDB',
        category: 'application',
        description: 'Verify database storage',
        status: 'pending',
      },
      {
        id: 'crashes',
        name: 'Crash History',
        category: 'application',
        description: 'Check recent crash reports',
        status: 'pending',
      },
      {
        id: 'settings',
        name: 'Settings Integrity',
        category: 'application',
        description: 'Verify settings data',
        status: 'pending',
      },

      // License
      {
        id: 'license_status',
        name: 'License Status',
        category: 'license',
        description: 'Verify license activation',
        status: 'pending',
      },
      {
        id: 'license_expiry',
        name: 'License Expiry',
        category: 'license',
        description: 'Check license validity period',
        status: 'pending',
      },

      // Performance
      {
        id: 'render_speed',
        name: 'Render Performance',
        category: 'performance',
        description: 'Test UI rendering speed',
        status: 'pending',
      },
      {
        id: 'storage_speed',
        name: 'Storage Speed',
        category: 'performance',
        description: 'Test read/write speed',
        status: 'pending',
      },
    ];
  }

  private updateTest(id: string, updates: Partial<DiagnosticTest>) {
    const index = this.tests.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tests[index] = { ...this.tests[index], ...updates };
      if (this.onProgress) {
        this.onProgress(this.tests[index]);
      }
    }
  }

  // Test implementations

  private async testMemory(): Promise<void> {
    this.updateTest('memory', { status: 'running' });
    const start = performance.now();

    try {
      const memory = (performance as unknown as { memory?: {
        usedJSHeapSize: number;
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
      }}).memory;

      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        const totalMB = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));
        const percentUsed = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

        let status: TestStatus = 'passed';
        if (usedMB > MEMORY_CRITICAL_MB) {
          status = 'failed';
        } else if (usedMB > MEMORY_WARNING_MB) {
          status = 'warning';
        }

        this.updateTest('memory', {
          status,
          result: `${usedMB} MB / ${totalMB} MB (${percentUsed}%)`,
          details: status === 'passed' ? 'Memory usage is healthy' :
                   status === 'warning' ? 'Memory usage is elevated' :
                   'Memory usage is critical',
          duration: performance.now() - start,
        });
      } else {
        this.updateTest('memory', {
          status: 'warning',
          result: 'Not available',
          details: 'Memory API not supported in this browser',
          duration: performance.now() - start,
        });
      }
    } catch (error) {
      this.updateTest('memory', {
        status: 'failed',
        result: 'Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - start,
      });
    }
  }

  private async testStorage(): Promise<void> {
    this.updateTest('storage', { status: 'running' });
    const start = performance.now();

    try {
      const testKey = 'scanmaster_diagnostic_test';
      const testValue = 'test_' + Date.now();

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        // Estimate storage used
        let totalSize = 0;
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage.getItem(key)?.length || 0;
          }
        }
        const sizeKB = Math.round(totalSize / 1024);

        this.updateTest('storage', {
          status: 'passed',
          result: `${sizeKB} KB used`,
          details: 'localStorage is accessible and working',
          duration: performance.now() - start,
        });
      } else {
        this.updateTest('storage', {
          status: 'failed',
          result: 'Read/Write mismatch',
          details: 'localStorage data corruption detected',
          duration: performance.now() - start,
        });
      }
    } catch (error) {
      this.updateTest('storage', {
        status: 'failed',
        result: 'Error',
        details: error instanceof Error ? error.message : 'Storage access denied',
        duration: performance.now() - start,
      });
    }
  }

  private async testNetwork(): Promise<void> {
    this.updateTest('network', { status: 'running' });
    const start = performance.now();

    try {
      const isOnline = navigator.onLine;

      this.updateTest('network', {
        status: isOnline ? 'passed' : 'warning',
        result: isOnline ? 'Online' : 'Offline',
        details: isOnline
          ? 'Network connection available'
          : 'Running in offline mode - some features may be limited',
        duration: performance.now() - start,
      });
    } catch (error) {
      this.updateTest('network', {
        status: 'warning',
        result: 'Unknown',
        details: 'Could not determine network status',
        duration: performance.now() - start,
      });
    }
  }

  private async testWebGL(): Promise<void> {
    this.updateTest('webgl', { status: 'running' });
    const start = performance.now();

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        let renderer = 'Unknown GPU';

        if (debugInfo) {
          renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }

        this.updateTest('webgl', {
          status: 'passed',
          result: 'Supported',
          details: `GPU: ${renderer}`,
          duration: performance.now() - start,
        });
      } else {
        this.updateTest('webgl', {
          status: 'failed',
          result: 'Not supported',
          details: '3D rendering will not work. Please update your browser or graphics drivers.',
          duration: performance.now() - start,
        });
      }
    } catch (error) {
      this.updateTest('webgl', {
        status: 'failed',
        result: 'Error',
        details: error instanceof Error ? error.message : 'WebGL initialization failed',
        duration: performance.now() - start,
      });
    }
  }

  private async testIndexedDB(): Promise<void> {
    this.updateTest('indexeddb', { status: 'running' });
    const start = performance.now();

    try {
      const request = indexedDB.open('scanmaster_diagnostic_test', 1);

      await new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(new Error('IndexedDB access denied'));
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('scanmaster_diagnostic_test');
          resolve();
        };
        request.onupgradeneeded = () => {
          // Database created successfully
        };
      });

      this.updateTest('indexeddb', {
        status: 'passed',
        result: 'Available',
        details: 'IndexedDB is accessible for data storage',
        duration: performance.now() - start,
      });
    } catch (error) {
      this.updateTest('indexeddb', {
        status: 'warning',
        result: 'Limited',
        details: error instanceof Error ? error.message : 'IndexedDB may not be available',
        duration: performance.now() - start,
      });
    }
  }

  private async testCrashes(): Promise<void> {
    this.updateTest('crashes', { status: 'running' });
    const start = performance.now();

    try {
      const stats = crashReporter.getCrashStats();

      let status: TestStatus = 'passed';
      if (stats.last24Hours >= CRASH_CRITICAL_COUNT) {
        status = 'failed';
      } else if (stats.last24Hours >= CRASH_WARNING_COUNT) {
        status = 'warning';
      }

      this.updateTest('crashes', {
        status,
        result: `${stats.last24Hours} in last 24h`,
        details: status === 'passed'
          ? 'No significant crash activity'
          : status === 'warning'
          ? 'Some crashes detected - consider exporting diagnostics'
          : 'Multiple crashes detected - please contact support',
        duration: performance.now() - start,
      });
    } catch (error) {
      this.updateTest('crashes', {
        status: 'warning',
        result: 'Unknown',
        details: 'Could not read crash history',
        duration: performance.now() - start,
      });
    }
  }

  private async testSettings(): Promise<void> {
    this.updateTest('settings', { status: 'running' });
    const start = performance.now();

    try {
      const settings = localStorage.getItem('scanmaster_settings');

      if (settings) {
        JSON.parse(settings); // Validate JSON
        this.updateTest('settings', {
          status: 'passed',
          result: 'Valid',
          details: 'Application settings are intact',
          duration: performance.now() - start,
        });
      } else {
        this.updateTest('settings', {
          status: 'passed',
          result: 'Default',
          details: 'Using default settings',
          duration: performance.now() - start,
        });
      }
    } catch (error) {
      this.updateTest('settings', {
        status: 'warning',
        result: 'Corrupted',
        details: 'Settings data may be corrupted - consider resetting',
        duration: performance.now() - start,
      });
    }
  }

  private async testLicenseStatus(): Promise<void> {
    this.updateTest('license_status', { status: 'running' });
    const start = performance.now();

    try {
      const licenseData = localStorage.getItem('scanmaster_license');

      if (licenseData) {
        const license = JSON.parse(licenseData);

        if (license.valid && license.activated) {
          this.updateTest('license_status', {
            status: 'passed',
            result: 'Active',
            details: `License type: ${license.type || 'Standard'}`,
            duration: performance.now() - start,
          });
        } else {
          this.updateTest('license_status', {
            status: 'failed',
            result: 'Invalid',
            details: 'License is not activated or has been revoked',
            duration: performance.now() - start,
          });
        }
      } else {
        this.updateTest('license_status', {
          status: 'warning',
          result: 'Not found',
          details: 'No license data - running in web mode or trial',
          duration: performance.now() - start,
        });
      }
    } catch (error) {
      this.updateTest('license_status', {
        status: 'warning',
        result: 'Error',
        details: 'Could not read license data',
        duration: performance.now() - start,
      });
    }
  }

  private async testLicenseExpiry(): Promise<void> {
    this.updateTest('license_expiry', { status: 'running' });
    const start = performance.now();

    try {
      const licenseData = localStorage.getItem('scanmaster_license');

      if (licenseData) {
        const license = JSON.parse(licenseData);

        if (license.lifetime) {
          this.updateTest('license_expiry', {
            status: 'passed',
            result: 'Lifetime',
            details: 'License never expires',
            duration: performance.now() - start,
          });
        } else if (license.expiryDate) {
          const expiry = new Date(license.expiryDate);
          const now = new Date();
          const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status: TestStatus = 'passed';
          if (daysRemaining <= 0) {
            status = 'failed';
          } else if (daysRemaining <= 30) {
            status = 'warning';
          }

          this.updateTest('license_expiry', {
            status,
            result: daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days`,
            details: daysRemaining <= 0
              ? 'License has expired - please renew'
              : daysRemaining <= 30
              ? 'License expiring soon - consider renewal'
              : 'License validity is good',
            duration: performance.now() - start,
          });
        } else {
          this.updateTest('license_expiry', {
            status: 'passed',
            result: 'No expiry',
            details: 'License has no expiration date',
            duration: performance.now() - start,
          });
        }
      } else {
        this.updateTest('license_expiry', {
          status: 'warning',
          result: 'N/A',
          details: 'No license installed',
          duration: performance.now() - start,
        });
      }
    } catch (error) {
      this.updateTest('license_expiry', {
        status: 'warning',
        result: 'Error',
        details: 'Could not check license expiry',
        duration: performance.now() - start,
      });
    }
  }

  private async testRenderSpeed(): Promise<void> {
    this.updateTest('render_speed', { status: 'running' });
    const start = performance.now();

    try {
      // Create a simple render benchmark
      const iterations = 100;
      const testDiv = document.createElement('div');
      testDiv.style.position = 'absolute';
      testDiv.style.left = '-9999px';
      document.body.appendChild(testDiv);

      const benchStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        testDiv.innerHTML = `<div style="background: red; width: 100px; height: 100px;">Test ${i}</div>`;
        testDiv.offsetHeight; // Force reflow
      }
      const benchEnd = performance.now();
      document.body.removeChild(testDiv);

      const avgTime = (benchEnd - benchStart) / iterations;
      let status: TestStatus = 'passed';
      if (avgTime > 5) {
        status = 'failed';
      } else if (avgTime > 2) {
        status = 'warning';
      }

      this.updateTest('render_speed', {
        status,
        result: `${avgTime.toFixed(2)} ms/render`,
        details: status === 'passed'
          ? 'Rendering performance is good'
          : status === 'warning'
          ? 'Rendering may be slow on complex views'
          : 'Rendering is very slow - check system resources',
        duration: performance.now() - start,
      });
    } catch (error) {
      this.updateTest('render_speed', {
        status: 'warning',
        result: 'Error',
        details: 'Could not run render benchmark',
        duration: performance.now() - start,
      });
    }
  }

  private async testStorageSpeed(): Promise<void> {
    this.updateTest('storage_speed', { status: 'running' });
    const start = performance.now();

    try {
      const testKey = 'scanmaster_speed_test';
      const testData = 'x'.repeat(10000); // 10KB of data
      const iterations = 50;

      const writeStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        localStorage.setItem(testKey + i, testData);
      }
      const writeEnd = performance.now();

      const readStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        localStorage.getItem(testKey + i);
      }
      const readEnd = performance.now();

      // Cleanup
      for (let i = 0; i < iterations; i++) {
        localStorage.removeItem(testKey + i);
      }

      const writeSpeed = ((iterations * 10) / ((writeEnd - writeStart) / 1000)).toFixed(0);
      const readSpeed = ((iterations * 10) / ((readEnd - readStart) / 1000)).toFixed(0);

      this.updateTest('storage_speed', {
        status: 'passed',
        result: `R: ${readSpeed} KB/s, W: ${writeSpeed} KB/s`,
        details: 'Storage I/O performance is acceptable',
        duration: performance.now() - start,
      });
    } catch (error) {
      this.updateTest('storage_speed', {
        status: 'warning',
        result: 'Error',
        details: 'Could not measure storage speed',
        duration: performance.now() - start,
      });
    }
  }

  /**
   * Run all diagnostic tests
   */
  async runAllTests(): Promise<DiagnosticReport> {
    // Run tests in sequence
    await this.testMemory();
    await this.testStorage();
    await this.testNetwork();
    await this.testWebGL();
    await this.testIndexedDB();
    await this.testCrashes();
    await this.testSettings();
    await this.testLicenseStatus();
    await this.testLicenseExpiry();
    await this.testRenderSpeed();
    await this.testStorageSpeed();

    // Calculate summary
    const passed = this.tests.filter(t => t.status === 'passed').length;
    const warnings = this.tests.filter(t => t.status === 'warning').length;
    const failed = this.tests.filter(t => t.status === 'failed').length;

    let overallStatus: DiagnosticReport['overallStatus'] = 'healthy';
    if (failed > 0) {
      overallStatus = 'unhealthy';
    } else if (warnings > 0) {
      overallStatus = 'warning';
    }

    return {
      timestamp: new Date().toISOString(),
      appVersion: APP_VERSION,
      overallStatus,
      tests: [...this.tests],
      summary: {
        total: this.tests.length,
        passed,
        warnings,
        failed,
      },
    };
  }

  /**
   * Get current tests state
   */
  getTests(): DiagnosticTest[] {
    return [...this.tests];
  }
}

export function createDiagnosticRunner(onProgress?: (test: DiagnosticTest) => void): DiagnosticTestRunner {
  return new DiagnosticTestRunner(onProgress);
}

export default DiagnosticTestRunner;
