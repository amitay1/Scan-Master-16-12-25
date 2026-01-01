/**
 * Update Notification Component
 * Shows beautiful animated update notifications in the app
 * Supports silent updates and automatic installation
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Sparkles, X, Rocket, Clock, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdateStatus {
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | 'restart-scheduled';
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
  releaseNotes?: string;
  autoInstallOnQuit?: boolean;
  restartIn?: number;
  silent?: boolean;
  canRetry?: boolean;
}

// Electron API type for window object
interface ElectronBridge {
  getAppVersion?: () => Promise<string>;
  checkForUpdates?: () => Promise<void>;
  forceCheckUpdates?: () => Promise<void>;
  installUpdate?: (silent?: boolean) => void;
  downloadUpdate?: () => Promise<void>;
  getUpdateInfo?: () => Promise<UpdateInfo>;
  getUpdateSettings?: () => Promise<UpdateSettings>;
  setUpdateSettings?: (settings: Partial<UpdateSettings>) => Promise<UpdateSettings>;
  scheduleRestart?: (delaySeconds: number) => Promise<{ scheduled: boolean; restartIn: number }>;
  cancelScheduledRestart?: () => Promise<{ cancelled: boolean }>;
  onUpdateStatus?: (callback: (event: unknown, status: UpdateStatus) => void) => void;
  removeUpdateListener?: (callback: (event: unknown, status: UpdateStatus) => void) => void;
}

interface UpdateInfo {
  updateAvailable: boolean;
  updateDownloaded: boolean;
  updateVersion: string | null;
  releaseNotes?: string;
  releaseDate?: string;
  currentVersion: string;
}

interface UpdateSettings {
  checkInterval: number;
  autoRestartDelay: number;
  silentMode: boolean;
  installOnQuit: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Safe access to electron API
const getElectron = (): ElectronBridge | undefined => {
  if (typeof window !== 'undefined' && 'electron' in window) {
    return (window as unknown as { electron: ElectronBridge }).electron;
  }
  return undefined;
};

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && 'electron' in window;

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showMinimal, setShowMinimal] = useState(false);

  useEffect(() => {
    if (!isElectron) return;

    const electron = getElectron();
    if (!electron) return;

    // Get current version
    electron.getAppVersion?.().then((version: string) => {
      setCurrentVersion(version);
    });

    // Listen for update status from main process
    const handleUpdateStatus = (_event: unknown, status: UpdateStatus) => {
      setUpdateStatus(status);
      
      // Handle restart scheduled countdown
      if (status.status === 'restart-scheduled' && status.restartIn) {
        setCountdown(status.restartIn);
      }
      
      // Show notification for important updates (but respect silent mode)
      if (status.status === 'available' || status.status === 'downloaded') {
        if (!status.silent) {
          setDismissed(false);
        } else {
          // In silent mode, show minimal indicator
          setShowMinimal(true);
        }
      }
    };

    electron.onUpdateStatus?.(handleUpdateStatus);

    // Check for updates on mount
    electron.checkForUpdates?.();

    return () => {
      electron.removeUpdateListener?.(handleUpdateStatus);
    };
  }, []);
  
  // Countdown timer effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInstallUpdate = useCallback((silent = true) => {
    getElectron()?.installUpdate?.(silent);
  }, []);
  
  const handleCancelRestart = useCallback(() => {
    getElectron()?.cancelScheduledRestart?.();
    setCountdown(null);
    setUpdateStatus(prev => prev ? { ...prev, status: 'downloaded' } : null);
  }, []);
  
  const handleScheduleRestart = useCallback((delaySeconds: number) => {
    getElectron()?.scheduleRestart?.(delaySeconds);
    setCountdown(delaySeconds);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowMinimal(true); // Show minimal indicator when dismissed
  };
  
  const handleRetry = () => {
    getElectron()?.forceCheckUpdates?.();
  };

  // Don't show anything if not in Electron
  if (!isElectron) return null;
  
  // Don't show for non-important statuses
  if (!updateStatus || updateStatus.status === 'not-available' || updateStatus.status === 'checking') {
    return null;
  }
  
  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };
  
  // Format time for countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Minimal indicator (shows when update is ready but dismissed or in silent mode)
  if ((dismissed || showMinimal) && updateStatus.status === 'downloaded') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-[9998]"
      >
        <Button
          onClick={() => { setDismissed(false); setShowMinimal(false); }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all border border-blue-500/30"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Update Ready
        </Button>
      </motion.div>
    );
  }
  
  // Don't show full UI if dismissed
  if (dismissed) return null;

  return (
    <AnimatePresence>
      {/* Downloading State - Enhanced with speed and size info */}
      {updateStatus.status === 'downloading' && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[420px]"
        >
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-2xl border border-blue-500/30 overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  initial={{ 
                    x: Math.random() * 400, 
                    y: Math.random() * 100,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: [null, -100],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            <div className="relative p-5">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="p-3 bg-white/20 rounded-xl"
                >
                  <Download className="w-6 h-6 text-white" />
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Downloading Update
                  </h3>
                  <p className="text-white/80 text-sm">
                    v{currentVersion} → v{updateStatus.version}
                  </p>
                </div>
                
                <span className="text-2xl font-bold text-white">
                  {Math.round(updateStatus.percent || 0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4 relative">
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${updateStatus.percent || 0}%` }}
                    transition={{ type: 'spring', damping: 20 }}
                  />
                </div>
                {/* Glowing effect on progress */}
                <motion.div
                  className="absolute top-0 h-3 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                  animate={{ left: ['-20%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              
              {/* Download stats */}
              {updateStatus.transferred && updateStatus.total && (
                <div className="mt-2 flex justify-between text-white/60 text-xs">
                  <span>{formatBytes(updateStatus.transferred)} / {formatBytes(updateStatus.total)}</span>
                  {updateStatus.bytesPerSecond && (
                    <span>{formatBytes(updateStatus.bytesPerSecond)}/s</span>
                  )}
                </div>
              )}
              
              {/* Silent mode indicator */}
              <p className="text-white/50 text-xs mt-3 text-center">
                🔇 Installing automatically when ready
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Update Available - Minimal notification */}
      {updateStatus.status === 'available' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-[9999] w-[350px]"
        >
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-2xl border border-blue-500/30 overflow-hidden">
            <div className="p-5">
              <button 
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 bg-white/20 rounded-xl"
                >
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">
                    Update Available! ✨
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    Version {updateStatus.version} is ready to download
                  </p>
                </div>
              </div>

              <p className="text-white/70 text-xs mt-3">
                🔇 Downloading automatically in the background...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Restart Scheduled - Countdown notification */}
      {updateStatus.status === 'restart-scheduled' && countdown !== null && countdown > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div 
            className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-3xl shadow-2xl border border-white/20 w-[450px] overflow-hidden"
          >
            <div className="relative p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6"
              >
                <Clock className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-2">
                Restarting in {formatTime(countdown)}
              </h2>
              
              <p className="text-white/80 text-lg mb-2">
                Version {updateStatus.version} will be installed
              </p>

              <p className="text-white/60 text-sm mb-6">
                Save your work now. The app will restart automatically.
              </p>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={handleCancelRestart}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleInstallUpdate(true)}
                  className="bg-white text-orange-600 hover:bg-white/90 font-bold px-6"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Restart Now
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Update Downloaded - Ready to install */}
      {updateStatus.status === 'downloaded' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div 
            className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-blue-500/30 w-[480px] overflow-hidden"
            initial={{ rotateX: -20 }}
            animate={{ rotateX: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Celebration particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ['#3B82F6', '#60A5FA', '#93C5FD', '#64748B', '#94A3B8'][i % 5],
                  }}
                  initial={{ 
                    x: 240, 
                    y: 200,
                    scale: 0
                  }}
                  animate={{ 
                    x: 240 + (Math.random() - 0.5) * 400,
                    y: 200 + (Math.random() - 0.5) * 300,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                />
              ))}
            </div>

            <div className="relative p-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, damping: 10 }}
                className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Rocket className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Update Ready! 🎉
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 text-lg mb-2"
              >
                Version {updateStatus.version} has been downloaded
              </motion.p>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/10 rounded-lg p-3 mb-6"
              >
                <p className="text-white/90 text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  {updateStatus.autoInstallOnQuit 
                    ? "Will install automatically when you close the app"
                    : "Ready to install now"
                  }
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 justify-center flex-wrap"
              >
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Continue Working
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleScheduleRestart(300)} // 5 minutes
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  In 5 min
                </Button>
                <Button
                  onClick={() => handleInstallUpdate(true)}
                  className="bg-blue-600 text-white hover:bg-blue-500 font-bold px-6 py-3 text-lg rounded-xl shadow-lg border border-blue-400/50"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Restart & Update
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error State - With retry option */}
      {updateStatus.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-4 right-4 z-[9999] w-[380px]"
        >
          <div className="bg-red-500/90 backdrop-blur rounded-2xl shadow-2xl border border-white/20 p-5">
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">Update Error</h3>
                <p className="text-white/80 text-sm">{updateStatus.error}</p>
              </div>
            </div>
            {updateStatus.canRetry && (
              <Button
                onClick={handleRetry}
                variant="ghost"
                className="mt-3 w-full text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
