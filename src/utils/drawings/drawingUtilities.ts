/**
 * Drawing Utilities for Professional Technical Drawings
 * ISO 128 compliant line styles and technical drawing standards
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface DrawingConfig {
  dpi: number;
  scale: number;
  lineWeights: {
    thin: number;
    normal: number;
    thick: number;
    extraThick: number;
  };
  colors: {
    primary: string;
    secondary: string;
    dimension: string;
    centerLine: string;
    hiddenLine: string;
    hatching: string;
    text: string;
    grid: string;
  };
  fonts: {
    title: string;
    dimension: string;
    annotation: string;
    label: string;
  };
}

export const DEFAULT_DRAWING_CONFIG: DrawingConfig = {
  dpi: 300,
  scale: 1,
  lineWeights: {
    thin: 0.5,
    normal: 1,
    thick: 2,
    extraThick: 3,
  },
  colors: {
    primary: '#000000',
    secondary: '#333333',
    dimension: '#0000FF',
    centerLine: '#FF0000',
    hiddenLine: '#666666',
    hatching: '#999999',
    text: '#000000',
    grid: '#E0E0E0',
  },
  fonts: {
    title: 'bold 14px Arial',
    dimension: '10px Arial',
    annotation: 'italic 10px Arial',
    label: '12px Arial',
  },
};

export class DrawingUtils {
  private ctx: CanvasRenderingContext2D;
  private config: DrawingConfig;

  constructor(ctx: CanvasRenderingContext2D, config: Partial<DrawingConfig> = {}) {
    this.ctx = ctx;
    this.config = { ...DEFAULT_DRAWING_CONFIG, ...config };
  }

  /**
   * Convert mm to pixels based on DPI
   */
  mmToPixels(mm: number): number {
    return (mm * this.config.dpi) / 25.4 * this.config.scale;
  }

  /**
   * Draw a grid background for scale reference
   */
  drawGrid(width: number, height: number, spacing: number = 10): void {
    const spacingPx = this.mmToPixels(spacing);
    
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.grid;
    this.ctx.lineWidth = this.config.lineWeights.thin;
    this.ctx.setLineDash([]);

    // Draw vertical lines
    for (let x = 0; x <= width; x += spacingPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += spacingPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Draw major grid lines every 5 units
    this.ctx.strokeStyle = this.config.colors.secondary;
    this.ctx.lineWidth = this.config.lineWeights.normal;
    
    for (let x = 0; x <= width; x += spacingPx * 5) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += spacingPx * 5) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw a dimension line with arrows and text
   */
  drawDimensionLine(start: Point2D, end: Point2D, text: string, offset: number = 15): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Calculate offset positions
    const offsetX = -Math.sin(angle) * this.mmToPixels(offset);
    const offsetY = Math.cos(angle) * this.mmToPixels(offset);
    
    const dimStart = {
      x: start.x + offsetX,
      y: start.y + offsetY,
    };
    
    const dimEnd = {
      x: end.x + offsetX,
      y: end.y + offsetY,
    };
    
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.dimension;
    this.ctx.fillStyle = this.config.colors.dimension;
    this.ctx.lineWidth = this.config.lineWeights.thin;
    this.ctx.setLineDash([]);
    
    // Draw dimension line
    this.ctx.beginPath();
    this.ctx.moveTo(dimStart.x, dimStart.y);
    this.ctx.lineTo(dimEnd.x, dimEnd.y);
    this.ctx.stroke();
    
    // Draw extension lines
    this.ctx.setLineDash([2, 2]);
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(dimStart.x, dimStart.y);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(dimEnd.x, dimEnd.y);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    
    // Draw arrows
    const arrowSize = this.mmToPixels(3);
    this.drawArrow(dimStart, angle + Math.PI, arrowSize);
    this.drawArrow(dimEnd, angle, arrowSize);
    
    // Draw text
    const midX = (dimStart.x + dimEnd.x) / 2;
    const midY = (dimStart.y + dimEnd.y) / 2;
    
    this.ctx.font = this.config.fonts.dimension;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Create text background
    const metrics = this.ctx.measureText(text);
    const padding = 2;
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(
      midX - metrics.width / 2 - padding,
      midY - 8,
      metrics.width + padding * 2,
      16
    );
    
    this.ctx.fillStyle = this.config.colors.dimension;
    this.ctx.fillText(text, midX, midY);
    
    this.ctx.restore();
  }

  /**
   * Draw an arrow at a point with given angle
   */
  private drawArrow(point: Point2D, angle: number, size: number): void {
    this.ctx.save();
    this.ctx.translate(point.x, point.y);
    this.ctx.rotate(angle);
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-size, -size / 2);
    this.ctx.lineTo(-size, size / 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }

  /**
   * Draw a center line (dash-dot pattern)
   */
  drawCenterLine(start: Point2D, end: Point2D): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.centerLine;
    this.ctx.lineWidth = this.config.lineWeights.thin;
    this.ctx.setLineDash([10, 3, 2, 3]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Draw a hidden line (dashed pattern)
   */
  drawHiddenLine(start: Point2D, end: Point2D): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.hiddenLine;
    this.ctx.lineWidth = this.config.lineWeights.thin;
    this.ctx.setLineDash([5, 3]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Draw hatching pattern for cross-sections
   */
  drawHatching(x: number, y: number, width: number, height: number, spacing: number = 3): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.hatching;
    this.ctx.lineWidth = this.config.lineWeights.thin;
    this.ctx.setLineDash([]);
    
    // Create clipping region
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();
    
    // Draw diagonal lines
    const spacingPx = this.mmToPixels(spacing);
    const diagonal = Math.sqrt(width * width + height * height);
    
    for (let i = -diagonal; i < diagonal; i += spacingPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + i, y);
      this.ctx.lineTo(x + i + height, y + height);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  /**
   * Draw a section indicator (A-A, B-B, etc.)
   */
  drawSectionIndicator(point: Point2D, label: string): void {
    const radius = this.mmToPixels(8);
    
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.primary;
    this.ctx.fillStyle = 'white';
    this.ctx.lineWidth = this.config.lineWeights.thick;
    
    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw label
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = this.config.fonts.label;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, point.x, point.y);
    
    this.ctx.restore();
  }

  /**
   * Draw surface finish symbol with Ra value
   */
  drawSurfaceFinish(point: Point2D, raValue: string): void {
    const size = this.mmToPixels(10);
    
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.primary;
    this.ctx.lineWidth = this.config.lineWeights.normal;
    
    // Draw surface finish symbol (checkmark-like)
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    this.ctx.lineTo(point.x - size / 2, point.y - size);
    this.ctx.lineTo(point.x + size / 2, point.y - size / 2);
    this.ctx.stroke();
    
    // Draw Ra value
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = this.config.fonts.annotation;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Ra ${raValue}`, point.x + size / 2 + 5, point.y - size / 2);
    
    this.ctx.restore();
  }

  /**
   * Draw tolerance text
   */
  drawTolerance(point: Point2D, nominal: string, upper: string, lower: string): void {
    this.ctx.save();
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = this.config.fonts.dimension;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    // Draw nominal value
    this.ctx.fillText(nominal, point.x, point.y);
    
    // Draw tolerance
    const nominalWidth = this.ctx.measureText(nominal).width;
    this.ctx.font = '8px Arial';
    this.ctx.fillText(`+${upper}`, point.x + nominalWidth + 2, point.y - 5);
    this.ctx.fillText(`-${lower}`, point.x + nominalWidth + 2, point.y + 5);
    
    this.ctx.restore();
  }

  /**
   * Draw a title block
   */
  drawTitleBlock(
    x: number,
    y: number,
    width: number,
    height: number,
    info: {
      partNumber?: string;
      material?: string;
      date?: string;
      scale?: string;
      drawnBy?: string;
      checkedBy?: string;
    }
  ): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.config.colors.primary;
    this.ctx.lineWidth = this.config.lineWeights.normal;
    
    // Draw border
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw internal divisions
    const rowHeight = height / 4;
    const colWidth = width / 2;
    
    // Horizontal lines
    for (let i = 1; i < 4; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + i * rowHeight);
      this.ctx.lineTo(x + width, y + i * rowHeight);
      this.ctx.stroke();
    }
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(x + colWidth, y);
    this.ctx.lineTo(x + colWidth, y + height);
    this.ctx.stroke();
    
    // Add text
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = this.config.fonts.annotation;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    const padding = 5;
    const textY = y + rowHeight / 2;
    
    // Row 1
    this.ctx.fillText('Part No:', x + padding, textY);
    this.ctx.fillText(info.partNumber || 'N/A', x + colWidth + padding, textY);
    
    // Row 2
    this.ctx.fillText('Material:', x + padding, y + rowHeight * 1.5);
    this.ctx.fillText(info.material || 'N/A', x + colWidth + padding, y + rowHeight * 1.5);
    
    // Row 3
    this.ctx.fillText('Scale:', x + padding, y + rowHeight * 2.5);
    this.ctx.fillText(info.scale || '1:1', x + colWidth + padding, y + rowHeight * 2.5);
    
    // Row 4
    this.ctx.fillText('Date:', x + padding, y + rowHeight * 3.5);
    this.ctx.fillText(info.date || new Date().toLocaleDateString(), x + colWidth + padding, y + rowHeight * 3.5);
    
    this.ctx.restore();
  }

  /**
   * Draw a legend
   */
  drawLegend(x: number, y: number, items: Array<{ symbol: string; description: string }>): void {
    this.ctx.save();
    
    // Draw border
    const width = this.mmToPixels(60);
    const height = items.length * 20 + 30;
    
    this.ctx.strokeStyle = this.config.colors.primary;
    this.ctx.lineWidth = this.config.lineWeights.normal;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw title
    this.ctx.font = this.config.fonts.label;
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('LEGEND', x + width / 2, y + 5);
    
    // Draw items
    this.ctx.font = this.config.fonts.annotation;
    this.ctx.textAlign = 'left';
    
    items.forEach((item, index) => {
      const itemY = y + 25 + index * 20;
      this.ctx.fillText(`${item.symbol} - ${item.description}`, x + 10, itemY);
    });
    
    this.ctx.restore();
  }

  /**
   * Draw an FBH (Flat Bottom Hole) with annotations
   */
  drawFBH(center: Point2D, diameter: number, depth: number, label: string): void {
    const radius = this.mmToPixels(diameter / 2);
    
    this.ctx.save();
    
    // Draw the hole
    this.ctx.strokeStyle = this.config.colors.primary;
    this.ctx.lineWidth = this.config.lineWeights.normal;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw center mark
    const markSize = this.mmToPixels(2);
    this.ctx.beginPath();
    this.ctx.moveTo(center.x - markSize, center.y);
    this.ctx.lineTo(center.x + markSize, center.y);
    this.ctx.moveTo(center.x, center.y - markSize);
    this.ctx.lineTo(center.x, center.y + markSize);
    this.ctx.stroke();
    
    // Draw label
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = this.config.fonts.annotation;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(label, center.x, center.y + radius + 5);
    this.ctx.fillText(`ø${diameter}mm`, center.x, center.y + radius + 18);
    this.ctx.fillText(`${depth}mm deep`, center.x, center.y + radius + 31);
    
    this.ctx.restore();
  }

  /**
   * Apply anti-aliasing settings
   */
  setAntialiasing(enabled: boolean): void {
    this.ctx.imageSmoothingEnabled = enabled;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Create isometric transformation
   */
  applyIsometricTransform(): void {
    const angle = Math.PI / 6; // 30 degrees
    this.ctx.transform(
      Math.cos(angle),
      Math.sin(angle),
      -Math.cos(angle),
      Math.sin(angle),
      0,
      0
    );
  }

  /**
   * Reset all transformations
   */
  resetTransform(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}