/**
 * Scan Master Update Server
 *
 * Handles per-factory update distribution and license validation
 * Supports:
 * - Factory-specific updates
 * - Global updates with channels (stable, beta)
 * - License validation on update check
 * - Platform-specific builds (Windows, macOS, Linux)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.UPDATE_SERVER_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files (admin dashboard & update files)

// In-memory factory configuration (in production, use database)
const factoryConfigs = new Map();

// Sample factory configs
factoryConfigs.set('FAC-ACMECO-M9X2K1', {
  factoryId: 'FAC-ACMECO-M9X2K1',
  factoryName: 'Acme Corporation',
  channel: 'stable',           // stable | beta | custom
  customUpdates: [],           // Custom version for this factory only
  autoUpdate: true,
  language: 'en',
  purchasedStandards: ['AMS-STD-2154E', 'ASTM-A388'],
  licenseValid: true,
  lastCheckIn: null
});

// Available versions
const versions = {
  stable: '1.0.21',
  beta: '1.0.22-beta.1',
  custom: new Map() // factoryId -> version
};

// Release notes
const releaseNotes = {
  '1.0.21': {
    version: '1.0.21',
    date: '2025-12-29',
    changes: {
      en: [
        '✨ Added license activation system',
        '🔒 Added standards locking mechanism',
        '🐛 Fixed PDF export issues',
        '⚡ Performance improvements'
      ],
      he: [
        '✨ נוספה מערכת הפעלת רישיון',
        '🔒 נוספה נעילת תקנים',
        '🐛 תוקנו בעיות ייצוא PDF',
        '⚡ שיפורי ביצועים'
      ]
    },
    critical: false,
    downloadUrls: {
      win32: 'https://updates.scanmaster.com/releases/v1.0.21/Scan-Master-Setup-1.0.21.exe',
      darwin: 'https://updates.scanmaster.com/releases/v1.0.21/Scan-Master-1.0.21.dmg',
      linux: 'https://updates.scanmaster.com/releases/v1.0.21/Scan-Master-1.0.21.AppImage'
    }
  },
  '1.0.22-beta.1': {
    version: '1.0.22-beta.1',
    date: '2025-12-30',
    changes: {
      en: [
        '🧪 BETA: New 3D calibration block designer',
        '🧪 BETA: Enhanced export templates',
        '🐛 Bug fixes from 1.0.21'
      ]
    },
    critical: false,
    downloadUrls: {
      win32: 'https://updates.scanmaster.com/releases/v1.0.22-beta.1/Scan-Master-Setup-1.0.22-beta.1.exe',
      darwin: 'https://updates.scanmaster.com/releases/v1.0.22-beta.1/Scan-Master-1.0.22-beta.1.dmg',
      linux: 'https://updates.scanmaster.com/releases/v1.0.22-beta.1/Scan-Master-1.0.22-beta.1.AppImage'
    }
  }
};

/**
 * Compare semantic versions
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(p => parseInt(p.replace(/[^0-9]/g, '')) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p.replace(/[^0-9]/g, '')) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * API: Check for updates
 * POST /api/updates/check
 * Supports both JSON body and headers-based factory identification
 */
app.post('/api/updates/check', async (req, res) => {
  try {
    // Support both JSON body and headers (for electron-updater)
    const factoryId = req.body.factoryId || req.headers['x-factory-id'];
    const currentVersion = req.body.currentVersion || req.headers['x-current-version'] || '1.0.0';
    const platform = req.body.platform || req.headers['x-platform'] || process.platform;
    const licenseKey = req.body.licenseKey || req.headers['x-license-key'];

    console.log(`Update check from: ${factoryId} (v${currentVersion}, ${platform})`);

    // Get factory config
    let factoryConfig = factoryConfigs.get(factoryId);

    if (!factoryConfig) {
      // Unknown factory - return global stable
      console.log(`Unknown factory ${factoryId}, using default config`);
      factoryConfig = {
        factoryId,
        channel: 'stable',
        customUpdates: [],
        language: 'en',
        licenseValid: true
      };
    }

    // Update last check-in
    factoryConfig.lastCheckIn = new Date().toISOString();
    factoryConfigs.set(factoryId, factoryConfig);

    // Determine which version to offer
    let availableVersion;

    // 1. Check for factory-specific custom updates
    if (factoryConfig.customUpdates && factoryConfig.customUpdates.length > 0) {
      availableVersion = factoryConfig.customUpdates[0];
      console.log(`Factory has custom update: ${availableVersion}`);
    }
    // 2. Check channel (stable or beta)
    else if (factoryConfig.channel === 'beta') {
      availableVersion = versions.beta;
      console.log(`Factory on beta channel: ${availableVersion}`);
    }
    // 3. Default to stable
    else {
      availableVersion = versions.stable;
      console.log(`Factory on stable channel: ${availableVersion}`);
    }

    // Compare versions
    if (compareVersions(availableVersion, currentVersion) > 0) {
      const release = releaseNotes[availableVersion];

      if (!release) {
        return res.json({
          updateAvailable: false,
          message: 'No release notes found for version'
        });
      }

      // Get release notes in factory language
      const language = factoryConfig.language || 'en';
      const changes = release.changes[language] || release.changes.en;

      res.json({
        updateAvailable: true,
        version: availableVersion,
        currentVersion,
        critical: release.critical || false,
        releaseDate: release.date,
        releaseNotes: changes.join('\n'),
        downloadUrl: release.downloadUrls[platform] || release.downloadUrls.win32,
        channel: factoryConfig.channel,
        custom: factoryConfig.customUpdates.length > 0
      });
    } else {
      res.json({
        updateAvailable: false,
        currentVersion,
        latestVersion: availableVersion,
        message: 'You are running the latest version'
      });
    }
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({
      error: 'Failed to check for updates',
      message: error.message
    });
  }
});

/**
 * API: Verify license
 * POST /api/license/verify
 */
app.post('/api/license/verify', (req, res) => {
  try {
    const { licenseKey, appVersion, platform } = req.body;

    // Parse license key (same logic as electron/license-manager.cjs)
    const parts = licenseKey.split('-');
    if (parts.length < 5) {
      return res.json({
        valid: false,
        reason: 'Invalid license key format'
      });
    }

    const [prefix, factoryId] = parts;

    if (prefix !== 'SM') {
      return res.json({
        valid: false,
        reason: 'Invalid license prefix'
      });
    }

    // In production, verify signature and check database
    // For now, accept all valid-format licenses

    res.json({
      valid: true,
      factoryId,
      message: 'License verified successfully'
    });
  } catch (error) {
    console.error('License verification error:', error);
    res.status(500).json({
      valid: false,
      reason: 'Verification failed',
      error: error.message
    });
  }
});

/**
 * Admin API: Get factory config
 * GET /api/admin/factory/:factoryId
 */
app.get('/api/admin/factory/:factoryId', (req, res) => {
  const { factoryId } = req.params;
  const config = factoryConfigs.get(factoryId);

  if (!config) {
    return res.status(404).json({ error: 'Factory not found' });
  }

  res.json(config);
});

/**
 * Admin API: Update factory config
 * PUT /api/admin/factory/:factoryId
 */
app.put('/api/admin/factory/:factoryId', (req, res) => {
  const { factoryId } = req.params;
  const updates = req.body;

  let config = factoryConfigs.get(factoryId);

  if (!config) {
    config = {
      factoryId,
      channel: 'stable',
      customUpdates: [],
      language: 'en',
      licenseValid: true
    };
  }

  // Update config
  Object.assign(config, updates);
  factoryConfigs.set(factoryId, config);

  console.log(`Factory ${factoryId} config updated:`, updates);

  res.json({
    success: true,
    config
  });
});

/**
 * Admin API: Get all factories
 * GET /api/admin/factories
 */
app.get('/api/admin/factories', (req, res) => {
  const factories = Array.from(factoryConfigs.values());
  res.json({ factories });
});

/**
 * Admin API: Push update to specific factory
 * POST /api/admin/push-update
 */
app.post('/api/admin/push-update', (req, res) => {
  const { factoryId, version } = req.body;

  let config = factoryConfigs.get(factoryId);

  if (!config) {
    return res.status(404).json({ error: 'Factory not found' });
  }

  // Set custom update for this factory
  config.customUpdates = [version];
  factoryConfigs.set(factoryId, config);

  console.log(`Pushed update ${version} to factory ${factoryId}`);

  res.json({
    success: true,
    message: `Update ${version} will be offered to ${factoryId} on next check`,
    config
  });
});

/**
 * Admin API: Set channel for factory
 * POST /api/admin/set-channel
 */
app.post('/api/admin/set-channel', (req, res) => {
  const { factoryId, channel } = req.body;

  if (!['stable', 'beta', 'custom'].includes(channel)) {
    return res.status(400).json({ error: 'Invalid channel' });
  }

  let config = factoryConfigs.get(factoryId);

  if (!config) {
    return res.status(404).json({ error: 'Factory not found' });
  }

  config.channel = channel;
  factoryConfigs.set(factoryId, config);

  console.log(`Factory ${factoryId} set to ${channel} channel`);

  res.json({
    success: true,
    message: `Factory ${factoryId} is now on ${channel} channel`,
    config
  });
});

/**
 * Admin Dashboard (Web UI)
 * Access at http://localhost:3001/admin
 */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    factoriesCount: factoryConfigs.size
  });
});

/**
 * Statistics
 */
app.get('/api/stats', (req, res) => {
  const factories = Array.from(factoryConfigs.values());

  const stats = {
    totalFactories: factories.length,
    byChannel: {
      stable: factories.filter(f => f.channel === 'stable').length,
      beta: factories.filter(f => f.channel === 'beta').length,
      custom: factories.filter(f => f.customUpdates?.length > 0).length
    },
    recentCheckIns: factories.filter(f => {
      if (!f.lastCheckIn) return false;
      const hourAgo = Date.now() - (60 * 60 * 1000);
      return new Date(f.lastCheckIn).getTime() > hourAgo;
    }).length,
    versions: {
      stable: versions.stable,
      beta: versions.beta
    }
  };

  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Scan Master Update Server');
  console.log('='.repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Stats API: http://localhost:${PORT}/api/stats`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
