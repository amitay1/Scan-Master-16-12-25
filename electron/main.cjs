const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');
const LicenseManager = require('./license-manager.cjs');

// GPU stability flags - keep GPU enabled for WebGL but with safe settings
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-gpu-watchdog');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('use-angle', 'default');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow;
let embeddedServer;
let updateAvailable = false;
let updateVersion = null;
let updateDownloaded = false;
let updateInfo = null;
let licenseManager;
let autoUpdater;
let isDev;
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
    console.error('Full error details:', error);
    
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
      return autoUpdater.checkForUpdates();
    }
    return { updateAvailable: false };
  });

  ipcMain.handle('download-update', async () => {
    if (autoUpdater) {
      return autoUpdater.downloadUpdate();
    }
    return null;
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
      updateRetryCount = 0;
      return autoUpdater.checkForUpdates();
    }
    return { updateAvailable: false };
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
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
      // Disable service workers in development
      enablePreferredSizeMode: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Scan Master Inspection Pro'
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

  // Initialize license manager with app data path
  licenseManager = new LicenseManager(app.getPath('userData'));

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
