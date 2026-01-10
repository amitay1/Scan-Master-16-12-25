import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StandardType } from "@/types/techniqueSheet";
import { Lock, Check, AlertCircle, Info, ShieldCheck, Factory, Globe, FlaskConical, DollarSign, Wrench, Beaker } from "lucide-react";
import { useStandardAccess } from "@/hooks/useStandardAccess";
import { useLicense } from "@/contexts/LicenseContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StandardSelectorProps {
  value: StandardType;
  onChange: (value: StandardType) => void;
  showComparisonIndicator?: boolean;
}

const standards = [
  {
    value: "AMS-STD-2154E" as StandardType,
    label: "AMS-STD-2154E (Revision E)",
    description: "Ultrasonic Inspection of Wrought Metals - Aerospace",
    stringency: "Most Stringent",
    badge: "Aerospace",
    icon: ShieldCheck,
    color: "text-red-600",
    iconBg: "bg-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    badgeBg: "#fef2f2",
    badgeText: "#dc2626",
    badgeBorder: "#fca5a5",
    features: ["5 classes (AAA-C)", "#1 FBH (0.8mm)", "30% overlap", "90% linearity"]
  },
  {
    value: "ASTM-A388" as StandardType,
    label: "ASTM A388/A388M",
    description: "Ultrasonic Examination of Heavy Steel Forgings",
    stringency: "Standard",
    badge: "Industrial",
    icon: Factory,
    color: "text-blue-600",
    iconBg: "bg-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    badgeBg: "#eff6ff",
    badgeText: "#2563eb",
    badgeBorder: "#93c5fd",
    features: ["4 quality levels", "DGS method", "10-15% overlap", "Heavy forgings"]
  },
  {
    value: "BS-EN-10228-3" as StandardType,
    label: "BS EN 10228-3:2016",
    description: "Ultrasonic Testing of Ferritic/Martensitic Steel Forgings",
    stringency: "European",
    badge: "EU Ferritic",
    icon: Globe,
    color: "text-green-600",
    iconBg: "bg-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    badgeBg: "#f0fdf4",
    badgeText: "#16a34a",
    badgeBorder: "#86efac",
    features: ["4 quality classes", "DAC curve", "2-10 MHz", "Ferritic steel"]
  },
  {
    value: "BS-EN-10228-4" as StandardType,
    label: "BS EN 10228-4:2016",
    description: "Ultrasonic Testing of Austenitic-Ferritic Stainless Steel Forgings",
    stringency: "Specialized",
    badge: "EU Austenitic",
    icon: FlaskConical,
    color: "text-purple-600",
    iconBg: "bg-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    badgeBg: "#faf5ff",
    badgeText: "#9333ea",
    badgeBorder: "#d8b4fe",
    features: ["Coarse grain", "0.5-2 MHz", "20% overlap", "Austenitic steel"]
  }
] as const;

export const StandardSelector = ({ value, onChange, showComparisonIndicator = false }: StandardSelectorProps) => {
  const navigate = useNavigate();
  const { hasAccess, isLoading } = useStandardAccess(value);
  const { canUseStandard, getStandards, license, isElectron } = useLicense();
  const currentStandard = standards.find(s => s.value === value);

  // Get standards catalog with license info
  const standardsCatalog = getStandards();

  // Check if current standard is purchased
  const isStandardPurchased = (standardCode: string) => {
    if (!isElectron) return true; // In web mode, all standards available
    return canUseStandard(standardCode);
  };

  // Handle standard selection
  const handleStandardChange = (newStandard: StandardType) => {
    if (!isElectron) {
      // Web mode - allow all standards
      onChange(newStandard);
      return;
    }

    if (!isStandardPurchased(newStandard)) {
      // Standard is locked
      toast.error(
        "Standard Locked",
        {
          description: `${newStandard} is not included in your license. Contact Scan Master to purchase it.`,
          action: {
            label: "Contact Sales",
            onClick: () => {
              if (window.electron) {
                // Open email client
                window.open('mailto:sales@scanmaster.com?subject=Purchase Standard: ' + newStandard);
              }
            }
          }
        }
      );
      return;
    }

    onChange(newStandard);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-foreground flex items-center gap-1 whitespace-nowrap">
            Standard
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Standard Selection Impact</p>
                <p className="text-xs">Changing standards will automatically adjust:</p>
                <ul className="text-xs mt-1 space-y-0.5">
                  <li>• Acceptance criteria</li>
                  <li>• FBH sizes and calibration</li>
                  <li>• Scan parameters</li>
                  <li>• Frequency recommendations</li>
                  <li>• Coverage requirements</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </label>
          
          {currentStandard && (
            <Badge 
              variant="outline" 
              className="shrink-0 font-medium"
              style={{ 
                backgroundColor: currentStandard.badgeBg, 
                color: currentStandard.badgeText,
                borderColor: currentStandard.badgeBorder 
              }}
            >
              {currentStandard.stringency}
            </Badge>
          )}
        </div>
        
        <Select value={value} onValueChange={handleStandardChange} disabled={isLoading}>
          <SelectTrigger className={`w-full bg-card border-border ${showComparisonIndicator ? 'ring-2 ring-primary/20' : ''}`}>
            <SelectValue placeholder="Select a standard...">
              {currentStandard && (
                <span className="text-xs truncate block">{currentStandard.value}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-xl">
            {standards.map((standard) => {
              const Icon = standard.icon;
              const isCurrentStandard = standard.value === value;
              const isPurchased = isStandardPurchased(standard.value);
              const isLocked = !isPurchased && isElectron;
              const hasCurrentAccess = isCurrentStandard && isPurchased;
              
              return (
                <SelectItem 
                  key={standard.value} 
                  value={standard.value}
                  disabled={isLocked}
                  className="py-4"
                >
                  <div className="flex items-start gap-2 sm:gap-3 w-full">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${standard.iconBg} shrink-0`}>
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[10px] sm:text-xs truncate flex-1">{standard.label}</span>
                        <div className="flex gap-1 shrink-0">
                          {isLocked && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-3 w-3 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Not purchased - Contact sales</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {hasCurrentAccess && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Check className="h-3 w-3 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Included in your license</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-2 truncate">{standard.description}</p>
                      
                      <div className="grid grid-cols-2 gap-1">
                        {standard.features.map((feature, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0.5 text-ellipsis overflow-hidden whitespace-nowrap">
                                {feature}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{feature}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {!isStandardPurchased(value) && isElectron && (
          <div className="flex flex-col gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800 mt-4 w-full">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-xs font-medium text-amber-900 dark:text-amber-100">Standard Not Purchased</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                This standard is not included in your license. Contact Scan Master to add it to your account.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium">Starting from $500</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                if (window.electron) {
                  window.open(`mailto:sales@scanmaster.com?subject=Add Standard to License&body=Factory ID: ${license?.factoryId}%0A%0AStandard to add: ${value}`);
                }
              }}
              className="w-full text-xs bg-amber-600 hover:bg-amber-700"
              data-testid="button-purchase-standard"
            >
              Contact Sales to Purchase
            </Button>
          </div>
        )}
        
        {showComparisonIndicator && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200 mt-4">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[10px] sm:text-xs text-amber-700 break-words">
              Values highlighted in yellow have changed due to standard requirements
            </span>
          </div>
        )}
        
        {currentStandard && (
          <div className={`p-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 ${currentStandard.borderColor} mt-4 w-full shadow-lg ring-1 ring-offset-1 ring-offset-slate-900 ${currentStandard.borderColor.replace('border-', 'ring-')}`}>
            {/* Header Row with Icon and Badge - more prominent */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`p-1.5 rounded-lg ${currentStandard.iconBg}`}>
                  <currentStandard.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white truncate">
                  {currentStandard.value}
                </span>
              </div>
              <Badge 
                className="font-semibold text-xs px-2 py-1 border-2"
                style={{ 
                  backgroundColor: currentStandard.badgeBg, 
                  color: currentStandard.badgeText,
                  borderColor: currentStandard.badgeBorder 
                }}
              >
                {currentStandard.stringency}
              </Badge>
            </div>
            
            {/* Feature Tags - 2x2 Grid with better visibility */}
            <div className="grid grid-cols-2 gap-2">
              {currentStandard.features.slice(0, 4).map((feature, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <div className="bg-slate-700/80 rounded-lg p-2 border border-slate-600 hover:bg-slate-600/80 transition-colors cursor-help">
                      <div className="text-white font-bold text-sm text-center">
                        {feature.split(' ')[0]}
                      </div>
                      <div className="text-slate-300 text-[10px] text-center truncate">
                        {feature.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-medium">{feature}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
