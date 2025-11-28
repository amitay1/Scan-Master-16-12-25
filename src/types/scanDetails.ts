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

// Comprehensive scan directions based on professional UT standards (AMS 2630, AMS-STD-2154)
export type ScanDirectionCode =
  | "A"   // Top/Axial - from top face down (LW 0°)
  | "B"   // Bottom/Axial - from bottom face up (LW 0°)
  | "C"   // Radial/Side - from OD surface (LW 0°)
  | "D"   // Shear wave 45° clockwise
  | "E"   // Shear wave 45° counter-clockwise
  | "F"   // Circumferential shear wave
  | "G"   // Axial shear wave from OD
  | "H"   // ID surface scan (for hollow parts)
  | "I"   // Through-Transmission (TT)
  | "J"   // Shear wave 60°
  | "K"   // Shear wave 70°
  | "L"   // Additional radial position

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

// Professional scan direction definitions
export const SCAN_DIRECTION_DEFINITIONS: ScanDirectionDefinition[] = [
  {
    code: "A",
    name: "Axial (Top)",
    nameHe: "אקסיאלי (מלמעלה)",
    waveMode: "LW 0° (Axial from Top)",
    description: "Longitudinal wave perpendicular from top surface",
    entrySurface: "top",
    angle: 0,
    color: "#22c55e", // green
    applicableParts: ["plate", "rectangular_bar", "round_bar", "disk", "disk_forging", "billet", "cylinder"]
  },
  {
    code: "B",
    name: "Axial (Bottom)",
    nameHe: "אקסיאלי (מלמטה)",
    waveMode: "LW 0° (Axial from Bottom)",
    description: "Longitudinal wave perpendicular from bottom surface",
    entrySurface: "bottom",
    angle: 0,
    color: "#3b82f6", // blue
    applicableParts: ["plate", "rectangular_bar", "round_bar", "disk", "disk_forging", "billet", "cylinder"]
  },
  {
    code: "C",
    name: "Radial (OD)",
    nameHe: "רדיאלי (מ-OD)",
    waveMode: "LW 0° (Radial from OD)",
    description: "Longitudinal wave from outer diameter surface",
    entrySurface: "od",
    angle: 0,
    color: "#f59e0b", // amber
    applicableParts: ["round_bar", "tube", "pipe", "cylinder", "ring", "ring_forging", "shaft", "sleeve"]
  },
  {
    code: "D",
    name: "Shear Wave 45° CW",
    nameHe: "גל גזירה 45° עם כיוון השעון",
    waveMode: "SW 45° (Clockwise)",
    description: "Shear wave 45° in clockwise direction",
    entrySurface: "side",
    angle: 45,
    color: "#ef4444", // red
    applicableParts: ["all"]
  },
  {
    code: "E",
    name: "Shear Wave 45° CCW",
    nameHe: "גל גזירה 45° נגד כיוון השעון",
    waveMode: "SW 45° (Counter-Clockwise)",
    description: "Shear wave 45° in counter-clockwise direction",
    entrySurface: "side",
    angle: 45,
    color: "#ec4899", // pink
    applicableParts: ["all"]
  },
  {
    code: "F",
    name: "Circumferential Shear",
    nameHe: "גל גזירה היקפי",
    waveMode: "SW Circumferential",
    description: "Circumferential shear wave around the part",
    entrySurface: "od",
    angle: 45,
    color: "#8b5cf6", // purple
    applicableParts: ["round_bar", "tube", "pipe", "cylinder", "ring", "ring_forging", "shaft"]
  },
  {
    code: "G",
    name: "Axial Shear from OD",
    nameHe: "גל גזירה אקסיאלי מ-OD",
    waveMode: "SW Axial 45° (from OD)",
    description: "Axial shear wave from outer diameter",
    entrySurface: "od",
    angle: 45,
    color: "#14b8a6", // teal
    applicableParts: ["round_bar", "tube", "pipe", "cylinder", "ring", "ring_forging", "shaft"]
  },
  {
    code: "H",
    name: "ID Surface",
    nameHe: "משטח פנימי (ID)",
    waveMode: "LW 0° (from ID)",
    description: "Longitudinal wave from inner diameter (hollow parts)",
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
    description: "Shear wave at 60 degrees",
    entrySurface: "side",
    angle: 60,
    color: "#f97316", // orange
    applicableParts: ["all"]
  },
  {
    code: "K",
    name: "Shear Wave 70°",
    nameHe: "גל גזירה 70°",
    waveMode: "SW 70°",
    description: "Shear wave at 70 degrees",
    entrySurface: "side",
    angle: 70,
    color: "#eab308", // yellow
    applicableParts: ["all"]
  },
  {
    code: "L",
    name: "Radial (Position 2)",
    nameHe: "רדיאלי (מיקום 2)",
    waveMode: "LW 0° (Radial Pos. 2)",
    description: "Additional radial scan from different position",
    entrySurface: "radial",
    angle: 0,
    color: "#a855f7", // violet
    applicableParts: ["round_bar", "tube", "cylinder", "ring", "ring_forging"]
  }
];
