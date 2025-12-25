/**
 * Floating Designer Button (FAB)
 * Fixed position button for quick access to Block Designer
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FloatingDesignerButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/block-designer">
            <Button
              size="lg"
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg
                         bg-primary hover:bg-primary/90 text-primary-foreground
                         transition-transform hover:scale-105"
            >
              <Pencil className="h-6 w-6" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Block Designer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
