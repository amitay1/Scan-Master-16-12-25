/**
 * Professional Ring Segment Block Drawing Module - TUV-17 Quality
 *
 * Creates professional-grade technical drawings matching TUV-17 reference quality.
 *
 * Features:
 * - Multi-view layout (Top View, Section A-A, Section B-B, Section C-E, Isometric)
 * - ISO 128 compliant line standards
 * - Ordinate dimensioning chains
 * - Professional cross-hatching (45° ISO pattern)
 * - Section cut indicators with proper ISO arrows
 * - Hidden line representation for projected holes
 * - Isometric 3D projection
 */

import paper from 'paper';
import { calculateArcBoundingBox } from '@/utils/ringSegmentBlock/geometry';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BlockGeometry {
  outerDiameterMm: number;
  innerDiameterMm: number;
  axialWidthMm: number;
  segmentAngleDeg: number;
}

export interface HoleData {
  label: string;
  angleOnArcDeg: number;
  axialPositionMm: number;
  depthMm: number;
  diameterMm: number;
  reflectorType?: 'SDH' | 'FBH';
}

export interface DrawingConfig {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  showDimensions: boolean;
  showCenterlines: boolean;
  showHatching: boolean;
  showHiddenLines: boolean;
  language: 'en' | 'fr' | 'he';
}

export interface ViewPort {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  label: string;
}

// ============================================================================
// LINE STANDARDS (ISO 128-24:1999) - Professional Quality
// ============================================================================

const LINE_STYLES = {
  // Type A - Visible outlines/edges (continuous thick) - 0.7mm
  visible: {
    strokeWidth: 1.0,
    strokeColor: '#000000',
    dashArray: null as number[] | null,
  },
  // Type A - Extra thick for main outlines
  visibleThick: {
    strokeWidth: 1.4,
    strokeColor: '#000000',
    dashArray: null as number[] | null,
  },
  // Type B - Hidden edges (dashed thin) - 0.35mm
  hidden: {
    strokeWidth: 0.5,
    strokeColor: '#666666',
    dashArray: [8, 3],
  },
  // Type G - Center lines (chain thin: long-short-long) - 0.35mm
  center: {
    strokeWidth: 0.4,
    strokeColor: '#000000',
    dashArray: [25, 4, 3, 4],
  },
  // Type B - Dimension/leader lines (continuous thin) - 0.25mm
  dimension: {
    strokeWidth: 0.35,
    strokeColor: '#000000',
    dashArray: null as number[] | null,
  },
  // Type H - Section cutting plane (chain thick) - 0.7mm
  section: {
    strokeWidth: 1.0,
    strokeColor: '#000000',
    dashArray: [25, 4, 3, 4],
  },
  // Section arrows
  sectionArrow: {
    strokeWidth: 0.7,
    strokeColor: '#000000',
    dashArray: null as number[] | null,
  },
  // Type J - Hatching lines (continuous extra-thin) - 0.18mm
  hatching: {
    strokeWidth: 0.25,
    strokeColor: '#000000',
    dashArray: null as number[] | null,
  },
  // Construction/reference lines (for hole annotations) - Changed to thin black for cleaner look
  holeAnnotation: {
    strokeWidth: 0.35,
    strokeColor: '#000000',
    dashArray: null as number[] | null,  // Solid line instead of dashed
  },
  // Guide lines for angular hole positions
  guide: {
    strokeWidth: 0.35,
    strokeColor: '#000000',
    dashArray: [4, 4],
  },
  // Scan path overlay arcs (red dashed)
  scan: {
    strokeWidth: 0.5,
    strokeColor: '#CC0000',
    dashArray: [8, 4],
  },
  // Phantom lines for motion/reference
  phantom: {
    strokeWidth: 0.35,
    strokeColor: '#000000',
    dashArray: [30, 4, 3, 4, 3, 4],
  },
};

// Font settings for dimensions - Professional quality
const FONT_SETTINGS = {
  dimension: { size: 11, family: 'Arial', weight: 'normal' },
  dimensionBold: { size: 11, family: 'Arial', weight: 'bold' },
  label: { size: 13, family: 'Arial', weight: 'bold' },
  holeLabel: { size: 12, family: 'Arial', weight: 'bold' },
  title: { size: 14, family: 'Arial', weight: 'bold' },
  sectionLabel: { size: 15, family: 'Arial', weight: 'bold' },
  note: { size: 9, family: 'Arial', weight: 'normal' },
};

// Drawing constants for professional appearance
const DRAWING_CONSTANTS = {
  HATCHING_SPACING: 3, // mm between hatching lines (tighter for better fill)
  HATCHING_ANGLE: 45, // degrees (ISO standard)
  DIMENSION_ARROW_SIZE: 8, // pixels
  DIMENSION_TEXT_OFFSET: 12, // pixels from dimension line
  SECTION_ARROW_SIZE: 12, // pixels for section cut arrows
  SECTION_LABEL_OFFSET: 20, // pixels from section line
  CENTERLINE_OVERHANG: 10, // pixels beyond outline
  HOLE_LABEL_OFFSET: 15, // pixels from hole center
};

// ============================================================================
// PROFESSIONAL DRAWING CLASS
// ============================================================================

export class ProfessionalRingSegmentDrawing {
  private scope: paper.PaperScope;
  private canvas: HTMLCanvasElement;
  private config: DrawingConfig;
  private geometry: BlockGeometry;
  private holes: HoleData[];

  // Calculated values
  private wallThickness: number = 0;
  private meanRadius: number = 0;
  private outerRadius: number = 0;
  private innerRadius: number = 0;

  // View references for section cut positioning
  private sectionAngles: { A: number; B: number; CE: number } = { A: 0, B: 0, CE: 0 };
  private topViewLabelBounds: paper.Rectangle[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    geometry: BlockGeometry,
    holes: HoleData[],
    config: Partial<DrawingConfig> = {}
  ) {
    this.canvas = canvas;
    this.geometry = geometry;
    this.holes = holes.sort((a, b) => a.angleOnArcDeg - b.angleOnArcDeg);
    this.config = {
      canvasWidth: config.canvasWidth || 1400,
      canvasHeight: config.canvasHeight || 1000,
      backgroundColor: config.backgroundColor || '#FFFFFF',
      showDimensions: config.showDimensions ?? true,
      showCenterlines: config.showCenterlines ?? true,
      showHatching: config.showHatching ?? true,
      showHiddenLines: config.showHiddenLines ?? true,
      language: config.language || 'en',
    };

    // Initialize Paper.js with robust setup
    this.scope = new paper.PaperScope();

    // Ensure canvas has proper dimensions before setup
    canvas.width = this.config.canvasWidth;
    canvas.height = this.config.canvasHeight;

    try {
      // Setup Paper.js with the canvas
      this.scope.setup(canvas);

      // Activate this scope to ensure it's the current drawing context
      this.scope.activate();

      // Explicitly set view size to match canvas dimensions
      if (this.scope.view) {
        this.scope.view.viewSize = new paper.Size(
          this.config.canvasWidth,
          this.config.canvasHeight
        );
      } else {
        console.error('Paper.js view not initialized properly');
        throw new Error('Failed to initialize Paper.js view');
      }
    } catch (err) {
      console.error('Error initializing Paper.js:', err);
      throw new Error(`Failed to setup Paper.js: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Validate and calculate derived values
    this.validateGeometry();
    this.calculateDerivedValues();
    this.calculateSectionAngles();
  }

  private validateGeometry(): void {
    // Ensure geometry values are valid numbers
    if (
      !Number.isFinite(this.geometry.outerDiameterMm) ||
      !Number.isFinite(this.geometry.innerDiameterMm) ||
      !Number.isFinite(this.geometry.axialWidthMm) ||
      !Number.isFinite(this.geometry.segmentAngleDeg)
    ) {
      throw new Error('Invalid geometry: all dimensions must be finite numbers');
    }

    // Ensure positive values
    if (
      this.geometry.outerDiameterMm <= 0 ||
      this.geometry.innerDiameterMm <= 0 ||
      this.geometry.axialWidthMm <= 0 ||
      this.geometry.segmentAngleDeg <= 0
    ) {
      throw new Error('Invalid geometry: all dimensions must be positive');
    }

    // Ensure OD > ID
    if (this.geometry.outerDiameterMm <= this.geometry.innerDiameterMm) {
      throw new Error('Invalid geometry: outer diameter must be greater than inner diameter');
    }
  }

  private calculateDerivedValues(): void {
    this.outerRadius = this.geometry.outerDiameterMm / 2;
    this.innerRadius = this.geometry.innerDiameterMm / 2;
    this.wallThickness = this.outerRadius - this.innerRadius;
    this.meanRadius = (this.outerRadius + this.innerRadius) / 2;
  }

  private calculateSectionAngles(): void {
    // Calculate section angles based on hole positions (like TUV-17)
    const startAngle = -this.geometry.segmentAngleDeg / 2;
    const midAngle = startAngle + this.geometry.segmentAngleDeg / 2;

    // Section B-B centered on the segment (vertical centerline in top view)
    this.sectionAngles.B = midAngle;

    if (this.holes.length > 0) {
      // Section A-A at first hole
      this.sectionAngles.A = startAngle + this.holes[0].angleOnArcDeg;
      // Section C-E at last hole (right-side cut)
      this.sectionAngles.CE = startAngle + this.holes[this.holes.length - 1].angleOnArcDeg;
    } else {
      // Default positions if not enough holes
      this.sectionAngles.A = startAngle + this.geometry.segmentAngleDeg * 0.2;
      this.sectionAngles.CE = startAngle + this.geometry.segmentAngleDeg * 0.8;
    }
  }

  // ============================================================================
  // MAIN DRAWING METHOD
  // ============================================================================

  public draw(): void {
    try {
      // Ensure this scope is active
      this.scope.activate();

      // Clear any previous content
      this.scope.project.clear();

      // Set background
      const background = new this.scope.Path.Rectangle(
        new this.scope.Rectangle(0, 0, this.config.canvasWidth, this.config.canvasHeight)
      );
      background.fillColor = new this.scope.Color(this.config.backgroundColor);

      // Calculate viewport layout (matching TUV-17)
      const viewports = this.calculateTUV17Layout();

      // Draw each view in correct order
      this.drawTopView(viewports.topView);
      this.drawSectionAA(viewports.sectionAA);
      this.drawSectionBB(viewports.sectionBB);
      this.drawSectionCE(viewports.sectionCE);
      this.drawIsometricView(viewports.isometric);

      // Draw title block and border
      this.drawTitleBlock();
      this.drawBorderFrame();

      // Add drawing notes
      this.drawDrawingNotes(viewports);

      // Force view update and redraw
      if (this.scope.view) {
        this.scope.view.update();
      }
    } catch (error) {
      console.error('Error in ProfessionalRingSegmentDrawing.draw():', error);
      throw error;
    }
  }

  // ============================================================================
  // TUV-17 STYLE LAYOUT
  // ============================================================================

  private calculateTUV17Layout(): {
    topView: ViewPort;
    sectionAA: ViewPort;
    sectionBB: ViewPort;
    sectionCE: ViewPort;
    isometric: ViewPort;
  } {
    const margin = 30;
    const w = this.config.canvasWidth;
    const h = this.config.canvasHeight;
    const isLargeBlock = this.geometry.outerDiameterMm >= 600;

    // TUV-17 Layout:
    // ┌─────────────────────────────────────────────────┐
    // │  Section A-A    │        TOP VIEW               │
    // │  (small)        │        (large, main view)     │
    // ├─────────────────┤                               │
    // │  Section B-B    │                               │
    // │  (small)        │                               │
    // ├────────┬────────┼───────────────────────────────┤
    // │ Note   │ C-E    │     ISOMETRIC                 │
    // └────────┴────────┴───────────────────────────────┘

    const leftColWidth = w * (isLargeBlock ? 0.22 : 0.20);
    const topViewWidth = w * (isLargeBlock ? 0.58 : 0.55);
    const isoWidth = Math.max(
      w - leftColWidth - topViewWidth,
      w * (isLargeBlock ? 0.20 : 0.22)
    );
    const sectionHeight = h * (isLargeBlock ? 0.30 : 0.30);

    return {
      sectionAA: {
        x: margin,
        y: margin,
        width: leftColWidth - margin,
        height: sectionHeight,
        scale: this.calculateSectionScale(leftColWidth - margin * 2, sectionHeight - 40),
        label: 'A - A',
      },
      sectionBB: {
        x: margin,
        y: margin + sectionHeight + 20,
        width: leftColWidth - margin,
        height: sectionHeight,
        scale: this.calculateSectionScale(leftColWidth - margin * 2, sectionHeight - 40),
        label: 'B - B',
      },
      sectionCE: {
        x: margin,
        y: margin + sectionHeight * 2 + 50,
        width: leftColWidth - margin,
        height: h * (isLargeBlock ? 0.22 : 0.25),
        scale: this.calculateSectionScale(leftColWidth - margin * 2, h * 0.2),
        label: 'C - C',
      },
      topView: {
        x: leftColWidth + margin,
        y: margin,
        width: topViewWidth,
        height: h * (isLargeBlock ? 0.68 : 0.65),
        scale: this.calculateTopViewScale(
          topViewWidth - margin,
          h * (isLargeBlock ? 0.63 : 0.6)
        ),
        label: '',
      },
      isometric: {
        x: leftColWidth + topViewWidth + margin,
        y: h * 0.5,
        width: isoWidth - margin * 2,
        height: h * 0.45,
        scale: this.calculateIsometricScale(isoWidth - margin * 3, h * 0.4),
        label: '',
      },
    };
  }

  private calculateTopViewScale(width: number, height: number): number {
    const startAngle = -this.geometry.segmentAngleDeg / 2;
    const endAngle = this.geometry.segmentAngleDeg / 2;
    const bbox = calculateArcBoundingBox(0, 0, this.outerRadius, startAngle, endAngle);
    const baseMargin = this.geometry.outerDiameterMm >= 600
      ? Math.min(width, height) * 0.26
      : Math.min(width, height) * 0.18;
    const margin = Math.max(60, baseMargin);
    const availableWidth = Math.max(1, width - margin * 2);
    const availableHeight = Math.max(1, height - margin * 2);
    return Math.min(availableWidth / bbox.width, availableHeight / bbox.height);
  }

  private calculateSectionScale(width: number, height: number): number {
    const sectionWidth = this.wallThickness * 2;
    const sectionHeight = this.geometry.axialWidthMm * 1.5;
    const baseScale = Math.min(width / sectionWidth, height / sectionHeight);
    return baseScale * (this.geometry.outerDiameterMm >= 600 ? 0.85 : 0.7);
  }

  private calculateIsometricScale(width: number, height: number): number {
    const maxDim = this.geometry.outerDiameterMm * 1.3;
    return Math.min(width / maxDim, height / maxDim) * 0.5;
  }

  // ============================================================================
  // TOP VIEW (Main Arc Segment View with all dimensions like TUV-17)
  // ============================================================================

  private drawTopView(vp: ViewPort): void {
    const scale = vp.scale;
    const startAngle = -this.geometry.segmentAngleDeg / 2;
    const endAngle = this.geometry.segmentAngleDeg / 2;
    const bbox = calculateArcBoundingBox(0, 0, this.outerRadius, startAngle, endAngle);
    const viewCenterX = vp.x + vp.width / 2;
    const viewCenterY = vp.y + vp.height / 2;
    const bboxCenterX = (bbox.minX + bbox.maxX) / 2;
    const bboxCenterY = (bbox.minY + bbox.maxY) / 2;
    const cx = viewCenterX - bboxCenterX * scale;
    const cy = viewCenterY - bboxCenterY * scale;

    const outerR = this.outerRadius * scale;
    const innerR = this.innerRadius * scale;
    const meanR = this.meanRadius * scale;

    this.resetTopViewLabelBounds();

    console.log('[RingSegment] drawTopView - cx:', cx, 'cy:', cy, 'scale:', scale, 'outerR:', outerR, 'innerR:', innerR);

    try {
      // 1. Draw arc segment outline (thick visible lines)
      this.drawArcSegmentOutline(cx, cy, innerR, outerR, startAngle, endAngle);
      console.log('[RingSegment] drawArcSegmentOutline done');
    } catch (err) {
      console.error('[RingSegment] Error in drawArcSegmentOutline:', err);
    }

    try {
      // 2. Draw center lines
      if (this.config.showCenterlines) {
        this.drawTopViewCenterlines(cx, cy, innerR, outerR, startAngle, endAngle);
        console.log('[RingSegment] drawTopViewCenterlines done');
      }
    } catch (err) {
      console.error('[RingSegment] Error in drawTopViewCenterlines:', err);
    }

    try {
      // 3. Draw hidden lines (hole projections through the block)
      if (this.config.showHiddenLines) {
        this.drawHiddenHoleProjections(cx, cy, scale, startAngle);
        console.log('[RingSegment] drawHiddenHoleProjections done');
      }
    } catch (err) {
      console.error('[RingSegment] Error in drawHiddenHoleProjections:', err);
    }

    try {
      // 4. Draw scan path overlays (red dashed arcs)
      if (this.config.showDimensions) {
        this.drawScanPathArcs(cx, cy, innerR, outerR, startAngle, endAngle);
        console.log('[RingSegment] drawScanPathArcs done');
      }
    } catch (err) {
      console.error('[RingSegment] Error in drawScanPathArcs:', err);
    }

    try {
      // 5. Draw section cut lines (A-A, B-B, C-E)
      this.drawAllSectionCutLines(cx, cy, innerR, outerR, startAngle);
      console.log('[RingSegment] drawAllSectionCutLines done');
    } catch (err) {
      console.error('[RingSegment] Error in drawAllSectionCutLines:', err);
    }

    try {
      // 6. Draw holes on arc (as circles with labels)
      this.drawHolesOnTopView(cx, cy, scale, startAngle);
      console.log('[RingSegment] drawHolesOnTopView done');
    } catch (err) {
      console.error('[RingSegment] Error in drawHolesOnTopView:', err);
    }

    try {
      // 7. Draw comprehensive dimensions (TUV-17 style)
      if (this.config.showDimensions) {
        this.drawTopViewDimensionsTUV17(cx, cy, scale, outerR, innerR, meanR, startAngle, endAngle);
        console.log('[RingSegment] drawTopViewDimensionsTUV17 done');
      }
    } catch (err) {
      console.error('[RingSegment] Error in drawTopViewDimensionsTUV17:', err);
    }
  }

  private drawArcSegmentOutline(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ): void {
    // Use thicker line for main outlines (like in TUV-17)
    const style = LINE_STYLES.visibleThick;

    // Outer arc (main outline - thick)
    const outerArc = this.createArc(cx, cy, outerR, startAngle, endAngle);
    this.applyStyle(outerArc, style);

    // Inner arc (main outline - thick)
    const innerArc = this.createArc(cx, cy, innerR, startAngle, endAngle);
    this.applyStyle(innerArc, style);

    // Start edge (radial line from outer to inner at start angle - thick)
    const startOuter = this.polarToCartesian(cx, cy, outerR, startAngle);
    const startInner = this.polarToCartesian(cx, cy, innerR, startAngle);
    const startEdge = new this.scope.Path.Line(
      new this.scope.Point(startOuter.x, startOuter.y),
      new this.scope.Point(startInner.x, startInner.y)
    );
    this.applyStyle(startEdge, style);

    // End edge (thick)
    const endOuter = this.polarToCartesian(cx, cy, outerR, endAngle);
    const endInner = this.polarToCartesian(cx, cy, innerR, endAngle);
    const endEdge = new this.scope.Path.Line(
      new this.scope.Point(endOuter.x, endOuter.y),
      new this.scope.Point(endInner.x, endInner.y)
    );
    this.applyStyle(endEdge, style);
  }

  private drawTopViewCenterlines(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ): void {
    const style = LINE_STYLES.center;
    const extend = 60; // Extend beyond outline for professional look

    // Main vertical centerline (symmetry axis at 0°)
    const topPt = this.polarToCartesian(cx, cy, outerR + extend, 0);
    const bottomPt = this.polarToCartesian(cx, cy, innerR * 0.3, 180); // Extend toward center
    const mainCenterLine = new this.scope.Path.Line(
      new this.scope.Point(topPt.x, topPt.y),
      new this.scope.Point(bottomPt.x, bottomPt.y)
    );
    this.applyStyle(mainCenterLine, style);

    // Radial centerlines at start and end edges
    for (const angle of [startAngle, endAngle]) {
      const outerPt = this.polarToCartesian(cx, cy, outerR + extend * 0.5, angle);
      const innerPt = this.polarToCartesian(cx, cy, innerR - extend * 0.3, angle);
      const radialCenterLine = new this.scope.Path.Line(
        new this.scope.Point(innerPt.x, innerPt.y),
        new this.scope.Point(outerPt.x, outerPt.y)
      );
      this.applyStyle(radialCenterLine, style);
    }

    // Concentric arc centerlines showing circular nature
    const meanR = (innerR + outerR) / 2;
    if (this.geometry.outerDiameterMm < 600) {
      // Outer reference arc
      const outerRefArc = this.createArc(cx, cy, outerR + 15, startAngle - 3, endAngle + 3);
      this.applyStyle(outerRefArc, style);

      // Mean radius centerline arc (main reference)
      const meanArc = this.createArc(cx, cy, meanR, startAngle - 5, endAngle + 5);
      this.applyStyle(meanArc, style);

      // Inner reference arc
      const innerRefArc = this.createArc(cx, cy, innerR - 15, startAngle - 3, endAngle + 3);
      this.applyStyle(innerRefArc, style);
    } else {
      // Large blocks: keep only the mean radius to reduce clutter
      const meanArc = this.createArc(cx, cy, meanR, startAngle - 5, endAngle + 5);
      this.applyStyle(meanArc, style);
    }

    // Draw centermarks (small crosses) at hole PCD positions
    // Temporarily disabled for debugging
    // this.drawHoleCentermarks(cx, cy, innerR, outerR, startAngle);
  }

  /**
   * Draw centermarks (small crosses) for each hole position
   * ISO standard centermarks show the center of circular features
   */
  private drawHoleCentermarks(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number
  ): void {
    const style = LINE_STYLES.center;
    const markSize = 12; // Size of centermark cross

    for (const hole of this.holes) {
      const angle = startAngle + hole.angleOnArcDeg;
      const holeRadius = outerR; // Holes are on outer radius
      const pos = this.polarToCartesian(cx, cy, holeRadius, angle);

      // Horizontal line of cross
      const h1 = new this.scope.Path.Line(
        new this.scope.Point(pos.x - markSize, pos.y),
        new this.scope.Point(pos.x + markSize, pos.y)
      );
      this.applyStyle(h1, style);

      // Vertical line of cross
      const v1 = new this.scope.Path.Line(
        new this.scope.Point(pos.x, pos.y - markSize),
        new this.scope.Point(pos.x, pos.y + markSize)
      );
      this.applyStyle(v1, style);

      // Small circle at center (optional ISO feature)
      const centerDot = new this.scope.Path.Circle(
        new this.scope.Point(pos.x, pos.y),
        2
      );
      centerDot.strokeColor = new this.scope.Color(style.strokeColor);
      centerDot.strokeWidth = style.strokeWidth;
    }
  }

  private drawHiddenHoleProjections(
    cx: number,
    cy: number,
    scale: number,
    startAngle: number
  ): void {
    const style = this.geometry.outerDiameterMm >= 600
      ? { ...LINE_STYLES.hidden, strokeWidth: 0.35, strokeColor: '#888888' }
      : LINE_STYLES.hidden;

    for (const hole of this.holes) {
      const angle = startAngle + hole.angleOnArcDeg;

      // Draw hidden line from outer surface through hole to bottom of hole
      const outerPt = this.polarToCartesian(cx, cy, this.outerRadius * scale, angle);
      const holeBottomRadius = (this.outerRadius - hole.depthMm) * scale;
      const holeEndPt = this.polarToCartesian(cx, cy, holeBottomRadius, angle);

      // Main hole projection line (dashed)
      const projectionLine = new this.scope.Path.Line(
        new this.scope.Point(outerPt.x, outerPt.y),
        new this.scope.Point(holeEndPt.x, holeEndPt.y)
      );
      this.applyStyle(projectionLine, style);

      // Draw hidden circle at hole bottom (flat bottom hole - FBH)
      const holeRadius = (hole.diameterMm / 2) * scale;
      const bottomCircle = new this.scope.Path.Circle(
        new this.scope.Point(holeEndPt.x, holeEndPt.y),
        Math.max(holeRadius * 0.8, 2)
      );
      bottomCircle.strokeColor = new this.scope.Color(style.strokeColor);
      bottomCircle.strokeWidth = style.strokeWidth;
      bottomCircle.dashArray = style.dashArray || [];

      // Draw hidden arc showing hole depth extent (perpendicular to radial)
      // This shows the hidden cylindrical boundary of the hole
      const perpAngle1 = angle - 3;
      const perpAngle2 = angle + 3;
      const bottomArc = this.createArc(cx, cy, holeBottomRadius, perpAngle1, perpAngle2);
      this.applyStyle(bottomArc, style);
    }

    // Draw additional hidden lines for internal stepped features
    // Show intermediate radii if the part has steps/contours
    // Temporarily disabled for debugging
    // this.drawInternalContourLines(cx, cy, scale, startAngle);
  }

  private drawScanPathArcs(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ): void {
    const style = LINE_STYLES.scan;
    const thickness = outerR - innerR;

    if (thickness <= 0) {
      return;
    }

    const scale = outerR / this.outerRadius;
    const radii: number[] = [];
    const minMargin = Math.max(6, thickness * 0.08);
    const minR = innerR + minMargin;
    const maxR = outerR - minMargin;

    const addRadius = (radius: number) => {
      const clamped = Math.min(Math.max(radius, minR), maxR);
      if (!radii.some((r) => Math.abs(r - clamped) < 3)) {
        radii.push(clamped);
      }
    };

    const depthGuides = this.getReferenceDepthsMm();
    for (const depth of depthGuides) {
      const radius = (this.outerRadius - depth) * scale;
      addRadius(radius);
    }

    const targetCount = Math.max(3, depthGuides.length);

    if (radii.length < targetCount) {
      const step = targetCount > 1 ? (maxR - minR) / (targetCount - 1) : 0;
      for (let i = 0; i < targetCount; i++) {
        addRadius(minR + step * i);
      }
    }

    radii.sort((a, b) => a - b);

    for (const radius of radii) {
      const arc = this.createArc(cx, cy, radius, startAngle + 1, endAngle - 1);
      this.applyStyle(arc, style);
    }
  }

  /**
   * Draw hidden lines for internal stepped features/contours
   * These show the stepped profile of the part from the top view
   */
  private drawInternalContourLines(
    cx: number,
    cy: number,
    scale: number,
    startAngle: number
  ): void {
    const style = LINE_STYLES.hidden;
    const endAngle = -startAngle; // Symmetric

    // Calculate step positions based on holes
    // Each hole depth creates a potential step level
    const uniqueDepths = [...new Set(this.holes.map(h => h.depthMm))].sort((a, b) => a - b);

    for (const depth of uniqueDepths) {
      const stepRadius = (this.outerRadius - depth) * scale;

      // Only draw if the step is visible (between inner and outer radius)
      if (stepRadius > this.innerRadius * scale && stepRadius < this.outerRadius * scale) {
        // Draw hidden arc at this step level
        const stepArc = this.createArc(cx, cy, stepRadius, startAngle + 2, endAngle - 2);
        this.applyStyle(stepArc, style);
      }
    }

    // Draw phantom line showing the PCD (Pitch Circle Diameter) for holes
    if (this.holes.length > 0) {
      const pcdRadius = this.outerRadius * scale; // Holes are at OD
      const pcdArc = this.createArc(cx, cy, pcdRadius, startAngle - 2, endAngle + 2);
      this.applyStyle(pcdArc, LINE_STYLES.phantom);
    }
  }

  private drawAllSectionCutLines(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number
  ): void {
    // Section A-A
    this.drawSectionCutLineISO(cx, cy, innerR, outerR, this.sectionAngles.A, 'A', 'A');

    // Section B-B
    this.drawSectionCutLineISO(cx, cy, innerR, outerR, this.sectionAngles.B, 'B', 'B');

    // Section C-E (if defined)
    if (Number.isFinite(this.sectionAngles.CE)) {
      this.drawSectionCutLineISO(cx, cy, innerR, outerR, this.sectionAngles.CE, 'C', 'C');
    }
  }

  private drawSectionCutLineISO(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    angle: number,
    labelStart: string,
    labelEnd: string
  ): void {
    const style = LINE_STYLES.section;
    const extend = 70; // Longer extension for better visibility

    // Calculate cut line endpoints
    const innerPt = this.polarToCartesian(cx, cy, innerR - extend, angle);
    const outerPt = this.polarToCartesian(cx, cy, outerR + extend, angle);

    // Draw the section cut line with thick dashes at ends (ISO standard)
    // First draw the main cutting plane line
    const cutLine = new this.scope.Path.Line(
      new this.scope.Point(innerPt.x, innerPt.y),
      new this.scope.Point(outerPt.x, outerPt.y)
    );
    this.applyStyle(cutLine, style);

    // Add thick end segments (ISO 128-40 style - thick line at ends of cutting plane)
    const endSegmentLength = 15;
    const rad = (angle - 90) * Math.PI / 180;

    // Inner end thick segment
    const innerEndPt = {
      x: innerPt.x + endSegmentLength * Math.cos(rad),
      y: innerPt.y + endSegmentLength * Math.sin(rad)
    };
    const innerEndLine = new this.scope.Path.Line(
      new this.scope.Point(innerPt.x, innerPt.y),
      new this.scope.Point(innerEndPt.x, innerEndPt.y)
    );
    this.applyStyle(innerEndLine, LINE_STYLES.visibleThick);

    // Outer end thick segment
    const outerEndPt = {
      x: outerPt.x - endSegmentLength * Math.cos(rad),
      y: outerPt.y - endSegmentLength * Math.sin(rad)
    };
    const outerEndLine = new this.scope.Path.Line(
      new this.scope.Point(outerPt.x, outerPt.y),
      new this.scope.Point(outerEndPt.x, outerEndPt.y)
    );
    this.applyStyle(outerEndLine, LINE_STYLES.visibleThick);

    // Draw ISO-style section arrows (perpendicular to cut line, pointing toward view direction)
    this.drawISOSectionArrow(innerPt.x, innerPt.y, angle - 90, labelStart);
    this.drawISOSectionArrow(outerPt.x, outerPt.y, angle + 90, labelEnd);
  }

  private drawISOSectionArrow(
    x: number,
    y: number,
    directionAngle: number,
    label: string
  ): void {
    // ISO 128-40 compliant section arrow
    const arrowLength = 18;
    const arrowHeadLength = 10;
    const arrowHeadWidth = 5;
    const rad = (directionAngle - 90) * Math.PI / 180;

    // Arrow shaft
    const shaftEndX = x + arrowLength * Math.cos(rad);
    const shaftEndY = y + arrowLength * Math.sin(rad);

    const shaft = new this.scope.Path.Line(
      new this.scope.Point(x, y),
      new this.scope.Point(shaftEndX, shaftEndY)
    );
    this.applyStyle(shaft, LINE_STYLES.visible);

    // Arrow head (filled triangle)
    const headTipX = shaftEndX + arrowHeadLength * Math.cos(rad);
    const headTipY = shaftEndY + arrowHeadLength * Math.sin(rad);

    const arrow = new this.scope.Path();
    arrow.add(new this.scope.Point(headTipX, headTipY));
    arrow.add(new this.scope.Point(
      shaftEndX + arrowHeadWidth * Math.cos(rad + Math.PI / 2),
      shaftEndY + arrowHeadWidth * Math.sin(rad + Math.PI / 2)
    ));
    arrow.add(new this.scope.Point(
      shaftEndX + arrowHeadWidth * Math.cos(rad - Math.PI / 2),
      shaftEndY + arrowHeadWidth * Math.sin(rad - Math.PI / 2)
    ));
    arrow.closed = true;
    arrow.fillColor = new this.scope.Color('#000000');

    // Label (circled letter)
    const labelX = headTipX + 15 * Math.cos(rad);
    const labelY = headTipY + 15 * Math.sin(rad);

    // Circle around label
    const labelCircle = new this.scope.Path.Circle(
      new this.scope.Point(labelX, labelY),
      10
    );
    labelCircle.strokeColor = new this.scope.Color('#000000');
    labelCircle.strokeWidth = LINE_STYLES.dimension.strokeWidth;
    labelCircle.fillColor = new this.scope.Color('#FFFFFF');

    // Label text
    const text = new this.scope.PointText(new this.scope.Point(labelX, labelY + 3));
    text.content = label;
    text.fontSize = FONT_SETTINGS.label.size;
    text.fontWeight = FONT_SETTINGS.label.weight;
    text.fontFamily = FONT_SETTINGS.label.family;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'center';
  }

  private drawHolesOnTopView(
    cx: number,
    cy: number,
    scale: number,
    startAngle: number
  ): void {
    const showBalloons = this.geometry.outerDiameterMm < 500;
    const showCross = this.geometry.outerDiameterMm < 500;

    for (let i = 0; i < this.holes.length; i++) {
      const hole = this.holes[i];
      const angle = startAngle + hole.angleOnArcDeg;

      // Hole position (radial depth for SDH, outer surface for FBH)
      const isRadial = hole.reflectorType !== 'FBH';
      const rawRadius = isRadial ? (this.outerRadius - hole.depthMm) : this.outerRadius;
      const clampedRadius = Math.min(Math.max(rawRadius, this.innerRadius), this.outerRadius);
      const holeRadius = clampedRadius * scale;
      const pos = this.polarToCartesian(cx, cy, holeRadius, angle);

      // Draw hole circle (visible from top) - use thicker line for visibility
      const holeSize = Math.max((hole.diameterMm / 2) * scale, showBalloons ? 5 : 3);
      const circle = new this.scope.Path.Circle(
        new this.scope.Point(pos.x, pos.y),
        holeSize
      );
      circle.strokeColor = new this.scope.Color('#000000');
      circle.strokeWidth = LINE_STYLES.visible.strokeWidth;
      circle.fillColor = new this.scope.Color('#FFFFFF');

      if (showCross) {
        // Cross in hole center (drilling/center symbol) - subtle thin lines
        const crossSize = holeSize * 0.6;
        const cross1 = new this.scope.Path.Line(
          new this.scope.Point(pos.x - crossSize, pos.y),
          new this.scope.Point(pos.x + crossSize, pos.y)
        );
        cross1.strokeColor = new this.scope.Color('#000000');
        cross1.strokeWidth = LINE_STYLES.center.strokeWidth;

        const cross2 = new this.scope.Path.Line(
          new this.scope.Point(pos.x, pos.y - crossSize),
          new this.scope.Point(pos.x, pos.y + crossSize)
        );
        cross2.strokeColor = new this.scope.Color('#000000');
        cross2.strokeWidth = LINE_STYLES.center.strokeWidth;
      }

      if (showBalloons) {
        // Hole label with lettered balloon (A, B, C ...)
        // Position balloons at staggered distances to avoid overlap
        const labelRadiusOffset = 50 + (i % 2) * 20; // Alternate distances
        const labelRadius = holeRadius + labelRadiusOffset;
        const labelPos = this.polarToCartesian(cx, cy, labelRadius, angle);

        // Balloon circle (black outline, cleaner look)
        const balloonSize = 11;
        const balloon = new this.scope.Path.Circle(
          new this.scope.Point(labelPos.x, labelPos.y),
          balloonSize
        );
        balloon.strokeColor = new this.scope.Color('#CC0000');
        balloon.strokeWidth = 1.2;
        balloon.fillColor = new this.scope.Color('#FFFFFF');

        // Label text - use hole label when available
        const labelText = hole.label || `#${i + 1}`;
        const label = new this.scope.PointText(new this.scope.Point(labelPos.x, labelPos.y + 4));
        label.content = labelText;
        label.fontSize = FONT_SETTINGS.holeLabel.size - 1;
        label.fontWeight = FONT_SETTINGS.holeLabel.weight;
        label.fontFamily = FONT_SETTINGS.holeLabel.family;
        label.fillColor = new this.scope.Color('#CC0000');
        label.justification = 'center';

        // Leader line from balloon to hole - use thin black line instead of red dashed
        const leaderLine = new this.scope.Path.Line(
          new this.scope.Point(pos.x, pos.y),
          new this.scope.Point(labelPos.x, labelPos.y)
        );
        this.applyStyle(leaderLine, LINE_STYLES.holeAnnotation);
      }
    }
  }

  private drawHoleAngleMarkers(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number
  ): void {
    const isLarge = this.geometry.outerDiameterMm >= 600;
    const tickLength = isLarge ? 7 : 6;
    const labelOffset = isLarge ? 20 : 16;
    const radius = innerR - Math.max(
      isLarge ? 30 : 20,
      (outerR - innerR) * (isLarge ? 0.35 : 0.25)
    );

    for (let i = 0; i < this.holes.length; i++) {
      const hole = this.holes[i];
      const angle = startAngle + hole.angleOnArcDeg;

      const tickStart = this.polarToCartesian(cx, cy, radius - tickLength, angle);
      const tickEnd = this.polarToCartesian(cx, cy, radius + tickLength, angle);
      const tick = new this.scope.Path.Line(
        new this.scope.Point(tickStart.x, tickStart.y),
        new this.scope.Point(tickEnd.x, tickEnd.y)
      );
      this.applyStyle(tick, LINE_STYLES.dimension);

      const baseRadius = radius + labelOffset;
      const radiusCandidates = [
        baseRadius,
        baseRadius - 12,
        baseRadius - 24,
        baseRadius + 12,
        baseRadius + 24,
      ].filter((r) => r > innerR * 0.2);
      const angleOffsets = isLarge ? [0, -3, 3, -6, 6] : [0, -2, 2];
      const candidatePoints: Array<{ x: number; y: number }> = [];

      for (const candidateRadius of radiusCandidates) {
        for (const angleOffset of angleOffsets) {
          candidatePoints.push(
            this.polarToCartesian(cx, cy, candidateRadius, angle + angleOffset)
          );
        }
      }

      if (candidatePoints.length === 0) {
        candidatePoints.push(this.polarToCartesian(cx, cy, baseRadius, angle));
      }

      const label = new this.scope.PointText(new this.scope.Point(0, 0));
      label.content = `${hole.angleOnArcDeg.toFixed(0)} deg`;
      label.fontSize = this.getTopViewSmallFontSize();
      label.fillColor = new this.scope.Color(LINE_STYLES.dimension.strokeColor);
      label.justification = 'center';

      const placement = this.placeTopViewLabel(label, candidatePoints, 4, 2);
      placement.group.bringToFront();
    }
  }

  private drawHoleRadialGuides(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number
  ): void {
    const style = LINE_STYLES.guide;
    const innerOffset = 4;
    const outerOffset = 6;

    for (const hole of this.holes) {
      const angle = startAngle + hole.angleOnArcDeg;
      const startPt = this.polarToCartesian(cx, cy, innerR + innerOffset, angle);
      const endPt = this.polarToCartesian(cx, cy, outerR - outerOffset, angle);

      const line = new this.scope.Path.Line(
        new this.scope.Point(startPt.x, startPt.y),
        new this.scope.Point(endPt.x, endPt.y)
      );
      this.applyStyle(line, style);
    }
  }

  private drawDepthDiameterGuides(
    cx: number,
    cy: number,
    scale: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ): void {
    const formatMm = (value: number) => (
      Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)
    );
    const uniqueDepths = this.getReferenceDepthsMm();
    if (uniqueDepths.length === 0) {
      return;
    }

    const isLarge = this.geometry.outerDiameterMm >= 600;
    const minAngle = startAngle + (isLarge ? 10 : 6);
    const maxAngle = endAngle - (isLarge ? 10 : 6);
    const baseOffset = isLarge ? 44 : 24;
    const stepOffset = isLarge ? 16 : 8;

    uniqueDepths.forEach((depth, index) => {
      const radiusMm = this.outerRadius - depth;
      const radiusPx = radiusMm * scale;

      if (radiusPx <= innerR + 2 || radiusPx >= outerR - 2) {
        return;
      }

      const arc = this.createArc(cx, cy, radiusPx, startAngle + 1, endAngle - 1);
      this.applyStyle(arc, LINE_STYLES.dimension);

      const diameterMm = radiusMm * 2;
      if (
        Math.abs(diameterMm - this.geometry.outerDiameterMm) < 0.1 ||
        Math.abs(diameterMm - this.geometry.innerDiameterMm) < 0.1
      ) {
        return;
      }

      const angleBase = index % 2 === 0 ? maxAngle : minAngle;
      const angleShift = Math.min(isLarge ? 18 : 12, index * (isLarge ? 5 : 4));
      let labelAngle = index % 2 === 0 ? angleBase - angleShift : angleBase + angleShift;
      labelAngle = Math.max(minAngle, Math.min(maxAngle, labelAngle));
      const offset = baseOffset + index * stepOffset;

      this.drawRadiusDimensionLeader(
        cx,
        cy,
        radiusPx,
        labelAngle,
        `D ${formatMm(diameterMm)}`,
        offset
      );
    });
  }

  private drawTopViewDimensionsTUV17(
    cx: number,
    cy: number,
    scale: number,
    outerR: number,
    innerR: number,
    meanR: number,
    startAngle: number,
    endAngle: number
  ): void {
    const formatMm = (value: number) => (
      Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)
    );
    const odOffset = Math.max(45, outerR * 0.25);
    const idOffset = -Math.max(35, outerR * 0.18);

    // 1. Outer diameter dimension (positioned at top-right)
    this.drawRadiusDimensionLeader(
      cx,
      cy,
      outerR,
      endAngle - 20,
      `OD ${formatMm(this.geometry.outerDiameterMm)}`,
      odOffset
    );

    // 2. Inner diameter dimension (positioned at bottom-left)
    this.drawRadiusDimensionLeader(
      cx,
      cy,
      innerR,
      startAngle + 20,
      `ID ${formatMm(this.geometry.innerDiameterMm)}`,
      idOffset
    );

    // 2b. Internal diameter guides based on reflector depths
    this.drawDepthDiameterGuides(cx, cy, scale, innerR, outerR, startAngle, endAngle);

    // 3. Segment angle extent (clean arc with centered label)
    this.drawCleanArcExtent(cx, cy, outerR, startAngle, endAngle);

    // 4. Wall thickness dimension (only shown once at one edge)
    const edgeAngle = startAngle + 5; // Near start edge for clarity
    const outerEdgePt = this.polarToCartesian(cx, cy, outerR, edgeAngle);
    const innerEdgePt = this.polarToCartesian(cx, cy, innerR, edgeAngle);
    this.drawLinearDimensionWithArrows(
      outerEdgePt.x,
      outerEdgePt.y,
      innerEdgePt.x,
      innerEdgePt.y,
      `${this.wallThickness.toFixed(1)}`,
      -30,
      'perpendicular'
    );

    // 5. Hole angle markers along the inner arc
    this.drawHoleAngleMarkers(cx, cy, innerR, outerR, startAngle);
    // 6. Radial guide lines for hole angles
    this.drawHoleRadialGuides(cx, cy, innerR, outerR, startAngle);
  }

  private getReferenceDepthsMm(): number[] {
    const depths = new Set<number>();

    for (const hole of this.holes) {
      if (hole.reflectorType === 'FBH') {
        continue;
      }
      depths.add(Math.round(hole.depthMm * 100) / 100);
    }

    // Add extra scan/diameter guides for large TUV-style blocks
    if (this.geometry.outerDiameterMm >= 600) {
      const referenceDiameters = [613.02, 579, 544.02, 530.82, 486.26];
      for (const diameter of referenceDiameters) {
        const depth = (this.geometry.outerDiameterMm - diameter) / 2;
        depths.add(Math.round(depth * 100) / 100);
      }
    }

    return Array.from(depths).sort((a, b) => a - b);
  }

  /**
   * Draw clean arc extent indicator (like the target drawing)
   * Shows total segment angle with clean arc and centered label
   */
  private drawCleanArcExtent(
    cx: number,
    cy: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ): void {
    const arcOffset = Math.max(45, outerR * 0.18);
    const arcRadius = outerR + arcOffset;
    const totalAngle = Math.abs(endAngle - startAngle);

    // Draw the arc (thin line)
    const arc = this.createArc(cx, cy, arcRadius, startAngle, endAngle);
    this.applyStyle(arc, LINE_STYLES.dimension);

    // Draw extension lines at both ends (short ticks perpendicular to arc)
    const tickLength = 10;

    // Tick at start
    const startPt = this.polarToCartesian(cx, cy, arcRadius, startAngle);
    const startTickOuter = this.polarToCartesian(cx, cy, arcRadius + tickLength, startAngle);
    const startTickInner = this.polarToCartesian(cx, cy, arcRadius - tickLength, startAngle);
    const startTick = new this.scope.Path.Line(
      new this.scope.Point(startTickOuter.x, startTickOuter.y),
      new this.scope.Point(startTickInner.x, startTickInner.y)
    );
    this.applyStyle(startTick, LINE_STYLES.dimension);

    // Tick at end
    const endPt = this.polarToCartesian(cx, cy, arcRadius, endAngle);
    const endTickOuter = this.polarToCartesian(cx, cy, arcRadius + tickLength, endAngle);
    const endTickInner = this.polarToCartesian(cx, cy, arcRadius - tickLength, endAngle);
    const endTick = new this.scope.Path.Line(
      new this.scope.Point(endTickOuter.x, endTickOuter.y),
      new this.scope.Point(endTickInner.x, endTickInner.y)
    );
    this.applyStyle(endTick, LINE_STYLES.dimension);

    // Arrows at arc ends (pointing along arc)
    const startTangent = (startAngle) * Math.PI / 180;
    const endTangent = (endAngle - 180) * Math.PI / 180;
    this.drawDimensionArrowhead(startPt.x, startPt.y, startTangent);
    this.drawDimensionArrowhead(endPt.x, endPt.y, endTangent);

    // Label centered above the arc (at 0 deg = top)
    const midAngle = (startAngle + endAngle) / 2;
    const labelOffset = Math.max(
      18,
      outerR * (this.geometry.outerDiameterMm >= 600 ? 0.1 : 0.07)
    );
    const labelText = `${totalAngle.toFixed(0)} deg`;
    const label = new this.scope.PointText(new this.scope.Point(0, 0));
    label.content = labelText;
    label.fontSize = this.getTopViewDimensionFontSize();
    label.fontWeight = FONT_SETTINGS.dimensionBold.weight;
    label.fillColor = new this.scope.Color('#000000');
    label.justification = 'center';

    const labelPt = this.polarToCartesian(cx, cy, arcRadius + labelOffset, midAngle);
    const candidatePoints = [
      labelPt,
      this.polarToCartesian(cx, cy, arcRadius + labelOffset + 14, midAngle),
      this.polarToCartesian(cx, cy, arcRadius + labelOffset + 28, midAngle),
    ];
    const placement = this.placeTopViewLabel(label, candidatePoints, 4, 2);
    placement.group.bringToFront();
  }

  // ============================================================================
  // SECTION VIEWS (A-A, B-B, C-E)
  // ============================================================================

  private drawSectionAA(vp: ViewPort): void {
    // Section A-A shows the first hole position
    const holesInSection = this.holes.filter((h) => {
      const holeAngle = -this.geometry.segmentAngleDeg / 2 + h.angleOnArcDeg;
      return Math.abs(holeAngle - this.sectionAngles.A) < 10;
    });

    if (holesInSection.length === 0 && this.holes.length > 0) {
      holesInSection.push(this.holes[0]);
    }

    this.drawDetailedSectionView(vp, holesInSection, 'A - A');
  }

  private drawSectionBB(vp: ViewPort): void {
    // Section B-B shows the second hole position
    const holesInSection = this.holes.filter((h) => {
      const holeAngle = -this.geometry.segmentAngleDeg / 2 + h.angleOnArcDeg;
      return Math.abs(holeAngle - this.sectionAngles.B) < 10;
    });

    if (holesInSection.length === 0 && this.holes.length > 1) {
      holesInSection.push(this.holes[1]);
    }

    this.drawDetailedSectionView(vp, holesInSection, 'B - B');
  }

  private drawSectionCE(vp: ViewPort): void {
    // Section C-E - align with the right-side cut
    const holesInSection = this.holes.filter((h) => {
      const holeAngle = -this.geometry.segmentAngleDeg / 2 + h.angleOnArcDeg;
      return Math.abs(holeAngle - this.sectionAngles.CE) < 10;
    });

    if (holesInSection.length === 0 && this.holes.length > 0) {
      holesInSection.push(this.holes[this.holes.length - 1]);
    }

    this.drawDetailedSectionView(vp, holesInSection, 'C - C');
  }

  private drawDetailedSectionView(vp: ViewPort, holes: HoleData[], label: string): void {
    const scale = vp.scale;
    const sectionWidth = this.wallThickness * scale;
    const sectionHeight = this.geometry.axialWidthMm * scale;

    // Center the section in viewport
    const rectX = vp.x + (vp.width - sectionWidth) / 2;
    const rectY = vp.y + 40 + (vp.height - 40 - sectionHeight) / 2;

    // Draw section label with professional styling (ISO standard: "SECTION A-A")
    const sectionLabelText = label.includes('-') ? `SECTION ${label}` : `SECTION ${label.charAt(0)}-${label.charAt(label.length - 1)}`;
    const labelText = new this.scope.PointText(
      new this.scope.Point(vp.x + vp.width / 2, vp.y + 20)
    );
    labelText.content = sectionLabelText;
    labelText.fontSize = FONT_SETTINGS.sectionLabel.size;
    labelText.fontWeight = FONT_SETTINGS.sectionLabel.weight;
    labelText.fontFamily = FONT_SETTINGS.sectionLabel.family;
    labelText.fillColor = new this.scope.Color('#000000');
    labelText.justification = 'center';

    // Add underline to section label (professional touch like TUV-17)
    const underlineY = vp.y + 25;
    const labelWidth = sectionLabelText.length * 6;
    const underlineLine = new this.scope.Path.Line(
      new this.scope.Point(vp.x + vp.width / 2 - labelWidth / 2, underlineY),
      new this.scope.Point(vp.x + vp.width / 2 + labelWidth / 2, underlineY)
    );
    underlineLine.strokeColor = new this.scope.Color('#000000');
    underlineLine.strokeWidth = 0.7;

    // Draw section outline (thick visible line for main outline)
    const outline = new this.scope.Path.Rectangle(
      new this.scope.Rectangle(rectX, rectY, sectionWidth, sectionHeight)
    );
    this.applyStyle(outline, LINE_STYLES.visibleThick);

    // Draw cross-hatching (45° at optimized spacing for clarity)
    if (this.config.showHatching) {
      this.drawPreciseCrossHatching(
        rectX, 
        rectY, 
        sectionWidth, 
        sectionHeight, 
        DRAWING_CONSTANTS.HATCHING_ANGLE, 
        DRAWING_CONSTANTS.HATCHING_SPACING * scale
      );
    }

    // Draw holes in section (as circles punched through hatching)
    for (const hole of holes) {
      // Hole Y position (axial)
      const holeY = rectY + hole.axialPositionMm * scale;

      // Hole X position (depth from outer surface - outer is on the RIGHT in section view)
      const holeX = rectX + sectionWidth - hole.depthMm * scale;

      // Hole radius
      const holeRadius = (hole.diameterMm / 2) * scale;

      // White circle to clear hatching
      const holeBg = new this.scope.Path.Circle(
        new this.scope.Point(holeX, holeY),
        Math.max(holeRadius + 1, 3)
      );
      holeBg.fillColor = new this.scope.Color('#FFFFFF');

      // Hole outline (red like TUV-17)
      const holeCircle = new this.scope.Path.Circle(
        new this.scope.Point(holeX, holeY),
        Math.max(holeRadius, 2)
      );
      holeCircle.strokeColor = new this.scope.Color('#CC0000');
      holeCircle.strokeWidth = LINE_STYLES.visible.strokeWidth;
      holeCircle.fillColor = new this.scope.Color('#FFEEEE');

      // Hole label
      const holeLabel = new this.scope.PointText(
        new this.scope.Point(holeX, holeY - holeRadius - 8)
      );
      holeLabel.content = hole.label;
      holeLabel.fontSize = FONT_SETTINGS.holeLabel.size - 1;
      holeLabel.fontWeight = FONT_SETTINGS.holeLabel.weight;
      holeLabel.fillColor = new this.scope.Color('#CC0000');
      holeLabel.justification = 'center';

      const diaLabel = new this.scope.PointText(
        new this.scope.Point(holeX + holeRadius + 10, holeY + 4)
      );
      diaLabel.content = `D${hole.diameterMm.toFixed(2)}`;
      diaLabel.fontSize = FONT_SETTINGS.dimension.size - 1;
      diaLabel.fillColor = new this.scope.Color('#000000');
      diaLabel.justification = 'left';

      // Draw hole depth dimension
      if (this.config.showDimensions) {
        this.drawHoleDepthDimension(
          rectX + sectionWidth,
          holeY,
          holeX,
          holeY,
          hole.depthMm
        );
      }
    }

    // Draw dimensions
    if (this.config.showDimensions) {
      // Wall thickness (horizontal, bottom)
      this.drawLinearDimensionWithArrows(
        rectX,
        rectY + sectionHeight + 25,
        rectX + sectionWidth,
        rectY + sectionHeight + 25,
        `${this.wallThickness.toFixed(1)}`,
        0,
        'horizontal'
      );

      // Axial width (vertical, left side)
      this.drawLinearDimensionWithArrows(
        rectX - 25,
        rectY,
        rectX - 25,
        rectY + sectionHeight,
        `${this.geometry.axialWidthMm}`,
        0,
        'vertical'
      );

      // Ordinate dimensions for hole axial positions
      this.drawOrdinateAxialDimensions(rectX, rectY, sectionHeight, scale, holes);
    }

    // Draw centerline
    if (this.config.showCenterlines) {
      const centerY = rectY + sectionHeight / 2;
      const centerLine = new this.scope.Path.Line(
        new this.scope.Point(rectX - 15, centerY),
        new this.scope.Point(rectX + sectionWidth + 15, centerY)
      );
      this.applyStyle(centerLine, LINE_STYLES.center);
    }
  }

  private drawPreciseCrossHatching(
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number = 45,
    spacing: number = 4
  ): void {
    const style = LINE_STYLES.hatching;
    const angleRad = angle * Math.PI / 180;

    // Create clipping path
    const clipRect = new this.scope.Path.Rectangle(
      new this.scope.Rectangle(x, y, width, height)
    );
    clipRect.clipMask = true;

    const group = new this.scope.Group([clipRect]);

    // Calculate hatching lines
    const diagonal = Math.sqrt(width * width + height * height);
    const numLines = Math.ceil(diagonal / spacing) * 2 + 10;

    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * spacing;

      // Line perpendicular offset
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      const lineStartX = centerX + offset * Math.cos(angleRad + Math.PI / 2) - diagonal * Math.cos(angleRad);
      const lineStartY = centerY + offset * Math.sin(angleRad + Math.PI / 2) - diagonal * Math.sin(angleRad);
      const lineEndX = centerX + offset * Math.cos(angleRad + Math.PI / 2) + diagonal * Math.cos(angleRad);
      const lineEndY = centerY + offset * Math.sin(angleRad + Math.PI / 2) + diagonal * Math.sin(angleRad);

      const line = new this.scope.Path.Line(
        new this.scope.Point(lineStartX, lineStartY),
        new this.scope.Point(lineEndX, lineEndY)
      );
      this.applyStyle(line, style);
      group.addChild(line);
    }

    group.clipped = true;
  }

  private drawOrdinateAxialDimensions(
    rectX: number,
    rectY: number,
    sectionHeight: number,
    scale: number,
    holes: HoleData[]
  ): void {
    // Draw ordinate dimension chain for axial positions
    const dimX = rectX - 45;

    // Baseline at bottom
    const baseLine = new this.scope.Path.Line(
      new this.scope.Point(dimX - 5, rectY + sectionHeight),
      new this.scope.Point(dimX + 5, rectY + sectionHeight)
    );
    this.applyStyle(baseLine, LINE_STYLES.dimension);

    // Zero label
    const zeroLabel = new this.scope.PointText(
      new this.scope.Point(dimX, rectY + sectionHeight + 10)
    );
    zeroLabel.content = '0';
    zeroLabel.fontSize = FONT_SETTINGS.dimension.size;
    zeroLabel.fillColor = new this.scope.Color('#000000');
    zeroLabel.justification = 'center';

    // Dimension for each hole
    for (const hole of holes) {
      const holeY = rectY + hole.axialPositionMm * scale;

      // Extension line
      const extLine = new this.scope.Path.Line(
        new this.scope.Point(rectX - 5, holeY),
        new this.scope.Point(dimX + 5, holeY)
      );
      this.applyStyle(extLine, LINE_STYLES.dimension);

      // Tick mark
      const tick = new this.scope.Path.Line(
        new this.scope.Point(dimX - 3, holeY),
        new this.scope.Point(dimX + 3, holeY)
      );
      this.applyStyle(tick, LINE_STYLES.dimension);

      // Dimension value
      const dimLabel = new this.scope.PointText(
        new this.scope.Point(dimX - 12, holeY + 3)
      );
      dimLabel.content = hole.axialPositionMm.toFixed(0);
      dimLabel.fontSize = FONT_SETTINGS.dimension.size;
      dimLabel.fillColor = new this.scope.Color('#000000');
      dimLabel.justification = 'right';
    }
  }

  // ============================================================================
  // ISOMETRIC VIEW
  // ============================================================================

  private drawIsometricView(vp: ViewPort): void {
    const scale = vp.scale * 0.8; // Scale down a bit for better fit
    const cx = vp.x + vp.width / 2;
    const cy = vp.y + vp.height / 2 + 20; // Move down slightly

    // Isometric projection angles (30° from horizontal)
    const isoAngleX = 30 * Math.PI / 180;
    const isoAngleY = 150 * Math.PI / 180;

    // Transform function for isometric projection
    const toIso = (x: number, y: number, z: number): { x: number; y: number } => {
      return {
        x: cx + (x * Math.cos(isoAngleX) + y * Math.cos(isoAngleY)) * scale * 0.85,
        y: cy - (x * Math.sin(isoAngleX) + y * Math.sin(isoAngleY)) * scale * 0.85 - z * scale * 0.85,
      };
    };

    // Draw simple isometric arc segment (clean lines, no hatching)
    this.drawSimpleIsometricBlock(toIso, scale);

    // Draw holes as simple circles
    this.drawSimpleIsometricHoles(toIso, scale);

    // Label with professional styling
    const label = new this.scope.PointText(
      new this.scope.Point(vp.x + vp.width / 2, vp.y + vp.height - 10)
    );
    label.content = 'ISOMETRIC VIEW';
    label.fontSize = FONT_SETTINGS.label.size;
    label.fontWeight = FONT_SETTINGS.label.weight;
    label.fillColor = new this.scope.Color('#000000');
    label.justification = 'center';
  }

  private drawSimpleIsometricBlock(
    toIso: (x: number, y: number, z: number) => { x: number; y: number },
    scale: number
  ): void {
    const startAngle = -this.geometry.segmentAngleDeg / 2;
    const endAngle = this.geometry.segmentAngleDeg / 2;
    const numPoints = 30;
    const axialWidth = this.geometry.axialWidthMm;
    const style = LINE_STYLES.visible; // Use regular visible lines, not thick

    // Draw top surface arcs (z = 0)
    const topOuterPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.outerRadius * Math.cos(rad);
      const y = this.outerRadius * Math.sin(rad);
      const pt = toIso(x, y, 0);
      topOuterPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(topOuterPath, style);

    const topInnerPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.innerRadius * Math.cos(rad);
      const y = this.innerRadius * Math.sin(rad);
      const pt = toIso(x, y, 0);
      topInnerPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(topInnerPath, style);

    // Draw bottom surface arcs (z = axialWidth) 
    const bottomOuterPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.outerRadius * Math.cos(rad);
      const y = this.outerRadius * Math.sin(rad);
      const pt = toIso(x, y, axialWidth);
      bottomOuterPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(bottomOuterPath, style);

    const bottomInnerPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.innerRadius * Math.cos(rad);
      const y = this.innerRadius * Math.sin(rad);
      const pt = toIso(x, y, axialWidth);
      bottomInnerPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(bottomInnerPath, LINE_STYLES.hidden); // Bottom inner arc is hidden

    // Draw vertical edges at cut faces
    for (const angle of [startAngle, endAngle]) {
      const rad = angle * Math.PI / 180;

      // Outer vertical edge
      const outerX = this.outerRadius * Math.cos(rad);
      const outerY = this.outerRadius * Math.sin(rad);
      const outer0 = toIso(outerX, outerY, 0);
      const outer1 = toIso(outerX, outerY, axialWidth);
      const outerEdge = new this.scope.Path.Line(
        new this.scope.Point(outer0.x, outer0.y),
        new this.scope.Point(outer1.x, outer1.y)
      );
      this.applyStyle(outerEdge, style);

      // Inner vertical edge
      const innerX = this.innerRadius * Math.cos(rad);
      const innerY = this.innerRadius * Math.sin(rad);
      const inner0 = toIso(innerX, innerY, 0);
      const inner1 = toIso(innerX, innerY, axialWidth);
      const innerEdge = new this.scope.Path.Line(
        new this.scope.Point(inner0.x, inner0.y),
        new this.scope.Point(inner1.x, inner1.y)
      );
      this.applyStyle(innerEdge, style);

      // Radial edges on top and bottom faces
      const topRadial = new this.scope.Path.Line(
        new this.scope.Point(outer0.x, outer0.y),
        new this.scope.Point(inner0.x, inner0.y)
      );
      this.applyStyle(topRadial, style);

      const bottomRadial = new this.scope.Path.Line(
        new this.scope.Point(outer1.x, outer1.y),
        new this.scope.Point(inner1.x, inner1.y)
      );
      this.applyStyle(bottomRadial, style);
    }
  }

  private drawSimpleIsometricHoles(
    toIso: (x: number, y: number, z: number) => { x: number; y: number },
    scale: number
  ): void {
    const startAngle = -this.geometry.segmentAngleDeg / 2;

    for (const hole of this.holes) {
      const angle = startAngle + hole.angleOnArcDeg;
      const rad = angle * Math.PI / 180;

      // Hole position on outer surface
      const holeX = this.outerRadius * Math.cos(rad);
      const holeY = this.outerRadius * Math.sin(rad);
      const holeZ = hole.axialPositionMm;

      // Draw hole as simple circle
      const holePt = toIso(holeX, holeY, holeZ);
      const holeRadius = Math.max((hole.diameterMm / 2) * scale * 0.6, 3);

      // Simple circle for hole
      const holeCircle = new this.scope.Path.Circle(
        new this.scope.Point(holePt.x, holePt.y),
        holeRadius
      );
      holeCircle.strokeColor = new this.scope.Color('#000000');
      holeCircle.strokeWidth = LINE_STYLES.visible.strokeWidth;
      holeCircle.fillColor = new this.scope.Color('#FFFFFF');
    }
  }

  // Keep old detailed methods for potential future use but rename them
  private drawIsometricArcSegmentDetailed(
    toIso: (x: number, y: number, z: number) => { x: number; y: number },
    scale: number
  ): void {
    const startAngle = -this.geometry.segmentAngleDeg / 2;
    const endAngle = this.geometry.segmentAngleDeg / 2;
    const numPoints = 40;
    const axialWidth = this.geometry.axialWidthMm;

    // Draw visible surfaces with thick lines for main outlines

    // 1. Top face (z = 0) - outer arc (VISIBLE, THICK)
    const topOuterPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.outerRadius * Math.cos(rad);
      const y = this.outerRadius * Math.sin(rad);
      const pt = toIso(x, y, 0);
      topOuterPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(topOuterPath, LINE_STYLES.visibleThick);

    // 2. Top face (z = 0) - inner arc (VISIBLE, THICK)
    const topInnerPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.innerRadius * Math.cos(rad);
      const y = this.innerRadius * Math.sin(rad);
      const pt = toIso(x, y, 0);
      topInnerPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(topInnerPath, LINE_STYLES.visibleThick);

    // 3. Bottom face (z = axialWidth) - outer arc (VISIBLE, THICK)
    const bottomOuterPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.outerRadius * Math.cos(rad);
      const y = this.outerRadius * Math.sin(rad);
      const pt = toIso(x, y, axialWidth);
      bottomOuterPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(bottomOuterPath, LINE_STYLES.visibleThick);

    // 4. Bottom face inner arc (may be hidden)
    const bottomInnerPath = new this.scope.Path();
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const rad = angle * Math.PI / 180;
      const x = this.innerRadius * Math.cos(rad);
      const y = this.innerRadius * Math.sin(rad);
      const pt = toIso(x, y, axialWidth);
      bottomInnerPath.add(new this.scope.Point(pt.x, pt.y));
    }
    this.applyStyle(bottomInnerPath, LINE_STYLES.hidden);

    // 5. Vertical edges at cut faces (THICK for main outline)
    for (const angle of [startAngle, endAngle]) {
      const rad = angle * Math.PI / 180;

      // Outer vertical edge (THICK)
      const outerX = this.outerRadius * Math.cos(rad);
      const outerY = this.outerRadius * Math.sin(rad);
      const outer0 = toIso(outerX, outerY, 0);
      const outer1 = toIso(outerX, outerY, axialWidth);

      const outerEdge = new this.scope.Path.Line(
        new this.scope.Point(outer0.x, outer0.y),
        new this.scope.Point(outer1.x, outer1.y)
      );
      this.applyStyle(outerEdge, LINE_STYLES.visibleThick);

      // Inner vertical edge (THICK)
      const innerX = this.innerRadius * Math.cos(rad);
      const innerY = this.innerRadius * Math.sin(rad);
      const inner0 = toIso(innerX, innerY, 0);
      const inner1 = toIso(innerX, innerY, axialWidth);

      const innerEdge = new this.scope.Path.Line(
        new this.scope.Point(inner0.x, inner0.y),
        new this.scope.Point(inner1.x, inner1.y)
      );
      this.applyStyle(innerEdge, LINE_STYLES.visibleThick);

      // Radial edges on top face (THICK)
      const topRadial = new this.scope.Path.Line(
        new this.scope.Point(outer0.x, outer0.y),
        new this.scope.Point(inner0.x, inner0.y)
      );
      this.applyStyle(topRadial, LINE_STYLES.visibleThick);

      // Radial edges on bottom face (THICK)
      const bottomRadial = new this.scope.Path.Line(
        new this.scope.Point(outer1.x, outer1.y),
        new this.scope.Point(inner1.x, inner1.y)
      );
      this.applyStyle(bottomRadial, LINE_STYLES.visibleThick);
    }

    // Add hatching to cut faces (like in TUV-17)
    if (this.config.showHatching) {
      this.drawIsometricCutFaceHatching(toIso, startAngle, endAngle, axialWidth);
    }

    // Add hatching to cut faces (like in TUV-17)
    if (this.config.showHatching) {
      this.drawIsometricCutFaceHatching(toIso, startAngle, endAngle, axialWidth);
    }
  }

  private drawIsometricCutFaceHatching(
    toIso: (x: number, y: number, z: number) => { x: number; y: number },
    startAngle: number,
    endAngle: number,
    axialWidth: number
  ): void {
    // Draw hatching on the two radial cut faces (start and end)
    const style = LINE_STYLES.hatching;
    const hatchSpacing = 8; // pixels between hatching lines
    
    // Hatching for START cut face (visible)
    this.drawRadialCutFaceHatching(toIso, startAngle, axialWidth, hatchSpacing, style);
    
    // Hatching for END cut face (may be partially visible)
    this.drawRadialCutFaceHatching(toIso, endAngle, axialWidth, hatchSpacing, style);
  }

  private drawRadialCutFaceHatching(
    toIso: (x: number, y: number, z: number) => { x: number; y: number },
    angle: number,
    axialWidth: number,
    spacing: number,
    style: any
  ): void {
    const rad = angle * Math.PI / 180;
    const numLines = Math.ceil(this.wallThickness / 3); // Number of hatching lines
    
    // Draw hatching lines from inner to outer radius at 45° to the face
    for (let i = 0; i <= numLines; i++) {
      const t = i / numLines;
      const r1 = this.innerRadius + t * this.wallThickness;
      const r2 = r1;
      
      // Hatching at 45° angle across the width
      const z1 = 0;
      const z2 = axialWidth;
      
      const x1 = r1 * Math.cos(rad);
      const y1 = r1 * Math.sin(rad);
      
      const pt1 = toIso(x1, y1, z1);
      const pt2 = toIso(x1, y1, z2);
      
      const hatchLine = new this.scope.Path.Line(
        new this.scope.Point(pt1.x, pt1.y),
        new this.scope.Point(pt2.x, pt2.y)
      );
      this.applyStyle(hatchLine, style);
    }
    
    // Add diagonal hatching for better effect
    const numDiag = Math.ceil(axialWidth / spacing);
    for (let i = 0; i <= numDiag; i++) {
      const z = (i / numDiag) * axialWidth;
      
      const innerPt = toIso(
        this.innerRadius * Math.cos(rad),
        this.innerRadius * Math.sin(rad),
        z
      );
      const outerPt = toIso(
        this.outerRadius * Math.cos(rad),
        this.outerRadius * Math.sin(rad),
        z
      );
      
      const diagLine = new this.scope.Path.Line(
        new this.scope.Point(innerPt.x, innerPt.y),
        new this.scope.Point(outerPt.x, outerPt.y)
      );
      this.applyStyle(diagLine, style);
    }
  }

  private drawIsometricHolesDetailed(
    toIso: (x: number, y: number, z: number) => { x: number; y: number },
    scale: number
  ): void {
    const startAngle = -this.geometry.segmentAngleDeg / 2;

    for (const hole of this.holes) {
      const angle = startAngle + hole.angleOnArcDeg;
      const rad = angle * Math.PI / 180;

      // Hole position on outer surface
      const holeX = this.outerRadius * Math.cos(rad);
      const holeY = this.outerRadius * Math.sin(rad);
      const holeZ = hole.axialPositionMm;

      // Draw hole as circle with depth indication
      const holePt = toIso(holeX, holeY, holeZ);
      const holeRadius = Math.max((hole.diameterMm / 2) * scale * 0.6, 4);

      // Hole opening - visible circle with fill
      const holeCircle = new this.scope.Path.Circle(
        new this.scope.Point(holePt.x, holePt.y),
        holeRadius
      );
      holeCircle.fillColor = new this.scope.Color('#CCCCCC'); // Light gray for hole depth
      holeCircle.strokeColor = new this.scope.Color('#000000');
      holeCircle.strokeWidth = LINE_STYLES.visible.strokeWidth;
      
      // Add inner darker circle to show depth
      const innerHoleCircle = new this.scope.Path.Circle(
        new this.scope.Point(holePt.x + 1, holePt.y + 1),
        holeRadius * 0.5
      );
      innerHoleCircle.fillColor = new this.scope.Color('#666666'); // Darker for depth effect
      
      // Optional: Add hole label if needed
      if (hole.label) {
        const labelPt = new this.scope.PointText(
          new this.scope.Point(holePt.x, holePt.y - holeRadius - 8)
        );
        labelPt.content = hole.label;
        labelPt.fontSize = FONT_SETTINGS.holeLabel.size - 2;
        labelPt.fontWeight = 'bold';
        labelPt.fillColor = new this.scope.Color('#CC0000');
        labelPt.justification = 'center';
      }
    }
  }

  // ============================================================================
  // DIMENSION HELPER METHODS
  // ============================================================================

  private drawLinearDimensionWithArrows(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    offset: number,
    orientation: 'horizontal' | 'vertical' | 'perpendicular'
  ): void {
    const style = LINE_STYLES.dimension;

    let ox1 = x1,
      oy1 = y1,
      ox2 = x2,
      oy2 = y2;

    if (orientation === 'perpendicular' && offset !== 0) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length;
      const ny = dx / length;

      ox1 = x1 + nx * offset;
      oy1 = y1 + ny * offset;
      ox2 = x2 + nx * offset;
      oy2 = y2 + ny * offset;

      // Extension lines
      const ext1 = new this.scope.Path.Line(
        new this.scope.Point(x1, y1),
        new this.scope.Point(ox1 + nx * 3, oy1 + ny * 3)
      );
      this.applyStyle(ext1, style);

      const ext2 = new this.scope.Path.Line(
        new this.scope.Point(x2, y2),
        new this.scope.Point(ox2 + nx * 3, oy2 + ny * 3)
      );
      this.applyStyle(ext2, style);
    }

    // Dimension line
    const dimLine = new this.scope.Path.Line(
      new this.scope.Point(ox1, oy1),
      new this.scope.Point(ox2, oy2)
    );
    this.applyStyle(dimLine, style);

    // Arrows at both ends
    const angle = Math.atan2(oy2 - oy1, ox2 - ox1);
    this.drawDimensionArrowhead(ox1, oy1, angle);
    this.drawDimensionArrowhead(ox2, oy2, angle + Math.PI);

    // Label at center
    const labelX = (ox1 + ox2) / 2;
    const labelY = (oy1 + oy2) / 2 - 6;

    // White background for label
    const textWidth = label.length * 5;
    const labelBg = new this.scope.Path.Rectangle(
      new this.scope.Rectangle(labelX - textWidth / 2 - 2, labelY - 8, textWidth + 4, 12)
    );
    labelBg.fillColor = new this.scope.Color('#FFFFFF');

    const text = new this.scope.PointText(new this.scope.Point(labelX, labelY));
    text.content = label;
    text.fontSize = FONT_SETTINGS.dimension.size;
    text.fontFamily = FONT_SETTINGS.dimension.family;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'center';
  }

  private drawRadiusDimensionLeader(
    cx: number,
    cy: number,
    radius: number,
    angle: number,
    label: string,
    offset: number
  ): void {
    const surfacePt = this.polarToCartesian(cx, cy, radius, angle);

    const offsetDir = offset >= 0 ? 1 : -1;
    const step = Math.max(12, Math.abs(offset) * 0.25);
    const candidateOffsets = Array.from({ length: 8 }, (_, i) => offset + offsetDir * step * i);
    const candidatePoints = candidateOffsets.map((candidate) =>
      this.polarToCartesian(cx, cy, radius + candidate, angle)
    );

    const text = new this.scope.PointText(new this.scope.Point(0, 0));
    text.content = label;
    text.fontSize = this.getTopViewDimensionFontSize();
    text.fontFamily = FONT_SETTINGS.dimension.family;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'center';

    const paddingX = this.geometry.outerDiameterMm >= 600 ? 5 : 4;
    const paddingY = this.geometry.outerDiameterMm >= 600 ? 3 : 2;
    const placement = this.placeTopViewLabel(text, candidatePoints, paddingX, paddingY);

    // Leader line
    const leader = new this.scope.Path.Line(
      new this.scope.Point(surfacePt.x, surfacePt.y),
      new this.scope.Point(placement.point.x, placement.point.y)
    );
    this.applyStyle(leader, LINE_STYLES.dimension);

    // Arrow at surface
    const angleRad = (angle - 90) * Math.PI / 180;
    const arrowDir = offset > 0 ? angleRad : angleRad + Math.PI;
    this.drawDimensionArrowhead(surfacePt.x, surfacePt.y, arrowDir);

    placement.group.bringToFront();
  }

  private drawAngleDimensionArc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    label: string
  ): void {
    // Arc
    const arc = this.createArc(cx, cy, radius, startAngle, endAngle);
    this.applyStyle(arc, LINE_STYLES.dimension);

    // Extension lines
    const startExt1 = this.polarToCartesian(cx, cy, radius - 10, startAngle);
    const startExt2 = this.polarToCartesian(cx, cy, radius + 10, startAngle);
    const ext1 = new this.scope.Path.Line(
      new this.scope.Point(startExt1.x, startExt1.y),
      new this.scope.Point(startExt2.x, startExt2.y)
    );
    this.applyStyle(ext1, LINE_STYLES.dimension);

    const endExt1 = this.polarToCartesian(cx, cy, radius - 10, endAngle);
    const endExt2 = this.polarToCartesian(cx, cy, radius + 10, endAngle);
    const ext2 = new this.scope.Path.Line(
      new this.scope.Point(endExt1.x, endExt1.y),
      new this.scope.Point(endExt2.x, endExt2.y)
    );
    this.applyStyle(ext2, LINE_STYLES.dimension);

    // Arrows
    const startPt = this.polarToCartesian(cx, cy, radius, startAngle);
    const endPt = this.polarToCartesian(cx, cy, radius, endAngle);

    // Tangent directions for arrows
    const startTangent = (startAngle + 90 - 90) * Math.PI / 180;
    const endTangent = (endAngle - 90 - 90) * Math.PI / 180;

    this.drawDimensionArrowhead(startPt.x, startPt.y, startTangent);
    this.drawDimensionArrowhead(endPt.x, endPt.y, endTangent);

    // Label at arc midpoint
    const midAngle = (startAngle + endAngle) / 2;
    const labelPt = this.polarToCartesian(cx, cy, radius + 12, midAngle);

    const text = new this.scope.PointText(new this.scope.Point(labelPt.x, labelPt.y + 3));
    text.content = label;
    text.fontSize = FONT_SETTINGS.dimension.size;
    text.fontFamily = FONT_SETTINGS.dimension.family;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'center';
  }

  private drawAngularDimension(
    cx: number,
    cy: number,
    radius: number,
    fromAngle: number,
    toAngle: number,
    label: string
  ): void {
    // Small arc with label - use standard dimension style (black, not red)
    const arc = this.createArc(cx, cy, radius, fromAngle, toAngle);
    this.applyStyle(arc, LINE_STYLES.dimension);

    // Add small ticks at the ends of the arc
    const tickLength = 5;
    const startPt = this.polarToCartesian(cx, cy, radius, fromAngle);
    const endPt = this.polarToCartesian(cx, cy, radius, toAngle);

    const startTickOuter = this.polarToCartesian(cx, cy, radius + tickLength, fromAngle);
    const startTick = new this.scope.Path.Line(
      new this.scope.Point(startPt.x, startPt.y),
      new this.scope.Point(startTickOuter.x, startTickOuter.y)
    );
    this.applyStyle(startTick, LINE_STYLES.dimension);

    const endTickOuter = this.polarToCartesian(cx, cy, radius + tickLength, toAngle);
    const endTick = new this.scope.Path.Line(
      new this.scope.Point(endPt.x, endPt.y),
      new this.scope.Point(endTickOuter.x, endTickOuter.y)
    );
    this.applyStyle(endTick, LINE_STYLES.dimension);

    // Label at midpoint - use black color for consistency
    const midAngle = (fromAngle + toAngle) / 2;
    const labelPt = this.polarToCartesian(cx, cy, radius + 12, midAngle);

    const text = new this.scope.PointText(new this.scope.Point(labelPt.x, labelPt.y + 3));
    text.content = label;
    text.fontSize = FONT_SETTINGS.dimension.size;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'center';
  }

  private drawSmallRadialDimension(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    angle: number
  ): void {
    // Small dimension line with label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Label position offset perpendicular to line
    const perpAngle = (angle) * Math.PI / 180;
    const labelX = midX + 15 * Math.cos(perpAngle);
    const labelY = midY + 15 * Math.sin(perpAngle);

    // Leader
    const leader = new this.scope.Path.Line(
      new this.scope.Point(midX, midY),
      new this.scope.Point(labelX, labelY)
    );
    this.applyStyle(leader, LINE_STYLES.dimension);

    const text = new this.scope.PointText(new this.scope.Point(labelX + 10, labelY + 3));
    text.content = label;
    text.fontSize = FONT_SETTINGS.dimension.size - 1;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'left';
  }

  private drawHoleDepthDimension(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    depth: number
  ): void {
    const offsetY = 12;

    // Dimension line above hole
    const dimLine = new this.scope.Path.Line(
      new this.scope.Point(x1, y1 - offsetY),
      new this.scope.Point(x2, y2 - offsetY)
    );
    this.applyStyle(dimLine, LINE_STYLES.dimension);

    // Extension lines
    const ext1 = new this.scope.Path.Line(
      new this.scope.Point(x1, y1 - 3),
      new this.scope.Point(x1, y1 - offsetY - 3)
    );
    this.applyStyle(ext1, LINE_STYLES.dimension);

    const ext2 = new this.scope.Path.Line(
      new this.scope.Point(x2, y2 - 3),
      new this.scope.Point(x2, y2 - offsetY - 3)
    );
    this.applyStyle(ext2, LINE_STYLES.dimension);

    // Arrows
    this.drawDimensionArrowhead(x1, y1 - offsetY, 0);
    this.drawDimensionArrowhead(x2, y2 - offsetY, Math.PI);

    // Label
    const labelX = (x1 + x2) / 2;
    const text = new this.scope.PointText(new this.scope.Point(labelX, y1 - offsetY - 6));
    text.content = depth.toString();
    text.fontSize = FONT_SETTINGS.dimension.size - 1;
    text.fillColor = new this.scope.Color('#000000');
    text.justification = 'center';
  }

  private drawDimensionArrowhead(x: number, y: number, angle: number): void {
    // Professional closed arrow (filled triangle) like TUV-17
    const size = DRAWING_CONSTANTS.DIMENSION_ARROW_SIZE;
    const arrowWidth = size * 0.3; // Width of arrow base
    
    const arrow = new this.scope.Path();
    // Arrow tip
    arrow.add(new this.scope.Point(x, y));
    // Arrow sides (forming filled triangle)
    arrow.add(new this.scope.Point(
      x - size * Math.cos(angle - Math.PI / 6),
      y - size * Math.sin(angle - Math.PI / 6)
    ));
    arrow.add(new this.scope.Point(
      x - size * Math.cos(angle + Math.PI / 6),
      y - size * Math.sin(angle + Math.PI / 6)
    ));
    arrow.closed = true;
    arrow.fillColor = new this.scope.Color('#000000');
    arrow.strokeWidth = 0;
  }

  // ============================================================================
  // TITLE BLOCK AND NOTES
  // ============================================================================

  private drawTitleBlock(): void {
    const width = 220;
    const height = 90;
    const x = this.config.canvasWidth - width - 20;
    const y = this.config.canvasHeight - height - 20;

    // Border
    const border = new this.scope.Path.Rectangle(
      new this.scope.Rectangle(x, y, width, height)
    );
    this.applyStyle(border, LINE_STYLES.visible);

    // Horizontal dividers
    const divY1 = y + 25;
    const divY2 = y + 50;
    const divY3 = y + 70;

    for (const divY of [divY1, divY2, divY3]) {
      const div = new this.scope.Path.Line(
        new this.scope.Point(x, divY),
        new this.scope.Point(x + width, divY)
      );
      this.applyStyle(div, LINE_STYLES.visible);
    }

    // Title
    const title = new this.scope.PointText(new this.scope.Point(x + width / 2, y + 17));
    title.content = 'SCAN MASTER';
    title.fontSize = 14;
    title.fontWeight = 'bold';
    title.fillColor = new this.scope.Color('#000000');
    title.justification = 'center';

    // Description
    const desc = new this.scope.PointText(new this.scope.Point(x + width / 2, y + 40));
    desc.content = 'Ring Segment Calibration Block';
    desc.fontSize = 10;
    desc.fillColor = new this.scope.Color('#000000');
    desc.justification = 'center';

    // Dimensions
    const dims = new this.scope.PointText(new this.scope.Point(x + width / 2, y + 63));
    dims.content = `OD${this.geometry.outerDiameterMm} × ID${this.geometry.innerDiameterMm} × W${this.geometry.axialWidthMm}`;
    dims.fontSize = 9;
    dims.fillColor = new this.scope.Color('#000000');
    dims.justification = 'center';

    // Angle
    const angleText = new this.scope.PointText(new this.scope.Point(x + width / 2, y + 82));
    angleText.content = `Segment: ${this.geometry.segmentAngleDeg}° | Holes: ${this.holes.length}`;
    angleText.fontSize = 8;
    angleText.fillColor = new this.scope.Color('#666666');
    angleText.justification = 'center';
  }

  private drawDrawingNotes(viewports: { sectionBB: ViewPort; topView: ViewPort }): void {
    // Manufacturing notes section
    const noteX = 30;
    const noteY = viewports.sectionBB.y + viewports.sectionBB.height + 20;

    // Notes header
    const notesHeader = new this.scope.PointText(new this.scope.Point(noteX, noteY));
    notesHeader.content = 'NOTES:';
    notesHeader.fontSize = 10;
    notesHeader.fontWeight = 'bold';
    notesHeader.fillColor = new this.scope.Color('#000000');

    // Note 1: General tolerances
    const note1 = new this.scope.PointText(new this.scope.Point(noteX, noteY + 15));
    note1.content = '1. GENERAL TOLERANCES: ISO 2768-mK';
    note1.fontSize = 8;
    note1.fillColor = new this.scope.Color('#000000');

    // Note 2: Surface finish
    const note2 = new this.scope.PointText(new this.scope.Point(noteX, noteY + 28));
    note2.content = '2. SURFACE FINISH: Ra 3.2 UNLESS OTHERWISE SPECIFIED';
    note2.fontSize = 8;
    note2.fillColor = new this.scope.Color('#000000');

    // Note 3: Edge break
    const note3 = new this.scope.PointText(new this.scope.Point(noteX, noteY + 41));
    note3.content = '3. BREAK ALL SHARP EDGES 0.3-0.5mm';
    note3.fontSize = 8;
    note3.fillColor = new this.scope.Color('#000000');

    // Note 4: Reference standard
    const note4 = new this.scope.PointText(new this.scope.Point(noteX, noteY + 54));
    note4.content = '4. REF: ASTM E127 / EN 10228-3';
    note4.fontSize = 8;
    note4.fillColor = new this.scope.Color('#000000');

    // Note 5: Report reference (matches TUV-17)
    const note5 = new this.scope.PointText(new this.scope.Point(noteX, noteY + 67));
    note5.content = '5. VOIR RAPPORT 5394 POUR COUPE A-A ET B-B';
    note5.fontSize = 8;
    note5.fillColor = new this.scope.Color('#000000');

    // Draw surface finish symbol on top view (Ra symbol near outer surface)
    this.drawSurfaceFinishSymbol(viewports.topView);
  }

  /**
   * Draw ISO surface finish symbol (Ra)
   * The standard check mark symbol with roughness value
   */
  private drawSurfaceFinishSymbol(vp: ViewPort): void {
    // Position the symbol near the outer arc in the top view
    const symbolX = vp.x + vp.width * 0.85;
    const symbolY = vp.y + vp.height * 0.25;

    const symbolSize = 12;

    // Draw the surface finish symbol (checkmark shape per ISO 1302)
    const symbol = new this.scope.Path();
    // Start at bottom left
    symbol.add(new this.scope.Point(symbolX, symbolY + symbolSize));
    // Go to bottom of V
    symbol.add(new this.scope.Point(symbolX + symbolSize * 0.3, symbolY + symbolSize));
    // Go up to top right (the check)
    symbol.add(new this.scope.Point(symbolX + symbolSize * 0.5, symbolY));
    // Horizontal line to right
    symbol.add(new this.scope.Point(symbolX + symbolSize * 1.2, symbolY));

    symbol.strokeColor = new this.scope.Color('#000000');
    symbol.strokeWidth = LINE_STYLES.visible.strokeWidth;

    // Ra value text
    const raText = new this.scope.PointText(
      new this.scope.Point(symbolX + symbolSize * 0.6, symbolY - 3)
    );
    raText.content = 'Ra 0.35';
    raText.fontSize = 8;
    raText.fillColor = new this.scope.Color('#000000');

    // Leader line from symbol to surface (pointing to OD arc)
    const leaderEndX = vp.x + vp.width * 0.65;
    const leaderEndY = vp.y + vp.height * 0.35;
    const leaderLine = new this.scope.Path.Line(
      new this.scope.Point(symbolX, symbolY + symbolSize),
      new this.scope.Point(leaderEndX, leaderEndY)
    );
    this.applyStyle(leaderLine, LINE_STYLES.dimension);

    // Arrow at the end pointing to surface
    this.drawDimensionArrowhead(leaderEndX, leaderEndY, Math.atan2(leaderEndY - (symbolY + symbolSize), leaderEndX - symbolX));
  }

  private drawBorderFrame(): void {
    const margin = 10;
    const frame = new this.scope.Path.Rectangle(
      new this.scope.Rectangle(
        margin,
        margin,
        this.config.canvasWidth - margin * 2,
        this.config.canvasHeight - margin * 2
      )
    );
    this.applyStyle(frame, LINE_STYLES.visible);
  }

  private resetTopViewLabelBounds(): void {
    this.topViewLabelBounds = [];
  }

  private getTopViewDimensionFontSize(): number {
    return this.geometry.outerDiameterMm >= 600
      ? Math.max(FONT_SETTINGS.dimension.size - 2, 8)
      : FONT_SETTINGS.dimension.size;
  }

  private getTopViewSmallFontSize(): number {
    return this.geometry.outerDiameterMm >= 600
      ? Math.max(FONT_SETTINGS.dimension.size - 3, 7)
      : FONT_SETTINGS.dimension.size - 1;
  }

  private doesLabelOverlap(bounds: paper.Rectangle): boolean {
    return this.topViewLabelBounds.some((existing) => existing.intersects(bounds));
  }

  private expandLabelBounds(
    bounds: paper.Rectangle,
    paddingX: number,
    paddingY: number
  ): paper.Rectangle {
    return new this.scope.Rectangle(
      bounds.x - paddingX,
      bounds.y - paddingY,
      bounds.width + paddingX * 2,
      bounds.height + paddingY * 2
    );
  }

  private placeTopViewLabel(
    text: paper.PointText,
    candidatePoints: Array<{ x: number; y: number }>,
    paddingX: number,
    paddingY: number
  ): { point: paper.Point; bounds: paper.Rectangle; group: paper.Group } {
    let chosenPoint = candidatePoints[candidatePoints.length - 1];
    let chosenBounds = this.expandLabelBounds(text.bounds, paddingX, paddingY);

    for (const pt of candidatePoints) {
      text.point = new this.scope.Point(pt.x, pt.y);
      const bounds = this.expandLabelBounds(text.bounds, paddingX, paddingY);
      if (!this.doesLabelOverlap(bounds)) {
        chosenPoint = pt;
        chosenBounds = bounds;
        break;
      }
      chosenBounds = bounds;
    }

    text.point = new this.scope.Point(chosenPoint.x, chosenPoint.y);
    const labelBg = new this.scope.Path.Rectangle(chosenBounds);
    labelBg.fillColor = new this.scope.Color('#FFFFFF');
    labelBg.strokeColor = null;

    const group = new this.scope.Group([labelBg, text]);
    this.topViewLabelBounds.push(chosenBounds);

    return {
      point: text.point,
      bounds: chosenBounds,
      group,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private createArc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): paper.Path {
    const path = new this.scope.Path();
    const numPoints = Math.max(Math.abs(endAngle - startAngle), 30);

    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
      const pt = this.polarToCartesian(cx, cy, radius, angle);
      path.add(new this.scope.Point(pt.x, pt.y));
    }

    return path;
  }

  private polarToCartesian(
    cx: number,
    cy: number,
    radius: number,
    angleDeg: number
  ): { x: number; y: number } {
    // Angle convention: 0° at top (+Y), CCW positive
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  }

  private applyStyle(
    path: paper.Path,
    style: { strokeWidth: number; strokeColor: string; dashArray: number[] | null }
  ): void {
    path.strokeColor = new this.scope.Color(style.strokeColor);
    path.strokeWidth = style.strokeWidth;
    if (style.dashArray) {
      path.dashArray = style.dashArray;
    }
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  public exportToSVG(): string {
    return this.scope.project.exportSVG({ asString: true }) as string;
  }

  public exportToPNG(): string {
    return this.canvas.toDataURL('image/png');
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public destroy(): void {
    try {
      // Clear all items in the project
      if (this.scope && this.scope.project) {
        this.scope.project.clear();
        
        // Remove the scope to prevent memory leaks
        if (this.scope.view) {
          this.scope.view.remove();
        }
      }
      
      // Clear the canvas
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } catch (err) {
      console.warn('Error during Paper.js cleanup:', err);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createProfessionalRingSegmentDrawing(
  canvas: HTMLCanvasElement,
  geometry: BlockGeometry,
  holes: HoleData[],
  config?: Partial<DrawingConfig>
): ProfessionalRingSegmentDrawing {
  const drawing = new ProfessionalRingSegmentDrawing(canvas, geometry, holes, config);
  drawing.draw();
  return drawing;
}
