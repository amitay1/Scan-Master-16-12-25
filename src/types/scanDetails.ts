export interface ScanDetail {
  scanningDirection: string;
  waveMode: string;
  frequency: string;
  make: string;
  probe: string;
  remarkDetails: string;
  enabled: boolean;
  isVisible?: boolean;
  // Additional properties for comprehensive coverage
  entrySurface?: "top" | "bottom" | "side" | "od" | "id" | "end" | "radial";
  probeType?: "single" | "dual" | "phased_array" | "tofd";
  angle?: number;
  color?: string;
}

export interface ScanDetailsData {
  scanDetails: ScanDetail[];
}

// Comprehensive scan directions based on ASTM E2375 (Figures 6 & 7)
// Reference: ASTM E2375-16 "Standard Practice for Ultrasonic Testing of Wrought Products"
export type ScanDirectionCode =
  | "A"   // Primary straight beam - typically from top/flat face (LW 0°)
  | "B"   // Secondary straight beam - from adjacent/opposite surface (LW 0°)
  | "C"   // Tertiary straight beam - radial or third adjacent face (LW 0°)
  | "D"   // Circumferential shear wave CLOCKWISE (SW 45° CW) - per E2375 Annex A1
  | "E"   // Circumferential shear wave COUNTER-CLOCKWISE (SW 45° CCW) - per E2375 Annex A1
  | "F"   // Axial shear wave direction 1 (SW 45°) - per E2375 Annex A1
  | "G"   // Axial shear wave direction 2 (SW 45° opposite) - per E2375 Annex A1
  | "H"   // ID surface scan - for hollow parts (tubes, rings)
  | "I"   // Through-Transmission (TT) - two-probe technique
  | "J"   // Shear wave 60° - for thin sections per E2375
  | "K"   // Shear wave 70° - for thin sections per E2375
  | "L"   // Additional radial/rotational position

export interface ScanDirectionDefinition {
  code: ScanDirectionCode;
  name: string;
  nameHe: string;
  waveMode: string;
  description: string;
  entrySurface: ScanDetail["entrySurface"];
  angle: number;
  color: string;
  applicableParts: string[];
}

// Professional scan direction definitions per ASTM E2375 Figures 6 & 7
export const SCAN_DIRECTION_DEFINITIONS: ScanDirectionDefinition[] = [
  {
    code: "A",
    name: "Primary Straight Beam",
    nameHe: "קרן ישרה ראשית (מלמעלה/פני שטוח)",
    waveMode: "LW 0° (Primary Surface)",
    description: "E2375 Fig.6: Straight beam through thickness from primary flat surface",
    entrySurface: "top",
    angle: 0,
    color: "#22c55e", // green
    applicableParts: ["plate", "rectangular_bar", "round_bar", "disk", "disk_forging", "billet", "cylinder", "hex_bar", "ring_forging"]
  },
  {
    code: "B",
    name: "Secondary Straight Beam",
    nameHe: "קרן ישרה משנית (צד סמוך/נגדי)",
    waveMode: "LW 0° (Adjacent/Opposite Surface)",
    description: "E2375 Fig.6: Straight beam from adjacent side (bars/billets) or opposite side (>9in)",
    entrySurface: "side",
    angle: 0,
    color: "#3b82f6", // blue
    applicableParts: ["plate", "rectangular_bar", "round_bar", "disk", "disk_forging", "billet", "cylinder", "hex_bar"]
  },
  {
    code: "C",
    name: "Tertiary/Radial Beam",
    nameHe: "קרן שלישית/רדיאלית",
    waveMode: "LW 0° (Third Face / Radial from OD)",
    description: "E2375 Fig.6/7: Third adjacent face (hex bar) or radial from circumference (disk/ring)",
    entrySurface: "od",
    angle: 0,
    color: "#f59e0b", // amber
    applicableParts: ["round_bar", "tube", "pipe", "cylinder", "ring", "ring_forging", "shaft", "sleeve", "hex_bar", "disk", "disk_forging"]
  },
  {
    code: "D",
    name: "Circumferential Shear CW",
    nameHe: "גל גזירה היקפי - עם כיוון השעון",
    waveMode: "SW Circumferential (Clockwise)",
    description: "E2375 Annex A1.3.1: Circumferential shear wave in clockwise direction (required for rings/tubes)",
    entrySurface: "od",
    angle: 45,
    color: "#ef4444", // red
    applicableParts: ["ring", "ring_forging", "tube", "pipe", "round_bar", "cylinder", "shaft"]
  },
  {
    code: "E",
    name: "Circumferential Shear CCW",
    nameHe: "גל גזירה היקפי - נגד כיוון השעון",
    waveMode: "SW Circumferential (Counter-Clockwise)",
    description: "E2375 Annex A1.3.1: Circumferential shear wave in counter-clockwise direction (required for rings/tubes)",
    entrySurface: "od",
    angle: 45,
    color: "#ec4899", // pink
    applicableParts: ["ring", "ring_forging", "tube", "pipe", "round_bar", "cylinder", "shaft"]
  },
  {
    code: "F",
    name: "Axial Shear Direction 1",
    nameHe: "גל גזירה אקסיאלי - כיוון 1",
    waveMode: "SW Axial 45° (Direction 1)",
    description: "E2375 Annex A1.3.3: Axial shear wave for tubes - direction 1",
    entrySurface: "od",
    angle: 45,
    color: "#8b5cf6", // purple
    applicableParts: ["tube", "pipe", "ring", "ring_forging"]
  },
  {
    code: "G",
    name: "Axial Shear Direction 2",
    nameHe: "גל גזירה אקסיאלי - כיוון 2",
    waveMode: "SW Axial 45° (Direction 2 - opposite)",
    description: "E2375 Annex A1.3.3: Axial shear wave for tubes - opposite direction",
    entrySurface: "od",
    angle: 45,
    color: "#14b8a6", // teal
    applicableParts: ["tube", "pipe", "ring", "ring_forging"]
  },
  {
    code: "H",
    name: "From ID Surface",
    nameHe: "מ-ID (משטח פנימי)",
    waveMode: "LW 0° (from ID)",
    description: "E2375: Longitudinal wave from inner diameter for hollow parts",
    entrySurface: "id",
    angle: 0,
    color: "#06b6d4", // cyan
    applicableParts: ["tube", "pipe", "ring", "ring_forging", "sleeve", "bushing"]
  },
  {
    code: "I",
    name: "Through-Transmission",
    nameHe: "TT - שני תמרים",
    waveMode: "Through-Transmission (TT)",
    description: "Through-transmission with separate transmitter and receiver",
    entrySurface: "top",
    angle: 0,
    color: "#84cc16", // lime
    applicableParts: ["plate", "rectangular_bar", "disk", "billet"]
  },
  {
    code: "J",
    name: "Shear Wave 60°",
    nameHe: "גל גזירה 60°",
    waveMode: "SW 60°",
    description: "E2375 Annex A1.3.4: 60° for thin sections (<1 inch)",
    entrySurface: "side",
    angle: 60,
    color: "#f97316", // orange
    applicableParts: ["plate", "rectangular_bar", "billet"]
  },
  {
    code: "K",
    name: "Shear Wave 45°",
    nameHe: "גל גזירה 45°",
    waveMode: "SW 45°",
    description: "E2375 Annex A1.3.4: 45° for thick sections (>1 inch)",
    entrySurface: "side",
    angle: 45,
    color: "#eab308", // yellow
    applicableParts: ["plate", "rectangular_bar", "billet"]
  },
  {
    code: "L",
    name: "Rotational/360° Scan",
    nameHe: "סריקה סיבובית 360°",
    waveMode: "LW 0° (Rotating 360°)",
    description: "E2375 Fig.6: Radial scan while rotating bar towards center",
    entrySurface: "radial",
    angle: 0,
    color: "#a855f7", // violet
    applicableParts: ["round_bar", "cylinder", "shaft", "hub"]
  }
];
