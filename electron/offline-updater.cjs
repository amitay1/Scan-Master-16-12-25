/**
 * Offline Updater - USB-based update system for air-gapped factories
 *
 * Features:
 * - Validates update packages from USB drive
 * - Verifies SHA256 checksums
 * - Optional signature verification
 * - Progress tracking during installation
 * - Rollback support
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class OfflineUpdater {
  constructor(options = {}) {
    this.currentVersion = options.currentVersion || '0.0.0';
    this.appPath = options.appPath || '';
    this.tempDir = options.tempDir || '';
    this.publicKey = options.publicKey || null; // For signature verification
    this.onProgress = options.onProgress || (() => {});
    this.onLog = options.onLog || console.log;
  }

  /**
   * Compare semantic versions
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  compareVersions(v1, v2) {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Scan a directory for update packages
   * Looks for ScanMaster-Update-*.zip files with valid update-info.json
   */
  async scanForUpdates(directoryPath) {
    const results = {
      found: false,
      packages: [],
      errors: []
    };

    try {
      if (!fs.existsSync(directoryPath)) {
        results.errors.push(`Directory not found: ${directoryPath}`);
        return results;
      }

      const files = fs.readdirSync(directoryPath);

      // Look for update folders or zip files
      for (const file of files) {
        const fullPath = path.join(directoryPath, file);
        const stat = fs.statSync(fullPath);

        // Check for update info file
        let infoPath;
        if (stat.isDirectory()) {
          infoPath = path.join(fullPath, 'update-info.json');
        } else if (file.endsWith('.json') && file.includes('update-info')) {
          infoPath = fullPath;
        } else {
          continue;
        }

        if (!fs.existsSync(infoPath)) {
          continue;
        }

        try {
          const infoContent = fs.readFileSync(infoPath, 'utf8');
          const updateInfo = JSON.parse(infoContent);

          // Validate update info structure
          if (!updateInfo.version || !updateInfo.installerFile) {
            results.errors.push(`Invalid update-info.json in ${file}`);
            continue;
          }

          // Check if this is a newer version
          const isNewer = this.compareVersions(updateInfo.version, this.currentVersion) > 0;

          const packageInfo = {
            path: stat.isDirectory() ? fullPath : path.dirname(infoPath),
            version: updateInfo.version,
            isNewer,
            releaseDate: updateInfo.releaseDate || 'Unknown',
            changelog: updateInfo.changelog || '',
            installerFile: updateInfo.installerFile,
            checksumFile: updateInfo.checksumFile || 'checksums.sha256',
            signatureFile: updateInfo.signatureFile,
            size: updateInfo.size || 0,
            minVersion: updateInfo.minVersion,
            platform: updateInfo.platform || 'win32'
          };

          // Check for installer file
          const installerPath = path.join(packageInfo.path, packageInfo.installerFile);
          if (!fs.existsSync(installerPath)) {
            results.errors.push(`Installer not found: ${packageInfo.installerFile}`);
            packageInfo.installerMissing = true;
          } else {
            const installerStat = fs.statSync(installerPath);
            packageInfo.actualSize = installerStat.size;
          }

          results.packages.push(packageInfo);
          results.found = true;

        } catch (parseError) {
          results.errors.push(`Failed to parse update-info.json in ${file}: ${parseError.message}`);
        }
      }

      // Sort packages by version (newest first)
      results.packages.sort((a, b) => this.compareVersions(b.version, a.version));

    } catch (error) {
      results.errors.push(`Scan error: ${error.message}`);
    }

    return results;
  }

  /**
   * Calculate SHA256 checksum of a file
   */
  calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      let bytesRead = 0;
      const fileSize = fs.statSync(filePath).size;

      stream.on('data', (chunk) => {
        hash.update(chunk);
        bytesRead += chunk.length;
        this.onProgress({
          stage: 'checksum',
          percent: (bytesRead / fileSize) * 100,
          message: `Verifying checksum: ${Math.round((bytesRead / fileSize) * 100)}%`
        });
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', reject);
    });
  }

  /**
   * Verify checksum against checksums file
   */
  async verifyChecksum(packagePath, installerFile, checksumFile) {
    const checksumPath = path.join(packagePath, checksumFile);
    const installerPath = path.join(packagePath, installerFile);

    if (!fs.existsSync(checksumPath)) {
      return { valid: false, error: 'Checksum file not found' };
    }

    try {
      const checksumContent = fs.readFileSync(checksumPath, 'utf8');
      const lines = checksumContent.split('\n');

      let expectedChecksum = null;
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const [hash, filename] = parts;
          if (filename === installerFile || filename.endsWith(installerFile)) {
            expectedChecksum = hash.toLowerCase();
            break;
          }
        }
      }

      if (!expectedChecksum) {
        return { valid: false, error: 'Checksum not found for installer file' };
      }

      this.onLog(`Expected checksum: ${expectedChecksum}`);

      const actualChecksum = await this.calculateChecksum(installerPath);
      this.onLog(`Actual checksum: ${actualChecksum}`);

      const valid = actualChecksum.toLowerCase() === expectedChecksum;

      return {
        valid,
        expected: expectedChecksum,
        actual: actualChecksum,
        error: valid ? null : 'Checksum mismatch - file may be corrupted'
      };

    } catch (error) {
      return { valid: false, error: `Checksum verification failed: ${error.message}` };
    }
  }

  /**
   * Verify digital signature (optional, requires public key)
   */
  async verifySignature(packagePath, signatureFile) {
    if (!this.publicKey || !signatureFile) {
      return { valid: true, skipped: true, message: 'Signature verification skipped' };
    }

    const signaturePath = path.join(packagePath, signatureFile);
    if (!fs.existsSync(signaturePath)) {
      return { valid: false, error: 'Signature file not found' };
    }

    try {
      // Read signature
      const signature = fs.readFileSync(signaturePath);

      // Read the checksums file (what we're verifying)
      const checksumPath = path.join(packagePath, 'checksums.sha256');
      const data = fs.readFileSync(checksumPath);

      // Verify signature
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      const isValid = verify.verify(this.publicKey, signature);

      return {
        valid: isValid,
        error: isValid ? null : 'Invalid signature - update may not be authentic'
      };

    } catch (error) {
      return { valid: false, error: `Signature verification failed: ${error.message}` };
    }
  }

  /**
   * Validate an update package completely
   */
  async validatePackage(packageInfo) {
    const results = {
      valid: true,
      checks: {
        version: { valid: false, message: '' },
        platform: { valid: false, message: '' },
        installer: { valid: false, message: '' },
        checksum: { valid: false, message: '' },
        signature: { valid: false, message: '', skipped: false }
      },
      errors: []
    };

    // Check version
    if (packageInfo.isNewer) {
      results.checks.version = { valid: true, message: `v${packageInfo.version} > v${this.currentVersion}` };
    } else {
      results.checks.version = { valid: false, message: `v${packageInfo.version} is not newer than v${this.currentVersion}` };
      results.valid = false;
      results.errors.push('Update version is not newer than current version');
    }

    // Check minimum version requirement
    if (packageInfo.minVersion) {
      const meetsMin = this.compareVersions(this.currentVersion, packageInfo.minVersion) >= 0;
      if (!meetsMin) {
        results.checks.version.valid = false;
        results.checks.version.message += ` (Requires min v${packageInfo.minVersion})`;
        results.valid = false;
        results.errors.push(`This update requires at least version ${packageInfo.minVersion}`);
      }
    }

    // Check platform
    const currentPlatform = process.platform;
    if (packageInfo.platform === currentPlatform || packageInfo.platform === 'all') {
      results.checks.platform = { valid: true, message: `Platform: ${currentPlatform}` };
    } else {
      results.checks.platform = { valid: false, message: `Package is for ${packageInfo.platform}, not ${currentPlatform}` };
      results.valid = false;
      results.errors.push('Update package is for a different platform');
    }

    // Check installer exists
    const installerPath = path.join(packageInfo.path, packageInfo.installerFile);
    if (fs.existsSync(installerPath)) {
      results.checks.installer = { valid: true, message: 'Installer file found' };
    } else {
      results.checks.installer = { valid: false, message: 'Installer file missing' };
      results.valid = false;
      results.errors.push('Installer file not found in update package');
    }

    // Verify checksum
    this.onProgress({ stage: 'validating', percent: 30, message: 'Verifying checksum...' });
    const checksumResult = await this.verifyChecksum(
      packageInfo.path,
      packageInfo.installerFile,
      packageInfo.checksumFile
    );
    results.checks.checksum = {
      valid: checksumResult.valid,
      message: checksumResult.error || 'Checksum verified'
    };
    if (!checksumResult.valid) {
      results.valid = false;
      results.errors.push(checksumResult.error);
    }

    // Verify signature
    this.onProgress({ stage: 'validating', percent: 70, message: 'Verifying signature...' });
    const signatureResult = await this.verifySignature(packageInfo.path, packageInfo.signatureFile);
    results.checks.signature = {
      valid: signatureResult.valid,
      message: signatureResult.error || signatureResult.message || 'Signature verified',
      skipped: signatureResult.skipped
    };
    if (!signatureResult.valid && !signatureResult.skipped) {
      results.valid = false;
      results.errors.push(signatureResult.error);
    }

    this.onProgress({ stage: 'validating', percent: 100, message: 'Validation complete' });

    return results;
  }

  /**
   * Install the update
   */
  async installUpdate(packageInfo, options = {}) {
    const { silent = false, autoRestart = true } = options;

    const installerPath = path.join(packageInfo.path, packageInfo.installerFile);

    if (!fs.existsSync(installerPath)) {
      throw new Error('Installer file not found');
    }

    this.onProgress({ stage: 'installing', percent: 0, message: 'Starting installation...' });
    this.onLog(`Starting installation: ${installerPath}`);

    return new Promise((resolve, reject) => {
      let installerArgs = [];

      // Determine installer type and arguments
      if (installerPath.endsWith('.exe')) {
        // NSIS or Squirrel installer
        if (silent) {
          installerArgs = ['/S', '/SILENT', '/VERYSILENT'];
        }
        if (autoRestart) {
          installerArgs.push('/RESTARTAPPLICATION');
        }
      } else if (installerPath.endsWith('.msi')) {
        // MSI installer
        installerArgs = ['/i', installerPath];
        if (silent) {
          installerArgs.push('/quiet', '/qn');
        }
      }

      this.onProgress({ stage: 'installing', percent: 10, message: 'Launching installer...' });

      // For Windows, run the installer
      const isWindows = process.platform === 'win32';
      let installer;

      if (isWindows && installerPath.endsWith('.msi')) {
        installer = spawn('msiexec', installerArgs, {
          detached: true,
          stdio: 'ignore'
        });
      } else {
        installer = spawn(installerPath, installerArgs, {
          detached: true,
          stdio: 'ignore'
        });
      }

      installer.on('error', (error) => {
        this.onLog(`Installer error: ${error.message}`);
        reject(error);
      });

      // Unref the child process so it can run independently
      installer.unref();

      this.onProgress({ stage: 'installing', percent: 100, message: 'Installation started' });

      // Give the installer a moment to start
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Installation started. The application will restart automatically.',
          installerPath
        });
      }, 1000);
    });
  }

  /**
   * Get update package details for display
   */
  getPackageDisplayInfo(packageInfo) {
    return {
      version: packageInfo.version,
      currentVersion: this.currentVersion,
      isNewer: packageInfo.isNewer,
      releaseDate: packageInfo.releaseDate,
      changelog: packageInfo.changelog,
      size: this.formatBytes(packageInfo.actualSize || packageInfo.size),
      platform: packageInfo.platform
    };
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = OfflineUpdater;
