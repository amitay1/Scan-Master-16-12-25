import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AcceptanceCriteriaData, StandardType } from "@/types/techniqueSheet";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useRef } from "react";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import {
  acceptanceClassesByStandard,
  acceptanceCriteriaByStandard,
  getDefaultAcceptanceClass,
  materialWarnings,
} from "@/data/standardsDifferences";

interface AcceptanceCriteriaTabProps {
  data: AcceptanceCriteriaData;
  onChange: (data: AcceptanceCriteriaData) => void;
  material: string;
  standard?: StandardType;
}

// Get the standard label for reference notes
const getStandardLabel = (standard: StandardType): string => {
  const labels: Record<StandardType, string> = {
    "MIL-STD-2154": "MIL-STD-2154 Table VI",
    "AMS-STD-2154E": "MIL-STD-2154 / AMS-STD-2154E Table VI",
    "ASTM-A388": "ASTM A388/A388M Quality Levels",
    "BS-EN-10228-3": "BS EN 10228-3:2016 Quality Classes",
    "BS-EN-10228-4": "BS EN 10228-4:2016 Quality Classes (Austenitic)",
  };
  return labels[standard] || standard;
};

// Get stringency badge color
const getStringencyColor = (stringency: string): string => {
  switch (stringency) {
    case "highest": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "basic": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export const AcceptanceCriteriaTab = ({ data, onChange, material, standard = "AMS-STD-2154E" }: AcceptanceCriteriaTabProps) => {
  // Refs to avoid stale closures in useEffect
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  dataRef.current = data;
  onChangeRef.current = onChange;

  const updateField = (field: keyof AcceptanceCriteriaData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Get acceptance classes for the current standard
  const acceptanceClasses = useMemo(() => {
    return acceptanceClassesByStandard[standard] || acceptanceClassesByStandard["AMS-STD-2154E"];
  }, [standard]);

  // Get acceptance criteria for the current standard and class
  const currentCriteria = useMemo(() => {
    const standardCriteria = acceptanceCriteriaByStandard[standard];
    if (standardCriteria && data.acceptanceClass) {
      return standardCriteria[data.acceptanceClass];
    }
    return null;
  }, [standard, data.acceptanceClass]);

  // Check if the selected class is valid for the current standard
  const isClassValidForStandard = useMemo(() => {
    return acceptanceClasses.some(cls => cls.id === data.acceptanceClass);
  }, [acceptanceClasses, data.acceptanceClass]);

  // Auto-fill criteria when class changes or standard changes
  useEffect(() => {
    const currentData = dataRef.current;
    if (currentData.acceptanceClass && currentCriteria) {
      onChangeRef.current({
        ...currentData,
        singleDiscontinuity: currentCriteria.singleDiscontinuity,
        multipleDiscontinuities: currentCriteria.multipleDiscontinuities,
        linearDiscontinuity: currentCriteria.linearDiscontinuity,
        backReflectionLoss: parseFloat(currentCriteria.backReflectionLoss) || 0,
        noiseLevel: currentCriteria.noiseLevel,
        specialRequirements: currentData.specialRequirements || currentCriteria.specialNotes || ""
      });
    }
  }, [data.acceptanceClass, standard, currentCriteria]);

  // Reset acceptance class when standard changes if current class is invalid
  useEffect(() => {
    if (!isClassValidForStandard) {
      const defaultClass = getDefaultAcceptanceClass(standard);
      const currentData = dataRef.current;
      onChangeRef.current({ ...currentData, acceptanceClass: defaultClass });
    }
  }, [standard, isClassValidForStandard]);

  // Check for material warnings
  const materialWarning = useMemo(() => {
    const normalizedMaterial = material.toLowerCase();
    return materialWarnings.find(w =>
      normalizedMaterial.includes(w.material) && w.standard === standard
    );
  }, [material, standard]);

  // Special warnings
  const isTitanium = material.toLowerCase().includes("titanium") || material.toLowerCase().includes("ti-");
  const isAustenitic = material.toLowerCase().includes("stainless") || material.toLowerCase().includes("austenitic");
  const showTitaniumWarning = data.acceptanceClass === "AAA" && isTitanium && standard === "AMS-STD-2154E";
  const showAusteniticWarning = isAustenitic && standard !== "BS-EN-10228-4";

  // Get the current class info for display
  const currentClassInfo = useMemo(() => {
    return acceptanceClasses.find(cls => cls.id === data.acceptanceClass);
  }, [acceptanceClasses, data.acceptanceClass]);

  return (
    <div className="space-y-6 p-6">
      {/* Standard-specific header */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Active Standard</h3>
            <p className="text-xs text-muted-foreground mt-1">{getStandardLabel(standard)}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {acceptanceClasses.length} Quality Levels
          </Badge>
        </div>
      </div>

      {/* Austenitic material warning */}
      {showAusteniticWarning && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Austenitic Material Detected</h4>
              <p className="text-sm text-muted-foreground">
                For austenitic stainless steel, consider using <strong>BS EN 10228-4</strong> which is specifically
                designed for austenitic materials with adjusted levels for coarse grain and high attenuation.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWithHelp
          label="Acceptance Class / Quality Level"
          fieldKey="acceptanceClass"
          required
        >
          <Select
            value={data.acceptanceClass}
            onValueChange={(value) => updateField("acceptanceClass", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {acceptanceClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  <div className="flex items-center gap-2">
                    <span>{cls.label}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${getStringencyColor(cls.stringency)}`}
                    >
                      {cls.stringency}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentClassInfo && (
            <p className="text-xs text-muted-foreground mt-1">
              {currentClassInfo.description}
            </p>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Back Reflection Loss Limit"
          fieldKey="backReflectionLoss"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={currentCriteria?.backReflectionLoss || data.backReflectionLoss || ""}
            onChange={(e) => updateField("backReflectionLoss", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Single Discontinuity Response"
          fieldKey="singleDiscontinuity"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.singleDiscontinuity}
            onChange={(e) => updateField("singleDiscontinuity", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label={standard.startsWith("BS-EN") ? "Multiple Indications (per 100cm²)" : "Multiple Discontinuities (centers < 1 inch apart)"}
          fieldKey="multipleDiscontinuities"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.multipleDiscontinuities}
            onChange={(e) => updateField("multipleDiscontinuities", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label="Linear Discontinuity"
          fieldKey="linearDiscontinuity"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.linearDiscontinuity}
            onChange={(e) => updateField("linearDiscontinuity", e.target.value)}
            placeholder="Select acceptance class first"
            className="bg-background"
          />
        </FieldWithHelp>

        <FieldWithHelp
          label={standard === "BS-EN-10228-4" ? "Noise Level / S/N Ratio Requirements" : "Noise Level Requirements"}
          fieldKey="noiseLevel"
          required
          autoFilled={!!data.acceptanceClass}
        >
          <Input
            value={data.noiseLevel}
            onChange={(e) => updateField("noiseLevel", e.target.value)}
            className="bg-background"
          />
        </FieldWithHelp>
      </div>

      {/* Titanium AAA Warning */}
      {showTitaniumWarning && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">CLASS AAA SPECIAL NOTES - Titanium Parts</h4>
              <ul className="text-sm text-foreground space-y-1 list-disc ml-4">
                <li>Multiple discontinuities: 1/8 inch - 2/64 response</li>
                <li>Noise: 1/4 inch - 2/64</li>
                <li>Additional scrutiny required for titanium alloys</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* BS EN 10228-4 Specific Notes */}
      {standard === "BS-EN-10228-4" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Austenitic Material Considerations</h4>
              <ul className="text-sm text-foreground space-y-1 list-disc ml-4">
                <li>Grass noise acceptable &lt; 20% screen height</li>
                <li>Signal-to-Noise ratio: 3:1 minimum, 6:1 preferred</li>
                <li>Levels adjusted for higher attenuation in austenitic materials</li>
                <li>Consider grain structure effects on beam scattering</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <FieldWithHelp
        label="Special Requirements"
        fieldKey="acceptanceClass"
      >
        <Textarea
          value={data.specialRequirements}
          onChange={(e) => updateField("specialRequirements", e.target.value)}
          placeholder="Enter any special requirements, deviations, or additional notes..."
          rows={4}
          className="bg-background"
        />
      </FieldWithHelp>

      {/* Reference Note - Dynamic based on standard */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Reference:</strong> All acceptance criteria are based on <strong>{getStandardLabel(standard)}</strong>.
          {standard === "AMS-STD-2154E" && " Class AAA is the most stringent, Class C is the least."}
          {standard === "ASTM-A388" && " Quality Level 1 (QL1) is the most stringent, QL4 is the least."}
          {standard.startsWith("BS-EN") && " Quality Class 1 is the most stringent, Class 4 is the least. Levels are defined in dB relative to DAC reference."}
          {" "}Ensure your inspection meets or exceeds the specified requirements.
        </p>
      </div>

      {/* Standards Comparison Quick Reference */}
      {standard === "AMS-STD-2154E" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: AMS-STD-2154E Classes</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Single</th>
                  <th className="px-3 py-2 text-left">Multiple</th>
                  <th className="px-3 py-2 text-left">Linear</th>
                  <th className="px-3 py-2 text-left">BWL</th>
                  <th className="px-3 py-2 text-left">Noise</th>
                </tr>
              </thead>
              <tbody>
                {["AAA", "AA", "A", "B", "C"].map((cls) => {
                  const criteria = acceptanceCriteriaByStandard["AMS-STD-2154E"][cls];
                  const isSelected = data.acceptanceClass === cls;
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">{cls}</td>
                      <td className="px-3 py-2">{criteria.singleDiscontinuity.substring(0, 20)}...</td>
                      <td className="px-3 py-2">{criteria.multipleDiscontinuities.substring(0, 20)}...</td>
                      <td className="px-3 py-2">{criteria.linearDiscontinuity.substring(0, 15)}...</td>
                      <td className="px-3 py-2">{criteria.backReflectionLoss}</td>
                      <td className="px-3 py-2">{criteria.noiseLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {standard === "ASTM-A388" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: ASTM A388 Quality Levels</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-left">Single</th>
                  <th className="px-3 py-2 text-left">Multiple</th>
                  <th className="px-3 py-2 text-left">Linear</th>
                  <th className="px-3 py-2 text-left">BWL</th>
                </tr>
              </thead>
              <tbody>
                {["QL1", "QL2", "QL3", "QL4"].map((cls) => {
                  const criteria = acceptanceCriteriaByStandard["ASTM-A388"][cls];
                  const isSelected = data.acceptanceClass === cls;
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">{cls}</td>
                      <td className="px-3 py-2">{criteria.singleDiscontinuity}</td>
                      <td className="px-3 py-2">{criteria.multipleDiscontinuities}</td>
                      <td className="px-3 py-2">{criteria.linearDiscontinuity}</td>
                      <td className="px-3 py-2">{criteria.backReflectionLoss}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {standard.startsWith("BS-EN-10228") && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: {standard} Quality Classes (dB from DAC)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Recording</th>
                  <th className="px-3 py-2 text-left">Acceptance</th>
                  <th className="px-3 py-2 text-left">Evaluation</th>
                  <th className="px-3 py-2 text-left">Max Indications</th>
                </tr>
              </thead>
              <tbody>
                {["1", "2", "3", "4"].map((cls) => {
                  const criteria = acceptanceCriteriaByStandard[standard][cls];
                  const isSelected = data.acceptanceClass === cls;
                  const levels = standard === "BS-EN-10228-3"
                    ? ["-12 dB", "-6 dB", "REF", "+6 dB"]
                    : ["-14 dB", "-8 dB", "-2 dB", "+4 dB"];
                  const acceptLevels = standard === "BS-EN-10228-3"
                    ? ["-6 dB", "REF", "+6 dB", "+12 dB"]
                    : ["-8 dB", "-2 dB", "+4 dB", "+10 dB"];
                  const evalLevels = standard === "BS-EN-10228-3"
                    ? ["REF", "+6 dB", "+12 dB", "+16 dB"]
                    : ["-2 dB", "+4 dB", "+10 dB", "+14 dB"];
                  const maxInd = standard === "BS-EN-10228-3"
                    ? ["0", "3", "5", "As agreed"]
                    : ["0", "2", "4", "As agreed"];
                  const idx = parseInt(cls) - 1;
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">Class {cls}</td>
                      <td className="px-3 py-2">{levels[idx]}</td>
                      <td className="px-3 py-2">{acceptLevels[idx]}</td>
                      <td className="px-3 py-2">{evalLevels[idx]}</td>
                      <td className="px-3 py-2">{maxInd[idx]} per 100cm²</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
