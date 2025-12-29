/**
 * Update Notification Component
 * Shows beautiful animated update notifications in the app
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, RefreshCw, Sparkles, Loader2, X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UpdateStatus {
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && window.electron;

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if (!isElectron) return;

    // Get current version
    window.electron?.getAppVersion?.().then((version: string) => {
      setCurrentVersion(version);
    });

    // Listen for update status from main process
    const handleUpdateStatus = (_event: any, status: UpdateStatus) => {
      setUpdateStatus(status);
      if (status.status === 'available' || status.status === 'downloaded') {
        setDismissed(false); // Show notification for important updates
      }
    };

    window.electron?.onUpdateStatus?.(handleUpdateStatus);

    // Check for updates on mount
    window.electron?.checkForUpdates?.();

    return () => {
      window.electron?.removeUpdateListener?.(handleUpdateStatus);
    };
  }, []);

  const handleInstallUpdate = () => {
    window.electron?.installUpdate?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show anything if not in Electron or dismissed
  if (!isElectron || dismissed || !updateStatus) return null;
  
  // Don't show for non-important statuses
  if (updateStatus.status === 'not-available' || updateStatus.status === 'checking') return null;

  return (
    <AnimatePresence>
      {updateStatus.status === 'downloading' && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[400px]"
        >
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
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
            </div>
          </div>
        </motion.div>
      )}

      {updateStatus.status === 'available' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-[9999] w-[350px]"
        >
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
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
                  <Sparkles className="w-6 h-6 text-yellow-300" />
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
                The update will download automatically in the background.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {updateStatus.status === 'downloaded' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div 
            className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-3xl shadow-2xl border border-white/20 w-[450px] overflow-hidden"
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
                    background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6'][i % 5],
                  }}
                  initial={{ 
                    x: 225, 
                    y: 200,
                    scale: 0
                  }}
                  animate={{ 
                    x: 225 + (Math.random() - 0.5) * 400,
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

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/60 text-sm mb-6"
              >
                Restart the app to apply the update
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 justify-center"
              >
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Later
                </Button>
                <Button
                  onClick={handleInstallUpdate}
                  className="bg-white text-green-600 hover:bg-white/90 font-bold px-6 py-3 text-lg rounded-xl shadow-lg"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Restart & Update
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {updateStatus.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-4 right-4 z-[9999] w-[350px]"
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
              <div>
                <h3 className="text-white font-bold">Update Error</h3>
                <p className="text-white/80 text-sm">{updateStatus.error}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
