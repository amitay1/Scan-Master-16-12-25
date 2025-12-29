/**
 * License Manager for Electron App
 *
 * Handles license validation, storage, and checking
 * Works offline-first with optional online verification
 */

const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Same secret as generator (should be obfuscated in production)
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'your-super-secret-key-change-this-in-production';

// Available standards catalog
const AVAILABLE_STANDARDS = {
  'AMS': { code: 'AMS-STD-2154E', name: 'Aerospace Material Specification' },
  'ASTM': { code: 'ASTM-A388', name: 'Steel Forgings' },
  'BS3': { code: 'BS-EN-10228-3', name: 'European Steel Standards Part 3' },
  'BS4': { code: 'BS-EN-10228-4', name: 'European Steel Standards Part 4' },
  'MIL': { code: 'MIL-STD-2154', name: 'Military Standard' },
};

class LicenseManager {
  constructor() {
    this.licenseFile = path.join(app.getPath('userData'), 'license.dat');
    this.licenseBackupFile = path.join(app.getPath('userData'), 'license.bak');
    this.secret = LICENSE_SECRET;
    this.cachedLicense = null;
  }

  /**
   * Check if application is activated
   */
  isActivated() {
    return fs.existsSync(this.licenseFile);
  }

  /**
   * Get current license info
   */
  getLicense() {
    if (this.cachedLicense) {
      return this.cachedLicense;
    }

    if (!this.isActivated()) {
      return {
        activated: false,
        valid: false,
        reason: 'NOT_ACTIVATED'
      };
    }

    try {
      const encryptedData = fs.readFileSync(this.licenseFile, 'utf8');
      const license = this.decryptLicense(encryptedData);

      // Check if expired
      if (license.expiryDate && new Date() > new Date(license.expiryDate)) {
        return {
          activated: true,
          valid: false,
          reason: 'EXPIRED',
          expiryDate: license.expiryDate
        };
      }

      // Cache valid license
      this.cachedLicense = {
        activated: true,
        valid: true,
        factoryId: license.factoryId,
        factoryName: license.factoryName,
        purchasedStandards: license.purchasedStandards,
        standardsCodes: license.standardsCodes || [],
        expiryDate: license.expiryDate,
        isLifetime: license.isLifetime,
        activatedAt: license.activatedAt
      };

      return this.cachedLicense;
    } catch (error) {
      console.error('Error reading license:', error);
      return {
        activated: true,
        valid: false,
        reason: 'CORRUPTED',
        error: error.message
      };
    }
  }

  /**
   * Validate and activate license
   */
  async activateLicense(licenseKey) {
    try {
      // 1. Parse and verify license key
      const parsed = this.parseLicenseKey(licenseKey);

      if (!parsed.valid) {
        return {
          success: false,
          error: parsed.error || 'Invalid license key format'
        };
      }

      // 2. Optional: Verify with server (if online)
      // This is non-blocking - if offline, we trust the signature
      try {
        const serverValidation = await this.verifyWithServer(licenseKey);
        if (serverValidation && !serverValidation.valid) {
          return {
            success: false,
            error: 'License rejected by server: ' + serverValidation.reason
          };
        }
      } catch (error) {
        console.log('Server verification failed (offline?), continuing with offline validation');
      }

      // 3. Prepare license data
      const licenseData = {
        licenseKey,
        factoryId: parsed.factoryId,
        factoryName: parsed.factoryName || 'Unknown Factory',
        purchasedStandards: parsed.purchasedStandards,
        standardsCodes: parsed.standardsCodes,
        expiryDate: parsed.expiryDate,
        isLifetime: parsed.isLifetime,
        activatedAt: new Date().toISOString()
      };

      // 4. Encrypt and save license
      const encrypted = this.encryptLicense(licenseData);
      fs.writeFileSync(this.licenseFile, encrypted, 'utf8');

      // Create backup
      fs.writeFileSync(this.licenseBackupFile, encrypted, 'utf8');

      // Clear cache
      this.cachedLicense = null;

      console.log('✅ License activated successfully');
      console.log('Factory ID:', licenseData.factoryId);
      console.log('Standards:', licenseData.purchasedStandards.join(', '));

      return {
        success: true,
        license: this.getLicense()
      };
    } catch (error) {
      console.error('License activation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse license key
   */
  parseLicenseKey(licenseKey) {
    try {
      const parts = licenseKey.trim().split('-');

      if (parts.length < 5) {
        throw new Error('Invalid license key format');
      }

      const [prefix, factoryId, standardsCodes, expiry, ...signatureParts] = parts;
      const signature = signatureParts.join('-');

      if (prefix !== 'SM') {
        throw new Error('Invalid license key prefix');
      }

      // Verify signature
      const data = `${factoryId}:${standardsCodes}:${expiry}`;
      const expectedSig = this.generateSignature(data);

      if (signature !== expectedSig) {
        throw new Error('Invalid license signature - license may be tampered');
      }

      // Decode standards
      const purchasedStandards = this.decodeStandards(standardsCodes);

      if (purchasedStandards.length === 0) {
        throw new Error('No valid standards found in license');
      }

      // Parse expiry
      let expiryDate = null;
      if (expiry !== 'LIFETIME') {
        const year = expiry.substring(0, 4);
        const month = expiry.substring(4, 6);
        const day = expiry.substring(6, 8);
        expiryDate = new Date(`${year}-${month}-${day}`);

        if (isNaN(expiryDate.getTime())) {
          throw new Error('Invalid expiry date in license');
        }
      }

      return {
        valid: true,
        factoryId,
        purchasedStandards,
        standardsCodes,
        expiryDate: expiryDate ? expiryDate.toISOString() : null,
        isLifetime: expiry === 'LIFETIME',
        signature
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Decode standards from compact format
   */
  decodeStandards(encoded) {
    const standards = [];
    const codes = [];

    for (const [key, value] of Object.entries(AVAILABLE_STANDARDS)) {
      if (encoded.includes(key)) {
        standards.push(value.code);
        codes.push(key);
      }
    }

    return standards;
  }

  /**
   * Generate HMAC signature
   */
  generateSignature(data) {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex')
      .substring(0, 12)
      .toUpperCase();
  }

  /**
   * Encrypt license data for storage
   */
  encryptLicense(licenseData) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.secret, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(licenseData), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt license data from storage
   */
  decryptLicense(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.secret, 'salt', 32);

    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Verify license with server (optional, non-blocking)
   */
  async verifyWithServer(licenseKey, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('https://license.scanmaster.com/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          appVersion: app.getVersion(),
          platform: process.platform
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Server returned error: ' + response.status);
      }

      return await response.json();
    } catch (error) {
      // If server is unreachable, we continue with offline validation
      console.log('Server verification unavailable:', error.message);
      return null;
    }
  }

  /**
   * Check if a specific standard is purchased
   */
  hasStandard(standardCode) {
    const license = this.getLicense();

    if (!license.valid) {
      return false;
    }

    return license.purchasedStandards.includes(standardCode);
  }

  /**
   * Get all available standards with lock status
   */
  getStandardsCatalog() {
    const license = this.getLicense();
    const purchased = license.valid ? license.purchasedStandards : [];

    return Object.entries(AVAILABLE_STANDARDS).map(([key, value]) => ({
      shortCode: key,
      code: value.code,
      name: value.name,
      isPurchased: purchased.includes(value.code),
      isLocked: !purchased.includes(value.code)
    }));
  }

  /**
   * Deactivate license (for testing or uninstall)
   */
  deactivate() {
    if (fs.existsSync(this.licenseFile)) {
      fs.unlinkSync(this.licenseFile);
    }
    if (fs.existsSync(this.licenseBackupFile)) {
      fs.unlinkSync(this.licenseBackupFile);
    }
    this.cachedLicense = null;
    console.log('License deactivated');
  }

  /**
   * Restore license from backup
   */
  restoreFromBackup() {
    if (fs.existsSync(this.licenseBackupFile)) {
      fs.copyFileSync(this.licenseBackupFile, this.licenseFile);
      this.cachedLicense = null;
      return true;
    }
    return false;
  }

  /**
   * Get license info for display
   */
  getLicenseInfo() {
    const license = this.getLicense();

    if (!license.valid) {
      return {
        status: 'inactive',
        message: this.getStatusMessage(license.reason)
      };
    }

    const daysUntilExpiry = license.isLifetime
      ? null
      : Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

    return {
      status: 'active',
      factoryId: license.factoryId,
      factoryName: license.factoryName,
      standards: this.getStandardsCatalog().filter(s => s.isPurchased),
      isLifetime: license.isLifetime,
      expiryDate: license.expiryDate,
      daysUntilExpiry,
      activatedAt: license.activatedAt
    };
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(reason) {
    const messages = {
      'NOT_ACTIVATED': 'This application is not activated. Please enter your license key.',
      'EXPIRED': 'Your license has expired. Please contact Scan Master to renew.',
      'CORRUPTED': 'License file is corrupted. Please contact support.',
      'INVALID': 'Invalid license. Please check your license key.'
    };
    return messages[reason] || 'License validation failed.';
  }
}

module.exports = LicenseManager;
