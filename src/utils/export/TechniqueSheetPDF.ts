/**
 * TechniqueSheetPDF - Professional PDF Export for Technique Sheets
 *
 * 100% DYNAMIC - Every field comes from user data
 * NO HARDCODED VALUES - Empty fields show "-" or "N/A"
 *
 * Structure:
 * Page 1: Cover Page
 * Page 2: Table of Contents
 * Page 3: Part Information (Setup)
 * Page 4: Equipment
 * Page 5: Calibration Details
 * Page 6: Calibration Block Diagram
 * Page 7: Scan Parameters
 * Page 8: Acceptance Criteria
 * Page 9: Scan Details & Directions
 * Page 10: Technical Drawing (if available)
 * Page 11: Documentation
 * Page 12: Approval Signatures
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from '@/types/techniqueSheet';
import type { ScanDetailsData } from '@/types/scanDetails';
import {
  COLORS,
  PAGE,
  FONTS,
  formatValue,
  formatNumber,
  formatDate,
  formatPartType,
  formatMaterial,
  formatBlockType,
  formatScanMethod,
  formatTransducerType,
  formatAcceptanceClass,
  isCylindrical,
  isCone,
  getPartDimensionRows,
  getMaterialWarning,
  buildTableRows,
} from './exportHelpers';

// ============================================================================
// TYPES
// ============================================================================
export interface TechniqueSheetExportData {
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails?: ScanDetailsData;
  capturedDrawing?: string; // Base64 image of technical drawing
  calibrationBlockDiagram?: string; // Base64 image of calibration block
}

export interface ExportOptions {
  companyName?: string;
  companyLogo?: string;
  documentNumber?: string;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
export function exportTechniqueSheetPDF(
  data: TechniqueSheetExportData,
  options: ExportOptions = {}
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const exporter = new TechniqueSheetPDFBuilder(pdf, data, options);
  exporter.build();

  // Generate filename from part number and date
  const partNumber = data.inspectionSetup.partNumber || 'TechniqueSheet';
  const date = new Date().toISOString().split('T')[0];
  const filename = `${partNumber}_TechniqueSheet_${date}.pdf`;

  pdf.save(filename);
}

// ============================================================================
// PDF BUILDER CLASS
// ============================================================================
class TechniqueSheetPDFBuilder {
  private pdf: jsPDF;
  private data: TechniqueSheetExportData;
  private options: ExportOptions;
  private currentPage: number = 1;
  private totalPages: number = 12; // Will be calculated
  private pageMapping: Map<string, number> = new Map();

  constructor(pdf: jsPDF, data: TechniqueSheetExportData, options: ExportOptions) {
    this.pdf = pdf;
    this.data = data;
    this.options = options;
    this.calculatePages();
  }

  // Calculate total pages based on content
  private calculatePages(): void {
    let pages = 10; // Base pages (cover, toc, setup, equipment, calibration, cal-diagram, scan-params, acceptance, docs, approvals)

    if (this.data.scanDetails) pages++; // Scan details page
    if (this.data.capturedDrawing) pages++; // Technical drawing page

    this.totalPages = pages;

    // Build page mapping
    let page = 1;
    this.pageMapping.set('cover', page++);
    this.pageMapping.set('toc', page++);
    this.pageMapping.set('setup', page++);
    this.pageMapping.set('equipment', page++);
    this.pageMapping.set('calibration', page++);
    this.pageMapping.set('calibration-diagram', page++);
    this.pageMapping.set('scan-parameters', page++);
    this.pageMapping.set('acceptance', page++);
    if (this.data.scanDetails) {
      this.pageMapping.set('scan-details', page++);
    }
    if (this.data.capturedDrawing) {
      this.pageMapping.set('technical-drawing', page++);
    }
    this.pageMapping.set('documentation', page++);
    this.pageMapping.set('approvals', page++);

    this.totalPages = page - 1;
  }

  // Build the complete PDF
  public build(): void {
    this.buildCoverPage();
    this.addNewPage();
    this.buildTableOfContents();
    this.addNewPage();
    this.buildPartInformation();
    this.addNewPage();
    this.buildEquipment();
    this.addNewPage();
    this.buildCalibration();
    this.addNewPage();
    this.buildCalibrationDiagram();
    this.addNewPage();
    this.buildScanParameters();
    this.addNewPage();
    this.buildAcceptanceCriteria();

    if (this.data.scanDetails) {
      this.addNewPage();
      this.buildScanDetails();
    }

    if (this.data.capturedDrawing) {
      this.addNewPage();
      this.buildTechnicalDrawing();
    }

    this.addNewPage();
    this.buildDocumentation();
    this.addNewPage();
    this.buildApprovals();
  }

  // =========================================================================
  // PAGE UTILITIES
  // =========================================================================

  private addNewPage(): void {
    this.pdf.addPage();
    this.currentPage++;
  }

  private addHeader(): void {
    const doc = this.data.documentation;
    const setup = this.data.inspectionSetup;

    // Header background
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(0, 0, PAGE.width, PAGE.headerHeight, 'F');

    // Company logo / name area (left)
    const logoX = PAGE.marginLeft;
    const logoY = 3;
    const logoMaxHeight = PAGE.headerHeight - 6;
    const logoMaxWidth = 30;

    let textStartX = logoX; // Default text position if no logo

    if (this.options.companyLogo) {
      try {
        // Add company logo image
        this.pdf.addImage(
          this.options.companyLogo,
          'AUTO', // Auto-detect format (PNG, JPEG, etc.)
          logoX,
          logoY,
          logoMaxWidth,
          logoMaxHeight,
          undefined,
          'FAST'
        );
        textStartX = logoX + logoMaxWidth + 3; // Position text after logo
      } catch (e) {
        // If logo fails to load, fall back to text only
        console.warn('Failed to add company logo:', e);
      }
    }

    // Company name (after logo or at start if no logo)
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    if (this.options.companyName) {
      this.pdf.text(this.options.companyName, textStartX, 10);
    }

    // Title (center)
    this.pdf.setFontSize(11);
    this.pdf.text('ULTRASONIC INSPECTION TECHNIQUE SHEET', PAGE.width / 2, 10, { align: 'center' });

    // Document number (right)
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    const docNum = setup.partNumber ? `P/N: ${setup.partNumber}` : '';
    this.pdf.text(docNum, PAGE.width - PAGE.marginRight, 10, { align: 'right' });

    // Reset text color
    this.pdf.setTextColor(...COLORS.text);
  }

  private addFooter(): void {
    const doc = this.data.documentation;
    const y = PAGE.height - PAGE.footerHeight;

    // Footer line
    this.pdf.setDrawColor(...COLORS.divider);
    this.pdf.line(PAGE.marginLeft, y, PAGE.width - PAGE.marginRight, y);

    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...COLORS.lightText);

    // Left: Document info
    const revision = doc.revision || 'A';
    this.pdf.text(`Rev. ${revision}`, PAGE.marginLeft, y + 5);

    // Center: Date
    this.pdf.text(formatDate(doc.inspectionDate), PAGE.width / 2, y + 5, { align: 'center' });

    // Right: Page number
    this.pdf.text(`Page ${this.currentPage} of ${this.totalPages}`, PAGE.width - PAGE.marginRight, y + 5, { align: 'right' });

    // Reset
    this.pdf.setTextColor(...COLORS.text);
  }

  private addSectionTitle(title: string, y: number): number {
    this.pdf.setFontSize(FONTS.sectionTitle.size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...COLORS.primary);
    this.pdf.text(title, PAGE.marginLeft, y);

    // Underline
    this.pdf.setDrawColor(...COLORS.primary);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(PAGE.marginLeft, y + 2, PAGE.marginLeft + 60, y + 2);

    this.pdf.setTextColor(...COLORS.text);
    return y + 10;
  }

  private addSubsectionTitle(title: string, y: number): number {
    this.pdf.setFontSize(FONTS.subsectionTitle.size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...COLORS.secondary);
    this.pdf.text(title, PAGE.marginLeft, y);
    this.pdf.setTextColor(...COLORS.text);
    return y + 7;
  }

  // =========================================================================
  // PAGE 1: COVER PAGE
  // =========================================================================

  private buildCoverPage(): void {
    const setup = this.data.inspectionSetup;
    const doc = this.data.documentation;

    // Header banner
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(0, 0, PAGE.width, 50, 'F');

    // Title
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ULTRASONIC INSPECTION', PAGE.width / 2, 25, { align: 'center' });
    this.pdf.text('TECHNIQUE SHEET', PAGE.width / 2, 35, { align: 'center' });

    // Company name
    if (this.options.companyName) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(this.options.companyName, PAGE.width / 2, 45, { align: 'center' });
    }

    this.pdf.setTextColor(...COLORS.text);

    // Document Info Box
    let y = 65;
    this.pdf.setFillColor(...COLORS.headerBg);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 35, 3, 3, 'F');
    this.pdf.setDrawColor(...COLORS.tableBorder);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 35, 3, 3, 'S');

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DOCUMENT INFORMATION', PAGE.marginLeft + 5, y + 8);

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    const docRows = [
      ['Standard:', formatValue(this.data.standard)],
      ['Revision:', formatValue(doc.revision)],
      ['Date:', formatDate(doc.inspectionDate)],
      ['Procedure:', formatValue(doc.procedureNumber)],
    ];

    const docY = y + 15;
    const colWidth = PAGE.contentWidth / 2;
    docRows.forEach((row, i) => {
      const x = PAGE.marginLeft + 5 + (i % 2) * colWidth;
      const rowY = docY + Math.floor(i / 2) * 8;
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(row[0], x, rowY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(row[1], x + 30, rowY);
    });

    // Part Info Box
    y = 110;
    this.pdf.setFillColor(...COLORS.headerBg);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 55, 3, 3, 'F');
    this.pdf.setDrawColor(...COLORS.tableBorder);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 55, 3, 3, 'S');

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PART INFORMATION', PAGE.marginLeft + 5, y + 8);

    // Part details
    const partRows = [
      ['Part Number:', formatValue(setup.partNumber)],
      ['Part Name:', formatValue(setup.partName)],
      ['Material:', formatMaterial(setup.material, setup.customMaterialName)],
      ['Material Spec:', formatValue(setup.materialSpec)],
      ['Part Type:', formatPartType(setup.partType)],
      ['Drawing:', formatValue(setup.drawingNumber)],
    ];

    const partY = y + 16;
    partRows.forEach((row, i) => {
      const x = PAGE.marginLeft + 5 + (i % 2) * colWidth;
      const rowY = partY + Math.floor(i / 2) * 10;
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.text(row[0], x, rowY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(row[1], x + 35, rowY);
    });

    // Inspector Info Box
    y = 175;
    this.pdf.setFillColor(...COLORS.headerBg);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 35, 3, 3, 'F');
    this.pdf.setDrawColor(...COLORS.tableBorder);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 35, 3, 3, 'S');

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('INSPECTOR INFORMATION', PAGE.marginLeft + 5, y + 8);

    const inspectorRows = [
      ['Inspector:', formatValue(doc.inspectorName)],
      ['Level:', formatValue(doc.inspectorLevel)],
      ['Certification:', formatValue(doc.inspectorCertification)],
      ['Organization:', formatValue(doc.certifyingOrganization)],
    ];

    const inspY = y + 16;
    inspectorRows.forEach((row, i) => {
      const x = PAGE.marginLeft + 5 + (i % 2) * colWidth;
      const rowY = inspY + Math.floor(i / 2) * 10;
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.text(row[0], x, rowY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(row[1], x + 30, rowY);
    });

    // Acceptance Class Badge
    y = 220;
    const classInfo = formatAcceptanceClass(this.data.acceptanceCriteria.acceptanceClass);
    if (classInfo.class !== '-') {
      // Badge background
      const badgeWidth = 60;
      const badgeX = (PAGE.width - badgeWidth) / 2;
      this.pdf.setFillColor(...COLORS.primary);
      this.pdf.roundedRect(badgeX, y, badgeWidth, 25, 3, 3, 'F');

      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('ACCEPTANCE CLASS', PAGE.width / 2, y + 8, { align: 'center' });
      this.pdf.setFontSize(18);
      this.pdf.text(classInfo.class, PAGE.width / 2, y + 20, { align: 'center' });

      this.pdf.setTextColor(...COLORS.text);
    }

    // Footer note
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...COLORS.lightText);
    this.pdf.text('This document contains confidential inspection information.', PAGE.width / 2, 270, { align: 'center' });
    this.pdf.text('Unauthorized reproduction or distribution is prohibited.', PAGE.width / 2, 275, { align: 'center' });

    // Page number
    this.addFooter();
  }

  // =========================================================================
  // PAGE 2: TABLE OF CONTENTS
  // =========================================================================

  private buildTableOfContents(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('TABLE OF CONTENTS', y);
    y += 5;

    const tocItems = [
      { title: '1. Part Information', page: this.pageMapping.get('setup') || 3 },
      { title: '2. Equipment', page: this.pageMapping.get('equipment') || 4 },
      { title: '3. Calibration', page: this.pageMapping.get('calibration') || 5 },
      { title: '   3.1 Calibration Block Diagram', page: this.pageMapping.get('calibration-diagram') || 6 },
      { title: '4. Scan Parameters', page: this.pageMapping.get('scan-parameters') || 7 },
      { title: '5. Acceptance Criteria', page: this.pageMapping.get('acceptance') || 8 },
    ];

    // Add optional sections
    if (this.data.scanDetails) {
      tocItems.push({ title: '6. Scan Details & Directions', page: this.pageMapping.get('scan-details') || 9 });
    }
    if (this.data.capturedDrawing) {
      tocItems.push({ title: '7. Technical Drawing', page: this.pageMapping.get('technical-drawing') || 10 });
    }

    const docPage = this.pageMapping.get('documentation') || 11;
    const appPage = this.pageMapping.get('approvals') || 12;
    tocItems.push(
      { title: `${tocItems.length + 1}. Documentation`, page: docPage },
      { title: `${tocItems.length + 2}. Approval Signatures`, page: appPage }
    );

    this.pdf.setFontSize(11);
    tocItems.forEach((item) => {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(item.title, PAGE.marginLeft + 5, y);

      // Dotted line
      const titleWidth = this.pdf.getTextWidth(item.title);
      const pageNumStr = String(item.page);
      const pageNumWidth = this.pdf.getTextWidth(pageNumStr);
      const dotsStart = PAGE.marginLeft + 10 + titleWidth;
      const dotsEnd = PAGE.width - PAGE.marginRight - pageNumWidth - 5;

      this.pdf.setDrawColor(...COLORS.divider);
      for (let x = dotsStart; x < dotsEnd; x += 3) {
        this.pdf.circle(x, y - 1, 0.3, 'F');
      }

      // Page number
      this.pdf.text(pageNumStr, PAGE.width - PAGE.marginRight, y, { align: 'right' });

      y += 10;
    });

    this.addFooter();
  }

  // =========================================================================
  // PAGE 3: PART INFORMATION
  // =========================================================================

  private buildPartInformation(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('1. PART INFORMATION', y);

    const setup = this.data.inspectionSetup;

    // Basic Part Info Table
    const basicInfo = buildTableRows([
      ['Part Number', setup.partNumber],
      ['Part Name', setup.partName],
      ['Material', formatMaterial(setup.material, setup.customMaterialName)],
      ['Material Specification', setup.materialSpec],
      ['Part Type / Geometry', formatPartType(setup.partType)],
      ['Drawing Number', setup.drawingNumber],
      ['Heat Treatment', setup.heatTreatment],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      head: [['Parameter', 'Value']],
      body: basicInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Dimensions Table
    y = this.addSubsectionTitle('Dimensions', y);

    const dimensionRows = getPartDimensionRows(setup);
    if (dimensionRows.length > 0) {
      autoTable(this.pdf, {
        startY: y,
        head: [['Dimension', 'Value']],
        body: dimensionRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 'auto' },
        },
        margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
      });

      y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Material Properties
    if (setup.acousticVelocity || setup.materialDensity) {
      y = this.addSubsectionTitle('Material Properties', y);

      const matProps = buildTableRows([
        ['Acoustic Velocity', setup.acousticVelocity ? formatNumber(setup.acousticVelocity, 0, 'm/s') : undefined],
        ['Material Density', setup.materialDensity ? formatNumber(setup.materialDensity, 0, 'kg/m³') : undefined],
      ]);

      if (matProps.length > 0) {
        autoTable(this.pdf, {
          startY: y,
          body: matProps,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' },
          },
          margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
        });

        y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }

    // Material Warning
    const warning = getMaterialWarning(setup.material);
    if (warning) {
      this.pdf.setFillColor(255, 243, 205); // Light yellow
      this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 15, 2, 2, 'F');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(133, 100, 4); // Dark yellow/brown
      this.pdf.text(warning, PAGE.marginLeft + 5, y + 5, { maxWidth: PAGE.contentWidth - 10 });
      this.pdf.setTextColor(...COLORS.text);
    }

    // Custom shape image if available
    if (setup.partType === 'custom' && setup.customShapeImage) {
      y += 20;
      y = this.addSubsectionTitle('Custom Shape Reference', y);
      try {
        this.pdf.addImage(setup.customShapeImage, 'PNG', PAGE.marginLeft, y, 80, 60);
        if (setup.customShapeDescription) {
          this.pdf.setFontSize(9);
          this.pdf.text(setup.customShapeDescription, PAGE.marginLeft + 85, y + 10, { maxWidth: 90 });
        }
      } catch {
        this.pdf.setFontSize(9);
        this.pdf.text('Custom shape image could not be loaded', PAGE.marginLeft, y + 5);
      }
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 4: EQUIPMENT
  // =========================================================================

  private buildEquipment(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('2. EQUIPMENT', y);

    const eq = this.data.equipment;

    // Main Equipment Info
    const equipmentInfo = buildTableRows([
      ['Manufacturer', eq.manufacturer],
      ['Model', eq.model],
      ['Serial Number', eq.serialNumber],
      ['Software Version', eq.softwareVersion],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      head: [['Equipment', 'Value']],
      body: equipmentInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Transducer Settings
    y = this.addSubsectionTitle('Transducer', y);

    const transducerInfo = buildTableRows([
      ['Probe Model', eq.probeModel],
      ['Frequency', eq.frequency ? `${eq.frequency} MHz` : undefined],
      ['Type', formatTransducerType(eq.transducerType)],
      ['Element Diameter', eq.transducerDiameter ? formatNumber(eq.transducerDiameter, 3, 'inches') : undefined],
      ['Couplant', eq.couplant],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      head: [['Transducer Parameter', 'Value']],
      body: transducerInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Performance Parameters
    y = this.addSubsectionTitle('Performance Parameters', y);

    const perfInfo = buildTableRows([
      ['Vertical Linearity', eq.verticalLinearity ? `${eq.verticalLinearity}%` : undefined],
      ['Horizontal Linearity', eq.horizontalLinearity ? `${eq.horizontalLinearity}%` : undefined],
      ['Entry Surface Resolution', eq.entrySurfaceResolution ? formatNumber(eq.entrySurfaceResolution, 3, 'inches') : undefined],
      ['Back Surface Resolution', eq.backSurfaceResolution ? formatNumber(eq.backSurfaceResolution, 3, 'inches') : undefined],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      body: perfInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Phased Array Settings (if applicable)
    if (eq.numberOfElements || eq.elementPitch || eq.wedgeModel || eq.wedgeType) {
      y = this.addSubsectionTitle('Phased Array Configuration', y);

      const paInfo = buildTableRows([
        ['Number of Elements', eq.numberOfElements?.toString()],
        ['Element Pitch', eq.elementPitch ? formatNumber(eq.elementPitch, 2, 'mm') : undefined],
        ['Wedge Model', eq.wedgeModel],
        ['Wedge Type', eq.wedgeType],
        ['Delay Line', eq.delayLine],
      ]);

      if (paInfo.length > 0) {
        autoTable(this.pdf, {
          startY: y,
          head: [['Phased Array', 'Value']],
          body: paInfo,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [128, 0, 128], textColor: [255, 255, 255] }, // Purple for PA
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' },
          },
          margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
        });
      }
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 5: CALIBRATION
  // =========================================================================

  private buildCalibration(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('3. CALIBRATION', y);

    const cal = this.data.calibration;

    // Calibration Block Info
    const calInfo = buildTableRows([
      ['Standard/Block Type', formatBlockType(cal.standardType)],
      ['Reference Material', cal.referenceMaterial],
      ['Block Dimensions', cal.blockDimensions],
      ['Block Serial Number', cal.blockSerialNumber],
      ['Last Calibration Date', formatDate(cal.lastCalibrationDate)],
      ['Metal Travel Distance', cal.metalTravelDistance ? formatNumber(cal.metalTravelDistance, 1, 'mm') : undefined],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      head: [['Calibration Parameter', 'Value']],
      body: calInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // FBH Table
    if (cal.fbhHoles && cal.fbhHoles.length > 0) {
      y = this.addSubsectionTitle('Flat Bottom Holes (FBH)', y);

      const fbhRows = cal.fbhHoles.map((hole) => [
        hole.partNumber || '-',
        hole.deltaType || '-',
        hole.diameterInch || '-',
        formatNumber(hole.diameterMm, 2, 'mm'),
        formatNumber(hole.distanceB, 1, 'mm'),
        formatNumber(hole.metalTravelH, 1, 'mm'),
      ]);

      autoTable(this.pdf, {
        startY: y,
        head: [['P/N', 'Δ Type', 'Ø FBH (inch)', 'Ø FBH (mm)', 'B (mm)', 'H (mm)']],
        body: fbhRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255] },
        margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
      });

      y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    } else if (cal.fbhSizes) {
      // Legacy FBH sizes string
      y = this.addSubsectionTitle('FBH Sizes', y);
      this.pdf.setFontSize(10);
      this.pdf.text(cal.fbhSizes, PAGE.marginLeft, y + 5);
      y += 15;
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 6: CALIBRATION BLOCK DIAGRAM
  // =========================================================================

  private buildCalibrationDiagram(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('3.1 CALIBRATION BLOCK DIAGRAM', y);

    if (this.data.calibrationBlockDiagram) {
      try {
        // Calculate image dimensions to fit page
        const maxWidth = PAGE.contentWidth;
        const maxHeight = 180;

        this.pdf.addImage(
          this.data.calibrationBlockDiagram,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          maxHeight,
          undefined,
          'FAST'
        );
      } catch {
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text('Calibration block diagram could not be loaded.', PAGE.marginLeft, y + 20);
      }
    } else {
      // Show block info in text form
      const cal = this.data.calibration;
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No calibration block diagram available.', PAGE.marginLeft, y + 10);

      if (cal.blockDimensions) {
        this.pdf.text(`Block Dimensions: ${cal.blockDimensions}`, PAGE.marginLeft, y + 20);
      }
      if (cal.standardType) {
        this.pdf.text(`Block Type: ${formatBlockType(cal.standardType)}`, PAGE.marginLeft, y + 30);
      }
    }

    this.pdf.setTextColor(...COLORS.text);
    this.addFooter();
  }

  // =========================================================================
  // PAGE 7: SCAN PARAMETERS
  // =========================================================================

  private buildScanParameters(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('4. SCAN PARAMETERS', y);

    const scan = this.data.scanParameters;

    // Main Scan Parameters
    const scanInfo = buildTableRows([
      ['Scan Method', formatScanMethod(scan.scanMethod)],
      ['Scan Type', formatValue(scan.scanType)],
      ['Scan Pattern', formatValue(scan.scanPattern)],
      ['Coupling Method', formatValue(scan.couplingMethod)],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      head: [['Parameter', 'Value']],
      body: scanInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Speed & Coverage
    y = this.addSubsectionTitle('Speed & Coverage', y);

    const speedInfo = buildTableRows([
      ['Scan Speed', scan.scanSpeed ? formatNumber(scan.scanSpeed, 0, 'mm/s') : undefined],
      ['Scan Index', scan.scanIndex ? formatNumber(scan.scanIndex, 0, '%') : undefined],
      ['Coverage', scan.coverage ? `${scan.coverage}%` : undefined],
      ['Water Path', scan.waterPath ? formatNumber(scan.waterPath, 1, 'mm') : undefined],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      body: speedInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Gate & Gain Settings
    y = this.addSubsectionTitle('Instrument Settings', y);

    const gateInfo = buildTableRows([
      ['Pulse Repetition Rate (PRF)', scan.pulseRepetitionRate ? `${scan.pulseRepetitionRate} Hz` : undefined],
      ['Gain Settings', scan.gainSettings],
      ['Alarm Gate Settings', scan.alarmGateSettings],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      body: gateInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Phased Array Settings
    if (scan.couplingMethod === 'phased_array' && scan.phasedArray) {
      y = this.addSubsectionTitle('Phased Array Settings', y);

      const pa = scan.phasedArray;
      const paInfo = buildTableRows([
        ['Refracted Angle Start', pa.refractedAngleStart ? `${pa.refractedAngleStart}°` : undefined],
        ['Refracted Angle End', pa.refractedAngleEnd ? `${pa.refractedAngleEnd}°` : undefined],
        ['Aperture', pa.aperture?.toString()],
        ['Focus Laws', pa.focusLaws],
      ]);

      if (paInfo.length > 0) {
        autoTable(this.pdf, {
          startY: y,
          head: [['Phased Array', 'Value']],
          body: paInfo,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [128, 0, 128], textColor: [255, 255, 255] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' },
          },
          margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
        });
      }
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 8: ACCEPTANCE CRITERIA
  // =========================================================================

  private buildAcceptanceCriteria(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('5. ACCEPTANCE CRITERIA', y);

    const acc = this.data.acceptanceCriteria;
    const classInfo = formatAcceptanceClass(acc.acceptanceClass);

    // Acceptance Class Badge
    if (classInfo.class !== '-') {
      this.pdf.setFillColor(...COLORS.primary);
      this.pdf.roundedRect(PAGE.marginLeft, y, 80, 20, 3, 3, 'F');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('ACCEPTANCE CLASS', PAGE.marginLeft + 5, y + 8);
      this.pdf.setFontSize(16);
      this.pdf.text(classInfo.class, PAGE.marginLeft + 5, y + 17);

      // Description
      this.pdf.setTextColor(...COLORS.text);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(classInfo.description, PAGE.marginLeft + 85, y + 12, { maxWidth: 90 });

      y += 30;
    }

    // Criteria Table
    const criteriaInfo = buildTableRows([
      ['Single Discontinuity', acc.singleDiscontinuity],
      ['Multiple Discontinuities', acc.multipleDiscontinuities],
      ['Linear Discontinuity', acc.linearDiscontinuity],
      ['Back Reflection Loss', acc.backReflectionLoss ? `${acc.backReflectionLoss}%` : undefined],
      ['Noise Level', acc.noiseLevel],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      head: [['Criterion', 'Limit']],
      body: criteriaInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Special Requirements
    if (acc.specialRequirements) {
      y = this.addSubsectionTitle('Special Requirements', y);
      this.pdf.setFontSize(9);
      this.pdf.text(acc.specialRequirements, PAGE.marginLeft, y + 5, { maxWidth: PAGE.contentWidth });
      y += 20;
    }

    // Material Warning
    const warning = getMaterialWarning(this.data.inspectionSetup.material);
    if (warning) {
      y += 5;
      this.pdf.setFillColor(255, 243, 205);
      this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 20, 2, 2, 'F');
      this.pdf.setDrawColor(255, 193, 7);
      this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 20, 2, 2, 'S');

      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(133, 100, 4);
      this.pdf.text('MATERIAL WARNING', PAGE.marginLeft + 5, y + 6);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(warning, PAGE.marginLeft + 5, y + 12, { maxWidth: PAGE.contentWidth - 10 });
      this.pdf.setTextColor(...COLORS.text);
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 9: SCAN DETAILS & DIRECTIONS (if available)
  // =========================================================================

  private buildScanDetails(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('6. SCAN DETAILS & DIRECTIONS', y);

    if (!this.data.scanDetails) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No scan direction details available.', PAGE.marginLeft, y + 10);
      this.pdf.setTextColor(...COLORS.text);
      this.addFooter();
      return;
    }

    const sd = this.data.scanDetails;

    // Scan directions table
    const directions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const directionRows: string[][] = [];

    directions.forEach((dir) => {
      const key = `direction${dir}` as keyof ScanDetailsData;
      const dirData = sd[key] as { enabled?: boolean; description?: string; angle?: number } | undefined;
      if (dirData && dirData.enabled) {
        directionRows.push([
          dir,
          dirData.description || '-',
          dirData.angle !== undefined ? `${dirData.angle}°` : '-',
        ]);
      }
    });

    if (directionRows.length > 0) {
      autoTable(this.pdf, {
        startY: y,
        head: [['Direction', 'Description', 'Angle']],
        body: directionRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 25, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30, halign: 'center' },
        },
        margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
      });
    } else {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No scan directions configured.', PAGE.marginLeft, y + 10);
      this.pdf.setTextColor(...COLORS.text);
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 10: TECHNICAL DRAWING (if available)
  // =========================================================================

  private buildTechnicalDrawing(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('7. TECHNICAL DRAWING', y);

    if (this.data.capturedDrawing) {
      try {
        const maxWidth = PAGE.contentWidth;
        const maxHeight = 180;

        this.pdf.addImage(
          this.data.capturedDrawing,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          maxHeight,
          undefined,
          'FAST'
        );
      } catch {
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text('Technical drawing could not be loaded.', PAGE.marginLeft, y + 20);
      }
    } else {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No technical drawing available.', PAGE.marginLeft, y + 10);
    }

    this.pdf.setTextColor(...COLORS.text);
    this.addFooter();
  }

  // =========================================================================
  // PAGE 11: DOCUMENTATION
  // =========================================================================

  private buildDocumentation(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    const sectionNum = this.data.scanDetails && this.data.capturedDrawing ? '8' :
                       this.data.scanDetails || this.data.capturedDrawing ? '7' : '6';
    y = this.addSectionTitle(`${sectionNum}. DOCUMENTATION`, y);

    const doc = this.data.documentation;

    // Inspector Info
    y = this.addSubsectionTitle('Inspector', y);

    const inspectorInfo = buildTableRows([
      ['Inspector Name', doc.inspectorName],
      ['Certification Number', doc.inspectorCertification],
      ['Level', doc.inspectorLevel],
      ['Certifying Organization', doc.certifyingOrganization],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      body: inspectorInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Customer & Document Info
    y = this.addSubsectionTitle('Customer & Document', y);

    const customerInfo = buildTableRows([
      ['Customer Name', doc.customerName],
      ['Purchase Order', doc.purchaseOrder],
      ['Part Serial Number', doc.serialNumber],
      ['Inspection Date', formatDate(doc.inspectionDate)],
      ['Procedure Number', doc.procedureNumber],
      ['Drawing Reference', doc.drawingReference],
      ['Revision', doc.revision],
    ], { showEmpty: true });

    autoTable(this.pdf, {
      startY: y,
      body: customerInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Additional Notes
    if (doc.additionalNotes) {
      y = this.addSubsectionTitle('Additional Notes', y);
      this.pdf.setFontSize(9);
      this.pdf.text(doc.additionalNotes, PAGE.marginLeft, y + 5, { maxWidth: PAGE.contentWidth });
    }

    this.addFooter();
  }

  // =========================================================================
  // PAGE 12: APPROVAL SIGNATURES
  // =========================================================================

  private buildApprovals(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    const sectionNum = this.data.scanDetails && this.data.capturedDrawing ? '9' :
                       this.data.scanDetails || this.data.capturedDrawing ? '8' : '7';
    y = this.addSectionTitle(`${sectionNum}. APPROVAL SIGNATURES`, y);

    const doc = this.data.documentation;

    // Signature table
    const signatureRows = [
      ['Prepared By', doc.inspectorName || '________________', formatDate(doc.inspectionDate), ''],
      ['Reviewed By (Level III)', '________________', '________________', ''],
      ['Approved By', '________________', '________________', ''],
    ];

    if (doc.approvalRequired) {
      signatureRows.push(['Customer Representative', '________________', '________________', '']);
    }

    autoTable(this.pdf, {
      startY: y,
      head: [['Role', 'Name / Signature', 'Date', 'Comments']],
      body: signatureRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5, minCellHeight: 15 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // Approval notice
    if (doc.approvalRequired) {
      this.pdf.setFillColor(255, 243, 205);
      this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 15, 2, 2, 'F');
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(133, 100, 4);
      this.pdf.text('NOTICE: This technique sheet requires Level III approval before use.', PAGE.marginLeft + 5, y + 9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(...COLORS.text);
      y += 20;
    }

    // Document control note
    y += 10;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...COLORS.lightText);
    this.pdf.text('This document is controlled. Unauthorized reproduction or modification is prohibited.', PAGE.marginLeft, y);
    this.pdf.text(`Document generated on ${new Date().toLocaleDateString()} by Scan-Master.`, PAGE.marginLeft, y + 5);

    this.pdf.setTextColor(...COLORS.text);
    this.addFooter();
  }
}

export default exportTechniqueSheetPDF;
