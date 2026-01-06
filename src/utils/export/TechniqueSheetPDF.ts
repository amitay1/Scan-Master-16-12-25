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
  ScanPlanData,
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
  scanPlan?: ScanPlanData; // Scan plan documents (list of linked PDFs/procedures)
  capturedDrawing?: string; // Base64 image of technical drawing
  calibrationBlockDiagram?: string; // Base64 image of FBH/straight beam calibration block
  angleBeamDiagram?: string; // Base64 image of angle beam calibration block (for circular parts)
  e2375Diagram?: string; // Base64 image of ASTM E2375 scan directions diagram
  scanDirectionsDrawing?: string; // Base64 image of scan directions (from InspectionPlanViewer)
}

export interface ExportOptions {
  companyName?: string;
  companyLogo?: string;
  documentNumber?: string;
}

// Type declaration for Electron API
interface ElectronAPI {
  isElectron: boolean;
  savePDF?: (data: string, filename: string) => Promise<{ success: boolean; path?: string; error?: string; cancelled?: boolean }>;
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

  // Check if we're in Electron environment
  const electronApi = typeof window !== 'undefined'
    ? (window as unknown as { electron?: ElectronAPI }).electron
    : undefined;
  const isElectron = electronApi?.isElectron === true;

  if (isElectron && electronApi?.savePDF) {
    // For Electron: use IPC to save PDF through main process (most reliable)
    try {
      // Get PDF as base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      // Call Electron's save dialog
      electronApi.savePDF(pdfBase64, filename)
        .then((result) => {
          if (result.success) {
            console.log('PDF saved successfully:', result.path);
          } else if (result.cancelled) {
            console.log('PDF save cancelled by user');
          } else {
            console.error('PDF save failed:', result.error);
            // Fallback to blob download
            fallbackBlobDownload(pdf, filename);
          }
        })
        .catch((error) => {
          console.error('Electron PDF save error:', error);
          fallbackBlobDownload(pdf, filename);
        });
    } catch (error) {
      console.error('Electron PDF export error:', error);
      // Fallback to blob download
      fallbackBlobDownload(pdf, filename);
    }
  } else {
    // For regular browser: use standard jsPDF save
    pdf.save(filename);
  }
}

// Fallback method using blob URL download
function fallbackBlobDownload(pdf: jsPDF, filename: string): void {
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    console.log('PDF fallback download initiated:', filename);
  } catch (fallbackError) {
    console.error('Fallback download also failed:', fallbackError);
    // Last resort: use standard jsPDF save
    pdf.save(filename);
  }
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

  // Safely get the final Y position after autoTable
  private getTableEndY(fallbackY: number, extraSpace = 10): number {
    const pdfWithTable = this.pdf as unknown as { lastAutoTable?: { finalY?: number } };
    const finalY = pdfWithTable.lastAutoTable?.finalY;
    if (typeof finalY === 'number' && !isNaN(finalY)) {
      return finalY + extraSpace;
    }
    return fallbackY + 30 + extraSpace; // Fallback: assume table took ~30mm
  }

  // Calculate total pages based on content
  private calculatePages(): void {
    let pages = 10; // Base pages (cover, toc, setup, equipment, calibration, cal-diagram, scan-params, acceptance, docs, approvals)

    if (this.data.angleBeamDiagram) pages++; // Angle beam calibration block diagram
    if (this.data.scanDetails) pages++; // Scan details table page
    if (this.data.e2375Diagram) pages++; // E2375 scan directions diagram
    if (this.data.scanDirectionsDrawing) pages++; // Scan directions drawing page
    if (this.data.capturedDrawing) pages++; // Technical drawing page
    // Safe check for scan plan documents
    const scanPlanDocs = this.data.scanPlan?.documents || [];
    if (scanPlanDocs.filter(d => d && d.isActive).length > 0) pages++; // Scan plan page

    this.totalPages = pages;

    // Build page mapping
    let page = 1;
    this.pageMapping.set('cover', page++);
    this.pageMapping.set('toc', page++);
    this.pageMapping.set('setup', page++);
    this.pageMapping.set('equipment', page++);
    this.pageMapping.set('calibration', page++);
    this.pageMapping.set('calibration-diagram', page++);
    if (this.data.angleBeamDiagram) {
      this.pageMapping.set('angle-beam-diagram', page++);
    }
    this.pageMapping.set('scan-parameters', page++);
    this.pageMapping.set('acceptance', page++);
    if (this.data.scanDetails) {
      this.pageMapping.set('scan-details', page++);
    }
    if (this.data.e2375Diagram) {
      this.pageMapping.set('e2375-diagram', page++);
    }
    if (this.data.scanDirectionsDrawing) {
      this.pageMapping.set('scan-directions-drawing', page++);
    }
    if (this.data.capturedDrawing) {
      this.pageMapping.set('technical-drawing', page++);
    }
    // Add scan plan page mapping - safe check
    if (scanPlanDocs.filter(d => d && d.isActive).length > 0) {
      this.pageMapping.set('scan-plan', page++);
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

    // Add angle beam calibration diagram if available (for circular parts)
    if (this.data.angleBeamDiagram) {
      this.addNewPage();
      this.buildAngleBeamDiagram();
    }

    this.addNewPage();
    this.buildScanParameters();
    this.addNewPage();
    this.buildAcceptanceCriteria();

    if (this.data.scanDetails) {
      this.addNewPage();
      this.buildScanDetails();
    }

    // Add E2375 scan directions diagram if available
    if (this.data.e2375Diagram) {
      this.addNewPage();
      this.buildE2375Diagram();
    }

    if (this.data.scanDirectionsDrawing) {
      this.addNewPage();
      this.buildScanDirectionsDrawing();
    }

    if (this.data.capturedDrawing) {
      this.addNewPage();
      this.buildTechnicalDrawing();
    }

    // Add scan plan page if documents exist - safe check
    const scanPlanDocsForBuild = this.data.scanPlan?.documents || [];
    if (scanPlanDocsForBuild.filter(d => d && d.isActive).length > 0) {
      this.addNewPage();
      this.buildScanPlan();
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
    ];

    // Add angle beam calibration if available
    if (this.data.angleBeamDiagram) {
      tocItems.push({ title: '   3.2 Angle Beam Calibration Block', page: this.pageMapping.get('angle-beam-diagram') || 7 });
    }

    tocItems.push(
      { title: '4. Scan Parameters', page: this.pageMapping.get('scan-parameters') || 7 },
      { title: '5. Acceptance Criteria', page: this.pageMapping.get('acceptance') || 8 },
    );

    // Add optional sections with dynamic numbering
    let sectionNum = 6;
    if (this.data.scanDetails) {
      tocItems.push({ title: `${sectionNum}. Scan Details & Directions`, page: this.pageMapping.get('scan-details') || 9 });
      sectionNum++;
    }
    // Add E2375 scan directions diagram if available
    if (this.data.e2375Diagram) {
      const subSection = this.data.scanDetails ? `${sectionNum - 1}.1` : String(sectionNum);
      tocItems.push({ title: `   ${subSection} E2375 Scan Directions Diagram`, page: this.pageMapping.get('e2375-diagram') || 10 });
      if (!this.data.scanDetails) sectionNum++;
    }
    if (this.data.scanDirectionsDrawing) {
      const subSection = this.data.scanDetails ? `${sectionNum - 1}.2` : String(sectionNum);
      tocItems.push({ title: `   ${subSection} Inspection Plan Drawing`, page: this.pageMapping.get('scan-directions-drawing') || 10 });
      if (!this.data.scanDetails) sectionNum++;
    }
    if (this.data.capturedDrawing) {
      tocItems.push({ title: `${sectionNum}. Technical Drawing`, page: this.pageMapping.get('technical-drawing') || 10 });
      sectionNum++;
    }

    // Add scan plan if available - safe check
    const scanPlanDocsForToc = this.data.scanPlan?.documents || [];
    if (scanPlanDocsForToc.filter(d => d && d.isActive).length > 0) {
      tocItems.push({ title: `${sectionNum}. Scan Plan & Reference Documents`, page: this.pageMapping.get('scan-plan') || 11 });
      sectionNum++;
    }

    const docPage = this.pageMapping.get('documentation') || 11;
    const appPage = this.pageMapping.get('approvals') || 12;
    tocItems.push(
      { title: `${sectionNum}. Documentation`, page: docPage },
      { title: `${sectionNum + 1}. Approval Signatures`, page: appPage }
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

    y = this.getTableEndY(y);

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

      y = this.getTableEndY(y);
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

        y = this.getTableEndY(y);
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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

      y = this.getTableEndY(y);
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
        // Use full available space for better quality
        const maxWidth = PAGE.contentWidth;
        const maxHeight = PAGE.height - y - PAGE.footerHeight - 20; // Available space

        this.pdf.addImage(
          this.data.calibrationBlockDiagram,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          Math.min(maxHeight, 200), // Cap at 200mm
          undefined,
          'MEDIUM' // Better quality
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
  // PAGE: ANGLE BEAM CALIBRATION DIAGRAM (optional - for circular parts)
  // =========================================================================

  private buildAngleBeamDiagram(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('3.2 ANGLE BEAM CALIBRATION BLOCK', y);

    // Add subtitle
    this.pdf.setFontSize(FONTS.small.size);
    this.pdf.setTextColor(...COLORS.lightText);
    this.pdf.text('Shear Wave / Circumferential Inspection Reference Block', PAGE.marginLeft, y);
    y += 8;

    if (this.data.angleBeamDiagram) {
      try {
        // Use full available space for better quality
        const maxWidth = PAGE.contentWidth;
        const maxHeight = PAGE.height - y - PAGE.footerHeight - 20;

        this.pdf.addImage(
          this.data.angleBeamDiagram,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          Math.min(maxHeight, 180),
          undefined,
          'MEDIUM'
        );
      } catch {
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text('Angle beam calibration block diagram could not be loaded.', PAGE.marginLeft, y + 20);
      }
    } else {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No angle beam calibration block diagram available.', PAGE.marginLeft, y + 10);
    }

    this.pdf.setTextColor(...COLORS.text);
    this.addFooter();
  }

  // =========================================================================
  // PAGE: E2375 SCAN DIRECTIONS DIAGRAM (optional)
  // =========================================================================

  private buildE2375Diagram(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('5.1 ASTM E2375 SCAN DIRECTIONS DIAGRAM', y);

    // Add subtitle with standard reference
    this.pdf.setFontSize(FONTS.small.size);
    this.pdf.setTextColor(...COLORS.lightText);
    const partType = this.data.inspectionSetup.partType || 'Unknown';
    this.pdf.text(
      `Standard Practice for Ultrasonic Testing of Wrought Products - ${formatPartType(partType)}`,
      PAGE.marginLeft,
      y
    );
    y += 8;

    if (this.data.e2375Diagram) {
      try {
        // Use full available space
        const maxWidth = PAGE.contentWidth;
        const maxHeight = PAGE.height - y - PAGE.footerHeight - 30;

        this.pdf.addImage(
          this.data.e2375Diagram,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          Math.min(maxHeight, 160),
          undefined,
          'MEDIUM'
        );

        // Add note below the diagram
        const noteY = y + Math.min(maxHeight, 160) + 10;
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text(
          'Reference: ASTM E2375-16 "Standard Practice for Ultrasonic Testing of Wrought Products"',
          PAGE.marginLeft,
          noteY
        );
      } catch {
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text('E2375 scan directions diagram could not be loaded.', PAGE.marginLeft, y + 20);
      }
    } else {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No E2375 scan directions diagram available.', PAGE.marginLeft, y + 10);
      this.pdf.text('Please visit the Scan Details tab before exporting to capture this diagram.', PAGE.marginLeft, y + 20);
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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

    // Scan directions table - filter only enabled directions
    const directionRows: string[][] = [];

    sd.scanDetails?.forEach((detail) => {
      if (detail.enabled) {
        directionRows.push([
          detail.scanningDirection,
          detail.waveMode || '-',
          detail.angle !== undefined ? `${detail.angle}°` : '-',
          detail.frequency ? `${detail.frequency} MHz` : '-',
          detail.make || '-',
          detail.probe || '-',
        ]);
      }
    });

    if (directionRows.length > 0) {
      autoTable(this.pdf, {
        startY: y,
        head: [['Dir.', 'Wave Mode', 'Angle', 'Frequency', 'Make', 'Probe']],
        body: directionRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 9 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 18, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 35 },
          5: { cellWidth: 35 },
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
  // PAGE 9.5: SCAN DIRECTIONS DRAWING (if available)
  // =========================================================================

  private buildScanDirectionsDrawing(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    // Dynamic section numbering
    const sectionNum = this.data.scanDetails ? '6.1' : '6';
    y = this.addSectionTitle(`${sectionNum}. SCAN DIRECTIONS - INSPECTION PLAN`, y);

    if (this.data.scanDirectionsDrawing) {
      try {
        // Use full available space for better quality
        const maxWidth = PAGE.contentWidth;
        const maxHeight = PAGE.height - y - PAGE.footerHeight - 25; // Available space

        this.pdf.addImage(
          this.data.scanDirectionsDrawing,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          Math.min(maxHeight, 200), // Cap at 200mm
          undefined,
          'MEDIUM' // Better quality
        );

        // Add caption below the image
        const captionY = y + Math.min(maxHeight, 200) + 5;
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text(
          'Figure: Inspection plan showing selected scanning directions with entry surfaces and beam paths.',
          PAGE.width / 2,
          captionY,
          { align: 'center' }
        );
      } catch {
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.text('Scan directions drawing could not be loaded.', PAGE.marginLeft, y + 20);
      }
    } else {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No scan directions drawing available.', PAGE.marginLeft, y + 10);
      this.pdf.text('Visit the Scan Details tab to generate the inspection plan drawing.', PAGE.marginLeft, y + 20);
    }

    this.pdf.setTextColor(...COLORS.text);
    this.addFooter();
  }

  // =========================================================================
  // PAGE 10: TECHNICAL DRAWING (if available)
  // =========================================================================

  private buildTechnicalDrawing(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    // Dynamic section numbering based on what's included
    const hasScans = this.data.scanDetails;
    const hasDirections = this.data.scanDirectionsDrawing;
    let sectionNum = '7';
    if (hasScans && hasDirections) sectionNum = '8';
    else if (hasScans || hasDirections) sectionNum = '7';

    y = this.addSectionTitle(`${sectionNum}. TECHNICAL DRAWING`, y);

    if (this.data.capturedDrawing) {
      try {
        // Use full page width and auto-calculate height to maintain aspect ratio
        const maxWidth = PAGE.contentWidth;
        const maxHeight = PAGE.height - y - PAGE.footerHeight - 20; // Available space

        // Add image with better quality settings
        this.pdf.addImage(
          this.data.capturedDrawing,
          'PNG',
          PAGE.marginLeft,
          y,
          maxWidth,
          Math.min(maxHeight, 200), // Cap at 200mm but allow more space
          undefined,
          'MEDIUM' // Better quality than FAST
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
  // PAGE: SCAN PLAN (Reference Documents)
  // =========================================================================

  private buildScanPlan(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    // Calculate dynamic section number
    let sectionNum = 7;
    if (this.data.scanDetails) sectionNum++;
    if (this.data.scanDirectionsDrawing) sectionNum++;
    if (this.data.capturedDrawing) sectionNum++;

    y = this.addSectionTitle(`${sectionNum}. SCAN PLAN & REFERENCE DOCUMENTS`, y);

    // Safe check for scanPlan and documents
    const documents = this.data.scanPlan?.documents || [];
    
    if (!this.data.scanPlan || documents.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No scan plan documents available.', PAGE.marginLeft, y + 10);
      this.pdf.setTextColor(...COLORS.text);
      this.addFooter();
      return;
    }

    // Filter active documents and sort by order
    const activeDocuments = documents
      .filter(doc => doc && doc.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (activeDocuments.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No active scan plan documents configured.', PAGE.marginLeft, y + 10);
      this.pdf.setTextColor(...COLORS.text);
      this.addFooter();
      return;
    }

    // Subtitle
    this.pdf.setFontSize(FONTS.small.size);
    this.pdf.setTextColor(...COLORS.lightText);
    this.pdf.text('The following reference documents are associated with this technique sheet:', PAGE.marginLeft, y);
    y += 10;

    // Build documents table - ensure all values are strings
    const documentRows = activeDocuments.map((doc, index) => [
      String(index + 1),
      String(doc.title || '-'),
      String(doc.description || '-'),
      String(doc.category || 'General'),
      doc.filePath ? String(doc.filePath.split('/').pop() || '-') : '-',
    ]);

    autoTable(this.pdf, {
      startY: y,
      head: [['#', 'Document Title', 'Description', 'Category', 'File Reference']],
      body: documentRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { fontStyle: 'bold', cellWidth: 50 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 30 },
        4: { cellWidth: 35, fontSize: 8 },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = this.getTableEndY(y, 15);

    // Add note about documents
    this.pdf.setFillColor(240, 249, 255); // Light blue background
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 25, 2, 2, 'F');
    this.pdf.setDrawColor(59, 130, 246); // Blue border
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 25, 2, 2, 'S');

    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(30, 64, 175); // Blue text
    this.pdf.text('NOTE', PAGE.marginLeft + 5, y + 7);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(30, 58, 138);
    this.pdf.text(
      'The documents listed above provide detailed procedures, calibration guides, and reference materials.',
      PAGE.marginLeft + 5,
      y + 14,
      { maxWidth: PAGE.contentWidth - 10 }
    );
    this.pdf.text(
      'Refer to these documents for complete inspection methodology and compliance requirements.',
      PAGE.marginLeft + 5,
      y + 20,
      { maxWidth: PAGE.contentWidth - 10 }
    );

    this.pdf.setTextColor(...COLORS.text);
    this.addFooter();
  }

  // =========================================================================
  // PAGE 11: DOCUMENTATION
  // =========================================================================

  private buildDocumentation(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    // Calculate section number based on what's included
    let docSectionNum = 6;
    if (this.data.scanDetails) docSectionNum++;
    if (this.data.scanDirectionsDrawing && !this.data.scanDetails) docSectionNum++;
    if (this.data.capturedDrawing) docSectionNum++;
    // Account for scan plan page - safe check
    const scanPlanDocsForDoc = this.data.scanPlan?.documents || [];
    if (scanPlanDocsForDoc.filter(d => d && d.isActive).length > 0) docSectionNum++;

    y = this.addSectionTitle(`${docSectionNum}. DOCUMENTATION`, y);

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

    y = this.getTableEndY(y);

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

    y = this.getTableEndY(y);

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

    // Calculate section number based on what's included
    let approvalSectionNum = 7;
    if (this.data.scanDetails) approvalSectionNum++;
    if (this.data.scanDirectionsDrawing && !this.data.scanDetails) approvalSectionNum++;
    if (this.data.capturedDrawing) approvalSectionNum++;
    // Account for scan plan page - safe check
    const scanPlanDocsForApproval = this.data.scanPlan?.documents || [];
    if (scanPlanDocsForApproval.filter(d => d && d.isActive).length > 0) approvalSectionNum++;

    y = this.addSectionTitle(`${approvalSectionNum}. APPROVAL SIGNATURES`, y);

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

    y = this.getTableEndY(y, 15);

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
