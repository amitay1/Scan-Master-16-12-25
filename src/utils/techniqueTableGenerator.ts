/**
 * Technical Table Generator
 * Class for creating professional technical tables for inspection reports
 */

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableStyle {
  headerBg: string;
  borderWidth: number;
  fontSize: number;
  cellPadding: number;
  fontFamily: string;
  textColor?: string;
}

export interface InspectionData {
  material: string;
  drawingNumber: string;
  partNumber: string;
  specification: string;
  weight: string;
}

export interface ScanTableData {
  type: string;
  direction: string;
  angle: number;
  frequency: number;
  coverage: number;
  gate: string;
  noiseLevel: number;
  result: 'ACCEPTED' | 'REJECTED' | 'PENDING';
}

export class TechnicalTableGenerator {
  private ctx: CanvasRenderingContext2D;
  private defaultStyle: TableStyle;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.defaultStyle = {
      headerBg: '#E0E0E0',
      borderWidth: 0.5,
      fontSize: 8,
      cellPadding: 4,
      fontFamily: 'Arial',
      textColor: '#000000'
    };
  }

  /**
   * Create professional inspection data table
   */
  createInspectionTable(x: number, y: number, data: InspectionData): number {
    const columns: TableColumn[] = [
      { header: 'METHOD / METHODE', width: 100, align: 'center' },
      { header: 'PART DESIGNATION', width: 120, align: 'center' },
      { header: 'MATERIAL / NUANCE', width: 80, align: 'center' }
    ];

    const rows = [
      ['UT', 'RING FORGING', data.material],
      ['DIMENSIONS', 'DRAWING NUMBER', data.drawingNumber],
      ['SIZES', 'PART NUMBER', data.partNumber],
      ['ACCORDING TO DRAWING', data.specification, data.weight + ' Kg'],
      ['FORGING CLASS', 'EXAMINATION STAGE', 'ROUGHNESS'],
      ['CLASS OF FORGED', 'INSPECTION STAGE', 'SURFACE'],
      ['/', 'FORGED / MACHINED', 'Ra ≤6.3μm'],
      ['', 'AS FORGED / FINISHED', '']
    ];

    const cellHeight = 20;
    let currentY = y;

    // Draw headers
    let currentX = x;
    this.ctx.fillStyle = this.defaultStyle.headerBg;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = this.defaultStyle.borderWidth;

    columns.forEach(col => {
      // Header background
      this.ctx.fillRect(currentX, currentY, col.width, cellHeight);
      this.ctx.strokeRect(currentX, currentY, col.width, cellHeight);

      // Header text
      this.ctx.fillStyle = '#000000';
      this.ctx.font = `bold ${this.defaultStyle.fontSize}px ${this.defaultStyle.fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        col.header,
        currentX + col.width / 2,
        currentY + cellHeight / 2
      );

      currentX += col.width;
    });

    currentY += cellHeight;

    // Draw rows
    rows.forEach(row => {
      currentX = x;
      this.ctx.fillStyle = '#FFFFFF';

      row.forEach((cell, colIndex) => {
        // Cell
        this.ctx.fillRect(currentX, currentY, columns[colIndex].width, cellHeight);
        this.ctx.strokeRect(currentX, currentY, columns[colIndex].width, cellHeight);

        // Text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${this.defaultStyle.fontSize}px ${this.defaultStyle.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          cell,
          currentX + columns[colIndex].width / 2,
          currentY + cellHeight / 2
        );

        currentX += columns[colIndex].width;
      });

      currentY += cellHeight;
    });

    return currentY;
  }

  /**
   * Professional scan data table
   */
  createScanDataTable(x: number, y: number, scanData: ScanTableData[]): number {
    const headers = [
      'Scan Type', 'Direction', 'Angle', 'Frequency',
      'Coverage', 'Gate', 'Noise', 'Result'
    ];

    const cellWidth = 50;
    const cellHeight = 18;

    // Headers with blue background
    this.ctx.fillStyle = '#4472C4';
    this.ctx.fillRect(x, y, cellWidth * headers.length, cellHeight);

    headers.forEach((header, i) => {
      // Cell border
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 0.5;
      this.ctx.strokeRect(x + i * cellWidth, y, cellWidth, cellHeight);

      // White header text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 7px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(header, x + i * cellWidth + cellWidth / 2, y + cellHeight / 2);
    });

    // Data rows
    scanData.forEach((scan, rowIndex) => {
      const rowY = y + (rowIndex + 1) * cellHeight;
      const rowData = [
        scan.type,
        scan.direction,
        scan.angle + '°',
        scan.frequency + ' MHz',
        scan.coverage + '%',
        scan.gate,
        scan.noiseLevel + '%',
        scan.result
      ];

      rowData.forEach((data, colIndex) => {
        // Background based on result
        if (colIndex === 7) {
          if (data === 'ACCEPTED') {
            this.ctx.fillStyle = '#C5E0B4';
          } else if (data === 'REJECTED') {
            this.ctx.fillStyle = '#F4B183';
          } else {
            this.ctx.fillStyle = '#FFF2CC';
          }
        } else {
          this.ctx.fillStyle = '#FFFFFF';
        }

        this.ctx.fillRect(x + colIndex * cellWidth, rowY, cellWidth, cellHeight);
        this.ctx.strokeRect(x + colIndex * cellWidth, rowY, cellWidth, cellHeight);

        // Text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '7px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          data,
          x + colIndex * cellWidth + cellWidth / 2,
          rowY + cellHeight / 2
        );
      });
    });

    return y + (scanData.length + 1) * cellHeight;
  }

  /**
   * General table with custom style
   */
  createCustomTable(
    x: number,
    y: number,
    columns: TableColumn[],
    rows: string[][],
    style?: Partial<TableStyle>
  ): number {
    const tableStyle = { ...this.defaultStyle, ...style };
    const cellHeight = 16;
    let currentY = y;

    // Headers
    let currentX = x;
    this.ctx.fillStyle = tableStyle.headerBg;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = tableStyle.borderWidth;

    columns.forEach(col => {
      this.ctx.fillRect(currentX, currentY, col.width, cellHeight);
      this.ctx.strokeRect(currentX, currentY, col.width, cellHeight);

      this.ctx.fillStyle = tableStyle.textColor || '#000000';
      this.ctx.font = `bold ${tableStyle.fontSize}px ${tableStyle.fontFamily}`;
      this.ctx.textAlign = col.align || 'center';
      const textX = col.align === 'left' 
        ? currentX + tableStyle.cellPadding
        : col.align === 'right'
        ? currentX + col.width - tableStyle.cellPadding
        : currentX + col.width / 2;
      this.ctx.fillText(col.header, textX, currentY + cellHeight / 2);

      currentX += col.width;
    });

    currentY += cellHeight;

    // Rows
    rows.forEach(row => {
      currentX = x;
      this.ctx.fillStyle = '#FFFFFF';

      row.forEach((cell, colIndex) => {
        this.ctx.fillRect(currentX, currentY, columns[colIndex].width, cellHeight);
        this.ctx.strokeRect(currentX, currentY, columns[colIndex].width, cellHeight);

        this.ctx.fillStyle = tableStyle.textColor || '#000000';
        this.ctx.font = `${tableStyle.fontSize}px ${tableStyle.fontFamily}`;
        this.ctx.textAlign = columns[colIndex].align || 'center';
        const textX = columns[colIndex].align === 'left'
          ? currentX + tableStyle.cellPadding
          : columns[colIndex].align === 'right'
          ? currentX + columns[colIndex].width - tableStyle.cellPadding
          : currentX + columns[colIndex].width / 2;
        this.ctx.fillText(cell, textX, currentY + cellHeight / 2);

        currentX += columns[colIndex].width;
      });

      currentY += cellHeight;
    });

    return currentY;
  }
}
