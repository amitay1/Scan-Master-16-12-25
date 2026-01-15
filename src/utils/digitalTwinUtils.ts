/**
 * Digital Twin Utilities
 * Functions for managing 3D indication mapping
 */

import type {
  Position3D,
  IndicationLocation,
  MappedIndication,
  DigitalTwinState,
  TwinStats,
  IndicationImport,
  TwinExportData,
  PartZone,
  ScanCoverage,
} from "@/types/digitalTwin";
import { calculateSeverity, DEFAULT_VIEW_SETTINGS, SEVERITY_THRESHOLDS } from "@/types/digitalTwin";

/**
 * Create a new Digital Twin state
 */
export function createDigitalTwin(
  partNumber: string,
  serialNumber?: string,
  boundingBox?: { min: Position3D; max: Position3D }
): DigitalTwinState {
  return {
    partId: `twin-${Date.now().toString(36)}`,
    partNumber,
    serialNumber,
    boundingBox: boundingBox || {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 100, y: 100, z: 25 },
    },
    indications: [],
    zones: [],
    scanCoverage: [],
    viewSettings: { ...DEFAULT_VIEW_SETTINGS },
    stats: calculateStats([]),
  };
}

/**
 * Add indication to Digital Twin
 */
export function addIndication(
  state: DigitalTwinState,
  location: Omit<IndicationLocation, "id">,
  amplitude: number,
  defectType?: string,
  confidence?: number,
  notes?: string
): DigitalTwinState {
  const indication: MappedIndication = {
    id: `ind-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    location: {
      ...location,
      id: `loc-${Date.now().toString(36)}`,
    },
    amplitude,
    defectType,
    confidence,
    severity: calculateSeverity(amplitude),
    isEvaluated: false,
    notes,
    visible: true,
  };

  const indications = [...state.indications, indication];

  return {
    ...state,
    indications,
    stats: calculateStats(indications),
  };
}

/**
 * Update indication
 */
export function updateIndication(
  state: DigitalTwinState,
  indicationId: string,
  updates: Partial<MappedIndication>
): DigitalTwinState {
  const indications = state.indications.map((ind) =>
    ind.id === indicationId
      ? {
          ...ind,
          ...updates,
          severity: updates.amplitude ? calculateSeverity(updates.amplitude) : ind.severity,
        }
      : ind
  );

  return {
    ...state,
    indications,
    stats: calculateStats(indications),
  };
}

/**
 * Remove indication
 */
export function removeIndication(
  state: DigitalTwinState,
  indicationId: string
): DigitalTwinState {
  const indications = state.indications.filter((ind) => ind.id !== indicationId);

  return {
    ...state,
    indications,
    stats: calculateStats(indications),
  };
}

/**
 * Calculate statistics
 */
export function calculateStats(indications: MappedIndication[]): TwinStats {
  const visible = indications.filter((i) => i.visible);

  return {
    totalIndications: visible.length,
    acceptableCount: visible.filter((i) => i.severity === "acceptable").length,
    recordableCount: visible.filter((i) => i.severity === "recordable").length,
    rejectableCount: visible.filter((i) => i.severity === "rejectable").length,
    coveragePercent: 0, // Calculated separately
    zonesInspected: 0,
    totalZones: 0,
  };
}

/**
 * Import indications from array
 */
export function importIndications(
  state: DigitalTwinState,
  imports: IndicationImport[]
): DigitalTwinState {
  let updatedState = state;

  for (const imp of imports) {
    const location: Omit<IndicationLocation, "id"> = {
      position: { x: imp.x, y: imp.y, z: imp.z ?? imp.depth },
      depth: imp.depth,
      surfacePoint: { x: imp.x, y: imp.y, z: 0 },
      length: imp.length,
      scanDirection: imp.scanDirection,
    };

    updatedState = addIndication(
      updatedState,
      location,
      imp.amplitude,
      undefined,
      undefined,
      imp.notes
    );
  }

  return updatedState;
}

/**
 * Parse CSV import data
 */
export function parseIndicationCSV(csvText: string): IndicationImport[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const imports: IndicationImport[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const record: Record<string, string> = {};

    headers.forEach((h, j) => {
      record[h] = values[j] || "";
    });

    // Map common column names
    const x = parseFloat(record.x || record.x_pos || record.xpos || "0");
    const y = parseFloat(record.y || record.y_pos || record.ypos || "0");
    const z = record.z ? parseFloat(record.z) : undefined;
    const depth = parseFloat(record.depth || record.d || "0");
    const amplitude = parseFloat(record.amplitude || record.amp || record.a || "0");

    if (!isNaN(x) && !isNaN(depth) && !isNaN(amplitude)) {
      imports.push({
        x,
        y,
        z,
        depth,
        amplitude,
        scanDirection: record.scan || record.direction || record.scandir,
        length: record.length ? parseFloat(record.length) : undefined,
        notes: record.notes || record.note || record.comment,
      });
    }
  }

  return imports;
}

/**
 * Export Digital Twin data
 */
export function exportTwinData(state: DigitalTwinState): TwinExportData {
  return {
    partInfo: {
      partNumber: state.partNumber,
      serialNumber: state.serialNumber,
      inspectionDate: new Date().toISOString(),
    },
    summary: state.stats,
    indications: state.indications.map((ind) => ({
      id: ind.id,
      location: formatLocation(ind.location),
      amplitude: ind.amplitude,
      severity: ind.severity,
      defectType: ind.defectType,
      notes: ind.notes,
    })),
  };
}

/**
 * Format location for display
 */
export function formatLocation(loc: IndicationLocation): string {
  const { position, depth } = loc;
  return `X: ${position.x.toFixed(1)}, Y: ${position.y.toFixed(1)}, Depth: ${depth.toFixed(1)}mm`;
}

/**
 * Add zone to Digital Twin
 */
export function addZone(
  state: DigitalTwinState,
  zone: Omit<PartZone, "id">
): DigitalTwinState {
  const newZone: PartZone = {
    ...zone,
    id: `zone-${Date.now().toString(36)}`,
  };

  return {
    ...state,
    zones: [...state.zones, newZone],
    stats: {
      ...state.stats,
      totalZones: state.zones.length + 1,
    },
  };
}

/**
 * Add scan coverage
 */
export function addScanCoverage(
  state: DigitalTwinState,
  coverage: Omit<ScanCoverage, "id">
): DigitalTwinState {
  const newCoverage: ScanCoverage = {
    ...coverage,
    id: `cov-${Date.now().toString(36)}`,
  };

  // Recalculate total coverage
  const totalCoverage = [...state.scanCoverage, newCoverage].reduce(
    (acc, c) => acc + c.coveragePercent,
    0
  ) / (state.scanCoverage.length + 1);

  return {
    ...state,
    scanCoverage: [...state.scanCoverage, newCoverage],
    stats: {
      ...state.stats,
      coveragePercent: Math.min(100, totalCoverage),
    },
  };
}

/**
 * Filter indications based on view settings
 */
export function filterIndications(
  indications: MappedIndication[],
  settings: DigitalTwinState["viewSettings"]
): MappedIndication[] {
  return indications.filter((ind) => {
    // Severity filter
    if (!settings.severityFilter.includes(ind.severity)) {
      return false;
    }

    // Amplitude filter
    if (settings.minAmplitude !== undefined && ind.amplitude < settings.minAmplitude) {
      return false;
    }
    if (settings.maxAmplitude !== undefined && ind.amplitude > settings.maxAmplitude) {
      return false;
    }

    // Defect type filter
    if (
      settings.defectTypeFilter &&
      settings.defectTypeFilter.length > 0 &&
      ind.defectType &&
      !settings.defectTypeFilter.includes(ind.defectType)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Get indication color based on severity
 */
export function getIndicationColor(
  indication: MappedIndication,
  settings: DigitalTwinState["viewSettings"]
): string {
  if (indication.color) return indication.color;

  switch (indication.severity) {
    case "rejectable":
      return settings.rejectableColor;
    case "recordable":
      return settings.recordableColor;
    default:
      return settings.acceptableColor;
  }
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(a: Position3D, b: Position3D): number {
  return Math.sqrt(
    Math.pow(b.x - a.x, 2) +
    Math.pow(b.y - a.y, 2) +
    Math.pow(b.z - a.z, 2)
  );
}

/**
 * Check if point is inside zone
 */
export function isPointInZone(point: Position3D, zone: PartZone): boolean {
  // Simple 2D polygon check (ignoring Z for now)
  const vertices = zone.vertices;
  let inside = false;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Generate sample data for testing
 */
export function generateSampleTwin(): DigitalTwinState {
  const state = createDigitalTwin("SAMPLE-001", "SN-12345", {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 200, y: 100, z: 25 },
  });

  // Add sample indications
  const sampleIndications: IndicationImport[] = [
    { x: 50, y: 30, depth: 5, amplitude: 45, notes: "Minor porosity" },
    { x: 100, y: 50, depth: 12, amplitude: 75, notes: "Recordable - evaluate" },
    { x: 150, y: 70, depth: 8, amplitude: 120, notes: "Rejectable - crack suspected" },
    { x: 75, y: 25, depth: 15, amplitude: 35, notes: "Below threshold" },
    { x: 125, y: 60, depth: 10, amplitude: 95, notes: "Near rejection" },
  ];

  return importIndications(state, sampleIndications);
}
