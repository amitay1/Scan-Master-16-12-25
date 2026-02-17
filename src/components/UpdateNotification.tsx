/**
 * Update Notification Component
 *
 * Hidden when no update. Shows a pulsing indicator when update is available/downloading.
 * Opens a clear modal when update is downloaded and ready to install.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, X, Rocket, Clock, CheckCircle2, ArrowDownCircle } from 'lucide-react';
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

interface ElectronBridge {
  getAppVersion?: () => Promise<string>;
  checkForUpdates?: () => Promise<void>;
  forceCheckUpdates?: () => Promise<void>;
  installUpdate?: (silent?: boolean) => void;
  downloadUpdate?: () => Promise<void>;
  getUpdateInfo?: () => Promise<unknown>;
  getUpdateSettings?: () => Promise<unknown>;
  setUpdateSettings?: (settings: unknown) => Promise<unknown>;
  scheduleRestart?: (delaySeconds: number) => Promise<{ scheduled: boolean; restartIn: number }>;
  cancelScheduledRestart?: () => Promise<{ cancelled: boolean }>;
  onUpdateStatus?: (callback: (event: unknown, status: UpdateStatus) => void) => void;
  removeUpdateListener?: (callback: (event: unknown, status: UpdateStatus) => void) => void;
}

const getElectron = (): ElectronBridge | undefined => {
  if (typeof window !== 'undefined' && 'electron' in window) {
    return (window as unknown as { electron: ElectronBridge }).electron;
  }
  return undefined;
};

const isElectron = typeof window !== 'undefined' && 'electron' in window;

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    const electron = getElectron();
    if (!electron) return;

    electron.getAppVersion?.().then((v: string) => setCurrentVersion(v));

    const handleUpdateStatus = (_event: unknown, status: UpdateStatus) => {
      setUpdateStatus(status);
      // Auto-show modal when download completes
      if (status.status === 'downloaded') {
        setShowModal(true);
      }
      if (status.status === 'restart-scheduled' && status.restartIn) {
        setCountdown(status.restartIn);
      }
    };

    electron.onUpdateStatus?.(handleUpdateStatus);
    electron.checkForUpdates?.();

    return () => {
      electron.removeUpdateListener?.(handleUpdateStatus);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInstallUpdate = useCallback((silent = true) => {
    getElectron()?.installUpdate?.(silent);
  }, []);

  const handleScheduleRestart = useCallback((delaySeconds: number) => {
    getElectron()?.scheduleRestart?.(delaySeconds);
    setCountdown(delaySeconds);
  }, []);

  const handleCancelRestart = useCallback(() => {
    getElectron()?.cancelScheduledRestart?.();
    setCountdown(null);
    setUpdateStatus(prev => prev ? { ...prev, status: 'downloaded' } : null);
  }, []);

  const handleRetry = () => {
    getElectron()?.forceCheckUpdates?.();
  };

  if (!isElectron) return null;

  // Nothing to show
  if (!updateStatus || updateStatus.status === 'not-available' || updateStatus.status === 'checking') {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const percent = updateStatus.percent ?? 0;

  // ─── Floating indicator (pill) ───
  // Visible when: downloading, available, downloaded (but modal closed), error
  const showPill = !showModal && (
    updateStatus.status === 'available' ||
    updateStatus.status === 'downloading' ||
    updateStatus.status === 'downloaded' ||
    updateStatus.status === 'error'
  );

  const pillColor =
    updateStatus.status === 'downloaded' ? 'from-green-500 to-emerald-600' :
    updateStatus.status === 'downloading' ? 'from-blue-500 to-cyan-600' :
    updateStatus.status === 'error' ? 'from-red-500 to-red-600' :
    'from-amber-500 to-orange-500';

  const pillIcon =
    updateStatus.status === 'downloaded' ? <CheckCircle2 className="w-5 h-5" /> :
    updateStatus.status === 'downloading' ? <Download className="w-5 h-5 animate-bounce" /> :
    updateStatus.status === 'error' ? <X className="w-5 h-5" /> :
    <ArrowDownCircle className="w-5 h-5" />;

  const pillLabel =
    updateStatus.status === 'downloaded' ? `v${updateStatus.version} Ready` :
    updateStatus.status === 'downloading' ? `${percent.toFixed(0)}%` :
    updateStatus.status === 'error' ? 'Update Error' :
    `v${updateStatus.version}`;

  return (
    <>
      {/* ─── Floating Pill ─── */}
      <AnimatePresence>
        {showPill && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-5 right-5 z-[9998]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              onClick={() => {
                if (updateStatus.status === 'downloaded') setShowModal(true);
                if (updateStatus.status === 'error') handleRetry();
              }}
              className={`
                flex items-center gap-2 text-white font-semibold rounded-full shadow-2xl
                bg-gradient-to-r ${pillColor} border border-white/20
                transition-all duration-300 cursor-pointer
                ${hovered ? 'px-5 py-3 text-sm' : 'px-3 py-3 text-sm'}
              `}
            >
              {/* Pulse ring when downloaded */}
              {updateStatus.status === 'downloaded' && (
                <span className="absolute inset-0 rounded-full animate-ping bg-green-400/30" />
              )}

              <span className="relative z-10 flex items-center gap-2">
                {pillIcon}
                <AnimatePresence mode="wait">
                  {hovered && (
                    <motion.span
                      key="label"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {pillLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {/* Download progress ring */}
              {updateStatus.status === 'downloading' && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="20" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="2" />
                  <circle cx="22" cy="22" r="20" fill="none" stroke="white" strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - percent / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Restart Scheduled Banner ─── */}
      <AnimatePresence>
        {updateStatus.status === 'restart-scheduled' && countdown !== null && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Restarting in {formatTime(countdown)} to install v{updateStatus.version}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancelRestart} className="text-white hover:bg-white/20 text-sm h-8">
                Cancel
              </Button>
              <Button onClick={() => handleInstallUpdate(true)} className="bg-white text-orange-700 hover:bg-white/90 text-sm h-8 font-bold">
                Restart Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Install Modal ─── */}
      <AnimatePresence>
        {showModal && updateStatus.status === 'downloaded' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md mx-4 overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

              <div className="p-8 text-center">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
                  <Rocket className="w-10 h-10 text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Update Ready
                </h2>
                <p className="text-slate-400 mb-1">
                  Version {updateStatus.version} has been downloaded
                </p>
                {currentVersion && (
                  <p className="text-slate-500 text-sm mb-6">
                    Current: v{currentVersion}
                  </p>
                )}

                <div className="bg-white/5 rounded-xl p-3 mb-8 text-slate-300 text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Will auto-install when you close the app
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => handleInstallUpdate(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 text-base rounded-xl"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Restart & Update
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleScheduleRestart(300)}
                      className="flex-1 text-slate-400 hover:text-white hover:bg-white/10 text-sm"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      In 5 min
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowModal(false)}
                      className="flex-1 text-slate-400 hover:text-white hover:bg-white/10 text-sm"
                    >
                      Later
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error Toast ─── */}
      <AnimatePresence>
        {updateStatus.status === 'error' && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-20 right-5 z-[9999] w-80"
          >
            <div className="bg-red-600/95 backdrop-blur rounded-xl shadow-2xl border border-white/20 p-4">
              <button onClick={() => setUpdateStatus(null)} className="absolute top-3 right-3 text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/15 rounded-lg mt-0.5">
                  <X className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Update Error</h3>
                  <p className="text-white/80 text-xs mt-1">{updateStatus.error}</p>
                </div>
              </div>
              {updateStatus.canRetry && (
                <Button onClick={handleRetry} variant="ghost" className="w-full mt-3 text-white hover:bg-white/10 text-xs h-8">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
