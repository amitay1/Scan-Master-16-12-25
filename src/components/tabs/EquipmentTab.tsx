// @ts-nocheck
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipmentData, StandardType } from "@/types/techniqueSheet";
import { FieldWithHelp } from "@/components/FieldWithHelp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, AlertTriangle, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  equipmentParametersByStandard,
  getRecommendedFrequencyForStandard,
} from "@/data/standardsDifferences";
import { getFrequencyOptionsForStandard } from "@/utils/frequencyUtils";

// LocalStorage keys for custom items
const STORAGE_KEYS = {
  customTransducerTypes: 'scanmaster_custom_transducer_types',
  customWedgeTypes: 'scanmaster_custom_wedge_types',
};

interface EquipmentTabProps {
  data: EquipmentData;
  onChange: (data: EquipmentData) => void;
  partThickness: number;
  standard?: StandardType;
}

const transducerTypes = ["immersion", "contact", "dual_element"];

const couplantOptions = [
  "Water (Immersion)",
  "Water (with wetting agent)",
  "Glycerin",
  "Commercial Gel (Sono 600)",
  "SAE No. 20 Motor Oil",
  "SAE No. 30 Motor Oil",
  "Mineral Oil",
  "Cellulose Paste",
  "Custom",
];

const transducerShapeOptions = [
  {
    value: "active_element_diameter_3_8_to_1_inch",
    label: "Active element diameter 3/8 inch to 1 inch",
  },
  {
    value: "rectangular_flat",
    label: "Rectangular flat",
  },
  {
    value: "cylindrically_focused_transducers",
    label: "Cylindrically focused transducers",
  },
];

// Get standard label
const getStandardLabel = (standard: StandardType): string => {
  const labels: Partial<Record<StandardType, string>> = {
    "MIL-STD-2154": "MIL-STD-2154 Table II",
    "AMS-STD-2154E": "AMS-STD-2154E Table II",
    "ASTM-A388": "ASTM A388/A388M",
    "ASTM-E2375": "ASTM E2375",
    "ASTM-E127": "ASTM E127",
    "ASTM-E164": "ASTM E164",
    "BS-EN-10228-3": "BS EN 10228-3:2016",
    "BS-EN-10228-4": "BS EN 10228-4:2016",
    "EN-ISO-16810": "EN ISO 16810",
    "AMS-2630": "AMS 2630",
    "AMS-2631": "AMS 2631 (Titanium)",
    "AMS-2632": "AMS 2632 (Thin Materials)",
    "NDIP-1226": "PW NDIP-1226 (V2500 HPT S1)",
    "NDIP-1227": "PW NDIP-1227 (V2500 HPT S2)",
  };
  return labels[standard] || standard;
};

// Default wedge types
const defaultWedgeTypes = [
  { value: "Normal", label: "Normal (0°)" },
  { value: "Angled", label: "Angled (Shear Wave)" },
  { value: "Immersion", label: "Immersion" },
  { value: "Custom", label: "Custom" },
];

export const EquipmentTab = ({ data, onChange, partThickness, standard = "AMS-STD-2154E" }: EquipmentTabProps) => {
  // State to control Phased Array section visibility
  const [showPASection, setShowPASection] = useState(false);

  // State for custom items (persisted in localStorage)
  const [customTransducerTypes, setCustomTransducerTypes] = useState<string[]>([]);
  const [customWedgeTypes, setCustomWedgeTypes] = useState<{ value: string; label: string }[]>([]);

  // State for "Add to list" input mode
  const [addingTransducer, setAddingTransducer] = useState(false);
  const [addingWedge, setAddingWedge] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");

  // Load custom items from localStorage on mount
  useEffect(() => {
    try {
      const storedTransducers = localStorage.getItem(STORAGE_KEYS.customTransducerTypes);
      const storedWedges = localStorage.getItem(STORAGE_KEYS.customWedgeTypes);

      if (storedTransducers) setCustomTransducerTypes(JSON.parse(storedTransducers));
      if (storedWedges) setCustomWedgeTypes(JSON.parse(storedWedges));
    } catch (error) {
      console.warn("Failed to load custom equipment items from localStorage:", error);
    }
  }, []);

  // Helper to add custom transducer type
  const addCustomTransducerType = (name: string) => {
    if (!name.trim()) return;
    const value = name.trim().toLowerCase().replace(/\s+/g, '_');
    if (transducerTypes.includes(value) || customTransducerTypes.includes(value)) return;
    const updated = [...customTransducerTypes, value];
    setCustomTransducerTypes(updated);
    localStorage.setItem(STORAGE_KEYS.customTransducerTypes, JSON.stringify(updated));
    applyTransducerSelection([...selectedTransducerTypes, value]);
    setAddingTransducer(false);
    setNewItemValue("");
  };

  // Helper to add custom wedge type
  const addCustomWedgeType = (name: string) => {
    if (!name.trim()) return;
    const value = name.trim();
    if (defaultWedgeTypes.some(w => w.value === value) || customWedgeTypes.some(w => w.value === value)) return;
    const newWedge = { value, label: value };
    const updated = [...customWedgeTypes, newWedge];
    setCustomWedgeTypes(updated);
    localStorage.setItem(STORAGE_KEYS.customWedgeTypes, JSON.stringify(updated));
    updateField("wedgeType", value);
    setAddingWedge(false);
    setNewItemValue("");
  };

  // Get all transducer types (default + custom)
  const allTransducerTypes = [...transducerTypes, ...customTransducerTypes];

  // Get all wedge types (default + custom)
  const allWedgeTypes = [...defaultWedgeTypes, ...customWedgeTypes];

  // Get equipment parameters for current standard
  const equipmentParams = useMemo(() => {
    return equipmentParametersByStandard[standard];
  }, [standard]);

  // Get available frequencies for current standard
  const frequencies = useMemo(() => {
    return getFrequencyOptionsForStandard(standard);
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

  const selectedTransducerTypes = useMemo(() => {
    if (Array.isArray(data.transducerTypes) && data.transducerTypes.length > 0) {
      return data.transducerTypes;
    }
    return (data.transducerType || "")
      .split(/[,+]/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }, [data.transducerType, data.transducerTypes]);

  const applyTransducerSelection = (selected: string[]) => {
    const normalized = Array.from(
      new Set(selected.map((value) => value.trim().toLowerCase()).filter(Boolean))
    );
    onChange({
      ...data,
      transducerTypes: normalized,
      transducerType: normalized.join(", "),
    });
  };

  const toggleTransducerType = (value: string) => {
    const current = selectedTransducerTypes;
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    applyTransducerSelection(updated);
  };

  const selectedCouplantValue = useMemo(() => {
    if (data.customCouplant) return "Custom";
    if (!data.couplant) return "";
    return couplantOptions.includes(data.couplant) ? data.couplant : "Custom";
  }, [data.couplant, data.customCouplant]);

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
                <li>Use lower frequencies (typically 0.5-2 MHz) due to coarse grain structure</li>
                <li>Standard nominal range is 0.5-6 MHz (select as low as practical for penetration)</li>
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
          label="Transducer Type (multi-select)"
          fieldKey="transducerType"
          required
        >
          {addingTransducer ? (
            <div className="flex gap-1">
              <Input
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Enter transducer type..."
                className="bg-background flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCustomTransducerType(newItemValue);
                  if (e.key === "Escape") {
                    setAddingTransducer(false);
                    setNewItemValue("");
                  }
                }}
              />
              <Button size="sm" onClick={() => addCustomTransducerType(newItemValue)} className="h-9">
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingTransducer(false);
                  setNewItemValue("");
                }}
                className="h-9"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {allTransducerTypes.map((type) => {
                  const selected = selectedTransducerTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTransducerType(type)}
                      className={`px-2 py-1 rounded border text-xs transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted/50"
                      }`}
                    >
                      {type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </button>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setAddingTransducer(true);
                    setNewItemValue("");
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to list
                </Button>
              </div>
              {selectedTransducerTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">Select one or more transducer types.</p>
              )}
            </div>
          )}
        </FieldWithHelp>

        <FieldWithHelp
          label="Transducer Shape and Size"
          fieldKey="transducerDiameter"
          help="As requested: choose one of the standard shape/size options"
          required
        >
          <Select
            value={data.transducerShapeAndSize || ""}
            onValueChange={(value) => {
              updateField("transducerShapeAndSize", value);
              if (value === "active_element_diameter_3_8_to_1_inch" && !data.transducerDiameter) {
                updateField("transducerDiameter", 0.5);
              }
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select shape/size..." />
            </SelectTrigger>
            <SelectContent>
              {transducerShapeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithHelp>

        <FieldWithHelp
          label="Couplant Type"
          fieldKey="couplant"
          required
        >
          <div className="space-y-2">
            <Select
              value={selectedCouplantValue}
              onValueChange={(value) => {
                if (value === "Custom") {
                  updateField("couplant", data.customCouplant || "");
                } else {
                  onChange({
                    ...data,
                    couplant: value,
                    customCouplant: "",
                  });
                }
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select couplant..." />
              </SelectTrigger>
              <SelectContent>
                {couplantOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCouplantValue === "Custom" && (
              <Input
                value={data.customCouplant || data.couplant || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    customCouplant: e.target.value,
                    couplant: e.target.value,
                  })
                }
                placeholder="Enter custom couplant..."
                className="bg-background"
              />
            )}
          </div>
        </FieldWithHelp>

        <FieldWithHelp
          label="Acoustic Velocity (m/s)"
          fieldKey="manufacturer"
          help="Longitudinal wave velocity in the test material"
        >
          <Input
            type="number"
            value={data.velocity ?? ""}
            onChange={(e) => updateField("velocity", e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 5920"
            step={10}
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
                  {addingWedge ? (
                    <div className="flex gap-1 flex-1">
                      <Input
                        value={newItemValue}
                        onChange={(e) => setNewItemValue(e.target.value)}
                        placeholder="Enter wedge type..."
                        className="bg-background flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addCustomWedgeType(newItemValue);
                          if (e.key === 'Escape') { setAddingWedge(false); setNewItemValue(""); }
                        }}
                      />
                      <Button size="sm" onClick={() => addCustomWedgeType(newItemValue)} className="h-9">
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddingWedge(false); setNewItemValue(""); }} className="h-9">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={data.wedgeType || ""}
                      onValueChange={(value) => {
                        if (value === "__add_new__") {
                          setAddingWedge(true);
                          setNewItemValue("");
                        } else {
                          updateField("wedgeType", value);
                        }
                      }}
                      disabled={data.wedgeTypeApplicable === false}
                    >
                      <SelectTrigger className="bg-background flex-1">
                        <SelectValue placeholder="Select wedge type..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allWedgeTypes.map((wedge) => (
                          <SelectItem key={wedge.value} value={wedge.value}>
                            {wedge.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="__add_new__" className="text-primary font-medium border-t mt-1 pt-1">
                          <span className="flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Add to the list
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
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
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <Checkbox
              checked={!!data.includeSelectionNotesInReport}
              onCheckedChange={(checked) => updateField("includeSelectionNotesInReport", checked === true)}
            />
            Include equipment selection notes in exported report
          </label>
          {data.includeSelectionNotesInReport && (
            <Textarea
              value={data.selectionNotes || ""}
              onChange={(e) => updateField("selectionNotes", e.target.value)}
              placeholder="Optional notes to print with the report..."
              rows={3}
              className="bg-background"
            />
          )}
        </div>
      </div>
    </div>
  );
};
