const { contextBridge, ipcRenderer } = require('electron');

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
    const validChannels = ['new-sheet', 'export-pdf', 'file-saved', 'file-opened'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    const validChannels = ['new-sheet', 'export-pdf', 'file-saved', 'file-opened'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // Platform information
  platform: process.platform,

  // App version
  version: require('../package.json').version
});

// Expose update-related API separately as 'electron' to match UpdateNotification component
contextBridge.exposeInMainWorld('electron', {
  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Check for updates
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),

  // Install update
  installUpdate: () => ipcRenderer.send('install-update'),

  // Listen for update status
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', callback);
  },

  // Remove update listener
  removeUpdateListener: (callback) => {
    ipcRenderer.removeListener('update-status', callback);
  }
});