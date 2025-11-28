/**
 * Enhanced Calibration Block Drawings Module
 * Professional CAD-quality technical drawings for ultrasonic calibration blocks
 */

import { CalibrationBlockType, TechniqueSheet } from '@/types/techniqueSheet';
import { DrawingUtils, DrawingConfig, Point2D } from './drawingUtilities';

export interface BlockDrawingOptions {
  type: CalibrationBlockType;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    radius?: number;
  };
  fbhData?: Array<{
    diameter: number;
    depth: number;
    position: { x: number; y: number };
    label: string;
  }>;
  material?: string;
  serialNumber?: string;
  showGrid?: boolean;
  showDimensions?: boolean;
  showCrossSection?: boolean;
  showIsometric?: boolean;
  showLegend?: boolean;
  showTitleBlock?: boolean;
  scale?: number;
  dpi?: number;
}

export interface DrawingView {
  type: 'top' | 'front' | 'side' | 'isometric' | 'section';
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

export class EnhancedCalibrationBlockDrawings {
  private utils: DrawingUtils;
  private config: Partial<DrawingConfig>;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: BlockDrawingOptions;
  private views: Map<string, DrawingView> = new Map();

  constructor(options: BlockDrawingOptions, config?: Partial<DrawingConfig>) {
    this.options = {
      showGrid: true,
      showDimensions: true,
      showCrossSection: false,
      showIsometric: false,
      showLegend: true,
      showTitleBlock: true,
      scale: 1,
      dpi: 300,
      ...options,
    };

    this.config = {
      dpi: this.options.dpi,
      scale: this.options.scale,
      ...config,
    };

    // Initialize canvas for main view
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    this.ctx = ctx;
    this.utils = new DrawingUtils(this.ctx, this.config);
    
    // Set canvas size based on DPI
    this.setupCanvas();
  }

  private setupCanvas(width: number = 210, height: number = 297): void {
    // A4 size in mm, converted to pixels at specified DPI
    const dpi = this.options.dpi || 300;
    this.canvas.width = (width * dpi) / 25.4;
    this.canvas.height = (height * dpi) / 25.4;
    
    // Set display size (CSS pixels)
    this.canvas.style.width = `${width * 2}px`;
    this.canvas.style.height = `${height * 2}px`;
    
    // Enable anti-aliasing
    this.utils.setAntialiasing(true);
  }

  /**
   * Generate all requested views of the calibration block
   */
  public async generateDrawings(): Promise<Map<string, DrawingView>> {
    this.views.clear();
    
    // Generate main view based on block type
    await this.generateMainView();
    
    // Generate additional views if requested
    if (this.options.showIsometric) {
      await this.generateIsometricView();
    }
    
    if (this.options.showCrossSection) {
      await this.generateCrossSectionView();
    }
    
    return this.views;
  }

  /**
   * Generate the main (top) view of the calibration block
   */
  private async generateMainView(): Promise<void> {
    // Clear canvas
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid if requested
    if (this.options.showGrid) {
      this.utils.drawGrid(this.canvas.width, this.canvas.height, 10);
    }
    
    // Draw the appropriate block type
    switch (this.options.type) {
      case 'flat_block':
        this.drawFlatBlock();
        break;
      case 'curved_block':
        this.drawCurvedBlock();
        break;
      case 'cylinder_fbh':
        this.drawCylinderFBH();
        break;
      case 'step_wedge':
        this.drawStepWedge();
        break;
      case 'iow_block':
        this.drawIOWBlock();
        break;
      case 'custom':
        this.drawCustomBlock();
        break;
      default:
        this.drawFlatBlock();
    }
    
    // Add title block if requested
    if (this.options.showTitleBlock) {
      this.addTitleBlock();
    }
    
    // Add legend if requested
    if (this.options.showLegend) {
      this.addLegend();
    }
    
    // Save view
    const view: DrawingView = {
      type: 'top',
      canvas: this.cloneCanvas(),
      dataUrl: this.canvas.toDataURL('image/png', 1.0),
    };
    this.views.set('top', view);
  }

  /**
   * Draw flat calibration block with FBH
   */
  private drawFlatBlock(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const length = this.utils.mmToPixels(this.options.dimensions?.length || 200);
    const width = this.utils.mmToPixels(this.options.dimensions?.width || 100);
    const height = this.utils.mmToPixels(this.options.dimensions?.height || 50);
    
    const blockX = centerX - length / 2;
    const blockY = centerY - width / 2;
    
    // Draw main block outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(blockX, blockY, length, width);
    
    // Draw center lines
    this.utils.drawCenterLine(
      { x: centerX, y: blockY - 20 },
      { x: centerX, y: blockY + width + 20 }
    );
    this.utils.drawCenterLine(
      { x: blockX - 20, y: centerY },
      { x: blockX + length + 20, y: centerY }
    );
    
    // Draw FBH holes
    if (this.options.fbhData && this.options.fbhData.length > 0) {
      this.options.fbhData.forEach((fbh, index) => {
        const fbhX = blockX + this.utils.mmToPixels(fbh.position.x);
        const fbhY = blockY + this.utils.mmToPixels(fbh.position.y);
        
        this.utils.drawFBH(
          { x: fbhX, y: fbhY },
          fbh.diameter,
          fbh.depth,
          fbh.label || `FBH${index + 1}`
        );
        
        // Draw depth line from side
        if (this.options.showCrossSection) {
          const depthPx = this.utils.mmToPixels(fbh.depth);
          this.ctx.save();
          this.ctx.strokeStyle = '#666666';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3]);
          this.ctx.beginPath();
          this.ctx.moveTo(fbhX, fbhY);
          this.ctx.lineTo(fbhX, blockY + width + 50);
          this.ctx.stroke();
          
          // Add depth annotation
          this.ctx.fillStyle = '#000000';
          this.ctx.font = '10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(`${fbh.depth}mm`, fbhX, blockY + width + 65);
          this.ctx.restore();
        }
      });
    } else {
      // Default FBH pattern
      const fbhSpacing = length / 4;
      for (let i = 1; i <= 3; i++) {
        const fbhX = blockX + fbhSpacing * i;
        this.utils.drawFBH(
          { x: fbhX, y: centerY },
          3 + i, // Increasing diameters
          10 + i * 5, // Increasing depths
          `#${i}/64"`
        );
      }
    }
    
    // Add dimensions
    if (this.options.showDimensions) {
      // Length dimension
      this.utils.drawDimensionLine(
        { x: blockX, y: blockY + width + 40 },
        { x: blockX + length, y: blockY + width + 40 },
        `${this.options.dimensions?.length || 200} mm`,
        0
      );
      
      // Width dimension
      this.utils.drawDimensionLine(
        { x: blockX + length + 40, y: blockY },
        { x: blockX + length + 40, y: blockY + width },
        `${this.options.dimensions?.width || 100} mm`,
        0
      );
      
      // Add tolerances
      this.utils.drawTolerance(
        { x: blockX + length + 60, y: blockY - 20 },
        `${this.options.dimensions?.height || 50}`,
        '0.1',
        '0.1'
      );
    }
    
    // Add surface finish symbols
    this.utils.drawSurfaceFinish(
      { x: blockX + 20, y: blockY - 10 },
      '3.2'
    );
  }

  /**
   * Draw curved calibration block
   */
  private drawCurvedBlock(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const radius = this.utils.mmToPixels(this.options.dimensions?.radius || 100);
    const thickness = this.utils.mmToPixels(this.options.dimensions?.height || 25);
    const arcAngle = Math.PI; // Semi-circle by default
    
    // Draw outer arc
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, arcAngle);
    this.ctx.stroke();
    
    // Draw inner arc
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - thickness, 0, arcAngle);
    this.ctx.stroke();
    
    // Draw end lines
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius, centerY);
    this.ctx.lineTo(centerX - radius + thickness, centerY);
    this.ctx.moveTo(centerX + radius, centerY);
    this.ctx.lineTo(centerX + radius - thickness, centerY);
    this.ctx.stroke();
    
    // Draw center line
    this.utils.drawCenterLine(
      { x: centerX, y: centerY - radius - 20 },
      { x: centerX, y: centerY + 50 }
    );
    
    // Draw FBH holes along the arc
    const fbhCount = this.options.fbhData?.length || 5;
    for (let i = 0; i < fbhCount; i++) {
      const angle = (arcAngle / (fbhCount - 1)) * i;
      const fbhRadius = radius - thickness / 2;
      const fbhX = centerX + fbhRadius * Math.cos(angle);
      const fbhY = centerY - fbhRadius * Math.sin(angle);
      
      if (this.options.fbhData && this.options.fbhData[i]) {
        const fbh = this.options.fbhData[i];
        this.utils.drawFBH(
          { x: fbhX, y: fbhY },
          fbh.diameter,
          fbh.depth,
          fbh.label
        );
      } else {
        this.utils.drawFBH(
          { x: fbhX, y: fbhY },
          3,
          15,
          `FBH${i + 1}`
        );
      }
    }
    
    // Add radius dimension
    if (this.options.showDimensions) {
      this.ctx.save();
      this.ctx.strokeStyle = '#0000FF';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([]);
      
      // Draw radius line
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(centerX + radius, centerY);
      this.ctx.stroke();
      
      // Add radius text
      this.ctx.fillStyle = '#0000FF';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`R${this.options.dimensions?.radius || 100}mm`, centerX + radius / 2, centerY - 10);
      
      this.ctx.restore();
    }
  }

  /**
   * Draw cylinder with FBH
   */
  private drawCylinderFBH(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const diameter = this.utils.mmToPixels(this.options.dimensions?.diameter || 150);
    const height = this.utils.mmToPixels(this.options.dimensions?.height || 100);
    const radius = diameter / 2;
    
    // Draw cylinder top view (circle)
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw center lines
    this.utils.drawCenterLine(
      { x: centerX - radius - 20, y: centerY },
      { x: centerX + radius + 20, y: centerY }
    );
    this.utils.drawCenterLine(
      { x: centerX, y: centerY - radius - 20 },
      { x: centerX, y: centerY + radius + 20 }
    );
    
    // Draw FBH holes in radial pattern
    const fbhCount = this.options.fbhData?.length || 8;
    for (let i = 0; i < fbhCount; i++) {
      const angle = (Math.PI * 2 / fbhCount) * i;
      const fbhRadius = radius * 0.6;
      const fbhX = centerX + fbhRadius * Math.cos(angle);
      const fbhY = centerY + fbhRadius * Math.sin(angle);
      
      if (this.options.fbhData && this.options.fbhData[i]) {
        const fbh = this.options.fbhData[i];
        this.utils.drawFBH(
          { x: fbhX, y: fbhY },
          fbh.diameter,
          fbh.depth,
          fbh.label
        );
      } else {
        this.utils.drawFBH(
          { x: fbhX, y: fbhY },
          2 + (i % 3),
          10 + (i * 2),
          `${(angle * 180 / Math.PI).toFixed(0)}°`
        );
      }
      
      // Draw angle lines
      this.ctx.save();
      this.ctx.strokeStyle = '#CCCCCC';
      this.ctx.lineWidth = 0.5;
      this.ctx.setLineDash([2, 2]);
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(fbhX, fbhY);
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    // Add diameter dimension
    if (this.options.showDimensions) {
      this.utils.drawDimensionLine(
        { x: centerX - radius, y: centerY + radius + 30 },
        { x: centerX + radius, y: centerY + radius + 30 },
        `ø${this.options.dimensions?.diameter || 150} mm`,
        0
      );
    }
    
    // Add section indicator
    this.utils.drawSectionIndicator(
      { x: centerX - radius - 40, y: centerY },
      'A-A'
    );
  }

  /**
   * Draw step wedge calibration block
   */
  private drawStepWedge(): void {
    const startX = this.canvas.width * 0.2;
    const startY = this.canvas.height * 0.4;
    
    const stepWidth = this.utils.mmToPixels(40);
    const steps = 5;
    const baseHeight = this.utils.mmToPixels(10);
    const stepIncrement = this.utils.mmToPixels(5);
    
    // Draw step wedge outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < steps; i++) {
      const x = startX + i * stepWidth;
      const stepHeight = baseHeight + i * stepIncrement;
      
      // Draw step
      this.ctx.strokeRect(x, startY - stepHeight, stepWidth, stepHeight);
      
      // Add step height dimension
      if (this.options.showDimensions) {
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          `${(baseHeight + i * stepIncrement) / this.utils.mmToPixels(1)}mm`,
          x + stepWidth / 2,
          startY + 20
        );
        this.ctx.restore();
      }
      
      // Add hatching to show material
      if (i > 0) {
        this.utils.drawHatching(x, startY - stepHeight, stepWidth, stepHeight, 2);
      }
    }
    
    // Draw baseline
    this.ctx.beginPath();
    this.ctx.moveTo(startX - 20, startY);
    this.ctx.lineTo(startX + steps * stepWidth + 20, startY);
    this.ctx.stroke();
    
    // Add overall dimension
    if (this.options.showDimensions) {
      this.utils.drawDimensionLine(
        { x: startX, y: startY + 50 },
        { x: startX + steps * stepWidth, y: startY + 50 },
        `${(steps * 40)}mm`,
        0
      );
    }
  }

  /**
   * Draw IOW (International Institute of Welding) reference block
   */
  private drawIOWBlock(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const length = this.utils.mmToPixels(300);
    const width = this.utils.mmToPixels(40);
    const height = this.utils.mmToPixels(100);
    
    const blockX = centerX - length / 2;
    const blockY = centerY - width / 2;
    
    // Draw main block
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(blockX, blockY, length, width);
    
    // Draw reference grooves
    const groovePositions = [50, 100, 150, 200, 250];
    groovePositions.forEach((pos, index) => {
      const x = blockX + this.utils.mmToPixels(pos);
      const depth = 2 + index;
      
      // Draw groove
      this.ctx.beginPath();
      this.ctx.moveTo(x, blockY);
      this.ctx.lineTo(x, blockY + width);
      this.ctx.stroke();
      
      // Add depth annotation
      this.ctx.save();
      this.ctx.fillStyle = '#000000';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${depth}mm`, x, blockY - 10);
      this.ctx.restore();
    });
    
    // Draw calibration reference line
    this.ctx.save();
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(blockX, centerY);
    this.ctx.lineTo(blockX + length, centerY);
    this.ctx.stroke();
    this.ctx.restore();
    
    // Add IIW marking
    this.ctx.save();
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('IIW TYPE 1', centerX, blockY + width + 30);
    this.ctx.restore();
    
    // Add dimensions
    if (this.options.showDimensions) {
      this.utils.drawDimensionLine(
        { x: blockX, y: blockY + width + 50 },
        { x: blockX + length, y: blockY + width + 50 },
        '300mm',
        0
      );
    }
  }

  /**
   * Draw custom calibration block
   */
  private drawCustomBlock(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const length = this.utils.mmToPixels(this.options.dimensions?.length || 150);
    const width = this.utils.mmToPixels(this.options.dimensions?.width || 75);
    
    const blockX = centerX - length / 2;
    const blockY = centerY - width / 2;
    
    // Draw block outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(blockX, blockY, length, width);
    
    // Add custom text
    this.ctx.save();
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CUSTOM BLOCK', centerX, centerY);
    
    this.ctx.font = '12px Arial';
    this.ctx.fillText(this.options.material || 'User Defined', centerX, centerY + 20);
    this.ctx.restore();
    
    // Add any FBH data if provided
    if (this.options.fbhData) {
      this.options.fbhData.forEach((fbh) => {
        const fbhX = blockX + this.utils.mmToPixels(fbh.position.x);
        const fbhY = blockY + this.utils.mmToPixels(fbh.position.y);
        
        this.utils.drawFBH(
          { x: fbhX, y: fbhY },
          fbh.diameter,
          fbh.depth,
          fbh.label
        );
      });
    }
    
    // Add dimensions
    if (this.options.showDimensions) {
      this.utils.drawDimensionLine(
        { x: blockX, y: blockY + width + 30 },
        { x: blockX + length, y: blockY + width + 30 },
        `${this.options.dimensions?.length || 150}mm`,
        0
      );
      
      this.utils.drawDimensionLine(
        { x: blockX + length + 30, y: blockY },
        { x: blockX + length + 30, y: blockY + width },
        `${this.options.dimensions?.width || 75}mm`,
        0
      );
    }
  }

  /**
   * Generate isometric view
   */
  private async generateIsometricView(): Promise<void> {
    // Create new canvas for isometric view
    const isoCanvas = document.createElement('canvas');
    isoCanvas.width = this.canvas.width;
    isoCanvas.height = this.canvas.height;
    
    const isoCtx = isoCanvas.getContext('2d');
    if (!isoCtx) return;
    
    const isoUtils = new DrawingUtils(isoCtx, this.config);
    
    // Clear canvas
    isoCtx.fillStyle = 'white';
    isoCtx.fillRect(0, 0, isoCanvas.width, isoCanvas.height);
    
    // Apply isometric transformation
    isoCtx.save();
    isoCtx.translate(isoCanvas.width / 2, isoCanvas.height / 2);
    isoUtils.applyIsometricTransform();
    
    // Draw isometric block
    const length = isoUtils.mmToPixels(this.options.dimensions?.length || 200);
    const width = isoUtils.mmToPixels(this.options.dimensions?.width || 100);
    const height = isoUtils.mmToPixels(this.options.dimensions?.height || 50);
    
    // Draw faces
    isoCtx.strokeStyle = '#000000';
    isoCtx.lineWidth = 2;
    
    // Top face
    isoCtx.beginPath();
    isoCtx.moveTo(-length / 2, -width / 2);
    isoCtx.lineTo(length / 2, -width / 2);
    isoCtx.lineTo(length / 2, width / 2);
    isoCtx.lineTo(-length / 2, width / 2);
    isoCtx.closePath();
    isoCtx.stroke();
    
    // Front face
    isoCtx.save();
    isoCtx.transform(1, 0, 0, 0.5, 0, height);
    isoCtx.strokeRect(-length / 2, -height, length, height);
    isoCtx.restore();
    
    // Side face
    isoCtx.save();
    isoCtx.transform(0.5, 0, 0, 1, length / 2, 0);
    isoCtx.strokeRect(0, -width / 2, height, width);
    isoCtx.restore();
    
    isoCtx.restore();
    
    // Add isometric label
    isoCtx.fillStyle = '#000000';
    isoCtx.font = 'bold 14px Arial';
    isoCtx.textAlign = 'center';
    isoCtx.fillText('ISOMETRIC VIEW', isoCanvas.width / 2, 50);
    
    // Save view
    const view: DrawingView = {
      type: 'isometric',
      canvas: isoCanvas,
      dataUrl: isoCanvas.toDataURL('image/png', 1.0),
    };
    this.views.set('isometric', view);
  }

  /**
   * Generate cross-section view
   */
  private async generateCrossSectionView(): Promise<void> {
    // Create new canvas for cross-section
    const sectionCanvas = document.createElement('canvas');
    sectionCanvas.width = this.canvas.width;
    sectionCanvas.height = this.canvas.height / 2;
    
    const sectionCtx = sectionCanvas.getContext('2d');
    if (!sectionCtx) return;
    
    const sectionUtils = new DrawingUtils(sectionCtx, this.config);
    
    // Clear canvas
    sectionCtx.fillStyle = 'white';
    sectionCtx.fillRect(0, 0, sectionCanvas.width, sectionCanvas.height);
    
    const centerX = sectionCanvas.width / 2;
    const centerY = sectionCanvas.height / 2;
    
    const length = sectionUtils.mmToPixels(this.options.dimensions?.length || 200);
    const height = sectionUtils.mmToPixels(this.options.dimensions?.height || 50);
    
    // Draw section outline
    sectionCtx.strokeStyle = '#000000';
    sectionCtx.lineWidth = 2;
    sectionCtx.strokeRect(centerX - length / 2, centerY - height / 2, length, height);
    
    // Add hatching
    sectionUtils.drawHatching(
      centerX - length / 2,
      centerY - height / 2,
      length,
      height,
      3
    );
    
    // Draw FBH holes in section
    if (this.options.fbhData) {
      this.options.fbhData.forEach((fbh) => {
        const fbhX = centerX - length / 2 + sectionUtils.mmToPixels(fbh.position.x);
        const fbhDepth = sectionUtils.mmToPixels(fbh.depth);
        
        // Draw hole from top
        sectionCtx.save();
        sectionCtx.strokeStyle = '#000000';
        sectionCtx.lineWidth = 1;
        sectionCtx.beginPath();
        sectionCtx.moveTo(fbhX, centerY - height / 2);
        sectionCtx.lineTo(fbhX, centerY - height / 2 + fbhDepth);
        
        // Draw flat bottom
        const fbhRadius = sectionUtils.mmToPixels(fbh.diameter / 2);
        sectionCtx.arc(fbhX, centerY - height / 2 + fbhDepth, fbhRadius, 0, Math.PI);
        sectionCtx.stroke();
        sectionCtx.restore();
      });
    }
    
    // Add section label
    sectionCtx.fillStyle = '#000000';
    sectionCtx.font = 'bold 14px Arial';
    sectionCtx.textAlign = 'center';
    sectionCtx.fillText('SECTION A-A', centerX, 30);
    
    // Save view
    const view: DrawingView = {
      type: 'section',
      canvas: sectionCanvas,
      dataUrl: sectionCanvas.toDataURL('image/png', 1.0),
    };
    this.views.set('section', view);
  }

  /**
   * Add title block to the drawing
   */
  private addTitleBlock(): void {
    const blockWidth = this.utils.mmToPixels(80);
    const blockHeight = this.utils.mmToPixels(40);
    const x = this.canvas.width - blockWidth - this.utils.mmToPixels(10);
    const y = this.canvas.height - blockHeight - this.utils.mmToPixels(10);
    
    this.utils.drawTitleBlock(x, y, blockWidth, blockHeight, {
      partNumber: this.options.serialNumber || 'CAL-001',
      material: this.options.material || 'Steel',
      date: new Date().toLocaleDateString(),
      scale: `1:${this.options.scale || 1}`,
      drawnBy: 'UT System',
      checkedBy: 'QA',
    });
  }

  /**
   * Add legend to the drawing
   */
  private addLegend(): void {
    const x = this.utils.mmToPixels(10);
    const y = this.canvas.height - this.utils.mmToPixels(80);
    
    const legendItems = [
      { symbol: 'FBH', description: 'Flat Bottom Hole' },
      { symbol: '━━━', description: 'Visible Edge' },
      { symbol: '- - -', description: 'Hidden Edge' },
      { symbol: '─ • ─', description: 'Center Line' },
      { symbol: 'ø', description: 'Diameter' },
      { symbol: 'R', description: 'Radius' },
    ];
    
    this.utils.drawLegend(x, y, legendItems);
  }

  /**
   * Clone canvas for saving views
   */
  private cloneCanvas(): HTMLCanvasElement {
    const clone = document.createElement('canvas');
    clone.width = this.canvas.width;
    clone.height = this.canvas.height;
    const cloneCtx = clone.getContext('2d');
    if (cloneCtx) {
      cloneCtx.drawImage(this.canvas, 0, 0);
    }
    return clone;
  }

  /**
   * Export drawing as PNG blob
   */
  public async exportAsPNG(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png', 1.0);
    });
  }

  /**
   * Export drawing as high-quality data URL
   */
  public exportAsDataURL(): string {
    return this.canvas.toDataURL('image/png', 1.0);
  }

  /**
   * Get canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get all generated views
   */
  public getViews(): Map<string, DrawingView> {
    return this.views;
  }
}