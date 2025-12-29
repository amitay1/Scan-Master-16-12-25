/// <reference types="vite/client" />
// Electron IPC Bridge Types
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => void;
  onUpdateStatus: (callback: (event: any, status: UpdateStatusEvent) => void) => void;
  removeUpdateListener: (callback: (event: any, status: UpdateStatusEvent) => void) => void;
}

interface UpdateStatusEvent {
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}