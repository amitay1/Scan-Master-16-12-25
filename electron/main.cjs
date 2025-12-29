const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');
const LicenseManager = require('./license-manager.cjs');

let mainWindow;
let embeddedServer;
let updateAvailable = false;
let updateVersion = null;
let updateDownloaded = false;
let licenseManager;
let autoUpdater;
let isDev;

// Initialize autoUpdater after app is ready
function initAutoUpdater() {
  const { autoUpdater: updater } = require('electron-updater');
  autoUpdater = updater;

  // Auto-updater configuration
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.disableWebInstaller = false;  // Use delta updates when available
  autoUpdater.allowDowngrade = false;

  // GitHub releases are configured in electron-builder.json
  // No custom feed URL configuration needed

  setupAutoUpdaterHandlers();
}

// Auto-updater event handlers
function setupAutoUpdaterHandlers() {
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    updateAvailable = true;
    updateVersion = info.version;
    updateMenu(); // Refresh menu to show update indicator
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${progress.percent.toFixed(1)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloading',
        percent: progress.percent
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    updateDownloaded = true;
    updateVersion = info.version;
    updateMenu(); // Refresh menu to show "Install Update" option
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'error', error: error.message });
    }
  });
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

  ipcMain.handle('install-update', () => {
    if (autoUpdater) {
      autoUpdater.quitAndInstall();
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
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
