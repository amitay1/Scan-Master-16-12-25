import { useEffect, useState, useCallback } from 'react';

export const useServiceWorker = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateInProgress, setUpdateInProgress] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      // Use the advanced service worker for full PWA capabilities
      navigator.serviceWorker
        .register('/service-worker-advanced.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('Service Worker registered successfully');

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          console.log(`Sync complete: ${event.data.successful} successful, ${event.data.failed} failed`);
        }
      });
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration && registration.waiting && !updateInProgress) {
      // Mark update as in progress to prevent duplicate calls
      setUpdateInProgress(true);
      
      // Tell SW to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Clear the update available flag immediately to prevent re-triggering
      setIsUpdateAvailable(false);
      
      // Reload once the new service worker is active
      const handleControllerChange = () => {
        window.location.reload();
      };
      
      // Use once: true to ensure single execution
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true });
      
      // Fallback reload after 3 seconds if controllerchange doesn't fire
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [registration, updateInProgress]);

  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.cleared) {
            resolve(true);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
    return false;
  };

  return {
    isOffline,
    isUpdateAvailable,
    updateServiceWorker,
    clearCache,
    registration,
  };
};