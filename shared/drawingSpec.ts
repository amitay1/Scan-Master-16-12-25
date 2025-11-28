// Shared TypeScript representation of the generic CAD spec used by
// the Python drawing engine. This allows the frontend and backend to
// build JSON specs that can be passed to `job_runner.py` at runtime.

export type CadOperationType =
  | "SketchCircle"
  | "Extrude"
  | "BaseBox"
  | "CutBox"
  | "ThroughHole";

export interface SketchCircleOp {
  type: "SketchCircle";
  radius: number;
  is_hole?: boolean;
}

export interface ExtrudeOp {
  type: "Extrude";
  length: number;
}

export interface BaseBoxOp {
  type: "BaseBox";
  width: number;
  depth: number;
  height: number;
  centered_xy?: boolean;
  centered_z?: boolean;
}

export interface CutBoxOp {
  type: "CutBox";
  width: number;
  depth: number;
  height: number;
  center: [number, number, number];
}

export interface ThroughHoleOp {
  type: "ThroughHole";
  radius: number;
  depth: number;
  axis?: "x" | "y" | "z";
  center?: [number, number, number];
}

export type CadOperation =
  | SketchCircleOp
  | ExtrudeOp
  | BaseBoxOp
  | CutBoxOp
  | ThroughHoleOp;

export interface SolidSpecDTO {
  id: string;
  operations: CadOperation[];
}

export interface ViewSpecDTO {
  id: string;
  direction: [number, number, number];
  is_section?: boolean;
  section_normal?: [number, number, number] | null;
  scale?: number;
}

export interface DimensionSpecDTO {
  view_id: string;
  kind: string;
  label: string;
  edges?: string[];
}

export interface DrawingSpecDTO {
  page_title: string;
  template_path: string;
  views: ViewSpecDTO[];
  dimensions: DimensionSpecDTO[];
}

export interface CadJobDTO {
  solid: SolidSpecDTO;
  drawing: DrawingSpecDTO;
  output_pdf: string;
  output_svg?: string;
}

// Convenience builders for common parts. These are *examples* of how
// to turn user inputs into generic specs without hard-coding logic on
// the Python side.

export interface FullRingParams {
  id: string;
  length: number;
  od: number;
  idInner: number;
}

export function buildFullRingJob(
  params: FullRingParams,
  templatePath: string,
  outputPdf: string,
): CadJobDTO {
  const solid: SolidSpecDTO = {
    id: params.id,
    operations: [
      { type: "SketchCircle", radius: params.od / 2, is_hole: false },
      { type: "SketchCircle", radius: params.idInner / 2, is_hole: true },
      { type: "Extrude", length: params.length },
    ],
  };

  const view: ViewSpecDTO = {
    id: "SECTION_AA",
    direction: [0, 1, 0],
    is_section: true,
    section_normal: [0, 1, 0],
    scale: 0.25,
  };

  const drawing: DrawingSpecDTO = {
    page_title: `DRW_${params.id}`,
    template_path: templatePath,
    views: [view],
    dimensions: [], // dimensions can be added later using edge names from FreeCAD
  };

  return {
    solid,
    drawing,
    output_pdf: outputPdf,
  };
}

export interface CalibrationBlockParams {
  id: string;
  blockLength: number;
  blockWidth: number;
  blockHeight: number;
  stepLength: number;
  stepHeight: number;
  holeRadius: number;
  holeOffsetX: number;
  holeOffsetY: number;
  holeSpacingX: number;
}

export function buildCalibrationBlockJob(
  p: CalibrationBlockParams,
  templatePath: string,
  outputPdf: string,
): CadJobDTO {
  const base: BaseBoxOp = {
    type: "BaseBox",
    width: p.blockLength,
    depth: p.blockWidth,
    height: p.blockHeight,
    centered_xy: false,
    centered_z: false,
  };

  const step: CutBoxOp = {
    type: "CutBox",
    width: p.stepLength,
    depth: p.blockWidth,
    height: p.stepHeight,
    center: [
      p.stepLength / 2,
      p.blockWidth / 2,
      p.blockHeight - p.stepHeight / 2,
    ],
  };

  const hole1: ThroughHoleOp = {
    type: "ThroughHole",
    radius: p.holeRadius,
    depth: p.blockHeight,
    axis: "z",
    center: [p.holeOffsetX, p.holeOffsetY, p.blockHeight / 2],
  };

  const hole2: ThroughHoleOp = {
    type: "ThroughHole",
    radius: p.holeRadius,
    depth: p.blockHeight,
    axis: "z",
    center: [
      p.holeOffsetX + p.holeSpacingX,
      p.holeOffsetY,
      p.blockHeight / 2,
    ],
  };

  const solid: SolidSpecDTO = {
    id: p.id,
    operations: [base, step, hole1, hole2],
  };

  const front: ViewSpecDTO = {
    id: "FRONT",
    direction: [0, -1, 0],
    scale: 0.5,
  };

  const top: ViewSpecDTO = {
    id: "TOP",
    direction: [0, 0, 1],
    scale: 0.5,
  };

  const iso: ViewSpecDTO = {
    id: "ISO",
    direction: [1, -1, 1],
    scale: 0.4,
  };

  const drawing: DrawingSpecDTO = {
    page_title: `DRW_${p.id}`,
    template_path: templatePath,
    views: [front, top, iso],
    dimensions: [],
  };

  return {
    solid,
    drawing,
    output_pdf: outputPdf,
  };
}
