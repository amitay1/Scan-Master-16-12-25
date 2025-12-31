import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-7 w-full rounded border border-input bg-background px-2 py-1 text-xs",
          "ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          // Smooth transitions
          "transition-all duration-150 ease-out",
          // Focus states with smooth glow
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
          "focus-visible:border-primary/50",
          // Hover state
          "hover:border-muted-foreground/50",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
