// @ts-nocheck
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScanParametersData, StandardType, CouplingMethod, PhasedArraySettings, EquipmentData } from "@/types/techniqueSheet";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Radio } from "lucide-react";
import { useMemo, useEffect } from "react";
import {
  scanParametersByStandard,
  calibrationByStandard,
  equipmentParametersByStandard,
} from "@/data/standardsDifferences";
import { getFrequencyOptionsForStandard } from "@/utils/frequencyUtils";

interface ScanParametersTabProps {
  data: ScanParametersData;
  onChange: (data: ScanParametersData) => void;
  standard: StandardType;
  equipmentFrequency?: string;
  onEquipmentFrequencyChange?: (frequency: string) => void;
  equipmentData?: EquipmentData;
  onEquipmentDataChange?: (data: EquipmentData) => void;
}

// Get standard label
const getStandardLabel = (standard: StandardType): string => {
  const labels: Record<StandardType, string> = {
    "MIL-STD-2154": "MIL-STD-2154",
    "AMS-STD-2154E": "AMS-STD-2154E",
    "ASTM-A388": "ASTM A388/A388M",
    "BS-EN-10228-3": "BS EN 10228-3:2016",
    "BS-EN-10228-4": "BS EN 10228-4:2016",
  };
  return labels[standard] || standard;
};

export const ScanParametersTab = ({ data, onChange, standard = "AMS-STD-2154E", equipmentFrequency, onEquipmentFrequencyChange, equipmentData, onEquipmentDataChange }: ScanParametersTabProps) => {
  // Ensure we have valid data object with defaults
  const safeData = data || {
    scanMethod: "",
    scanMethods: [],
    technique: "conventional" as const,
    scanType: "",
    scanSpeed: 100,
    scanIndex: 70,
    coverage: 100,
    scanPattern: "",
    waterPath: 0,
    pulseRepetitionRate: 1000,
    gainSettings: "",
    alarmGateSettings: "",
  };

  // Get scan parameters for current standard with fallback
  const scanParams = useMemo(() => {
    return scanParametersByStandard[standard] || scanParametersByStandard["AMS-STD-2154E"];
  }, [standard]);

  // Get calibration requirements for current standard with fallback
  const calibParams = useMemo(() => {
    return calibrationByStandard[standard] || calibrationByStandard["AMS-STD-2154E"];
  }, [standard]);

  // Get max speed based on scan type and standard
  const maxSpeed = useMemo(() => {
    if (data.scanType === "manual" || data.scanType === "semi_automated") {
      return scanParams.maxSpeedManual.value;
    }
    return scanParams.maxSpeedAutomated.value;
  }, [data.scanType, scanParams]);

  // Check compliance
  const compliance = useMemo(() => {
    const speedOk = data.scanSpeed <= maxSpeed;
    const overlapOk = (100 - data.scanIndex) >= scanParams.minOverlap;
    const coverageOk = data.coverage >= scanParams.coverageRequired;

    return { speedOk, overlapOk, coverageOk };
  }, [data.scanSpeed, data.scanIndex, data.coverage, maxSpeed, scanParams]);

  // Get equipment parameters for current standard
  const equipmentParams = useMemo(() => {
    return equipmentParametersByStandard[standard];
  }, [standard]);

  // Check linearity compliance
  const linearityCompliance = useMemo(() => {
    if (!equipmentData) return { verticalOk: true, horizontalOk: true };
    const vMin = equipmentParams.verticalLinearity.min;
    const vMax = equipmentParams.verticalLinearity.max;
    const hMin = equipmentParams.horizontalLinearity?.min || 0;
    const verticalOk = equipmentData.verticalLinearity >= vMin && equipmentData.verticalLinearity <= vMax;
    const horizontalOk = !hMin || equipmentData.horizontalLinearity >= hMin;
    return { verticalOk, horizontalOk };
  }, [equipmentData?.verticalLinearity, equipmentData?.horizontalLinearity, equipmentParams]);

  const updateField = (field: keyof ScanParametersData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateEquipmentField = (field: keyof EquipmentData, value: any) => {
    if (equipmentData && onEquipmentDataChange) {
      onEquipmentDataChange({ ...equipmentData, [field]: value });
    }
  };

  // Update defaults when standard changes
  useEffect(() => {
    // Set default overlap based on standard if current value is too low
    const requiredOverlap = scanParams.minOverlap;
    const currentOverlap = 100 - data.scanIndex;

    if (currentOverlap < requiredOverlap) {
      const newIndex = 100 - requiredOverlap;
      updateField("scanIndex", newIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standard]);

  // Show phased array fields when PA technique is selected
  const showPhasedArray = data.technique === "phased_array";
  // Show bubbler fields when bubbler technique is selected
  const showBubblerFields = data.technique === "bubbler";
  const isAustenitic = standard === "BS-EN-10228-4";

  // Update phased array settings
  const updatePhasedArrayField = (field: keyof PhasedArraySettings, value: unknown) => {
    onChange({
      ...data,
      phasedArray: {
        ...data.phasedArray,
        [field]: value,
      },
    });
  };

  // Update phased array scan types
  const updatePhasedArrayScanType = (scanType: 'sScan' | 'linearScan' | 'compoundScan', checked: boolean) => {
    onChange({
      ...data,
      phasedArray: {
        ...data.phasedArray,
        scanTypes: {
          ...data.phasedArray?.scanTypes,
          [scanType]: checked,
        },
      },
    });
  };

  return (
    <div className="space-y-2 p-2">
      {/* Austenitic specific note */}
      {isAustenitic && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Austenitic Material Scan Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                <li>Lower scan speeds required due to beam distortion</li>
                <li>Higher overlap (20% minimum) to compensate for beam spread</li>
                <li>Record actual scan paths in documentation</li>
                <li>Orthogonal grid pattern recommended</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Scan Method - Multi-select buttons */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2 mb-2">
        <Label className="text-sm font-semibold mb-1.5 block">Scan Method</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const current = data.scanMethods || [];
              const newMethods = current.includes('immersion')
                ? current.filter(m => m !== 'immersion')
                : [...current, 'immersion'];
              onChange({
                ...data,
                scanMethods: newMethods,
                scanMethod: newMethods.length > 0 ? newMethods[0] : data.scanMethod
              });
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all border ${
              (data.scanMethods || []).includes('immersion')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            IMMERSION
          </button>
          <button
            type="button"
            onClick={() => {
              const current = data.scanMethods || [];
              const newMethods = current.includes('contact')
                ? current.filter(m => m !== 'contact')
                : [...current, 'contact'];
              onChange({
                ...data,
                scanMethods: newMethods,
                scanMethod: newMethods.length > 0 ? newMethods[0] : data.scanMethod
              });
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all border ${
              (data.scanMethods || []).includes('contact')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            CONTACT
          </button>
        </div>
        {(data.scanMethods || []).length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">Select one or more scan methods</p>
        )}
      </div>

      {/* Technique Selection */}
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2 mb-2">
        <Label className="text-sm font-semibold mb-1.5 block">Technique</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateField("technique", "conventional")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              data.technique === 'conventional'
                ? 'bg-purple-600 text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Conventional
          </button>
          <button
            type="button"
            onClick={() => updateField("technique", "bubbler")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              data.technique === 'bubbler'
                ? 'bg-purple-600 text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Bubbler
          </button>
          <button
            type="button"
            onClick={() => updateField("technique", "squirter")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              data.technique === 'squirter'
                ? 'bg-purple-600 text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Squirter
          </button>
          <button
            type="button"
            onClick={() => updateField("technique", "phased_array")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              data.technique === 'phased_array'
                ? 'bg-purple-600 text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            Phased array
          </button>
        </div>
      </div>

      {/* Frequency Selection - Standard-aware */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2 mb-2">
        <FieldWithHelp
          label="Frequency (MHz)"
          fieldKey="frequency"
          help={`Standard ${standard} supports frequencies: ${getFrequencyOptionsForStandard(standard).join(", ")} MHz`}
          required
        >
          <Select
            value={equipmentFrequency || ""}
            onValueChange={(value) => onEquipmentFrequencyChange?.(value)}
          >
            <SelectTrigger className="bg-background max-w-xs h-8">
              <SelectValue placeholder="Select frequency..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {getFrequencyOptionsForStandard(standard).map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq} MHz
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>
      </div>

      {/* Equipment Compliance - Linearity & Resolution */}
      {equipmentData && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2 mb-2">
          <Label className="text-sm font-semibold mb-1.5 block">Linearity & Resolution</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <FieldWithHelp
              label="Vertical Linearity (%)"
              fieldKey="verticalLinearity"
              help={`Per ${standard}: ${equipmentParams.verticalLinearity.min}-${equipmentParams.verticalLinearity.max}% FSH range required`}
              required
            >
              <Input
                type="number"
                value={equipmentData.verticalLinearity}
                onChange={(e) => updateEquipmentField("verticalLinearity", parseFloat(e.target.value) || 0)}
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
                value={equipmentData.horizontalLinearity}
                onChange={(e) => updateEquipmentField("horizontalLinearity", parseFloat(e.target.value) || 0)}
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
                value={equipmentData.entrySurfaceResolution}
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
                value={equipmentData.backSurfaceResolution}
                className="bg-background"
                disabled
              />
            </FieldWithHelp>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">

        <FieldWithHelp
          label="Scan Type"
          fieldKey="scanMethod"
          required
        >
          <Select
            value={data.scanType}
            onValueChange={(value) => updateField("scanType", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="manual">
                Manual (max {scanParams.maxSpeedManual.value} {scanParams.maxSpeedManual.unit})
              </SelectItem>
              <SelectItem value="semi_automated">
                Semi-Automated (max {scanParams.maxSpeedManual.value} {scanParams.maxSpeedManual.unit})
              </SelectItem>
              <SelectItem value="fully_automated">
                Fully Automated (max {scanParams.maxSpeedAutomated.value} {scanParams.maxSpeedAutomated.unit})
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldWithHelp>


        {/* Bubbler Settings - Only when Bubbler is selected */}
        {showBubblerFields && (
          <div className="md:col-span-2">
            <Card className="p-4 border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-400" />
                <Label className="text-sm font-semibold">Bubbler Settings</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldWithHelp
                  label="Water Path (mm)"
                  fieldKey="waterPath"
                  help="Distance from transducer face to part surface through water column"
                >
                  <Input
                    type="number"
                    value={data.waterPath ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateField("waterPath", undefined);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        updateField("waterPath", numValue);
                      }
                    }}
                    min={0}
                    step={0.1}
                    placeholder="e.g., 25"
                    className="bg-background"
                  />
                </FieldWithHelp>
              </div>
            </Card>
          </div>
        )}

        {/* Phased Array Settings - Only when PA is selected */}
        {showPhasedArray && (
          <div className="md:col-span-2">
            <Card className="p-4 border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-4 w-4 text-purple-400" />
                <Label className="text-sm font-semibold">Phased Array Settings</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Refracted Angle Range */}
                <FieldWithHelp
                  label="Refracted Angle Start (°)"
                  fieldKey="scanMethod"
                  help="Starting angle for sector scan"
                >
                  <Input
                    type="number"
                    value={data.phasedArray?.refractedAngleStart ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updatePhasedArrayField("refractedAngleStart", undefined);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        updatePhasedArrayField("refractedAngleStart", numValue);
                      }
                    }}
                    min={0}
                    max={90}
                    step={1}
                    placeholder="e.g., 40"
                    className="bg-background"
                  />
                </FieldWithHelp>

                <FieldWithHelp
                  label="Refracted Angle End (°)"
                  fieldKey="scanMethod"
                  help="Ending angle for sector scan"
                >
                  <Input
                    type="number"
                    value={data.phasedArray?.refractedAngleEnd ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updatePhasedArrayField("refractedAngleEnd", undefined);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        updatePhasedArrayField("refractedAngleEnd", numValue);
                      }
                    }}
                    min={0}
                    max={90}
                    step={1}
                    placeholder="e.g., 70"
                    className="bg-background"
                  />
                </FieldWithHelp>

                <FieldWithHelp
                  label="Aperture (Active Elements)"
                  fieldKey="scanMethod"
                  help="Number of active elements used in the focal law"
                >
                  <Input
                    type="number"
                    value={data.phasedArray?.aperture ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updatePhasedArrayField("aperture", undefined);
                        return;
                      }
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue)) {
                        updatePhasedArrayField("aperture", numValue);
                      }
                    }}
                    min={1}
                    max={128}
                    step={1}
                    placeholder="e.g., 16"
                    className="bg-background"
                  />
                </FieldWithHelp>

                <FieldWithHelp
                  label="Focus Laws"
                  fieldKey="scanMethod"
                  help="Focal law configuration description"
                >
                  <Input
                    value={data.phasedArray?.focusLaws ?? ''}
                    onChange={(e) => updatePhasedArrayField("focusLaws", e.target.value)}
                    placeholder="e.g., Linear 0°, Sectorial 40-70°"
                    className="bg-background"
                  />
                </FieldWithHelp>
              </div>

              {/* Scan Types */}
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Scan Types Used</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={data.phasedArray?.scanTypes?.sScan ?? false}
                      onCheckedChange={(checked) => updatePhasedArrayScanType("sScan", checked as boolean)}
                    />
                    <span className="text-sm">S-Scan (Sectorial)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={data.phasedArray?.scanTypes?.linearScan ?? false}
                      onCheckedChange={(checked) => updatePhasedArrayScanType("linearScan", checked as boolean)}
                    />
                    <span className="text-sm">Linear Scan (E-Scan)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={data.phasedArray?.scanTypes?.compoundScan ?? false}
                      onCheckedChange={(checked) => updatePhasedArrayScanType("compoundScan", checked as boolean)}
                    />
                    <span className="text-sm">Compound Scan</span>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        )}

        <FieldWithHelp
          label={`Scan Speed (${scanParams.maxSpeedManual.unit})`}
          fieldKey="scanSpeed"
          help={`Per ${standard}: Max ${maxSpeed} ${scanParams.maxSpeedManual.unit} for ${data.scanType || "manual"}`}
          required
        >
          <Input
            type="number"
            value={data.scanSpeed}
            onChange={(e) => updateField("scanSpeed", parseFloat(e.target.value) || 0)}
            min={1}
            max={maxSpeed}
            className={`bg-background ${!compliance.speedOk ? "border-destructive" : ""}`}
          />
          {!compliance.speedOk && (
            <p className="text-xs text-destructive mt-1">
              Exceeds maximum of {maxSpeed} {scanParams.maxSpeedManual.unit} per {standard}
            </p>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Scan Index (% of beam width)"
          fieldKey="scanIndex"
          help={`Per ${standard}: Minimum ${scanParams.minOverlap}% overlap required (max index ${100 - scanParams.minOverlap}%)`}
          required
        >
          <Input
            type="number"
            value={data.scanIndex}
            onChange={(e) => updateField("scanIndex", parseFloat(e.target.value) || 0)}
            min={1}
            max={100 - scanParams.minOverlap}
            className={`bg-background ${!compliance.overlapOk ? "border-destructive" : ""}`}
          />
          {!compliance.overlapOk && (
            <p className="text-xs text-destructive mt-1">
              Results in {100 - data.scanIndex}% overlap. Minimum {scanParams.minOverlap}% required per {standard}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Current overlap: {100 - data.scanIndex}%
          </p>
        </FieldWithHelp>

        <FieldWithHelp
          label="Coverage (%)"
          fieldKey="coverage"
          help={`Per ${standard}: ${scanParams.coverageRequired}% volumetric coverage required`}
          required
        >
          <Input
            type="number"
            value={data.coverage}
            onChange={(e) => updateField("coverage", parseFloat(e.target.value) || 0)}
            min={scanParams.coverageRequired}
            max={100}
            disabled
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Scan Pattern"
          fieldKey="scanPattern"
          required
        >
          <Select
            value={data.scanPattern}
            onValueChange={(value) => updateField("scanPattern", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select pattern..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="raster">
                Raster {isAustenitic && "⭐"}
              </SelectItem>
              <SelectItem value="bidirectional">
                Bidirectional Raster
              </SelectItem>
              <SelectItem value="spiral">Spiral</SelectItem>
              <SelectItem value="helical">Helical (for cylindrical parts)</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </FieldWithHelp>

        {/* Water Path for Immersion - shown when technique is conventional or not using bubbler */}
        {(data.scanMethods || []).includes("immersion") && data.technique !== "bubbler" && (
          <FieldWithHelp
            label="Water Path (mm)"
            fieldKey="waterPath"
            help={isAustenitic ? "25-75mm typical for focused probes in austenitic materials" : undefined}
          >
            <Input
              type="number"
              value={data.waterPath ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || value === null) {
                  updateField("waterPath", undefined);
                  return;
                }
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  updateField("waterPath", numValue);
                }
              }}
              min={0}
              placeholder="e.g., 25"
              className="bg-background"
            />
          </FieldWithHelp>
        )}

        <FieldWithHelp
          label="Pulse Repetition Rate (Hz)"
          fieldKey="pulseRepetitionRate"
          help={standard === "AMS-STD-2154E" ? "Per AMS-STD-2154E: 100-10000 Hz" : undefined}
        >
          <Input
            type="number"
            value={data.pulseRepetitionRate}
            onChange={(e) => updateField("pulseRepetitionRate", parseFloat(e.target.value) || 0)}
            min={100}
            max={10000}
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Gain Settings (dB)"
          fieldKey="gainSettings"
          help={scanParams.sensitivityGain}
        >
          <Input
            value={data.gainSettings}
            onChange={(e) => updateField("gainSettings", e.target.value)}
            placeholder="45 dB"
            className="bg-background"
          />
        </FieldWithHelp>
      </div>

      <FieldWithHelp
        label="Alarm/Gate Settings"
        fieldKey="alarmGateSettings"
      >
        <Textarea
          value={data.alarmGateSettings}
          onChange={(e) => updateField("alarmGateSettings", e.target.value)}
          placeholder="Describe gate positions, alarm levels, and trigger settings..."
          rows={4}
          className="bg-background"
        />
      </FieldWithHelp>

      {/* Scan Parameters Summary - Current Standard Only */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-4 py-2 border-b border-border">
          <h4 className="text-sm font-semibold">Scan Parameters - {getStandardLabel(standard)}</h4>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Max Speed (Manual)</p>
              <p className="text-sm font-semibold">{scanParams.maxSpeedManual.value} {scanParams.maxSpeedManual.unit}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Max Speed (Automated)</p>
              <p className="text-sm font-semibold">{scanParams.maxSpeedAutomated.value} {scanParams.maxSpeedAutomated.unit}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Min Overlap</p>
              <p className="text-sm font-semibold">{scanParams.minOverlap}%</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Coverage Required</p>
              <p className="text-sm font-semibold">{scanParams.coverageRequired}%</p>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Calibration Interval</p>
            <p className="text-sm font-semibold">{calibParams.calibrationInterval}</p>
          </div>
        </div>
      </div>

      {/* Calibration requirements note */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Calibration:</strong> {calibParams.calibrationInterval}.{" "}
          <strong>Sensitivity:</strong> {calibParams.primarySensitivity}.{" "}
          {scanParams.notes}
        </p>
      </div>
    </div>
  );
};
