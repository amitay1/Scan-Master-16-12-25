import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Collapsible Sidebar Component
 * Provides a sidebar that can be collapsed to save space
 */
export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  onToggle,
  children,
  title,
  className
}) => {
  return (
    <div
      className={cn(
        'relative h-full transition-all duration-300 ease-in-out hidden md:flex flex-shrink-0',
        isOpen ? 'w-[22%] min-w-[280px] max-w-[350px]' : 'w-12',
        className
      )}
    >
      {/* Sidebar Content */}
      <div
        className={cn(
          'h-full w-full app-panel flex flex-col transition-opacity duration-200 overflow-hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none w-0'
        )}
      >
        {title && (
          <div className="p-3 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-sm mb-0">{title}</h3>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {children}
          </div>
        </ScrollArea>
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          'absolute top-2 z-20 h-8 w-8 rounded-full bg-background border border-border shadow-sm hover:shadow-md transition-all duration-200',
          isOpen ? '-right-4' : 'right-2'
        )}
        title={isOpen ? 'סגור סרגל צד' : 'פתח סרגל צד'}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
