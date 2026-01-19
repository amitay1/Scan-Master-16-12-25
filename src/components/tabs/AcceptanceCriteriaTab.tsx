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
    <div className="space-y-2 p-2">
      {/* Standard-specific header */}
      <div className="bg-primary/5 border border-primary/20 rounded p-2">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
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
          {standard === "BS-EN-10228-3" && " Quality Class 4 is the most stringent, Class 1 is the least. Based on EFBH (Equivalent Flat Bottom Hole) sizes."}
          {standard === "BS-EN-10228-4" && " Quality Class 3 is the most stringent, Class 1 is the least. For austenitic/duplex steels only."}
          {" "}Ensure your inspection meets or exceeds the specified requirements.
        </p>
      </div>

      {/* Standards Comparison Quick Reference */}
      {(standard === "AMS-STD-2154E" || standard === "MIL-STD-2154") && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: AMS-STD-2154E / MIL-STD-2154 Table VI</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Single FBH</th>
                  <th className="px-3 py-2 text-left">Multiple FBH</th>
                  <th className="px-3 py-2 text-left">Linear FBH</th>
                  <th className="px-3 py-2 text-left">Linear Max</th>
                  <th className="px-3 py-2 text-left">BWL</th>
                </tr>
              </thead>
              <tbody>
                {["AAA", "AA", "A", "B", "C"].map((cls) => {
                  const isSelected = data.acceptanceClass === cls;
                  const singleFBH = ["1/64\" (0.4mm)", "3/64\" (1.2mm)", "5/64\" (2.0mm)", "8/64\" (3.2mm)", "8/64\" (3.2mm)"];
                  const multipleFBH = ["1/64\" (0.4mm)", "2/64\" (0.8mm)", "2/64\" (0.8mm)", "3/64\" (1.2mm)", "5/64\" (2.0mm)"];
                  const linearFBH = ["1/64\" (0.4mm)", "2/64\" (0.8mm)", "3/64\" (1.2mm)", "5/64\" (2.0mm)", "N/A"];
                  const linearMax = ["1/8\"", "1/2\"", "1\"", "1\"", "N/A"];
                  const bwl = ["Note 4", "50%", "50%", "50%", "50%"];
                  const idx = ["AAA", "AA", "A", "B", "C"].indexOf(cls);
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">{cls}</td>
                      <td className="px-3 py-2">{singleFBH[idx]}</td>
                      <td className="px-3 py-2">{multipleFBH[idx]}</td>
                      <td className="px-3 py-2">{linearFBH[idx]}</td>
                      <td className="px-3 py-2">{linearMax[idx]}</td>
                      <td className="px-3 py-2">{bwl[idx]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/20">
            Note: Multiple discontinuities = centers &lt;1&quot; apart. Class AAA = Most stringent, Class C = Least stringent.
          </p>
        </div>
      )}

      {standard === "ASTM-A388" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: ASTM A388 Quality Levels (Industry Convention)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-left">Single</th>
                  <th className="px-3 py-2 text-left">Multiple</th>
                  <th className="px-3 py-2 text-left">Linear</th>
                  <th className="px-3 py-2 text-left">BWL Max</th>
                </tr>
              </thead>
              <tbody>
                {["QL1", "QL2", "QL3", "QL4"].map((cls) => {
                  const isSelected = data.acceptanceClass === cls;
                  const single = ["Ref FBH", "2× Ref", "4× Ref", "No limit"];
                  const multiple = ["50% Ref", "Ref FBH", "2× Ref", "4× Ref"];
                  const linear = ["Not allowed", "≤1\"", "≤2\"", "As agreed"];
                  const bwl = ["50%", "75%", "90%", "100%"];
                  const idx = ["QL1", "QL2", "QL3", "QL4"].indexOf(cls);
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">{cls}</td>
                      <td className="px-3 py-2">{single[idx]}</td>
                      <td className="px-3 py-2">{multiple[idx]}</td>
                      <td className="px-3 py-2">{linear[idx]}</td>
                      <td className="px-3 py-2">{bwl[idx]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/20">
            Note: QL1-QL4 are industry conventions, not defined in ASTM A388. Reference FBH by thickness: &lt;1.5&quot;=1/16&quot;, 1.5-6&quot;=1/8&quot;, &gt;6&quot;=1/4&quot;.
          </p>
        </div>
      )}

      {standard === "BS-EN-10228-3" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: BS EN 10228-3 Quality Classes (EFBH sizes)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Recording Level</th>
                  <th className="px-3 py-2 text-left">Isolated Max</th>
                  <th className="px-3 py-2 text-left">Extended Max</th>
                  <th className="px-3 py-2 text-left">BWE Ratio</th>
                </tr>
              </thead>
              <tbody>
                {["1", "2", "3", "4"].map((cls) => {
                  const isSelected = data.acceptanceClass === cls;
                  const recording = [">8mm EFBH", ">5mm EFBH", ">3mm EFBH", ">2mm EFBH"];
                  const isolated = ["≤12mm", "≤8mm", "≤5mm", "≤3mm"];
                  const extended = ["≤8mm", "≤5mm", "≤3mm", "≤2mm"];
                  const bweRatio = ["R ≤ 0.1", "R ≤ 0.3", "R ≤ 0.5", "R ≤ 0.6"];
                  const idx = parseInt(cls) - 1;
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">Class {cls}</td>
                      <td className="px-3 py-2">{recording[idx]}</td>
                      <td className="px-3 py-2">{isolated[idx]}</td>
                      <td className="px-3 py-2">{extended[idx]}</td>
                      <td className="px-3 py-2">{bweRatio[idx]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/20">
            Note: Class 1 = Least stringent, Class 4 = Most stringent. EFBH = Equivalent Flat Bottom Hole.
          </p>
        </div>
      )}

      {standard === "BS-EN-10228-4" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: BS EN 10228-4 Quality Classes (Austenitic)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Stringency</th>
                  <th className="px-3 py-2 text-left">S/N Ratio</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {["1", "2", "3"].map((cls) => {
                  const isSelected = data.acceptanceClass === cls;
                  const stringency = ["Least stringent", "Intermediate", "Most stringent"];
                  const snRatio = ["Per agreement", "Min 3:1", "Preferred 6:1"];
                  const notes = ["Largest allowable sizes", "Intermediate sizes", "Smallest allowable sizes"];
                  const idx = parseInt(cls) - 1;
                  return (
                    <tr key={cls} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">Class {cls}</td>
                      <td className="px-3 py-2">{stringency[idx]}</td>
                      <td className="px-3 py-2">{snRatio[idx]}</td>
                      <td className="px-3 py-2">{notes[idx]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/20">
            Note: BS EN 10228-4 has only 3 Quality Classes. Limits are thickness-dependent per Table 5.
          </p>
        </div>
      )}
    </div>
  );
};
