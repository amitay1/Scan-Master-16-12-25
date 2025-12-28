const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const fs = require('fs');

let mainWindow;
let embeddedServer;

// In packaged app, app.isPackaged is true
const isDev = !app.isPackaged;

// Auto-updater configuration
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'עדכון זמין',
      message: `גרסה חדשה זמינה: ${info.version}`,
      detail: 'האם תרצה להוריד את העדכון עכשיו?',
      buttons: ['הורד עכשיו', 'אחר כך'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
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
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'העדכון מוכן',
      message: 'העדכון הורד בהצלחה!',
      detail: 'האפליקציה תופעל מחדש כדי להתקין את העדכון.',
      buttons: ['התקן והפעל מחדש', 'התקן בסגירה'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});

autoUpdater.on('error', (error) => {
  console.error('Auto-updater error:', error);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'error', error: error.message });
  }
});

// IPC handlers for manual update control
ipcMain.handle('check-for-updates', async () => {
  if (!isDev) {
    return autoUpdater.checkForUpdates();
  }
  return { updateAvailable: false };
});

ipcMain.handle('download-update', async () => {
  return autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

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
  const template = [
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
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            if (!isDev) {
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
        },
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

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

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
    // In production, start embedded server then load through it
    // This provides API support for saving/loading data
    try {
      await startEmbeddedServer();
      console.log('Loading from embedded server...');
      mainWindow.loadURL('http://localhost:5000');
    } catch (error) {
      console.error('Failed to start server, loading file directly:', error);
      // Fallback to direct file loading if server fails
      const appPath = app.getAppPath();
      const indexPath = path.join(appPath, 'dist', 'index.html');
      mainWindow.loadFile(indexPath);
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
      
      // Get the correct path for static files using app.getAppPath()
      // This works correctly inside asar archives
      const appPath = app.getAppPath();
      const distPath = path.join(appPath, 'dist');
      
      console.log('App path:', appPath);
      console.log('Dist path:', distPath);
      console.log('Dist exists:', fs.existsSync(distPath));
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      expressApp.use(express.json({ limit: '10mb' }));
      
      // Serve static files from dist
      expressApp.use(express.static(distPath));

      // Simple file-based data storage for technique sheets
      const sheetsFile = path.join(dataDir, 'technique-sheets.json');
      const standardsFile = path.join(dataDir, 'standards.json');
      const orgsFile = path.join(dataDir, 'organizations.json');

      // Initialize files if they don't exist
      if (!fs.existsSync(sheetsFile)) fs.writeFileSync(sheetsFile, '[]');
      if (!fs.existsSync(standardsFile)) fs.writeFileSync(standardsFile, '[]');
      if (!fs.existsSync(orgsFile)) fs.writeFileSync(orgsFile, '[]');

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

      // Fallback to index.html for SPA routing
      expressApp.get('*', (req, res) => {
        const indexPath = path.join(appPath, 'dist', 'index.html');
        res.sendFile(indexPath);
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
