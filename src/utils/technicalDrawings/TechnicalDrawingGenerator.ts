/**
 * Technical Drawing Generator
 * Generates professional technical drawings compliant with ISO 128 standards
 */

import paper from 'paper';

export interface LineStyle {
  width: number;
  dash?: number[];
  color: string;
  description: string;
}

export interface Dimensions {
  length: number;
  width: number;
  thickness: number;
  diameter?: number;
  outerDiameter?: number;
  innerDiameter?: number;
  innerLength?: number;
  innerWidth?: number;
  wallThickness?: number;
  isHollow?: boolean;
  // Cone-specific parameters
  coneTopDiameter?: number;
  coneBottomDiameter?: number;
  coneHeight?: number;
}

export interface LayoutConfig {
  frontView: { x: number; y: number; width: number; height: number };
  topView: { x: number; y: number; width: number; height: number };
  sideView: { x: number; y: number; width: number; height: number };
  isometric: { x: number; y: number; width: number; height: number };
}

// ISO 128 Line Standards with advanced properties - HIGH CONTRAST for dark backgrounds
export const LINE_STANDARDS: Record<string, LineStyle> = {
  visible: {
    width: 3.5,
    color: '#FFFFFF',
    description: 'Visible outlines'
  },
  hidden: {
    width: 2.0,
    dash: [5, 3],
    color: '#B0B0B0',
    description: 'Hidden edges'
  },
  center: {
    width: 1.5,
    dash: [15, 3, 3, 3],
    color: '#FFD700',
    description: 'Center lines'
  },
  dimension: {
    width: 1.2,
    color: '#00D4FF',
    description: 'Dimension lines'
  },
  cutting: {
    width: 3.0,
    dash: [20, 3, 3, 3],
    color: '#FF6B6B',
    description: 'Section cutting plane'
  },
  boundary: {
    width: 0.5,
    color: '#FFFFFF',
    description: 'Boundary lines'
  },
  leader: {
    width: 1.0,
    color: '#00D4FF',
    description: 'Leader lines'
  },
  phantom: {
    width: 1.0,
    dash: [10, 3],
    color: '#A0A0A0',
    description: 'Alternative positions'
  },
  grid: {
    width: 0.15,
    color: '#404040',
    description: 'Grid lines'
  }
};

// Surface finish symbols (ISO 1302)
export const SURFACE_FINISH = {
  machined: { symbol: '▽', Ra: '1.6' },
  ground: { symbol: '▽▽', Ra: '0.8' },
  turned: { symbol: '▽', Ra: '3.2' },
  milled: { symbol: '▽', Ra: '3.2' },
  polished: { symbol: '▽▽▽', Ra: '0.1' },
  asRolled: { symbol: '═', Ra: '12.5' },
  asCast: { symbol: '≈', Ra: '25' },
  sandBlasted: { symbol: '●', Ra: '6.3' }
};

// Geometric tolerance symbols (ISO 1101)
export const GEOMETRIC_TOLERANCES = {
  straightness: '⎯',
  flatness: '⏥',
  circularity: '○',
  cylindricity: '⌭',
  profile: '⌒',
  parallelism: '∥',
  perpendicularity: '⊥',
  angularity: '∠',
  position: '⊕',
  concentricity: '◎',
  symmetry: '≡',
  runout: '↗'
};

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export class TechnicalDrawingGenerator {
  private scope: paper.PaperScope;
  private canvas: HTMLCanvasElement;
  private scale: number = 1;
  private autoScale: boolean = true;
  private paddingFactor: number = 0.2; // 20% padding by default
  
  constructor(canvas: HTMLCanvasElement, scale: number = 1, autoScale: boolean = true) {
    this.canvas = canvas;
    this.scale = scale;
    this.autoScale = autoScale;
    this.scope = new paper.PaperScope();
    this.scope.setup(canvas);
  }

  clear() {
    // Clear all layers and items from the project
    this.scope.project.clear();
    
    // Also clear the canvas context directly for extra cleanup
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Calculate optimal scale to fit content within viewport with padding
   * @param contentWidth - Width of the content to fit
   * @param contentHeight - Height of the content to fit
   * @param viewportWidth - Available viewport width
   * @param viewportHeight - Available viewport height
   * @param paddingFactor - Padding as a percentage (0.2 = 20%)
   * @returns Optimal scale factor
   */
  calculateOptimalScale(
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    paddingFactor: number = this.paddingFactor
  ): number {
    // Reduce viewport by padding amount
    const effectiveWidth = viewportWidth * (1 - paddingFactor);
    const effectiveHeight = viewportHeight * (1 - paddingFactor);
    
    // Calculate scale needed for width and height
    const scaleX = effectiveWidth / contentWidth;
    const scaleY = effectiveHeight / contentHeight;
    
    // Use the smaller scale to ensure both dimensions fit
    const optimalScale = Math.min(scaleX, scaleY);
    
    // Prevent excessive scaling
    const maxScale = 2.0;
    const minScale = 0.1;
    
    return Math.max(minScale, Math.min(maxScale, optimalScale));
  }

  /**
   * Calculate bounding box for a set of dimensions across multiple views
   * @param dimensions - Part dimensions
   * @param includeLabels - Whether to account for dimension labels
   * @returns Bounding box with padding for labels and dimensions
   */
  calculateBoundingBox(dimensions: Dimensions, includeLabels: boolean = true): BoundingBox {
    const { length, width, thickness, diameter } = dimensions;
    
    // Determine maximum dimensions based on part type
    let maxWidth = length || diameter || 100;
    let maxHeight = Math.max(width || 0, thickness || 0, diameter || 0);
    
    // Add space for dimension lines and labels if needed
    if (includeLabels) {
      const labelPadding = 80; // Space for dimension lines and text
      maxWidth += labelPadding * 2;
      maxHeight += labelPadding * 2;
    }
    
    return {
      minX: 0,
      minY: 0,
      maxX: maxWidth,
      maxY: maxHeight,
      width: maxWidth,
      height: maxHeight
    };
  }

  /**
   * Apply auto-scaling to a view region
   * @param viewConfig - The view configuration to scale
   * @param dimensions - Part dimensions
   * @returns Scaled dimensions for drawing
   */
  applyAutoScaling(
    viewConfig: { x: number; y: number; width: number; height: number },
    dimensions: Dimensions
  ): { scale: number; scaledDimensions: Dimensions } {
    if (!this.autoScale) {
      return { scale: this.scale, scaledDimensions: dimensions };
    }
    
    const bbox = this.calculateBoundingBox(dimensions, true);
    const scale = this.calculateOptimalScale(
      bbox.width,
      bbox.height,
      viewConfig.width,
      viewConfig.height,
      this.paddingFactor
    );
    
    // Apply scale to all dimensions
    const scaledDimensions: Dimensions = {
      length: (dimensions.length || 0) * scale,
      width: (dimensions.width || 0) * scale,
      thickness: (dimensions.thickness || 0) * scale,
      diameter: dimensions.diameter ? dimensions.diameter * scale : undefined,
      outerDiameter: dimensions.outerDiameter ? dimensions.outerDiameter * scale : undefined,
      innerDiameter: dimensions.innerDiameter ? dimensions.innerDiameter * scale : undefined,
      wallThickness: dimensions.wallThickness ? dimensions.wallThickness * scale : undefined,
    };
    
    return { scale, scaledDimensions };
  }

  /**
   * Set auto-scaling mode
   * @param enabled - Whether to enable auto-scaling
   */
  setAutoScale(enabled: boolean) {
    this.autoScale = enabled;
  }

  /**
   * Set padding factor for auto-scaling
   * @param factor - Padding as a percentage (0.2 = 20%)
   */
  setPaddingFactor(factor: number) {
    this.paddingFactor = Math.max(0, Math.min(0.5, factor)); // Limit to 0-50%
  }

  // Draw a line with specific style
  drawLine(x1: number, y1: number, x2: number, y2: number, style: string = 'visible') {
    const lineStyle = LINE_STANDARDS[style] || LINE_STANDARDS.visible;
    const path = new this.scope.Path.Line(
      new this.scope.Point(x1, y1),
      new this.scope.Point(x2, y2)
    );
    
    path.strokeColor = new this.scope.Color(lineStyle.color);
    path.strokeWidth = lineStyle.width;
    
    if (lineStyle.dash) {
      path.dashArray = lineStyle.dash;
    }
    
    return path;
  }

  // Draw a rectangle with specific style
  drawRectangle(x: number, y: number, width: number, height: number, style: string = 'visible') {
    const lineStyle = LINE_STANDARDS[style] || LINE_STANDARDS.visible;
    const rect = new this.scope.Path.Rectangle(
      new this.scope.Point(x, y),
      new this.scope.Size(width, height)
    );
    
    rect.strokeColor = new this.scope.Color(lineStyle.color);
    rect.strokeWidth = lineStyle.width;
    rect.fillColor = null;
    
    if (lineStyle.dash) {
      rect.dashArray = lineStyle.dash;
    }
    
    return rect;
  }

  // Draw a circle with specific style
  drawCircle(x: number, y: number, radius: number, style: string = 'visible') {
    const lineStyle = LINE_STANDARDS[style] || LINE_STANDARDS.visible;
    const circle = new this.scope.Path.Circle(
      new this.scope.Point(x, y),
      radius
    );
    
    circle.strokeColor = new this.scope.Color(lineStyle.color);
    circle.strokeWidth = lineStyle.width;
    circle.fillColor = null;
    
    if (lineStyle.dash) {
      circle.dashArray = lineStyle.dash;
    }
    
    return circle;
  }

  // Draw centerlines (cross)
  drawCenterlines(x: number, y: number, width: number, height: number) {
    // Horizontal centerline
    this.drawLine(x - width * 0.6, y, x + width * 0.6, y, 'center');
    
    // Vertical centerline
    this.drawLine(x, y - height * 0.6, x, y + height * 0.6, 'center');
  }

  // Draw dimension line with arrows and text
  drawDimension(x1: number, y1: number, x2: number, y2: number, label: string, offset: number = 20) {
    const lineStyle = LINE_STANDARDS.dimension;
    
    // Calculate angle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Offset perpendicular to dimension line
    const offsetX = -Math.sin(angle) * offset;
    const offsetY = Math.cos(angle) * offset;
    
    const startX = x1 + offsetX;
    const startY = y1 + offsetY;
    const endX = x2 + offsetX;
    const endY = y2 + offsetY;
    
    // Extension lines
    this.drawLine(x1, y1, startX, startY, 'dimension');
    this.drawLine(x2, y2, endX, endY, 'dimension');
    
    // Dimension line
    this.drawLine(startX, startY, endX, endY, 'dimension');
    
    // Arrows
    const arrowSize = 8;
    this.drawArrow(startX, startY, angle, arrowSize);
    this.drawArrow(endX, endY, angle + Math.PI, arrowSize);
    
    // Text
    const textX = (startX + endX) / 2;
    const textY = (startY + endY) / 2 - 10;
    this.drawText(textX, textY, label, 12);
  }

  // Draw arrow
  drawArrow(x: number, y: number, angle: number, size: number) {
    const path = new this.scope.Path();
    path.add(new this.scope.Point(x, y));
    path.add(new this.scope.Point(
      x - size * Math.cos(angle - Math.PI / 6),
      y - size * Math.sin(angle - Math.PI / 6)
    ));
    path.add(new this.scope.Point(
      x - size * Math.cos(angle + Math.PI / 6),
      y - size * Math.sin(angle + Math.PI / 6)
    ));
    path.closed = true;
    path.fillColor = new this.scope.Color(LINE_STANDARDS.dimension.color);
  }

  // Draw section arrow for cross-sectional views
  drawSectionArrow(x: number, y: number, label: string, direction: 'left' | 'right' | 'up' | 'down') {
    const arrowSize = 12;
    const lineLength = 30;
    let angle = 0;
    let endX = x;
    let endY = y;

    // Calculate direction
    switch (direction) {
      case 'right':
        angle = 0;
        endX = x + lineLength;
        break;
      case 'left':
        angle = Math.PI;
        endX = x - lineLength;
        break;
      case 'down':
        angle = Math.PI / 2;
        endY = y + lineLength;
        break;
      case 'up':
        angle = -Math.PI / 2;
        endY = y - lineLength;
        break;
    }

    // Draw the arrow line
    this.drawLine(x, y, endX, endY, 'cutting');

    // Draw the arrowhead
    this.drawArrow(endX, endY, angle, arrowSize);

    // Draw the label
    const labelOffset = 15;
    let labelX = endX;
    let labelY = endY;

    switch (direction) {
      case 'right':
        labelX += labelOffset;
        break;
      case 'left':
        labelX -= labelOffset;
        break;
      case 'down':
        labelY += labelOffset;
        break;
      case 'up':
        labelY -= labelOffset;
        break;
    }

    // Draw section label with circle background
    const circle = new this.scope.Path.Circle(new this.scope.Point(labelX, labelY), 10);
    circle.fillColor = new this.scope.Color('#FF6B6B');
    circle.strokeColor = new this.scope.Color('#FFFFFF');
    circle.strokeWidth = 2;

    this.drawText(labelX, labelY + 1, label, 14, '#FFFFFF');
  }

  // Draw text - HIGH CONTRAST for visibility
  drawText(x: number, y: number, text: string, fontSize: number = 12, color: string = '#FFFFFF') {
    const textItem = new this.scope.PointText(new this.scope.Point(x, y));
    textItem.content = text;
    textItem.fontSize = fontSize;
    textItem.fillColor = new this.scope.Color(color);
    textItem.fontFamily = 'Arial, sans-serif';
    textItem.fontWeight = 'bold';
    textItem.justification = 'center';
    return textItem;
  }

  // Draw hatching (for sections)
  drawHatching(x: number, y: number, width: number, height: number, angle: number = 45, spacing: number = 5) {
    const group = new this.scope.Group();
    const rect = new this.scope.Path.Rectangle(
      new this.scope.Point(x, y),
      new this.scope.Size(width, height)
    );
    
    const angleRad = (angle * Math.PI) / 180;
    const maxDim = Math.max(width, height) * 2;
    const numLines = Math.ceil(maxDim / spacing);
    
    for (let i = -numLines; i < numLines; i++) {
      const offset = i * spacing;
      const x1 = x + width / 2 + offset * Math.cos(angleRad) - maxDim * Math.sin(angleRad);
      const y1 = y + height / 2 + offset * Math.sin(angleRad) + maxDim * Math.cos(angleRad);
      const x2 = x + width / 2 + offset * Math.cos(angleRad) + maxDim * Math.sin(angleRad);
      const y2 = y + height / 2 + offset * Math.sin(angleRad) - maxDim * Math.cos(angleRad);
      
      const line = new this.scope.Path.Line(
        new this.scope.Point(x1, y1),
        new this.scope.Point(x2, y2)
      );
      line.strokeColor = new this.scope.Color('#CCCCCC');
      line.strokeWidth = 0.5;
      
      const clipped = line.intersect(rect);
      group.addChild(clipped);
      line.remove();
    }
    
    rect.remove();
    return group;
  }

  // Draw view label - HIGH CONTRAST
  drawViewLabel(x: number, y: number, label: string) {
    this.drawText(x, y - 15, label, 14, '#FFFFFF');
  }

  // Draw grid background
  drawGrid(spacing: number = 10, majorInterval: number = 5) {
    const bounds = this.scope.view.bounds;
    const startX = Math.floor(bounds.left / spacing) * spacing;
    const startY = Math.floor(bounds.top / spacing) * spacing;
    const endX = Math.ceil(bounds.right / spacing) * spacing;
    const endY = Math.ceil(bounds.bottom / spacing) * spacing;
    
    for (let x = startX; x <= endX; x += spacing) {
      this.drawLine(x, startY, x, endY, 'grid');
    }
    
    for (let y = startY; y <= endY; y += spacing) {
      this.drawLine(startX, y, endX, y, 'grid');
    }
  }

  // Draw title block (ISO 7200)
  drawTitleBlock(
    title: string,
    partNumber: string,
    material: string,
    scale: string,
    tolerance: string = '±0.1mm',
    revision: string = 'A',
    date: string = new Date().toISOString().split('T')[0]
  ) {
    const width = 180;
    const height = 80;
    const x = this.canvas.width - width - 20;
    const y = this.canvas.height - height - 20;
    
    // Main border
    this.drawRectangle(x, y, width, height, 'visible');
    
    // Horizontal dividers
    this.drawLine(x, y + 20, x + width, y + 20, 'visible');
    this.drawLine(x, y + 40, x + width, y + 40, 'visible');
    this.drawLine(x, y + 60, x + width, y + 60, 'visible');
    
    // Vertical divider
    this.drawLine(x + 120, y, x + 120, y + 60, 'visible');
    
    // Title - HIGH CONTRAST
    this.drawText(x + 90, y + 10, title, 12, '#FFFFFF');
    
    // Part Number
    this.drawText(x + 60, y + 30, `PART: ${partNumber}`, 10, '#FFFFFF');
    this.drawText(x + 150, y + 30, `REV: ${revision}`, 10, '#FFFFFF');
    
    // Material
    this.drawText(x + 60, y + 50, `MATERIAL: ${material}`, 10, '#FFFFFF');
    this.drawText(x + 150, y + 50, `SCALE: ${scale}`, 10, '#FFFFFF');
    
    // Bottom row - HIGH CONTRAST
    this.drawText(x + 40, y + 70, `TOL: ${tolerance}`, 9, '#FFFFFF');
    this.drawText(x + 90, y + 70, date, 9, '#FFFFFF');
    this.drawText(x + 140, y + 70, 'ISO 128', 9, '#FFFFFF');
  }

  // Draw dimension with tolerance
  drawDimensionWithTolerance(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    nominal: string,
    upper: string = '+0.1',
    lower: string = '-0.1',
    arrowSize: number = 5
  ) {
    this.drawDimension(startX, startY, endX, endY, nominal, arrowSize);
    
    // Add tolerance - HIGH CONTRAST
    const textX = (startX + endX) / 2;
    const textY = (startY + endY) / 2 - 10;
    this.drawText(textX, textY - 12, `${upper}`, 8, '#00D4FF');
    this.drawText(textX, textY + 2, `${lower}`, 8, '#00D4FF');
  }

  // Draw surface finish symbol
  drawSurfaceFinish(x: number, y: number, finish: string, Ra: string = '1.6') {
    const finishData = SURFACE_FINISH[finish as keyof typeof SURFACE_FINISH] || SURFACE_FINISH.machined;
    
    // Draw surface finish symbol - HIGH CONTRAST
    const path = new this.scope.Path();
    path.add(new this.scope.Point(x - 10, y + 10));
    path.add(new this.scope.Point(x, y - 10));
    path.add(new this.scope.Point(x + 10, y + 10));
    path.strokeColor = new this.scope.Color('#FFFFFF');
    path.strokeWidth = 1;
    
    // Add Ra value - HIGH CONTRAST
    this.drawText(x, y - 15, `Ra ${Ra || finishData.Ra}`, 8, '#FFFFFF');
    
    // Add symbol
    this.drawText(x, y + 5, finishData.symbol, 12, '#FFFFFF');
  }

  // Draw geometric tolerance frame
  drawGeometricTolerance(
    x: number,
    y: number,
    symbol: string,
    tolerance: string,
    datum: string = ''
  ) {
    const width = 60;
    const height = 20;
    
    // Frame
    this.drawRectangle(x, y, width, height, 'visible');
    
    // Dividers
    this.drawLine(x + 20, y, x + 20, y + height, 'visible');
    if (datum) {
      this.drawLine(x + 40, y, x + 40, y + height, 'visible');
    }
    
    // Symbol - HIGH CONTRAST
    const toleranceSymbol = GEOMETRIC_TOLERANCES[symbol as keyof typeof GEOMETRIC_TOLERANCES] || symbol;
    this.drawText(x + 10, y + height / 2 + 3, toleranceSymbol, 12, '#FFFFFF');
    
    // Tolerance value
    this.drawText(x + 30, y + height / 2 + 3, tolerance, 10, '#FFFFFF');
    
    // Datum if provided
    if (datum) {
      this.drawText(x + 50, y + height / 2 + 3, datum, 10, '#FFFFFF');
    }
  }

  // Draw section indicator
  drawSectionIndicator(x1: number, y1: number, x2: number, y2: number, label: string = 'A-A') {
    // Section line
    this.drawLine(x1, y1, x2, y2, 'cutting');
    
    // Arrows at ends
    const angle = Math.atan2(y2 - y1, x2 - x1);
    this.drawArrow(x1 - 5 * Math.cos(angle), y1 - 5 * Math.sin(angle), angle + Math.PI, 8);
    this.drawArrow(x2 + 5 * Math.cos(angle), y2 + 5 * Math.sin(angle), angle, 8);
    
    // Labels - HIGH CONTRAST
    this.drawText(x1 - 20, y1, label.split('-')[0], 14, '#FF6B6B');
    this.drawText(x2 + 20, y2, label.split('-')[1] || label.split('-')[0], 14, '#FF6B6B');
  }

  // Draw weld symbol
  drawWeldSymbol(x: number, y: number, type: string = 'fillet', size: string = '5') {
    const path = new this.scope.Path();
    
    switch(type) {
      case 'fillet':
        path.add(new this.scope.Point(x - 10, y));
        path.add(new this.scope.Point(x, y - 10));
        path.add(new this.scope.Point(x + 10, y));
        break;
      case 'groove':
        path.add(new this.scope.Point(x - 10, y - 5));
        path.add(new this.scope.Point(x - 10, y + 5));
        path.add(new this.scope.Point(x + 10, y + 5));
        path.add(new this.scope.Point(x + 10, y - 5));
        break;
      case 'spot':
        this.drawCircle(x, y, 5, 'visible');
        return;
    }
    
    path.strokeColor = new this.scope.Color('#FFFFFF');
    path.strokeWidth = 1.5;
    
    // Size annotation - HIGH CONTRAST
    this.drawText(x, y - 15, size, 10, '#FFFFFF');
  }

  // Export to SVG
  exportToSVG(): string {
    return this.scope.project.exportSVG({ asString: true }) as string;
  }

  // Get Paper.js scope (for advanced usage)
  getScope() {
    return this.scope;
  }

  // Render the view
  render() {
    this.scope.view.update();
  }
}
