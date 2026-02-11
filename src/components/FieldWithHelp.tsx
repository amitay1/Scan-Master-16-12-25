import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { StandardReferenceDialog } from "./StandardReferenceDialog";
import { getStandardReference } from "@/data/standardReferences";
import { useActiveStandard } from "@/contexts/StandardContext";

interface FieldWithHelpProps {
  label: string;
  help?: string;
  required?: boolean;
  autoFilled?: boolean;
  materialInfo?: string;
  children: React.ReactNode;
  fieldKey?: string; // Key to lookup standard reference
  compact?: boolean; // Ultra-compact inline mode
}

/**
 * Reusable field component with label, help text, and standard reference dialog
 */
export const FieldWithHelp = ({ 
  label, 
  help, 
  required,
  autoFilled,
  materialInfo,
  children,
  fieldKey,
  compact = false
}: FieldWithHelpProps) => {
  const [showStandardDialog, setShowStandardDialog] = useState(false);
  const activeStandard = useActiveStandard();
  const standardReference = fieldKey ? getStandardReference(fieldKey) : undefined;

  const handleInfoClick = () => {
    if (standardReference) {
      setShowStandardDialog(true);
    }
  };

  // Ultra-compact inline mode - label and input on same row
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1">
          <Label className="text-xs font-medium whitespace-nowrap min-w-[80px]">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex-1 min-w-0">{children}</div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 flex-shrink-0 hover:bg-primary/10" 
            title={standardReference ? "View reference" : (help || "Info")}
            onClick={handleInfoClick}
          >
            <Info className="h-3 w-3" />
          </Button>
        </div>
         <StandardReferenceDialog
           open={showStandardDialog}
           onOpenChange={setShowStandardDialog}
           reference={standardReference}
           fieldLabel={label}
           standardType={activeStandard}
         />
      </>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Label className="text-xs font-medium">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {autoFilled && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 bg-accent/10 text-accent border-accent">
              Auto
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 hover:bg-primary/10" 
            title={standardReference ? "Click to view standard reference" : (help || "Information")}
            onClick={handleInfoClick}
          >
            <Info className="h-3 w-3" />
          </Button>
        </div>
        {children}
        {materialInfo && (
          <p className="text-[10px] text-muted-foreground">{materialInfo}</p>
        )}
      </div>

      <StandardReferenceDialog
        open={showStandardDialog}
        onOpenChange={setShowStandardDialog}
        reference={standardReference}
        fieldLabel={label}
        standardType={activeStandard}
      />
    </>
  );
};
