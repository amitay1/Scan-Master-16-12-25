import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScanParametersData, StandardType, CouplingMethod, PhasedArraySettings } from "@/types/techniqueSheet";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Radio } from "lucide-react";
import { useMemo, useEffect } from "react";
import {
  scanParametersByStandard,
  calibrationByStandard,
} from "@/data/standardsDifferences";

interface ScanParametersTabProps {
  data: ScanParametersData;
  onChange: (data: ScanParametersData) => void;
  standard: StandardType;
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

export const ScanParametersTab = ({ data, onChange, standard = "AMS-STD-2154E" }: ScanParametersTabProps) => {
  // Get scan parameters for current standard
  const scanParams = useMemo(() => {
    return scanParametersByStandard[standard];
  }, [standard]);

  // Get calibration requirements for current standard
  const calibParams = useMemo(() => {
    return calibrationByStandard[standard];
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

  const updateField = (field: keyof ScanParametersData, value: any) => {
    onChange({ ...data, [field]: value });
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
  }, [standard]);

  // Show coupling method options only for immersion or contact
  const showCouplingMethod = data.scanMethod === "immersion" || data.scanMethod === "contact";
  // Show phased array fields when PA is selected
  const showPhasedArray = data.couplingMethod === "phased_array";
  // Show bubbler fields
  const showBubblerFields = data.couplingMethod === "bubbler";
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
    <div className="space-y-6 p-6">
      {/* Standard-specific header */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Scan Parameters</h3>
            <p className="text-xs text-muted-foreground mt-1">Per {getStandardLabel(standard)}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {scanParams.minOverlap}% min overlap
            </Badge>
            <Badge variant="outline" className="text-xs">
              Max {maxSpeed} mm/s
            </Badge>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWithHelp
          label="Scan Method"
          fieldKey="scanMethod"
          required
        >
          <Select
            value={data.scanMethod}
            onValueChange={(value) => {
              updateField("scanMethod", value);
              // Reset coupling method when changing scan method
              if (value === "squirter") {
                updateField("couplingMethod", undefined);
              }
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select method..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="immersion">Immersion</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="squirter">Squirter</SelectItem>
            </SelectContent>
          </Select>
        </FieldWithHelp>

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
                Semi-Automated (max {scanParams.maxSpeedAutomated.value} {scanParams.maxSpeedAutomated.unit})
              </SelectItem>
              <SelectItem value="fully_automated">
                Fully Automated (max {scanParams.maxSpeedAutomated.value} {scanParams.maxSpeedAutomated.unit})
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldWithHelp>

        {/* Coupling Method Section - Only for Immersion/Contact */}
        {showCouplingMethod && (
          <div className="md:col-span-2">
            <Card className="p-4 bg-muted/30">
              <Label className="text-sm font-semibold mb-3 block">Coupling Method / Technique</Label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="couplingMethod"
                    value="regular"
                    checked={data.couplingMethod === "regular" || !data.couplingMethod}
                    onChange={() => updateField("couplingMethod", "regular")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Regular (Conventional UT)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="couplingMethod"
                    value="bubbler"
                    checked={data.couplingMethod === "bubbler"}
                    onChange={() => updateField("couplingMethod", "bubbler")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Bubbler (Water Column)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="couplingMethod"
                    value="phased_array"
                    checked={data.couplingMethod === "phased_array"}
                    onChange={() => updateField("couplingMethod", "phased_array")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Phased Array (PAUT)</span>
                </label>
              </div>
            </Card>
          </div>
        )}

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

        {/* Water Path for Immersion without Coupling Method - Legacy support */}
        {data.scanMethod === "immersion" && !showCouplingMethod && (
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

      {/* Scan Parameters Summary Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b border-border">
          <h4 className="text-sm font-semibold">Scan Parameters by Standard</h4>
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
                <td className="px-3 py-2 font-medium">Max Speed (Manual)</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>150 mm/s</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>152 mm/s</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>150 mm/s</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>100 mm/s</td>
              </tr>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Max Speed (Auto)</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>150 mm/s</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>305 mm/s</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>500 mm/s</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>250 mm/s</td>
              </tr>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Min Overlap</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>30%</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>10-15%</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>10%</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>20%</td>
              </tr>
              <tr className={standard === "AMS-STD-2154E" ? "bg-primary/10" : ""}>
                <td className="px-3 py-2 font-medium">Calibration Interval</td>
                <td className={`px-3 py-2 ${standard === "AMS-STD-2154E" ? "font-semibold" : ""}`}>Every 4 hrs</td>
                <td className={`px-3 py-2 ${standard === "ASTM-A388" ? "font-semibold" : ""}`}>Start/End</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-3" ? "font-semibold" : ""}`}>Start/End</td>
                <td className={`px-3 py-2 ${standard === "BS-EN-10228-4" ? "font-semibold" : ""}`}>Every 2 hrs</td>
              </tr>
            </tbody>
          </table>
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
