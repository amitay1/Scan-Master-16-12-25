import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ValidationLevel = 'success' | 'warning' | 'error' | 'info';

export interface ValidationIndicatorProps {
  level: ValidationLevel;
  message: string;
  suggestion?: string;
  reference?: string;
  className?: string;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  level,
  message,
  suggestion,
  reference,
  className
}) => {
  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />
  };

  const icon = icons[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 cursor-help",
              level === 'success' && "animate-pulse-success",
              level === 'error' && "animate-pulse-error",
              className
            )}
          >
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-card border border-border"
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              {icon}
              <div className="space-y-1 text-sm">
                <p className="font-medium">{message}</p>
                {suggestion && (
                  <p className="text-muted-foreground">{suggestion}</p>
                )}
                {reference && (
                  <p className="text-xs text-primary">
                    Reference: AMS-STD-2154E {reference}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface FieldWithValidationProps {
  children: React.ReactNode;
  validation?: {
    level: ValidationLevel;
    message: string;
    suggestion?: string;
    reference?: string;
  };
  autoFilled?: boolean;
}

export const FieldWithValidation: React.FC<FieldWithValidationProps> = ({
  children,
  validation,
  autoFilled
}) => {
  return (
    <div className={cn(
      "relative",
      autoFilled && "field-auto-filled"
    )}>
      {children}
      {validation && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="pointer-events-auto">
            <ValidationIndicator {...validation} />
          </div>
        </div>
      )}
      {autoFilled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-auto">
                <HelpCircle className="h-3 w-3 text-primary opacity-50" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Auto-filled per AMS-STD-2154E</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};