const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Enable live reload for Electron in development
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
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
          label: 'About Scan Master',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Scan Master',
              message: 'Scan Master Inspection Pro',
              detail: 'Professional ultrasonic inspection technique sheet generator\n\nVersion: 1.0.0\n\nBuilt with Electron, React, and Node.js',
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
    const cspPolicy = isDev 
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* ws://localhost:* wss://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*; img-src 'self' data: blob: http://localhost:* https://storage.googleapis.com; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://storage.googleapis.com; connect-src 'self'";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspPolicy]
      }
    });
  });

  // Load the app - in development, load from localhost
  // In production, load from built files
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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

// Start the Express server
function startServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, check if server is already running
      const http = require('http');
      http.get('http://localhost:5000/api/health', (res) => {
        console.log('Development server already running');
        resolve();
      }).on('error', () => {
        console.log('Starting development server...');
        serverProcess = spawn('npm', ['run', 'dev'], {
          cwd: path.join(__dirname, '..'),
          shell: process.platform === 'win32',
          env: { ...process.env, ELECTRON_DEV: 'true' }
        });

        serverProcess.stdout.on('data', (data) => {
          console.log(`Server: ${data}`);
          if (data.toString().includes('Server running on port')) {
            setTimeout(resolve, 1000); // Give it a moment to stabilize
          }
        });

        serverProcess.stderr.on('data', (data) => {
          console.error(`Server Error: ${data}`);
        });

        // Fallback timeout
        setTimeout(resolve, 8000);
      });
    } else {
      // In production, start the Express server
      console.log('Starting production server...');
      // Use tsx to run TypeScript server files
      serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
        cwd: path.join(__dirname, '..'),
        shell: process.platform === 'win32',
        env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
      });

      serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
        if (data.toString().includes('Server running')) {
          setTimeout(resolve, 1000);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
      });

      // Fallback timeout for production
      setTimeout(resolve, 5000);
    }
  });
}

// App event handlers
app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});