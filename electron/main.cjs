const { app, BrowserWindow, Menu, shell, dialog, ipcMain, screen } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');
const LicenseManager = require('./license-manager.cjs');
const OfflineUpdater = require('./offline-updater.cjs');

// GPU stability flags - keep GPU enabled for WebGL but with safe settings
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-gpu-watchdog');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('use-angle', 'default');
app.commandLine.appendSwitch('no-sandbox');

// High DPI and scaling support for Windows
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

let mainWindow;
let embeddedServer;
let updateAvailable = false;
let updateVersion = null;
let updateDownloaded = false;
let updateInfo = null;
let licenseManager;
let autoUpdater;
let isDev;
let offlineUpdater;
let silentUpdateTimer = null;
let updateCheckInterval = null;

// Update settings - can be configured per-factory
const UPDATE_SETTINGS = {
  // Check for updates every 30 minutes
  checkInterval: 30 * 60 * 1000,
  // Auto-restart after this many seconds (0 = disabled, let user decide)
  autoRestartDelay: 0,
  // Silent mode - minimal notifications to user
  silentMode: true,
  // Install on quit - always true for seamless updates
  installOnQuit: true,
  // Retry failed updates
  maxRetries: 3,
  retryDelay: 60 * 1000 // 1 minute
};

let updateRetryCount = 0;

// Initialize autoUpdater after app is ready
function initAutoUpdater() {
  const { autoUpdater: updater } = require('electron-updater');
  autoUpdater = updater;

  // Auto-updater configuration for seamless updates
  autoUpdater.autoDownload = true;              // Download automatically
  autoUpdater.autoInstallOnAppQuit = true;      // Install when user quits
  autoUpdater.disableWebInstaller = false;      // Use delta updates when available
  autoUpdater.allowDowngrade = false;           // Never downgrade
  autoUpdater.allowPrerelease = false;          // Only stable releases
  
  // Set logger for debugging
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // GitHub releases are configured in electron-builder.json
  // No custom feed URL configuration needed

  setupAutoUpdaterHandlers();
  
  // Setup periodic update checks
  setupPeriodicUpdateChecks();
}

// Setup periodic update checks
function setupPeriodicUpdateChecks() {
  // Clear existing interval if any
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  
  // Check for updates periodically
  updateCheckInterval = setInterval(() => {
    if (autoUpdater && !updateDownloaded) {
      console.log('🔄 Periodic update check...');
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Periodic update check failed:', err.message);
      });
    }
  }, UPDATE_SETTINGS.checkInterval);
}

// Auto-updater event handlers
function setupAutoUpdaterHandlers() {
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Checking for updates...');
    if (mainWindow && !UPDATE_SETTINGS.silentMode) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('✅ Update available:', info.version);
    updateAvailable = true;
    updateVersion = info.version;
    updateInfo = info;
    updateRetryCount = 0; // Reset retry count for new update
    updateMenu(); // Refresh menu to show update indicator
    
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'available', 
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
        silent: UPDATE_SETTINGS.silentMode
      });
    }
    
    // Force download if autoDownload didn't trigger automatically
    // This ensures the update is downloaded even if there are network issues
    setTimeout(() => {
      if (!updateDownloaded && autoUpdater) {
        console.log('🔄 Forcing update download...');
        autoUpdater.downloadUpdate().catch(err => {
          console.error('Failed to download update:', err.message);
        });
      }
    }, 2000);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('👍 App is up to date:', info.version);
    if (mainWindow && !UPDATE_SETTINGS.silentMode) {
      mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = progress.percent.toFixed(1);
    const speed = (progress.bytesPerSecond / 1024 / 1024).toFixed(2);
    const transferred = (progress.transferred / 1024 / 1024).toFixed(2);
    const total = (progress.total / 1024 / 1024).toFixed(2);
    
    console.log(`📥 Download: ${percent}% (${transferred}/${total} MB @ ${speed} MB/s)`);
    
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloading',
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Update downloaded:', info.version);
    updateDownloaded = true;
    updateVersion = info.version;
    updateInfo = info;
    updateMenu(); // Refresh menu to show "Install Update" option
    
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'downloaded', 
        version: info.version,
        releaseNotes: info.releaseNotes,
        autoInstallOnQuit: UPDATE_SETTINGS.installOnQuit
      });
    }
    
    // If auto-restart is enabled, schedule restart
    if (UPDATE_SETTINGS.autoRestartDelay > 0) {
      scheduleAutoRestart(UPDATE_SETTINGS.autoRestartDelay);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('❌ Auto-updater error:', error.message);
    console.error('Full error details:', JSON.stringify({
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    }, null, 2));
    
    // Enhanced error info for debugging
    const errorInfo = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      isNetworkError: error.message?.includes('net::') || error.message?.includes('ENOTFOUND') || error.message?.includes('ETIMEDOUT'),
      isSha512Error: error.message?.includes('sha512') || error.message?.includes('checksum'),
      isFileError: error.message?.includes('ENOENT') || error.message?.includes('file'),
      timestamp: new Date().toISOString()
    };
    console.error('Error analysis:', JSON.stringify(errorInfo, null, 2));
    
    // Retry logic
    if (updateRetryCount < UPDATE_SETTINGS.maxRetries) {
      updateRetryCount++;
      console.log(`🔄 Retrying update check (${updateRetryCount}/${UPDATE_SETTINGS.maxRetries})...`);
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Retry failed:', err.message);
        });
      }, UPDATE_SETTINGS.retryDelay);
    } else if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'error', 
        error: error.message,
        errorCode: error.code,
        errorDetails: errorInfo,
        canRetry: true 
      });
    }
  });
}

// Schedule automatic restart for update installation
function scheduleAutoRestart(delaySeconds) {
  if (silentUpdateTimer) {
    clearTimeout(silentUpdateTimer);
  }
  
  console.log(`⏰ Auto-restart scheduled in ${delaySeconds} seconds`);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'restart-scheduled',
      restartIn: delaySeconds,
      version: updateVersion
    });
  }
  
  silentUpdateTimer = setTimeout(() => {
    console.log('🔄 Auto-restarting for update...');
    if (autoUpdater) {
      autoUpdater.quitAndInstall(true, true); // isSilent: true, isForceRunAfter: true
    }
  }, delaySeconds * 1000);
}

// Cancel scheduled restart
function cancelScheduledRestart() {
  if (silentUpdateTimer) {
    clearTimeout(silentUpdateTimer);
    silentUpdateTimer = null;
    console.log('⏹️ Auto-restart cancelled');
  }
}

// Setup IPC handlers
function setupIPCHandlers() {
  // IPC handlers for manual update control
  ipcMain.handle('check-for-updates', async () => {
    if (!isDev && autoUpdater) {
      try {
        await autoUpdater.checkForUpdates();
        // Return current state - the actual update info comes via events
        return { 
          checking: true,
          updateAvailable,
          updateDownloaded,
          updateVersion,
          currentVersion: app.getVersion()
        };
      } catch (error) {
        console.error('Check for updates error:', error.message);
        return { error: error.message, updateAvailable: false };
      }
    }
    return { updateAvailable: false, isDev: true };
  });

  ipcMain.handle('download-update', async () => {
    if (autoUpdater) {
      try {
        await autoUpdater.downloadUpdate();
        return { downloading: true };
      } catch (error) {
        console.error('Download update error:', error.message);
        return { error: error.message };
      }
    }
    return { error: 'No auto updater available' };
  });

  ipcMain.handle('install-update', (event, silent = true) => {
    if (autoUpdater) {
      // Cancel any scheduled restart
      cancelScheduledRestart();
      // isSilent: run installer without UI, isForceRunAfter: restart app after install
      autoUpdater.quitAndInstall(silent, true);
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
  
  // New: Get update info
  ipcMain.handle('get-update-info', () => {
    return {
      updateAvailable,
      updateDownloaded,
      updateVersion,
      releaseNotes: updateInfo?.releaseNotes,
      releaseDate: updateInfo?.releaseDate,
      currentVersion: app.getVersion()
    };
  });
  
  // New: Get/Set update settings
  ipcMain.handle('get-update-settings', () => {
    return UPDATE_SETTINGS;
  });
  
  ipcMain.handle('set-update-settings', (event, settings) => {
    Object.assign(UPDATE_SETTINGS, settings);
    // Re-setup periodic checks if interval changed
    if (settings.checkInterval) {
      setupPeriodicUpdateChecks();
    }
    return UPDATE_SETTINGS;
  });
  
  // New: Schedule restart
  ipcMain.handle('schedule-restart', (event, delaySeconds) => {
    scheduleAutoRestart(delaySeconds);
    return { scheduled: true, restartIn: delaySeconds };
  });
  
  // New: Cancel scheduled restart
  ipcMain.handle('cancel-scheduled-restart', () => {
    cancelScheduledRestart();
    return { cancelled: true };
  });
  
  // New: Force check for updates (bypass cache)
  ipcMain.handle('force-check-updates', async () => {
    if (!isDev && autoUpdater) {
      try {
        updateRetryCount = 0;
        await autoUpdater.checkForUpdates();
        return { 
          checking: true,
          updateAvailable,
          updateDownloaded,
          updateVersion,
          currentVersion: app.getVersion()
        };
      } catch (error) {
        console.error('Force check updates error:', error.message);
        return { error: error.message, updateAvailable: false };
      }
    }
    return { updateAvailable: false, isDev: true };
  });

  // PDF/File Save IPC Handler - more reliable than blob downloads
  ipcMain.handle('save-pdf', async (event, { data, filename }) => {
    try {
      // Show save dialog
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.join(app.getPath('downloads'), filename),
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
        ]
      });

      if (filePath) {
        // Convert base64 to buffer and save
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, buffer);
        console.log('PDF saved to:', filePath);

        // Open the file location
        shell.showItemInFolder(filePath);

        return { success: true, path: filePath };
      }
      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Error saving PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // License Management IPC Handlers
  ipcMain.handle('license:check', () => {
    return licenseManager.getLicense();
  });

  ipcMain.handle('license:activate', async (event, licenseKey) => {
    return await licenseManager.activateLicense(licenseKey);
  });

  ipcMain.handle('license:getInfo', () => {
    return licenseManager.getLicenseInfo();
  });

  ipcMain.handle('license:hasStandard', (event, standardCode) => {
    return licenseManager.hasStandard(standardCode);
  });

  ipcMain.handle('license:getStandards', () => {
    return licenseManager.getStandardsCatalog();
  });

  ipcMain.handle('license:deactivate', () => {
    licenseManager.deactivate();
    return { success: true };
  });

  // Offline Activation IPC Handlers
  ipcMain.handle('license:generateActivationRequest', () => {
    return licenseManager.generateActivationRequest();
  });

  ipcMain.handle('license:activateOffline', async (event, licenseKey, responseCode) => {
    return await licenseManager.activateOffline(licenseKey, responseCode);
  });

  ipcMain.handle('license:getMachineInfo', () => {
    return licenseManager.getMachineInfo();
  });

  // ==========================================
  // Offline Update IPC Handlers (USB Updates)
  // ==========================================

  // Initialize offline updater
  offlineUpdater = new OfflineUpdater({
    currentVersion: app.getVersion(),
    appPath: app.getPath('exe'),
    tempDir: app.getPath('temp'),
    onProgress: (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('offline-update-progress', progress);
      }
    },
    onLog: (message) => {
      console.log('[OfflineUpdater]', message);
    }
  });

  // Browse for update folder
  ipcMain.handle('offline-update:browse', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Update Folder (USB Drive)',
      properties: ['openDirectory'],
      buttonLabel: 'Select Folder'
    });

    if (result.canceled || !result.filePaths[0]) {
      return { cancelled: true };
    }

    return { path: result.filePaths[0] };
  });

  // Scan for updates in a directory
  ipcMain.handle('offline-update:scan', async (event, directoryPath) => {
    return await offlineUpdater.scanForUpdates(directoryPath);
  });

  // Validate an update package
  ipcMain.handle('offline-update:validate', async (event, packageInfo) => {
    return await offlineUpdater.validatePackage(packageInfo);
  });

  // Install update from USB
  ipcMain.handle('offline-update:install', async (event, packageInfo, options) => {
    try {
      const result = await offlineUpdater.installUpdate(packageInfo, options);

      // If installation started, quit the app
      if (result.success && options.autoRestart !== false) {
        setTimeout(() => {
          app.quit();
        }, 2000);
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get display info for a package
  ipcMain.handle('offline-update:getDisplayInfo', (event, packageInfo) => {
    return offlineUpdater.getPackageDisplayInfo(packageInfo);
  });

  // Get current version
  ipcMain.handle('offline-update:getCurrentVersion', () => {
    return app.getVersion();
  });

  // ==========================================
  // Claude Vision API Handler (Secure)
  // API key stays in main process, never exposed to renderer
  // ==========================================
  ipcMain.handle('claude:analyzeDrawing', async (event, { imageBase64, mediaType }) => {
    try {
      // Get API key from environment (secure - not exposed to renderer)
      const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'No Claude API key configured',
          geometry: 'unknown',
          confidence: 0,
          reasoning: 'API key not found. Set VITE_ANTHROPIC_API_KEY in environment.'
        };
      }

      // NDT Analysis Prompt - optimized for precise arrow placement
      const NDT_PROMPT = `You are an expert NDT (Non-Destructive Testing) engineer analyzing a technical drawing.

YOUR TASKS:
1. Identify the geometry type of the part
2. Visually locate EXACTLY where the part appears in the image
3. Place scan direction arrows PRECISELY on the visible surfaces

=== STEP 1: IDENTIFY GEOMETRY ===
Look for text labels or analyze the visual shape:
• PLATE/BLOCK: Rectangular solid with flat faces
• CYLINDER: Solid circular cross-section (NO center hole)
• TUBE: HOLLOW circular with visible ID (inner diameter) and OD (outer diameter)
• CONE: Tapered shape - wider at one end, narrower at other
• DISK: Flat circular shape, like a coin or pancake
• RING: Thick-walled donut/annular shape with large center hole
• IMPELLER: Complex part with blades/vanes, stepped hub profile
• SPHERE: Round ball shape

=== STEP 2: MEASURE THE ACTUAL PART LOCATION ===
CRITICAL - You MUST visually measure where the part is in the image!

Look at the image and identify:
1. The LEFT-MOST pixel of the part → this is x_left (as 0-1 fraction of image width)
2. The RIGHT-MOST pixel of the part → this is x_right
3. The TOP-MOST pixel of the part → this is y_top
4. The BOTTOM-MOST pixel of the part → this is y_bottom

IGNORE these when measuring: title blocks, dimension lines, text labels, borders, whitespace

Example: If the part occupies the center-right portion of the image:
- x_left might be 0.35, x_right might be 0.90
- y_top might be 0.15, y_bottom might be 0.85

=== STEP 3: PLACE ARROWS ON MEASURED SURFACES ===
Now place arrows AT THE EDGES of the part you measured!

Coordinate system:
- x=0 is LEFT edge of IMAGE, x=1 is RIGHT edge
- y=0 is TOP edge of IMAGE, y=1 is BOTTOM edge
- angle: 0°=pointing right, 90°=pointing down, 180°=pointing left, 270°=pointing up

ARROW RULES:
1. Arrow BASE (origin point) should be OUTSIDE the part, about 5-10% away from the surface
2. Arrow points INTO the part (toward the surface where ultrasound enters)
3. Arrows must be perpendicular to the entry surface
4. Place arrows on ALL accessible surfaces shown in ALL views

MULTI-VIEW DRAWINGS:
Many drawings show multiple views (Front + Side, or Top + Front + Side).
You MUST place arrows on EACH VIEW separately!

Example: A tube drawing with front view (circle) at x=0.2-0.4 and side view (rectangle) at x=0.55-0.95:
- For front view circle centered at x=0.30:
  - Place "C" arrow at x=0.12 (left of circle OD), y=0.50, angle=0
  - Place "D" arrow at x=0.48 (right of circle OD), y=0.50, angle=180
- For side view rectangle from x=0.55 to x=0.95:
  - Place "A" arrow at x=0.75, y=(y_top - 0.05), angle=90 (from top)
  - Place "B" arrow at x=0.75, y=(y_bottom + 0.05), angle=270 (from bottom)

=== ARROW DIRECTIONS BY GEOMETRY ===

PLATE/BLOCK:
- A: Top surface entry (perpendicular, angle=90)
- B: Bottom surface entry (perpendicular, angle=270)
- C: Left side entry (angle=0)
- D: Right side entry (angle=180)
- E,F: 45° shear waves

TUBE/CYLINDER (place on BOTH front circle view AND side profile view):
- A: Axial from top end
- B: Axial from bottom end
- C: Radial from OD (left side of circle)
- D: Radial from OD (right side of circle)
- E: Circumferential CW
- F: Circumferential CCW
- If tube has ID visible: also add arrows from ID surface

CONE:
- A: Axial from large end
- B: Axial from small end
- C,D: Radial from OD at various heights
- E: Along tapered surface (angle matches taper)

IMPELLER:
- A: Axial from hub top
- B: Axial from hub bottom
- C,D: Radial from hub OD
- E,F: At blade/vane surfaces if visible

=== OUTPUT FORMAT ===
Return ONLY a JSON object (no other text):
{
  "geometry": "tube",
  "confidence": 0.92,
  "reasoning": "Describe what you see: the views present, where the part is located in the image, key features identified",
  "partBounds": {
    "x_left": 0.15,
    "x_right": 0.85,
    "y_top": 0.10,
    "y_bottom": 0.90
  },
  "suggestedArrows": [
    {"direction": "A", "x": 0.50, "y": 0.05, "angle": 90, "label": "Axial top"},
    {"direction": "B", "x": 0.50, "y": 0.95, "angle": 270, "label": "Axial bottom"},
    {"direction": "C", "x": 0.10, "y": 0.50, "angle": 0, "label": "Radial OD left"},
    {"direction": "D", "x": 0.90, "y": 0.50, "angle": 180, "label": "Radial OD right"}
  ]
}

CRITICAL REMINDERS:
- The x,y coordinates MUST match where you actually SEE the part in this specific image
- Do NOT use generic template positions - LOOK at the image and MEASURE
- If the part is in the right half of the image, x values should be 0.5-1.0
- If there are multiple views, place arrows on EACH view
- Arrow base should be slightly OUTSIDE the part surface (5-10% gap)`;

      // Make API call to Claude (using node-fetch in main process)
      const https = require('https');

      const requestBody = JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/png',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: NDT_PROMPT,
            },
          ],
        }],
      });

      return new Promise((resolve) => {
        const req = https.request({
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const response = JSON.parse(data);

              if (res.statusCode !== 200) {
                console.error('Claude API Error:', response);
                resolve({
                  success: false,
                  error: response.error?.message || `API returned ${res.statusCode}`,
                  geometry: 'unknown',
                  confidence: 0,
                  reasoning: `API Error: ${response.error?.message || res.statusCode}`
                });
                return;
              }

              const responseText = response.content?.[0]?.text || '';
              console.log('Claude Response:', responseText.substring(0, 200));

              // Parse JSON from response
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                resolve({
                  success: false,
                  error: 'Could not parse Claude response',
                  geometry: 'unknown',
                  confidence: 0,
                  reasoning: 'Failed to parse AI response'
                });
                return;
              }

              const parsed = JSON.parse(jsonMatch[0]);

              resolve({
                success: true,
                geometry: parsed.geometry || 'unknown',
                confidence: parsed.confidence || 0,
                reasoning: parsed.reasoning || 'No reasoning provided',
                suggestedArrows: parsed.suggestedArrows || []
              });
            } catch (parseError) {
              console.error('Parse error:', parseError);
              resolve({
                success: false,
                error: parseError.message,
                geometry: 'unknown',
                confidence: 0,
                reasoning: 'Failed to parse response'
              });
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error);
          resolve({
            success: false,
            error: error.message,
            geometry: 'unknown',
            confidence: 0,
            reasoning: `Request failed: ${error.message}`
          });
        });

        req.write(requestBody);
        req.end();
      });

    } catch (error) {
      console.error('Claude Vision IPC Error:', error);
      return {
        success: false,
        error: error.message,
        geometry: 'unknown',
        confidence: 0,
        reasoning: `Error: ${error.message}`
      };
    }
  });

  // Check Claude API availability
  ipcMain.handle('claude:checkStatus', async () => {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    return {
      available: !!apiKey,
      error: apiKey ? null : 'No API key configured'
    };
  });
}

// Build menu template with dynamic update status
function buildMenuTemplate() {
  // Determine update menu item text and action
  let updateMenuItem;
  if (updateDownloaded) {
    updateMenuItem = {
      label: '🔴 Install Update (v' + updateVersion + ')',
      click: () => {
        if (autoUpdater) {
          autoUpdater.quitAndInstall();
        }
      }
    };
  } else if (updateAvailable) {
    updateMenuItem = {
      label: '🟡 Download Update (v' + updateVersion + ')',
      click: () => {
        if (autoUpdater) {
          autoUpdater.downloadUpdate();
        }
      }
    };
  } else {
    updateMenuItem = {
      label: 'Check for Updates',
      click: () => {
        if (!isDev && autoUpdater) {
          autoUpdater.checkForUpdates();
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Development Mode',
            message: 'Auto-update is disabled in development mode.',
            buttons: ['OK']
          });
        }
      }
    };
  }

  return [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Technique Sheet',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-sheet');
          }
        },
        {
          label: 'Export PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('export-pdf');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: updateAvailable || updateDownloaded ? '❗ Help' : 'Help',
      submenu: [
        updateMenuItem,
        { type: 'separator' },
        {
          label: 'About Scan Master',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Scan Master',
              message: 'Scan Master Inspection Pro',
              detail: `Professional ultrasonic inspection technique sheet generator\n\nVersion: ${app.getVersion()}\n\nBuilt with Electron, React, and Node.js`,
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/yourusername/scan-master/wiki');
          }
        }
      ]
    }
  ];
}

// Update the application menu
function updateMenu() {
  const menu = Menu.buildFromTemplate(buildMenuTemplate());
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  // Get the primary display to calculate proper dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const scaleFactor = primaryDisplay.scaleFactor;

  console.log(`Screen: ${screenWidth}x${screenHeight}, Scale Factor: ${scaleFactor}`);

  // Set up download handler for PDF exports and other file downloads
  const { session } = require('electron');
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const fileName = item.getFilename();
    console.log('Download started:', fileName);

    // Get the default download path
    const downloadsPath = app.getPath('downloads');
    const savePath = path.join(downloadsPath, fileName);

    // Set the save path
    item.setSavePath(savePath);

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download interrupted');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download paused');
        } else {
          const percent = item.getReceivedBytes() / item.getTotalBytes() * 100;
          console.log(`Download progress: ${percent.toFixed(1)}%`);
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download completed:', savePath);
        // Notify renderer that download is complete
        if (mainWindow) {
          mainWindow.webContents.send('download-complete', {
            success: true,
            path: savePath,
            fileName: fileName
          });
        }
        // Open the file location in explorer/finder
        shell.showItemInFolder(savePath);
      } else {
        console.log('Download failed:', state);
        if (mainWindow) {
          mainWindow.webContents.send('download-complete', {
            success: false,
            error: state
          });
        }
      }
    });
  });
  
  // Calculate responsive minimum sizes based on screen and scale
  // For high DPI displays, we need smaller minimums
  const baseMinWidth = Math.min(1024, Math.floor(screenWidth * 0.6));
  const baseMinHeight = Math.min(768, Math.floor(screenHeight * 0.6));
  
  // Create the browser window with proper scaling support
  mainWindow = new BrowserWindow({
    width: Math.min(1400, screenWidth),
    height: Math.min(900, screenHeight),
    minWidth: baseMinWidth,
    minHeight: baseMinHeight,
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
      // Disable service workers in development
      enablePreferredSizeMode: false,
      // Adjust zoom for better readability - slightly larger UI
      // On high DPI displays (scale > 1.25), use 1.0; otherwise use 1.1 for larger UI
      zoomFactor: scaleFactor > 1.25 ? 1.0 : 1.1
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Scan Master Inspection Pro',
    // Use content size to ensure proper fitting
    useContentSize: true,
    // Enable frame for proper window controls on Windows
    frame: true,
    // Ensure window respects DPI settings
    backgroundColor: '#14171c'
  });

  // Set minimum window size after creation for better control
  mainWindow.setMinimumSize(baseMinWidth, baseMinHeight);
  
  // Always open maximized (fullscreen) on first launch
  mainWindow.maximize();
  
  // Wait for maximize animation to complete before showing
  setTimeout(() => {
    mainWindow.show();
  }, 100);

  // Handle window resize to ensure proper layout
  mainWindow.on('resize', () => {
    // Notify renderer of resize for any needed adjustments
    if (mainWindow && mainWindow.webContents) {
      const [width, height] = mainWindow.getSize();
      mainWindow.webContents.send('window-resized', { width, height, scaleFactor });
    }
  });

  // Create application menu
  updateMenu();

  // Clear all browser data in development to remove cached service workers
  if (isDev) {
    mainWindow.webContents.session.clearStorageData({
      storages: ['serviceworkers', 'cachestorage', 'websql', 'indexdb']
    });

    // Block service worker requests in development
    mainWindow.webContents.session.webRequest.onBeforeRequest({
      urls: ['*://*/service-worker*.js', '*://*/sw.js']
    }, (details, callback) => {
      console.log('Blocking service worker request:', details.url);
      callback({ cancel: true });
    });
  }

  // Set up Content Security Policy for security
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // Allow both localhost (for embedded server) and file:// (for fallback)
    const cspPolicy = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* file:; style-src 'self' 'unsafe-inline' http://localhost:* file:; img-src 'self' data: blob: http://localhost:* file: https://storage.googleapis.com https:; connect-src 'self' http://localhost:* https: file:; font-src 'self' data: file:";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspPolicy]
      }
    });
  });

  // Send display info to renderer when ready
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('display-info', {
      scaleFactor,
      screenWidth,
      screenHeight,
      zoomFactor: scaleFactor > 1.25 ? 1.0 : 1.1
    });
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, start embedded server first, then load through it
    try {
      await startEmbeddedServer();
      console.log('Server started, loading from http://localhost:5000');
      
      // Wait a moment for server to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      mainWindow.loadURL('http://localhost:5000');
    } catch (error) {
      console.error('Server failed:', error);
      // If server fails, show error
      mainWindow.loadURL(`data:text/html,<h1>Error starting server: ${error.message}</h1>`);
    }
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Embedded Express server for production
function startEmbeddedServer() {
  return new Promise((resolve, reject) => {
    try {
      const expressApp = express();
      const dataDir = path.join(app.getPath('userData'), 'data');
      
      // Get the correct path for static files
      let distPath;
      if (isDev) {
        distPath = path.join(__dirname, '..', 'dist');
      } else {
        // In production, dist is unpacked from asar
        distPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist');
      }
      
      console.log('=== SERVER STARTUP DEBUG ===');
      console.log('isDev:', isDev);
      console.log('Resources path:', process.resourcesPath);
      console.log('Dist path:', distPath);
      console.log('Dist exists:', fs.existsSync(distPath));
      
      // Check if dist exists, if not try alternative paths
      if (!fs.existsSync(distPath)) {
        console.log('Dist not found at expected path, trying alternatives...');
        
        // Try direct app.asar path (Electron can read from asar)
        const asarDistPath = path.join(process.resourcesPath, 'app.asar', 'dist');
        console.log('Trying asar path:', asarDistPath);
        console.log('Asar path exists:', fs.existsSync(asarDistPath));
        
        if (fs.existsSync(asarDistPath)) {
          distPath = asarDistPath;
        }
      }
      
      // List dist contents for debugging
      if (fs.existsSync(distPath)) {
        console.log('Dist contents:', fs.readdirSync(distPath));
        const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
        console.log('index.html exists:', indexExists);
      } else {
        console.error('ERROR: dist folder not found anywhere!');
        // List resources folder to see what's there
        console.log('Resources contents:', fs.readdirSync(process.resourcesPath));
      }
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      expressApp.use(express.json({ limit: '10mb' }));
      
      // Log all requests for debugging
      expressApp.use((req, res, next) => {
        console.log('Request:', req.method, req.url);
        next();
      });
      
      // Serve static files from dist
      expressApp.use(express.static(distPath));

      // Simple file-based data storage for technique sheets
      const sheetsFile = path.join(dataDir, 'technique-sheets.json');
      const standardsFile = path.join(dataDir, 'standards.json');
      const orgsFile = path.join(dataDir, 'organizations.json');
      const profilesFile = path.join(dataDir, 'inspector-profiles.json');

      // Default organization for Electron (offline) mode
      const DEFAULT_ELECTRON_ORG = [{
        id: "11111111-1111-1111-1111-111111111111",
        name: "Local Workspace",
        slug: "local",
        plan: "free",
        isActive: true,
        userRole: "owner"
      }];

      // Initialize files if they don't exist
      if (!fs.existsSync(sheetsFile)) fs.writeFileSync(sheetsFile, '[]');
      if (!fs.existsSync(standardsFile)) fs.writeFileSync(standardsFile, '[]');
      if (!fs.existsSync(profilesFile)) fs.writeFileSync(profilesFile, '[]');
      // Initialize orgs with default org (valid UUID) for Electron mode
      if (!fs.existsSync(orgsFile)) {
        fs.writeFileSync(orgsFile, JSON.stringify(DEFAULT_ELECTRON_ORG, null, 2));
      } else {
        // Fix existing empty organizations file
        try {
          const existingOrgs = JSON.parse(fs.readFileSync(orgsFile, 'utf8'));
          if (!Array.isArray(existingOrgs) || existingOrgs.length === 0) {
            fs.writeFileSync(orgsFile, JSON.stringify(DEFAULT_ELECTRON_ORG, null, 2));
          }
        } catch (e) {
          fs.writeFileSync(orgsFile, JSON.stringify(DEFAULT_ELECTRON_ORG, null, 2));
        }
      }

      // API Routes
      expressApp.get('/api/technique-sheets', (req, res) => {
        try {
          const data = JSON.parse(fs.readFileSync(sheetsFile, 'utf8'));
          res.json(data);
        } catch (e) {
          res.json([]);
        }
      });

      expressApp.post('/api/technique-sheets', (req, res) => {
        try {
          const sheets = JSON.parse(fs.readFileSync(sheetsFile, 'utf8'));
          const newSheet = { ...req.body, id: Date.now() };
          sheets.push(newSheet);
          fs.writeFileSync(sheetsFile, JSON.stringify(sheets, null, 2));
          res.json(newSheet);
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.get('/api/technique-sheets/:id', (req, res) => {
        try {
          const sheets = JSON.parse(fs.readFileSync(sheetsFile, 'utf8'));
          const sheet = sheets.find(s => String(s.id) === String(req.params.id));
          if (sheet) {
            res.json(sheet);
          } else {
            res.status(404).json({ error: 'Technique sheet not found' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.patch('/api/technique-sheets/:id', (req, res) => {
        try {
          const sheets = JSON.parse(fs.readFileSync(sheetsFile, 'utf8'));
          const index = sheets.findIndex(s => String(s.id) === String(req.params.id));
          if (index !== -1) {
            sheets[index] = { ...sheets[index], ...req.body, id: sheets[index].id };
            fs.writeFileSync(sheetsFile, JSON.stringify(sheets, null, 2));
            res.json(sheets[index]);
          } else {
            res.status(404).json({ error: 'Technique sheet not found' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.delete('/api/technique-sheets/:id', (req, res) => {
        try {
          const sheets = JSON.parse(fs.readFileSync(sheetsFile, 'utf8'));
          const index = sheets.findIndex(s => String(s.id) === String(req.params.id));
          if (index !== -1) {
            sheets.splice(index, 1);
            fs.writeFileSync(sheetsFile, JSON.stringify(sheets, null, 2));
            res.json({ success: true });
          } else {
            res.status(404).json({ error: 'Technique sheet not found' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.get('/api/standards/:code', (req, res) => {
        try {
          const data = JSON.parse(fs.readFileSync(standardsFile, 'utf8'));
          const standard = data.find(s => s.code === req.params.code);
          res.json(standard || {});
        } catch (e) {
          res.json({});
        }
      });

      expressApp.get('/api/organizations', (req, res) => {
        try {
          const data = JSON.parse(fs.readFileSync(orgsFile, 'utf8'));
          res.json(data);
        } catch (e) {
          res.json([]);
        }
      });

      expressApp.post('/api/logs', (req, res) => {
        // Just acknowledge logs without saving
        res.json({ success: true });
      });

      // Inspector Profiles API Routes
      expressApp.get('/api/inspector-profiles', (req, res) => {
        try {
          const data = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
          res.json(data);
        } catch (e) {
          res.json([]);
        }
      });

      expressApp.get('/api/inspector-profiles/:id', (req, res) => {
        try {
          const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
          const profile = profiles.find(p => String(p.id) === String(req.params.id));
          if (profile) {
            res.json(profile);
          } else {
            res.status(404).json({ error: 'Profile not found' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.post('/api/inspector-profiles', (req, res) => {
        try {
          const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
          const newProfile = { ...req.body };
          profiles.push(newProfile);
          fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2));
          console.log('Profile saved:', newProfile.name);
          res.json(newProfile);
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.patch('/api/inspector-profiles/:id', (req, res) => {
        try {
          const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
          const index = profiles.findIndex(p => String(p.id) === String(req.params.id));
          if (index !== -1) {
            profiles[index] = { ...profiles[index], ...req.body };
            fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2));
            res.json(profiles[index]);
          } else {
            res.status(404).json({ error: 'Profile not found' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      expressApp.delete('/api/inspector-profiles/:id', (req, res) => {
        try {
          const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
          const index = profiles.findIndex(p => String(p.id) === String(req.params.id));
          if (index !== -1) {
            profiles.splice(index, 1);
            fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2));
            res.json({ success: true });
          } else {
            res.status(404).json({ error: 'Profile not found' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      // Fallback to index.html for SPA routing (use regex for Express 5 compatibility)
      expressApp.use((req, res, next) => {
        // Only handle GET requests that aren't API routes
        if (req.method === 'GET' && !req.url.startsWith('/api/')) {
          const indexPath = path.join(distPath, 'index.html');
          res.sendFile(indexPath);
        } else {
          next();
        }
      });

      embeddedServer = expressApp.listen(5000, () => {
        console.log('Embedded server running on port 5000');
        resolve();
      });
      
      embeddedServer.on('error', (err) => {
        console.error('Server error:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Failed to create server:', error);
      reject(error);
    }
  });
}

// App event handlers
app.whenReady().then(async () => {
  // In packaged app, app.isPackaged is true
  isDev = !app.isPackaged;

  // Initialize license manager with app data path and version
  licenseManager = new LicenseManager(app.getPath('userData'), app.getVersion());

  // Setup IPC handlers
  setupIPCHandlers();

  // Initialize autoUpdater
  if (!isDev) {
    initAutoUpdater();
  }

  // Create window (will start embedded server inside)
  await createWindow();

  // Check for updates on startup (production only)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (embeddedServer) {
    embeddedServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (embeddedServer) {
    embeddedServer.close();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
