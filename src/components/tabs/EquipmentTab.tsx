import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipmentData, StandardType } from "@/types/techniqueSheet";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
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

  const updateField = (field: keyof EquipmentData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Warn if frequency is invalid for standard
  const showFrequencyWarning = !isFrequencyValid && data.frequency;

  return (
    <div className="space-y-2 p-2">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
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
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 border rounded px-2 bg-muted/50">
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="numberOfElements_an"
                        checked={data.numberOfElementsApplicable !== false}
                        onChange={() => updateField("numberOfElementsApplicable", true)}
                        className="w-3 h-3"
                      />
                      A
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="numberOfElements_an"
                        checked={data.numberOfElementsApplicable === false}
                        onChange={() => updateField("numberOfElementsApplicable", false)}
                        className="w-3 h-3"
                      />
                      N
                    </label>
                  </div>
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
                    className="bg-background flex-1"
                    disabled={data.numberOfElementsApplicable === false}
                  />
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Element Pitch (mm)"
                fieldKey="manufacturer"
                help="Distance between adjacent elements in mm"
              >
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 border rounded px-2 bg-muted/50">
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="elementPitch_an"
                        checked={data.elementPitchApplicable !== false}
                        onChange={() => updateField("elementPitchApplicable", true)}
                        className="w-3 h-3"
                      />
                      A
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="elementPitch_an"
                        checked={data.elementPitchApplicable === false}
                        onChange={() => updateField("elementPitchApplicable", false)}
                        className="w-3 h-3"
                      />
                      N
                    </label>
                  </div>
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
                    className="bg-background flex-1"
                    disabled={data.elementPitchApplicable === false}
                  />
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Wedge Model"
                fieldKey="manufacturer"
                help="Wedge/shoe model identifier"
              >
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 border rounded px-2 bg-muted/50">
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="wedgeModel_an"
                        checked={data.wedgeModelApplicable !== false}
                        onChange={() => updateField("wedgeModelApplicable", true)}
                        className="w-3 h-3"
                      />
                      A
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="wedgeModel_an"
                        checked={data.wedgeModelApplicable === false}
                        onChange={() => updateField("wedgeModelApplicable", false)}
                        className="w-3 h-3"
                      />
                      N
                    </label>
                  </div>
                  <Input
                    value={data.wedgeModel || ""}
                    onChange={(e) => updateField("wedgeModel", e.target.value)}
                    placeholder="e.g., SA32-N55S"
                    className="bg-background flex-1"
                    disabled={data.wedgeModelApplicable === false}
                  />
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Wedge Type"
                fieldKey="manufacturer"
                help="Type of wedge (Normal, Angled, Immersion)"
              >
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 border rounded px-2 bg-muted/50">
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="wedgeType_an"
                        checked={data.wedgeTypeApplicable !== false}
                        onChange={() => updateField("wedgeTypeApplicable", true)}
                        className="w-3 h-3"
                      />
                      A
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="wedgeType_an"
                        checked={data.wedgeTypeApplicable === false}
                        onChange={() => updateField("wedgeTypeApplicable", false)}
                        className="w-3 h-3"
                      />
                      N
                    </label>
                  </div>
                  <Select
                    value={data.wedgeType || ""}
                    onValueChange={(value) => updateField("wedgeType", value)}
                    disabled={data.wedgeTypeApplicable === false}
                  >
                    <SelectTrigger className="bg-background flex-1">
                      <SelectValue placeholder="Select wedge type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal (0°)</SelectItem>
                      <SelectItem value="Angled">Angled (Shear Wave)</SelectItem>
                      <SelectItem value="Immersion">Immersion</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Delay Line"
                fieldKey="manufacturer"
                help="Delay line specification if applicable"
              >
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 border rounded px-2 bg-muted/50">
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="delayLine_an"
                        checked={data.delayLineApplicable !== false}
                        onChange={() => updateField("delayLineApplicable", true)}
                        className="w-3 h-3"
                      />
                      A
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="delayLine_an"
                        checked={data.delayLineApplicable === false}
                        onChange={() => updateField("delayLineApplicable", false)}
                        className="w-3 h-3"
                      />
                      N
                    </label>
                  </div>
                  <Input
                    value={data.delayLine || ""}
                    onChange={(e) => updateField("delayLine", e.target.value)}
                    placeholder="e.g., DL-25, Water column"
                    className="bg-background flex-1"
                    disabled={data.delayLineApplicable === false}
                  />
                </div>
              </FieldWithHelp>
            </div>
          </div>
        )}
      </div>

      {/* Equipment Requirements Summary - Shows only current standard */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b border-border">
          <h4 className="text-sm font-semibold">Equipment Requirements for {standard}</h4>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Frequency Range</div>
              <div className="font-semibold text-sm">
                {equipmentParams.frequencyRange.min}-{equipmentParams.frequencyRange.max} MHz
              </div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Vertical Linearity</div>
              <div className="font-semibold text-sm">
                {equipmentParams.verticalLinearity.min}-{equipmentParams.verticalLinearity.max}% FSH
              </div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Horizontal Linearity</div>
              <div className="font-semibold text-sm">
                {equipmentParams.horizontalLinearity ? `≥${equipmentParams.horizontalLinearity.min}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Probe Diameter</div>
              <div className="font-semibold text-sm">
                {equipmentParams.transducerDiameter.min}-{equipmentParams.transducerDiameter.max} {equipmentParams.transducerDiameter.unit}
              </div>
            </div>
          </div>
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
