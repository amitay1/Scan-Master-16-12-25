// @ts-nocheck
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AcceptanceCriteriaData, StandardType } from "@/types/techniqueSheet";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useRef } from "react";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Checkbox } from "@/components/ui/checkbox";
import {
  acceptanceClassesByStandard,
  acceptanceCriteriaByStandard,
  getDefaultAcceptanceClass,
  materialWarnings,
  type AcceptanceCriteriaValues,
} from "@/data/standardsDifferences";

interface AcceptanceCriteriaTabProps {
  data: AcceptanceCriteriaData;
  onChange: (data: AcceptanceCriteriaData) => void;
  material: string;
  standard?: StandardType;
}

const getStandardLabel = (standard: StandardType): string => {
  const labels: Partial<Record<StandardType, string>> = {
    "MIL-STD-2154": "MIL-STD-2154 Table VI",
    "AMS-STD-2154E": "MIL-STD-2154 / AMS-STD-2154E Table VI",
    "ASTM-A388": "ASTM A388/A388M Quality Levels",
    "BS-EN-10228-3": "BS EN 10228-3:2016 Quality Classes",
    "BS-EN-10228-4": "BS EN 10228-4:2016 Quality Classes (Austenitic)",
    "NDIP-1226": "NDIP-1226 Rev F - PW V2500 1st Stage HPT Disk",
    "NDIP-1227": "NDIP-1227 Rev D - PW V2500 2nd Stage HPT Disk",
    "NDIP-1254": "NDIP-1254 - PW1100G HPT 1st Stage Hub (AUSI)",
    "NDIP-1257": "NDIP-1257 - PW1100G HPT 2nd Stage Hub (AUSI)",
    "NDIP-1260": "NDIP-1260 - PW1100G HPC 8th Stage IBR-8 (AUSI)",
    "PWA-SIM": "PWA SIM - Sonic Inspection Method (Bar/Billet/Forging)",
    "ASTM-E2375": "ASTM E2375 - UT of Wrought Products",
    "ASTM-E127": "ASTM E127 - FBH Reference Blocks",
    "ASTM-E164": "ASTM E164 - UT of Weldments",
    "AMS-2630": "AMS 2630 - Products >0.5\" Thick",
    "AMS-2631": "AMS 2631 - Titanium Bar, Billet, Plate",
    "AMS-2632": "AMS 2632 - Thin Materials <=0.5\"",
    "EN-ISO-16810": "EN ISO 16810 - General UT Principles",
  };
  return labels[standard] || standard;
};

const getQuickReferenceNote = (standard: StandardType): string => {
  if (standard === "AMS-STD-2154E" || standard === "MIL-STD-2154") {
    return "Table VI Note 2: Multiple discontinuities are centers <1 inch apart. Back reflection loss limit is 50% (Note 4).";
  }
  if (standard === "ASTM-A388") {
    return "ASTM A388 does not define QL1-QL4 in the base text. These quality levels are common industry conventions.";
  }
  if (standard === "BS-EN-10228-3") {
    return "Class 1 is least stringent and Class 4 is most stringent. Limits are expressed in EFBH sizes.";
  }
  if (standard === "BS-EN-10228-4") {
    return "BS EN 10228-4 uses 3 classes (Class 1 to Class 3) with thickness-dependent limits.";
  }
  return "Values shown are loaded from the selected standard profile and acceptance class definitions.";
};

const getStringencyColor = (stringency: string): string => {
  switch (stringency) {
    case "highest":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "basic":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const AcceptanceCriteriaTab = ({
  data,
  onChange,
  material,
  standard = "AMS-STD-2154E",
}: AcceptanceCriteriaTabProps) => {
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  dataRef.current = data;
  onChangeRef.current = onChange;

  const updateField = (field: keyof AcceptanceCriteriaData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const acceptanceClasses = useMemo(() => {
    return acceptanceClassesByStandard[standard] || acceptanceClassesByStandard["AMS-STD-2154E"];
  }, [standard]);

  const currentCriteria = useMemo(() => {
    const standardCriteria = acceptanceCriteriaByStandard[standard];
    if (standardCriteria && data.acceptanceClass) {
      return standardCriteria[data.acceptanceClass] || null;
    }
    return null;
  }, [standard, data.acceptanceClass]);

  const isClassValidForStandard = useMemo(() => {
    return acceptanceClasses.some((cls) => cls.id === data.acceptanceClass);
  }, [acceptanceClasses, data.acceptanceClass]);

  useEffect(() => {
    const currentData = dataRef.current;
    if (currentData.acceptanceClass && currentCriteria) {
      const bwlParsed = parseFloat((currentCriteria.backReflectionLoss || "").replace(/[^0-9.]/g, ""));
      onChangeRef.current({
        ...currentData,
        singleDiscontinuity: currentCriteria.singleDiscontinuity,
        multipleDiscontinuities: currentCriteria.multipleDiscontinuities,
        linearDiscontinuity: currentCriteria.linearDiscontinuity,
        backReflectionLoss: Number.isFinite(bwlParsed) ? bwlParsed : currentData.backReflectionLoss,
        noiseLevel: currentCriteria.noiseLevel,
        specialRequirements: currentData.specialRequirements || currentCriteria.specialNotes || "",
        standardNotes: currentCriteria.specialNotes || "",
      });
    }
  }, [data.acceptanceClass, standard, currentCriteria]);

  useEffect(() => {
    if (!isClassValidForStandard) {
      const defaultClass = getDefaultAcceptanceClass(standard);
      const currentData = dataRef.current;
      onChangeRef.current({ ...currentData, acceptanceClass: defaultClass });
    }
  }, [standard, isClassValidForStandard]);

  const materialWarning = useMemo(() => {
    const normalizedMaterial = material.toLowerCase();
    return materialWarnings.find(
      (w) => normalizedMaterial.includes(w.material) && w.standard === standard
    );
  }, [material, standard]);

  const normalizedMaterial = material.toLowerCase();
  const isTitanium = normalizedMaterial.includes("titanium") || normalizedMaterial.includes("ti-");
  const showTitaniumWarning =
    isTitanium &&
    ((["AAA", "AA"].includes(data.acceptanceClass) &&
      (standard === "AMS-STD-2154E" || standard === "MIL-STD-2154")) ||
      standard === "AMS-2631");

  const currentClassInfo = useMemo(() => {
    return acceptanceClasses.find((cls) => cls.id === data.acceptanceClass);
  }, [acceptanceClasses, data.acceptanceClass]);

  const quickReferenceRows = useMemo(() => {
    const rows: { classId: string; classLabel: string; criteria: AcceptanceCriteriaValues }[] = [];
    const criteriaByClass = acceptanceCriteriaByStandard[standard] || {};

    for (const cls of acceptanceClasses) {
      const criteria = criteriaByClass[cls.id];
      if (criteria) {
        rows.push({
          classId: cls.id,
          classLabel: cls.label,
          criteria,
        });
      }
    }

    return rows;
  }, [acceptanceClasses, standard]);

  return (
    <div className="space-y-2 p-2">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        <FieldWithHelp label="Acceptance Class / Quality Level" fieldKey="acceptanceClass" required>
          <Select value={data.acceptanceClass} onValueChange={(value) => updateField("acceptanceClass", value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {acceptanceClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  <div className="flex items-center gap-2">
                    <span>{cls.label}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStringencyColor(cls.stringency)}`}>
                      {cls.stringency}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentClassInfo && <p className="text-xs text-muted-foreground mt-1">{currentClassInfo.description}</p>}
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
          label={
            standard.startsWith("BS-EN")
              ? "Multiple Indications (per 100 cm^2)"
              : "Multiple Discontinuities (centers < 1 inch apart)"
          }
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

      {showTitaniumWarning && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                TITANIUM SPECIAL REQUIREMENTS{standard === "AMS-2631" ? " (AMS 2631)" : ""}
              </h4>
              <ul className="text-sm text-foreground space-y-1 list-disc ml-4">
                {data.acceptanceClass === "AAA" && (
                  <>
                    <li>Table VI Note 6 (Titanium): Multiple discontinuity = 1/8" max length at 2/64" response</li>
                    <li>Table VI Note 6 (Titanium): Noise criteria is not applicable for Class AAA</li>
                  </>
                )}
                {data.acceptanceClass === "AA" && (
                  <>
                    <li>Table VI Note 6 (Titanium): Multiple discontinuity = 1/4" max length at 2/64" response (or greater)</li>
                    <li>Table VI Note 6 (Titanium): Linear discontinuity criteria is not applicable for Class AA</li>
                  </>
                )}
                <li>Higher attenuation than metals of similar density - verify calibration sensitivity</li>
                <li>Macrostructure variations may cause false indications - verify with rescan at 90 deg</li>
                {standard === "AMS-2631" && <li>AMS 2631 applies specifically to titanium bar, billet, and plate products</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

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

      {materialWarning && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-foreground">{materialWarning.warning}</p>
        </div>
      )}

      <FieldWithHelp label="Special Requirements" fieldKey="acceptanceClass">
        <Textarea
          value={data.specialRequirements}
          onChange={(e) => updateField("specialRequirements", e.target.value)}
          placeholder="Enter any special requirements, deviations, or additional notes..."
          rows={4}
          className="bg-background"
        />
      </FieldWithHelp>

      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Reference:</strong> All acceptance criteria are based on <strong>{getStandardLabel(standard)}</strong>.
          {(standard === "AMS-STD-2154E" || standard === "MIL-STD-2154") && " Class AAA is the most stringent, Class C is the least."}
          {standard === "ASTM-A388" && " Quality Level 1 (QL1) is the most stringent, QL4 is the least."}
          {standard === "BS-EN-10228-3" && " Quality Class 4 is the most stringent, Class 1 is the least. Based on EFBH (Equivalent Flat Bottom Hole) sizes."}
          {standard === "BS-EN-10228-4" && " Quality Class 3 is the most stringent, Class 1 is the least. For austenitic/duplex steels only."}
          {" "}Ensure your inspection meets or exceeds the specified requirements.
        </p>
      </div>

      {quickReferenceRows.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h4 className="text-sm font-semibold">Quick Reference: {getStandardLabel(standard)}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Single Discontinuity</th>
                  <th className="px-3 py-2 text-left">Multiple Discontinuities</th>
                  <th className="px-3 py-2 text-left">Linear Discontinuity</th>
                  <th className="px-3 py-2 text-left">Back Reflection Loss</th>
                  <th className="px-3 py-2 text-left">Noise</th>
                </tr>
              </thead>
              <tbody>
                {quickReferenceRows.map((row) => {
                  const isSelected = data.acceptanceClass === row.classId;
                  return (
                    <tr key={row.classId} className={isSelected ? "bg-primary/10" : ""}>
                      <td className="px-3 py-2 font-medium">{row.classLabel}</td>
                      <td className="px-3 py-2">{row.criteria.singleDiscontinuity}</td>
                      <td className="px-3 py-2">{row.criteria.multipleDiscontinuities}</td>
                      <td className="px-3 py-2">{row.criteria.linearDiscontinuity}</td>
                      <td className="px-3 py-2">{row.criteria.backReflectionLoss}</td>
                      <td className="px-3 py-2">{row.criteria.noiseLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-muted/20 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground">
              Note: {getQuickReferenceNote(standard)}
            </p>
            {!!data.standardNotes && (
              <div className="bg-background/60 border border-border rounded-md p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Standard Notes</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{data.standardNotes}</p>
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <Checkbox
                checked={!!data.includeStandardNotesInReport}
                onCheckedChange={(checked) => updateField("includeStandardNotesInReport", checked === true)}
              />
              Include standard notes in exported report
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
