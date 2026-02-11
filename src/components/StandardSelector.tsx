import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StandardType } from "@/types/techniqueSheet";
import { Lock, Check, AlertCircle, Info, ShieldCheck, Factory, Globe, FlaskConical, DollarSign, Wrench, Beaker, FileText, Zap, Layers, BookOpen, CircleDot, AlertTriangle, Clock, Gauge, Target } from "lucide-react";
import { useStandardAccess } from "@/hooks/useStandardAccess";
import { useLicense } from "@/contexts/LicenseContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMemo } from "react";
import { isOEMStandard, getOEMRulesFromStandard } from "@/utils/oemRuleEngine";

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
    features: ["5 classes (AAA-C)", "#1 FBH (0.4mm)", "30% overlap", "90% linearity"]
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
    features: ["4 quality classes", "DAC curve", "1-6 MHz", "Ferritic steel"]
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
    features: ["Coarse grain", "0.5-6 MHz (typ. 0.5-2)", "20% overlap", "Austenitic steel"]
  },
  {
    value: "NDIP-1226" as StandardType,
    label: "NDIP-1226 Rev F",
    description: "V2500 1st Stage HPT Disk - Immersion UT Inspection",
    stringency: "OEM Specific",
    badge: "PW Aerospace",
    icon: Wrench,
    color: "text-orange-600",
    iconBg: "bg-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    badgeBg: "#fff7ed",
    badgeText: "#ea580c",
    badgeBorder: "#fdba74",
    features: ["5 MHz immersion", "#1 FBH (1/64\")", "±45° shear wave", "100% coverage"]
  },
  {
    value: "NDIP-1227" as StandardType,
    label: "NDIP-1227 Rev D",
    description: "V2500 2nd Stage HPT Disk - Immersion UT Inspection",
    stringency: "OEM Specific",
    badge: "PW Aerospace",
    icon: Wrench,
    color: "text-orange-600",
    iconBg: "bg-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    badgeBg: "#fff7ed",
    badgeText: "#ea580c",
    badgeBorder: "#fdba74",
    features: ["5 MHz immersion", "#1 FBH (1/64\")", "±45° shear wave", "100% coverage"]
  },

  // ============================================================================
  // PW1100G GTF (Geared Turbofan) — FAA AD-mandated AUSI
  // ============================================================================
  {
    value: "NDIP-1254" as StandardType,
    label: "NDIP-1254",
    description: "PW1100G HPT 1st Stage Hub — Angled Ultrasonic Inspection (AUSI)",
    stringency: "OEM Specific",
    badge: "PW GTF",
    icon: Wrench,
    color: "text-orange-600",
    iconBg: "bg-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    badgeBg: "#fff7ed",
    badgeText: "#ea580c",
    badgeBorder: "#fdba74",
    features: ["AUSI immersion", "Powder metal inspection", "FAA AD 2023-16-07", "PW1100G-JM / PW1400G-JM"]
  },
  {
    value: "NDIP-1257" as StandardType,
    label: "NDIP-1257",
    description: "PW1100G HPT 2nd Stage Hub — Angled Ultrasonic Inspection (AUSI)",
    stringency: "OEM Specific",
    badge: "PW GTF",
    icon: Wrench,
    color: "text-orange-600",
    iconBg: "bg-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    badgeBg: "#fff7ed",
    badgeText: "#ea580c",
    badgeBorder: "#fdba74",
    features: ["AUSI immersion", "Powder metal inspection", "FAA AD 2023-16-07", "PW1100G-JM / PW1400G-JM"]
  },
  {
    value: "NDIP-1260" as StandardType,
    label: "NDIP-1260",
    description: "PW1100G HPC 8th Stage Disc (IBR-8) — Angled Ultrasonic Inspection",
    stringency: "OEM Specific",
    badge: "PW GTF",
    icon: Wrench,
    color: "text-orange-600",
    iconBg: "bg-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    badgeBg: "#fff7ed",
    badgeText: "#ea580c",
    badgeBorder: "#fdba74",
    features: ["AUSI immersion", "IBR disc inspection", "Powder metal screening", "PW1100G-JM"]
  },

  // ============================================================================
  // PWA SIM — Sonic Inspection Method (Bar, Billet, Forging)
  // ============================================================================
  {
    value: "PWA-SIM" as StandardType,
    label: "PWA SIM (Sonic Inspection Method)",
    description: "Pratt & Whitney Sonic Inspection of Bar, Billet & Forging Stock",
    stringency: "OEM Specific",
    badge: "PW Material",
    icon: Wrench,
    color: "text-amber-600",
    iconBg: "bg-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    badgeBg: "#fffbeb",
    badgeText: "#d97706",
    badgeBorder: "#fcd34d",
    features: ["5 MHz immersion", "FBH + EDM notch", "Bar/Billet/Rod", "PWA 127 compliant"]
  },

  // ============================================================================
  // NEW STANDARDS
  // ============================================================================

  {
    value: "ASTM-E2375" as StandardType,
    label: "ASTM E2375-22",
    description: "Ultrasonic Testing of Wrought Products (Adopted from MIL-STD-2154)",
    stringency: "Most Stringent",
    badge: "General UT",
    icon: FileText,
    color: "text-indigo-600",
    iconBg: "bg-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    badgeBg: "#eef2ff",
    badgeText: "#4f46e5",
    badgeBorder: "#a5b4fc",
    features: ["5 classes (AAA-C)", "MIL-STD-2154 based", "30% overlap", "All wrought metals"]
  },
  {
    value: "ASTM-E127" as StandardType,
    label: "ASTM E127-20",
    description: "Fabrication of FBH Ultrasonic Reference Blocks",
    stringency: "Calibration",
    badge: "Calibration",
    icon: CircleDot,
    color: "text-cyan-600",
    iconBg: "bg-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-300",
    badgeBg: "#ecfeff",
    badgeText: "#0891b2",
    badgeBorder: "#67e8f9",
    features: ["FBH 1/64\"-8/64\"", "5 MHz immersion", "Block fabrication", "Reference std"]
  },
  {
    value: "ASTM-E164" as StandardType,
    label: "ASTM E164-19",
    description: "Contact Ultrasonic Testing of Weldments",
    stringency: "Standard",
    badge: "Welding",
    icon: Zap,
    color: "text-amber-600",
    iconBg: "bg-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    badgeBg: "#fffbeb",
    badgeText: "#d97706",
    badgeBorder: "#fcd34d",
    features: ["Weld inspection", "45°/60°/70° angles", "0.25\"-8\" thick", "Ferrous/Aluminum"]
  },
  {
    value: "AMS-2630" as StandardType,
    label: "AMS 2630E",
    description: "Ultrasonic Inspection of Products Over 0.5\" Thick",
    stringency: "Aerospace",
    badge: "Thick Parts",
    icon: Layers,
    color: "text-rose-600",
    iconBg: "bg-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-300",
    badgeBg: "#fff1f2",
    badgeText: "#e11d48",
    badgeBorder: "#fda4af",
    features: ["5 classes (AAA-C)", ">0.5\" thickness", "30% overlap", "All wrought metals"]
  },
  {
    value: "AMS-2631" as StandardType,
    label: "AMS 2631G",
    description: "Ultrasonic Inspection of Titanium Bar, Billet and Plate",
    stringency: "Aerospace Ti",
    badge: "Titanium",
    icon: ShieldCheck,
    color: "text-teal-600",
    iconBg: "bg-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-300",
    badgeBg: "#f0fdfa",
    badgeText: "#0d9488",
    badgeBorder: "#5eead4",
    features: ["Classes AA/A/A1/B", "Ti-6Al-4V blocks", "≤250 μin surface", "Grain flow aware"]
  },
  {
    value: "AMS-2632" as StandardType,
    label: "AMS 2632C",
    description: "Ultrasonic Inspection of Thin Materials (≤0.5\" / 12.7mm)",
    stringency: "Aerospace Thin",
    badge: "Thin Parts",
    icon: Layers,
    color: "text-pink-600",
    iconBg: "bg-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-300",
    badgeBg: "#fdf2f8",
    badgeText: "#db2777",
    badgeBorder: "#f9a8d4",
    features: ["Classes AA/A/B/C", "≤0.5\" thickness", "High frequency", "Near-surface critical"]
  },
  {
    value: "EN-ISO-16810" as StandardType,
    label: "EN ISO 16810:2024",
    description: "Non-destructive Testing - Ultrasonic Testing - General Principles",
    stringency: "Framework",
    badge: "EU/ISO",
    icon: BookOpen,
    color: "text-slate-600",
    iconBg: "bg-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    badgeBg: "#f8fafc",
    badgeText: "#475569",
    badgeBorder: "#cbd5e1",
    features: ["General principles", "EN 12668 equipment", "Framework std", "Ref. other stds"]
  }
] as const;

export const StandardSelector = ({ value, onChange, showComparisonIndicator = false }: StandardSelectorProps) => {
  const navigate = useNavigate();
  const { hasAccess, isLoading } = useStandardAccess(value);
  const { canUseStandard, getStandards, license, isElectron } = useLicense();
  const currentStandard = standards.find(s => s.value === value);

  // Get OEM rules if this is an OEM-specific standard (NDIP, etc.)
  const oemRules = useMemo(() => {
    if (!value || !isOEMStandard(value)) return null;
    return getOEMRulesFromStandard(value);
  }, [value]);

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
            {/* Header Row with Icon */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${currentStandard.iconBg} shrink-0`}>
                <currentStandard.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">
                {currentStandard.value}
              </span>
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

        {/* OEM-Specific Rules Display - Shows when OEM standard is selected */}
        {oemRules && (
          <div className="mt-4 space-y-3">
            {/* OEM Header */}
            <div className="flex items-center gap-2 px-1">
              <Factory className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-foreground">
                {oemRules.vendorName} Requirements
              </span>
              <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/30">
                {oemRules.specReference}
              </Badge>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Coverage */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 cursor-help">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="h-3 w-3 text-blue-500" />
                      <span className="text-[10px] text-blue-600 font-medium">Coverage</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {oemRules.coverageRequirements.minCoverage}%
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      Overlap: {oemRules.coverageRequirements.overlapRequirement}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Minimum coverage and overlap per {oemRules.vendorName}</p>
                </TooltipContent>
              </Tooltip>

              {/* Calibration Interval */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 cursor-help">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-medium">Calibration</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      Every {oemRules.calibrationRules.interval}h
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {oemRules.calibrationRules.dacCurveRequired ? 'DAC Required' : 'DAC Optional'}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Calibration interval and DAC requirements</p>
                </TooltipContent>
              </Tooltip>

              {/* Frequency */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 cursor-help">
                    <div className="flex items-center gap-1 mb-1">
                      <Gauge className="h-3 w-3 text-purple-500" />
                      <span className="text-[10px] text-purple-600 font-medium">Frequency</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {oemRules.frequencyConstraints.min}-{oemRules.frequencyConstraints.max} MHz
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      Preferred: {oemRules.frequencyConstraints.preferred.join(', ')} MHz
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Allowed frequency range per {oemRules.vendorName}</p>
                </TooltipContent>
              </Tooltip>

              {/* Transfer Correction */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 cursor-help">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] text-amber-600 font-medium">Transfer</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      Max {oemRules.calibrationRules.transferCorrectionMax} dB
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {oemRules.calibrationRules.tcgRequired ? 'TCG Required' : 'TCG Optional'}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Maximum transfer correction allowed</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Warnings */}
            {oemRules.warnings && oemRules.warnings.length > 0 && (
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-[10px] text-red-600 font-medium">Warnings</span>
                </div>
                <ul className="text-[10px] text-muted-foreground space-y-0.5">
                  {oemRules.warnings.slice(0, 3).map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-red-500">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {oemRules.notes && oemRules.notes.length > 0 && (
              <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/30">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] text-slate-600 font-medium">Notes</span>
                </div>
                <ul className="text-[10px] text-muted-foreground space-y-0.5">
                  {oemRules.notes.slice(0, 3).map((note, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-slate-500">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
