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
    const validChannels = ['new-sheet', 'export-pdf', 'file-saved', 'file-opened', 'update-status'];
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
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Platform information
  platform: process.platform,

  // App version (hardcoded to avoid path issues in Electron)
  version: '0.0.0'
});

// Also expose as 'electron' for easier access
contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => {
    updateListeners.add(callback);
  },
  removeUpdateListener: (callback) => {
    updateListeners.delete(callback);
  }
});