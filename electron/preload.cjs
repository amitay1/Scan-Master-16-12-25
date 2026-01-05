const { contextBridge, ipcRenderer } = require('electron');

// Store update status listeners
const updateListeners = new Set();

// Listen for update status from main process
ipcRenderer.on('update-status', (event, status) => {
  updateListeners.forEach(callback => callback(event, status));
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to main process
  send: (channel, data) => {
    const validChannels = ['new-sheet', 'export-pdf', 'save-file', 'open-file'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive messages from main process
  on: (channel, callback) => {
    const validChannels = ['new-sheet', 'export-pdf', 'file-saved', 'file-opened', 'update-status', 'display-info', 'window-resized'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    const validChannels = ['new-sheet', 'export-pdf', 'file-saved', 'file-opened', 'update-status'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // Auto-updater API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: (silent = true) => ipcRenderer.invoke('install-update', silent),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Platform information
  platform: process.platform,

  // App version (hardcoded to avoid path issues in Electron)
  version: '0.0.0'
});

// Also expose as 'electron' for easier access with enhanced update capabilities
contextBridge.exposeInMainWorld('electron', {
  // Flag to identify Electron environment
  isElectron: true,
  platform: process.platform,
  
  // Version info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Update checking
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  forceCheckUpdates: () => ipcRenderer.invoke('force-check-updates'),
  
  // Update installation
  installUpdate: (silent = true) => ipcRenderer.invoke('install-update', silent),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  
  // Update info
  getUpdateInfo: () => ipcRenderer.invoke('get-update-info'),
  
  // Update settings
  getUpdateSettings: () => ipcRenderer.invoke('get-update-settings'),
  setUpdateSettings: (settings) => ipcRenderer.invoke('set-update-settings', settings),
  
  // Scheduled restart management
  scheduleRestart: (delaySeconds) => ipcRenderer.invoke('schedule-restart', delaySeconds),
  cancelScheduledRestart: () => ipcRenderer.invoke('cancel-scheduled-restart'),
  
  // Update status listeners
  onUpdateStatus: (callback) => {
    updateListeners.add(callback);
  },
  removeUpdateListener: (callback) => {
    updateListeners.delete(callback);
  },
  
  // License Management API
  license: {
    check: () => ipcRenderer.invoke('license:check'),
    activate: (licenseKey) => ipcRenderer.invoke('license:activate', licenseKey),
    getInfo: () => ipcRenderer.invoke('license:getInfo'),
    hasStandard: (standardCode) => ipcRenderer.invoke('license:hasStandard', standardCode),
    getStandards: () => ipcRenderer.invoke('license:getStandards'),
    deactivate: () => ipcRenderer.invoke('license:deactivate')
  }
});