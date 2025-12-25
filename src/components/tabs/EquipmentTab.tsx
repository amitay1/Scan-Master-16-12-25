import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipmentData, StandardType } from "@/types/techniqueSheet";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useEffect, useState, useRef } from "react";
import {
  equipmentParametersByStandard,
  getRecommendedFrequencyForStandard,
} from "@/data/standardsDifferences";

interface EquipmentTabProps {
  data: EquipmentData;
  onChange: (data: EquipmentData) => void;
  partThickness: number;
  standard?: StandardType;
}

// Frequency options per standard
const frequenciesByStandard: Record<StandardType, string[]> = {
  "MIL-STD-2154": ["1.0", "2.25", "5.0", "10.0", "15.0"],
  "AMS-STD-2154E": ["1.0", "2.25", "5.0", "10.0", "15.0"],
  "ASTM-A388": ["1.0", "2.25", "5.0"],
  "BS-EN-10228-3": ["1.0", "2.0", "4.0", "5.0"],
  "BS-EN-10228-4": ["0.5", "1.0", "2.0"],
};

const transducerTypes = ["immersion", "contact", "dual_element"];

// Resolution values based on frequency (MIL-STD-2154 Table II)
const getResolutionValues = (frequency: string) => {
  const resolutions: Record<string, { entry: number; back: number }> = {
    "0.5": { entry: 1.000, back: 0.400 },   // 0.5 MHz (BS EN 10228-4)
    "1.0": { entry: 0.500, back: 0.200 },   // 1 MHz
    "2.0": { entry: 0.300, back: 0.120 },   // 2 MHz
    "2.25": { entry: 0.250, back: 0.100 },  // 2.25 MHz
    "4.0": { entry: 0.150, back: 0.060 },   // 4 MHz
    "5.0": { entry: 0.125, back: 0.050 },   // 5 MHz
    "10.0": { entry: 0.050, back: 0.025 },  // 10 MHz
    "15.0": { entry: 0.035, back: 0.020 },  // 15 MHz
  };
  return resolutions[frequency] || { entry: 0.125, back: 0.05 };
};

// Get standard label
const getStandardLabel = (standard: StandardType): string => {
  const labels: Record<StandardType, string> = {
    "MIL-STD-2154": "MIL-STD-2154 Table II",
    "AMS-STD-2154E": "AMS-STD-2154E Table II",
    "ASTM-A388": "ASTM A388/A388M",
    "BS-EN-10228-3": "BS EN 10228-3:2016",
    "BS-EN-10228-4": "BS EN 10228-4:2016",
  };
  return labels[standard] || standard;
};

export const EquipmentTab = ({ data, onChange, partThickness, standard = "AMS-STD-2154E" }: EquipmentTabProps) => {
  // State to control Phased Array section visibility
  const [showPASection, setShowPASection] = useState(false);

  // Refs to avoid stale closures in useEffect
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  dataRef.current = data;
  onChangeRef.current = onChange;

  // Get equipment parameters for current standard
  const equipmentParams = useMemo(() => {
    return equipmentParametersByStandard[standard];
  }, [standard]);

  // Get available frequencies for current standard
  const frequencies = useMemo(() => {
    return frequenciesByStandard[standard] || frequenciesByStandard["AMS-STD-2154E"];
  }, [standard]);

  // Get recommended frequency based on standard and thickness
  const recommendedFreq = useMemo(() => {
    return getRecommendedFrequencyForStandard(standard, partThickness);
  }, [standard, partThickness]);

  // Check if current frequency is valid for the standard
  const isFrequencyValid = useMemo(() => {
    if (!data.frequency) return true;
    return frequencies.includes(data.frequency);
  }, [data.frequency, frequencies]);

  // Check linearity compliance
  const linearityCompliance = useMemo(() => {
    const vMin = equipmentParams.verticalLinearity.min;
    const vMax = equipmentParams.verticalLinearity.max;
    const hMin = equipmentParams.horizontalLinearity?.min || 0;

    const verticalOk = data.verticalLinearity >= vMin && data.verticalLinearity <= vMax;
    const horizontalOk = !hMin || data.horizontalLinearity >= hMin;

    return { verticalOk, horizontalOk };
  }, [data.verticalLinearity, data.horizontalLinearity, equipmentParams]);

  const updateField = (field: keyof EquipmentData, value: any) => {
    let newData = { ...data, [field]: value };

    // Auto-fill resolution when frequency changes
    if (field === "frequency") {
      const resolutions = getResolutionValues(value);
      newData = {
        ...newData,
        entrySurfaceResolution: resolutions.entry,
        backSurfaceResolution: resolutions.back,
      };
    }

    onChange(newData);
  };

  // Update linearity defaults when standard changes
  useEffect(() => {
    const vMin = equipmentParams.verticalLinearity.min;
    const hMin = equipmentParams.horizontalLinearity?.min || 0;
    const currentData = dataRef.current;

    // Only update if current values don't meet minimum requirements
    if (currentData.verticalLinearity < vMin || currentData.horizontalLinearity < hMin) {
      onChangeRef.current({
        ...currentData,
        verticalLinearity: Math.max(currentData.verticalLinearity, vMin),
        horizontalLinearity: Math.max(currentData.horizontalLinearity, hMin),
      });
    }
  }, [standard, equipmentParams]);

  // Warn if frequency is invalid for standard
  const showFrequencyWarning = !isFrequencyValid && data.frequency;

  return (
    <div className="space-y-6 p-6">
      {/* Standard-specific header */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Equipment Requirements</h3>
            <p className="text-xs text-muted-foreground mt-1">Per {getStandardLabel(standard)}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {equipmentParams.frequencyRange.min}-{equipmentParams.frequencyRange.max} MHz
          </Badge>
        </div>
      </div>

      {/* Frequency warning */}
      {showFrequencyWarning && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Frequency Not Standard</h4>
              <p className="text-sm text-muted-foreground">
                The selected frequency ({data.frequency} MHz) is outside the typical range for {standard}.
                Recommended range: {equipmentParams.frequencyRange.min}-{equipmentParams.frequencyRange.max} MHz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BS EN 10228-4 specific note */}
      {standard === "BS-EN-10228-4" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Austenitic Material Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                <li>Use lower frequencies (0.5-2 MHz) due to coarse grain structure</li>
                <li>Larger probe diameter (20-30mm) preferred</li>
                <li>Consider dual-element probes for near-surface resolution</li>
                <li>{equipmentParams.notes}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWithHelp
          label="Equipment Manufacturer"
          fieldKey="manufacturer"
          required
        >
          <Input
            value={data.manufacturer}
            onChange={(e) => updateField("manufacturer", e.target.value)}
            placeholder="Olympus, GE Inspection Technologies, etc."
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Equipment Model"
          fieldKey="manufacturer"
          required
        >
          <Input
            value={data.model}
            onChange={(e) => updateField("model", e.target.value)}
            placeholder="OmniScan X3, USM Vision, etc."
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Serial Number"
          fieldKey="manufacturer"
        >
          <Input
            value={data.serialNumber}
            onChange={(e) => updateField("serialNumber", e.target.value)}
            placeholder="SN-12345"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Software Version"
          fieldKey="manufacturer"
        >
          <Input
            value={data.softwareVersion || ""}
            onChange={(e) => updateField("softwareVersion", e.target.value)}
            placeholder="e.g., 4.0R22"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Probe Model"
          fieldKey="manufacturer"
        >
          <Input
            value={data.probeModel || ""}
            onChange={(e) => updateField("probeModel", e.target.value)}
            placeholder="e.g., 5L64-A32"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Frequency (MHz)"
          help={`Per ${standard}: ${equipmentParams.frequencyRange.min}-${equipmentParams.frequencyRange.max} MHz. Recommended for ${partThickness}mm: ${recommendedFreq}`}
          required
          fieldKey="frequency"
        >
          <Select
            value={data.frequency}
            onValueChange={(value) => updateField("frequency", value)}
          >
            <SelectTrigger className={`bg-background ${showFrequencyWarning ? "border-warning" : ""}`}>
              <SelectValue placeholder="Select frequency..." />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq} MHz {recommendedFreq.includes(freq) && "⭐"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>

        <FieldWithHelp
          label="Transducer Type"
          fieldKey="transducerType"
          required
        >
          <Select
            value={data.transducerType}
            onValueChange={(value) => updateField("transducerType", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {transducerTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  {type === "dual_element" && standard === "BS-EN-10228-4" && " ⭐"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>

        <FieldWithHelp
          label={`Active Element Diameter (${standard.startsWith("BS-EN") ? "mm" : "inches"})`}
          fieldKey="transducerDiameter"
          help={`Per ${standard}: ${equipmentParams.transducerDiameter.min}-${equipmentParams.transducerDiameter.max} ${equipmentParams.transducerDiameter.unit}`}
          required
        >
          <Input
            type="number"
            value={data.transducerDiameter}
            onChange={(e) => updateField("transducerDiameter", parseFloat(e.target.value) || 0)}
            min={standard.startsWith("BS-EN") ? 10 : 0.25}
            max={standard.startsWith("BS-EN") ? 30 : 1.0}
            step={standard.startsWith("BS-EN") ? 1 : 0.125}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Couplant Type"
          fieldKey="couplant"
          required
        >
          <Input
            value={data.couplant}
            onChange={(e) => updateField("couplant", e.target.value)}
            placeholder="Water, Glycerin, Commercial gel"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Vertical Linearity (%)"
          fieldKey="verticalLinearity"
          help={`Per ${standard}: ${equipmentParams.verticalLinearity.min}-${equipmentParams.verticalLinearity.max}% FSH range required`}
          required
        >
          <Input
            type="number"
            value={data.verticalLinearity}
            onChange={(e) => updateField("verticalLinearity", parseFloat(e.target.value) || 0)}
            min={equipmentParams.verticalLinearity.min}
            max={100}
            className={`bg-background ${!linearityCompliance.verticalOk ? "border-destructive" : ""}`}
          />
          {!linearityCompliance.verticalOk && (
            <p className="text-xs text-destructive mt-1">
              Below minimum requirement ({equipmentParams.verticalLinearity.min}%)
            </p>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Horizontal Linearity (%)"
          fieldKey="horizontalLinearity"
          help={equipmentParams.horizontalLinearity
            ? `Per ${standard}: Minimum ${equipmentParams.horizontalLinearity.min}% required`
            : `Not specified in ${standard}`}
          required={!!equipmentParams.horizontalLinearity}
        >
          <Input
            type="number"
            value={data.horizontalLinearity}
            onChange={(e) => updateField("horizontalLinearity", parseFloat(e.target.value) || 0)}
            min={equipmentParams.horizontalLinearity?.min || 0}
            max={100}
            className={`bg-background ${!linearityCompliance.horizontalOk ? "border-destructive" : ""}`}
            disabled={!equipmentParams.horizontalLinearity}
          />
          {equipmentParams.horizontalLinearity && !linearityCompliance.horizontalOk && (
            <p className="text-xs text-destructive mt-1">
              Below minimum requirement ({equipmentParams.horizontalLinearity.min}%)
            </p>
          )}
          {!equipmentParams.horizontalLinearity && (
            <p className="text-xs text-muted-foreground mt-1">
              Not required by {standard}
            </p>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Entry Surface Resolution (inches)"
          fieldKey="entrySurfaceResolution"
          required
          autoFilled
        >
          <Input
            type="number"
            value={data.entrySurfaceResolution}
            onChange={(e) => updateField("entrySurfaceResolution", parseFloat(e.target.value) || 0)}
            className="bg-background"
            disabled
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Back Surface Resolution (inches)"
          fieldKey="backSurfaceResolution"
          required
          autoFilled
        >
          <Input
            type="number"
            value={data.backSurfaceResolution}
            onChange={(e) => updateField("backSurfaceResolution", parseFloat(e.target.value) || 0)}
            className="bg-background"
            disabled
          />
        </FieldWithHelp>
      </div>

      {/* Phased Array Settings Section (Collapsible) */}
      <div className="border border-purple-500/30 rounded-lg overflow-hidden bg-purple-500/5">
        <button
          type="button"
          onClick={() => setShowPASection(!showPASection)}
          className="w-full bg-purple-500/10 px-4 py-2 border-b border-purple-500/30 flex items-center justify-between hover:bg-purple-500/20 transition-colors cursor-pointer"
        >
          <div className="text-left">
            <h4 className="text-sm font-semibold">Phased Array Settings</h4>
            <p className="text-xs text-muted-foreground mt-1">Fill in if using Phased Array equipment</p>
          </div>
          {showPASection ? (
            <ChevronDown className="h-5 w-5 text-purple-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-purple-400" />
          )}
        </button>
        {showPASection && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWithHelp
                label="Number of Elements"
                fieldKey="manufacturer"
                help="Total number of elements in the PA probe (e.g., 32, 64, 128)"
              >
                <Input
                  type="number"
                  value={data.numberOfElements ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === null) {
                      updateField("numberOfElements", undefined);
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                      updateField("numberOfElements", numValue);
                    }
                  }}
                  min={1}
                  max={256}
                  step={1}
                  placeholder="e.g., 64"
                  className="bg-background"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Element Pitch (mm)"
                fieldKey="manufacturer"
                help="Distance between adjacent elements in mm"
              >
                <Input
                  type="number"
                  value={data.elementPitch ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === null) {
                      updateField("elementPitch", undefined);
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      updateField("elementPitch", numValue);
                    }
                  }}
                  min={0.1}
                  max={5}
                  step={0.01}
                  placeholder="e.g., 0.6"
                  className="bg-background"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Wedge Model"
                fieldKey="manufacturer"
                help="Wedge/shoe model identifier"
              >
                <Input
                  value={data.wedgeModel || ""}
                  onChange={(e) => updateField("wedgeModel", e.target.value)}
                  placeholder="e.g., SA32-N55S"
                  className="bg-background"
                />
              </FieldWithHelp>

              <FieldWithHelp
                label="Wedge Type"
                fieldKey="manufacturer"
                help="Type of wedge (Normal, Angled, Immersion)"
              >
                <Select
                  value={data.wedgeType || ""}
                  onValueChange={(value) => updateField("wedgeType", value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select wedge type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal (0°)</SelectItem>
                    <SelectItem value="Angled">Angled (Shear Wave)</SelectItem>
                    <SelectItem value="Immersion">Immersion</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <FieldWithHelp
                label="Delay Line"
                fieldKey="manufacturer"
                help="Delay line specification if applicable"
              >
                <Input
                  value={data.delayLine || ""}
                  onChange={(e) => updateField("delayLine", e.target.value)}
                  placeholder="e.g., DL-25, Water column"
                  className="bg-background"
                />
              </FieldWithHelp>
            </div>
          </div>
        )}
      </div>

      {/* Equipment Requirements Summary */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b border-border">
          <h4 className="text-sm font-semibold">Equipment Requirements by Standard</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-3 py-2 text-left">Parameter</th>
                <th className="px-3 py-2 text-left">AMS-STD-2154E</th>
                <th className="px-3 py-2 text-left">ASTM A388</th>
                <th className="px-3 py-2 text-left">BS EN 10228-3</th>
                <th className="px-3 py-2 text-left">BS EN 10228-4</th>
              </tr>
            </thead>
            <tbody>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Frequency Range</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>2.25-15 MHz</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>1-5 MHz</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>1-5 MHz</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>0.5-2 MHz</td>
              </tr>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Vertical Linearity</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>5-98% FSH</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>10-95% FSH</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>≥80% range</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>≥80% range</td>
              </tr>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Horizontal Linearity</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>≥90%</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>≥85%</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>N/A</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>N/A</td>
              </tr>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Probe Diameter</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>0.25-1" (6-25mm)</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>0.375-1.125"</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>10-25mm</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>20-30mm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Reference note */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> {equipmentParams.notes}
          {equipmentParams.frequencyTolerance && ` Frequency tolerance: ${equipmentParams.frequencyTolerance}.`}
          {equipmentParams.prfRange && ` PRF range: ${equipmentParams.prfRange}.`}
        </p>
      </div>
    </div>
  );
};
