/**
 * Floating action buttons: Splash Demo + Check for Updates
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const isElectron = typeof window !== 'undefined' && 'electron' in window;

export function FloatingSplashDemoButton() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleSplashDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/splash-demo');
  };

  const handleCheckUpdates = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (checking) return;
    setChecking(true);
    setChecked(false);
    try {
      const electron = (window as unknown as { electron: { forceCheckUpdates?: () => Promise<void>; checkForUpdates?: () => Promise<void> } }).electron;
      await (electron.forceCheckUpdates?.() || electron.checkForUpdates?.());
    } catch { /* ignore */ }
    setTimeout(() => {
      setChecking(false);
      setChecked(true);
      setTimeout(() => setChecked(false), 3000);
    }, 2000);
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-center">
        {/* Check for Updates */}
        {isElectron && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={handleCheckUpdates}
                disabled={checking}
                className={`h-12 w-12 rounded-full shadow-lg border-2 border-white/20
                  transition-all duration-300 hover:scale-110 hover:shadow-xl
                  ${checked
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-500 hover:to-emerald-600'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  }
                  text-white`}
                style={{
                  boxShadow: checked
                    ? '0 4px 20px rgba(16,185,129,0.4)'
                    : '0 4px 20px rgba(59,130,246,0.4)',
                }}
              >
                {checking ? (
                  <Download className="h-5 w-5 animate-bounce" />
                ) : checked ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-none">
              <p className="font-semibold">{checking ? 'Checking...' : checked ? 'Up to date!' : 'Check for Updates'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Splash Demos */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              onClick={handleSplashDemo}
              className="h-14 w-14 rounded-full shadow-lg
                         bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500
                         hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600
                         text-white border-2 border-white/20
                         transition-all duration-300 hover:scale-110 hover:shadow-xl"
              style={{
                boxShadow: '0 4px 20px rgba(139,92,246,0.4), 0 0 30px rgba(217,70,239,0.2)',
              }}
            >
              <Sparkles className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none">
            <p className="font-semibold">Splash Demos</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
