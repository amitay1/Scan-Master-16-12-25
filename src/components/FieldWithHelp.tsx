import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { StandardReferenceDialog } from "./StandardReferenceDialog";
import { getStandardReference } from "@/data/standardReferences";

interface FieldWithHelpProps {
  label: string;
  help?: string;
  required?: boolean;
  autoFilled?: boolean;
  materialInfo?: string;
  children: React.ReactNode;
  fieldKey?: string; // Key to lookup standard reference
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
  fieldKey
}: FieldWithHelpProps) => {
  const [showStandardDialog, setShowStandardDialog] = useState(false);
  const standardReference = fieldKey ? getStandardReference(fieldKey) : undefined;

  const handleInfoClick = () => {
    if (standardReference) {
      setShowStandardDialog(true);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {autoFilled && (
            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent">
              Auto-filled
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 min-w-[2.5rem] hover:bg-primary/10 touch-manipulation" 
            title={standardReference ? "Click to view standard reference" : (help || "Information")}
            onClick={handleInfoClick}
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
        {children}
        {materialInfo && (
          <p className="text-xs text-muted-foreground mt-1">{materialInfo}</p>
        )}
      </div>

      <StandardReferenceDialog
        open={showStandardDialog}
        onOpenChange={setShowStandardDialog}
        reference={standardReference}
        fieldLabel={label}
      />
    </>
  );
};
