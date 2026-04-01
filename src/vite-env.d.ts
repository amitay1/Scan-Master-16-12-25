/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

// Electron IPC Bridge Types
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  installUpdate: (silent?: boolean) => Promise<{ started: boolean }>;
  onUpdateStatus: (callback: (event: any, status: UpdateStatusEvent) => void) => void;
  removeUpdateListener: (callback: (event: any, status: UpdateStatusEvent) => void) => void;
  confirmAppClose?: () => Promise<{ success: boolean }>;
  onAppCloseRequested?: (callback: () => void) => void;
  removeAppCloseRequested?: (callback: () => void) => void;
  onPrepareForUpdateInstall?: (callback: (payload: PrepareForUpdateInstallPayload) => void) => void;
  removePrepareForUpdateInstall?: (callback: (payload: PrepareForUpdateInstallPayload) => void) => void;
  confirmUpdateInstallReady?: (requestId: string) => Promise<{ acknowledged: boolean }>;
}

interface UpdateStatusEvent {
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

interface PrepareForUpdateInstallPayload {
  requestId: string;
  reason: 'manual-install' | 'scheduled-restart' | 'update-on-quit';
  version?: string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
