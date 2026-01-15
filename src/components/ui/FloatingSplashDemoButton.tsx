/**
 * Floating Splash Demo Button (FAB) - TEMPORARY
 * Cute animated button for quick access to Splash Screens Demo
 * TODO: Remove this component when splash screen selection is finalized
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FloatingSplashDemoButton() {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/splash-demo');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            onClick={handleClick}
            className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full shadow-lg
                       bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400
                       hover:from-purple-600 hover:via-pink-600 hover:to-orange-500
                       text-white border-2 border-white/20
                       transition-all duration-300 hover:scale-110 hover:shadow-xl
                       animate-pulse hover:animate-none"
            style={{
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)',
            }}
          >
            <Sparkles className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none">
          <p className="font-semibold">Splash Demos</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
