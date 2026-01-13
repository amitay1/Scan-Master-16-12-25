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
  VISUAL,
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
  previewInNewTab?: boolean; // Open PDF in new browser tab instead of downloading
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

  // If preview mode - open in new tab instead of downloading
  if (options.previewInNewTab) {
    openPdfInNewTab(pdf, filename);
    return;
  }

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

// Store reference to preview window for reuse
let previewWindow: Window | null = null;
let previousBlobUrl: string | null = null;

// Open PDF in a browser tab for preview (reuses same window for live updates)
function openPdfInNewTab(pdf: jsPDF, filename: string): void {
  try {
    // Clean up previous blob URL
    if (previousBlobUrl) {
      URL.revokeObjectURL(previousBlobUrl);
    }

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    previousBlobUrl = blobUrl;

    // Try to reuse existing preview window
    if (previewWindow && !previewWindow.closed) {
      // Update the existing window
      previewWindow.location.href = blobUrl;
      previewWindow.focus();
      console.log('PDF preview updated in existing tab:', filename);
    } else {
      // Open new window with a specific name so it can be reused
      previewWindow = window.open(blobUrl, 'pdf_preview');

      if (previewWindow) {
        previewWindow.focus();
        console.log('PDF preview opened in new tab:', filename);
      } else {
        // Popup blocked - fall back to download
        console.warn('Popup blocked, falling back to download');
        fallbackBlobDownload(pdf, filename);
      }
    }
  } catch (error) {
    console.error('Failed to open PDF in new tab:', error);
    fallbackBlobDownload(pdf, filename);
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

    // Build page mapping - ORDER MATCHES UI TABS
    let page = 1;
    this.pageMapping.set('cover', page++);
    this.pageMapping.set('toc', page++);

    // 1. Setup (Part Information + Technical Drawing)
    this.pageMapping.set('setup', page++);
    if (this.data.capturedDrawing) {
      this.pageMapping.set('technical-drawing', page++);
    }

    // 2. Equipment
    this.pageMapping.set('equipment', page++);

    // 3. Scan Parameters
    this.pageMapping.set('scan-parameters', page++);

    // 4. Acceptance
    this.pageMapping.set('acceptance', page++);

    // 5. Scan Details
    if (this.data.scanDetails) {
      this.pageMapping.set('scan-details', page++);
    }
    if (this.data.e2375Diagram) {
      this.pageMapping.set('e2375-diagram', page++);
    }
    if (this.data.scanDirectionsDrawing) {
      this.pageMapping.set('scan-directions-drawing', page++);
    }

    // 6. Documentation
    this.pageMapping.set('documentation', page++);

    // 7. Reference Standard (Calibration)
    this.pageMapping.set('calibration', page++);
    this.pageMapping.set('calibration-diagram', page++);
    if (this.data.angleBeamDiagram) {
      this.pageMapping.set('angle-beam-diagram', page++);
    }

    // 8. Scan Plan
    if (scanPlanDocs.filter(d => d && d.isActive).length > 0) {
      this.pageMapping.set('scan-plan', page++);
    }

    // Approvals
    this.pageMapping.set('approvals', page++);

    this.totalPages = page - 1;
  }

  // Build the complete PDF
  // ORDER MATCHES UI TABS: Setup → Equipment → Scan Params → Acceptance → Scan Details → Documentation → Reference Standard → Scan Plan
  public build(): void {
    this.buildCoverPage();
    this.addNewPage();
    this.buildTableOfContents();

    // 1. SETUP (Part Information + Technical Drawing)
    this.addNewPage();
    this.buildPartInformation();

    if (this.data.capturedDrawing) {
      this.addNewPage();
      this.buildTechnicalDrawing();
    }

    // 2. EQUIPMENT
    this.addNewPage();
    this.buildEquipment();

    // 3. SCAN PARAMETERS
    this.addNewPage();
    this.buildScanParameters();

    // 4. ACCEPTANCE CRITERIA
    this.addNewPage();
    this.buildAcceptanceCriteria();

    // 5. SCAN DETAILS (table + diagrams)
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

    // 6. DOCUMENTATION (moved before calibration)
    this.addNewPage();
    this.buildDocumentation();

    // 7. REFERENCE STANDARD (Calibration)
    this.addNewPage();
    this.buildCalibration();
    this.addNewPage();
    this.buildCalibrationDiagram();

    // Add angle beam calibration diagram if available (for circular parts)
    if (this.data.angleBeamDiagram) {
      this.addNewPage();
      this.buildAngleBeamDiagram();
    }

    // 8. SCAN PLAN (last tab)
    const scanPlanDocsForBuild = this.data.scanPlan?.documents || [];
    if (scanPlanDocsForBuild.filter(d => d && d.isActive).length > 0) {
      this.addNewPage();
      this.buildScanPlan();
    }

    // APPROVALS (final page)
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

    // ========== ULTIMATE HEADER DESIGN ==========
    // Main header background with TUV blue
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(0, 0, PAGE.width, PAGE.headerHeight, 'F');

    // Gold accent line at bottom
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.rect(0, PAGE.headerHeight - 1.5, PAGE.width, 1.5, 'F');

    // Company logo (left side)
    const logoX = PAGE.marginLeft;
    const logoY = 3;
    const logoMaxHeight = PAGE.headerHeight - 6;
    const logoMaxWidth = 30;

    let textStartX = logoX;

    if (this.options.companyLogo) {
      try {
        // Get actual image dimensions to preserve aspect ratio
        const imgProps = this.pdf.getImageProperties(this.options.companyLogo);
        const aspectRatio = imgProps.width / imgProps.height;

        // Calculate dimensions that fit within bounds while preserving aspect ratio
        let finalWidth = logoMaxWidth;
        let finalHeight = logoMaxWidth / aspectRatio;

        // If height exceeds max, scale based on height instead
        if (finalHeight > logoMaxHeight) {
          finalHeight = logoMaxHeight;
          finalWidth = logoMaxHeight * aspectRatio;
        }

        this.pdf.addImage(
          this.options.companyLogo,
          'AUTO',
          logoX,
          logoY,
          finalWidth,
          finalHeight,
          undefined,
          'FAST'
        );
        textStartX = logoX + finalWidth + 5;
      } catch (e) {
        console.warn('Failed to add company logo:', e);
      }
    }

    // Company name (after logo)
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    if (this.options.companyName) {
      this.pdf.text(this.options.companyName, textStartX, 10);
    }

    // Document title (center) - Two lines
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('UT TECHNIQUE SHEET', PAGE.width / 2, 10, { align: 'center' });

    // Part number & Revision badge (right side)
    const rightX = PAGE.width - PAGE.marginRight;
    if (setup.partNumber) {
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(180, 200, 220);
      this.pdf.text('P/N', rightX, 6, { align: 'right' });
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(setup.partNumber, rightX, 12, { align: 'right' });
    }

    this.pdf.setTextColor(...COLORS.text);
  }

  private addFooter(): void {
    const doc = this.data.documentation;
    const footerY = PAGE.height - PAGE.footerHeight;
    const centerY = footerY + PAGE.footerHeight / 2; // Center of footer area

    // ========== CLEAN FOOTER DESIGN ==========
    // Top accent line (blue + gold)
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(0, footerY, PAGE.width, 0.5, 'F');
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.rect(0, footerY + 0.5, PAGE.width, 0.3, 'F');

    // Footer background
    this.pdf.setFillColor(...COLORS.sectionBg);
    this.pdf.rect(0, footerY + 0.8, PAGE.width, PAGE.footerHeight - 0.8, 'F');

    // Left section: Revision and Standard
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...COLORS.primary);
    this.pdf.text(`Rev. ${doc.revision || 'A'}`, PAGE.marginLeft, centerY + 1);

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(...COLORS.lightText);
    const revWidth = this.pdf.getTextWidth(`Rev. ${doc.revision || 'A'}`);
    this.pdf.text(` | ${formatValue(this.data.standard)} | ${formatDate(doc.inspectionDate)}`, PAGE.marginLeft + revWidth, centerY + 1);

    // Center: Confidentiality notice (single line)
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(...COLORS.confidential);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('CONFIDENTIAL - Proprietary Document', PAGE.width / 2, centerY + 1, { align: 'center' });

    // Right: Page number (simple format without circle)
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...COLORS.primary);
    this.pdf.text(`Page ${this.currentPage} of ${this.totalPages}`, PAGE.width - PAGE.marginRight, centerY + 1, { align: 'right' });

    this.pdf.setTextColor(...COLORS.text);
  }

  // Helper to calculate proper image dimensions preserving aspect ratio
  private calculateImageDimensions(
    imageData: string,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    try {
      const imgProps = this.pdf.getImageProperties(imageData);
      const aspectRatio = imgProps.width / imgProps.height;

      let imgWidth = maxWidth;
      let imgHeight = maxWidth / aspectRatio;

      // If height exceeds max, scale based on height instead
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
      }

      return { width: imgWidth, height: imgHeight };
    } catch {
      // Fallback to 4:3 ratio if can't read image properties
      const fallbackRatio = 4 / 3;
      let imgWidth = maxWidth;
      let imgHeight = maxWidth / fallbackRatio;
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * fallbackRatio;
      }
      return { width: imgWidth, height: imgHeight };
    }
  }

  private addSectionTitle(title: string, y: number): number {
    // ========== ULTIMATE SECTION HEADER ==========
    const sectionHeight = 12;

    // Subtle shadow
    this.pdf.setFillColor(...COLORS.divider);
    this.pdf.roundedRect(PAGE.marginLeft + 0.5, y - 3.5, PAGE.contentWidth, sectionHeight, VISUAL.radiusMedium, VISUAL.radiusMedium, 'F');

    // Background bar with TUV blue
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.roundedRect(PAGE.marginLeft, y - 4, PAGE.contentWidth, sectionHeight, VISUAL.radiusMedium, VISUAL.radiusMedium, 'F');

    // Gold left accent bar
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.roundedRect(PAGE.marginLeft, y - 4, 4, sectionHeight, VISUAL.radiusMedium, VISUAL.radiusMedium, 'F');
    this.pdf.rect(PAGE.marginLeft + 2, y - 4, 2, sectionHeight, 'F');

    // Section title text
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(FONTS.sectionTitle.size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, PAGE.marginLeft + 10, y + 4);

    this.pdf.setTextColor(...COLORS.text);
    return y + 16;
  }

  private addSubsectionTitle(title: string, y: number): number {
    // ========== PREMIUM SUBSECTION HEADER ==========
    // Dual-color accent bar
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(PAGE.marginLeft, y - 3, 2, 9, 'F');
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.rect(PAGE.marginLeft + 2, y - 3, 2, 9, 'F');

    // Subtle background
    this.pdf.setFillColor(...COLORS.sectionBg);
    this.pdf.rect(PAGE.marginLeft + 4, y - 3, PAGE.contentWidth - 4, 9, 'F');

    this.pdf.setFontSize(FONTS.subsectionTitle.size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...COLORS.primary);
    this.pdf.text(title, PAGE.marginLeft + 8, y + 3);
    this.pdf.setTextColor(...COLORS.text);
    return y + 12;
  }

  // =========================================================================
  // PAGE 1: COVER PAGE - Ultimate Professional Design
  // =========================================================================

  private buildCoverPage(): void {
    const setup = this.data.inspectionSetup;
    const doc = this.data.documentation;
    const colWidth = PAGE.contentWidth / 2 - 5;

    // ========== CLEAN WHITE HEADER DESIGN ==========
    // White background - no fill needed (page is already white)

    // Company logo on cover page (top-left, larger on white background)
    const coverLogoMaxWidth = 55;
    const coverLogoMaxHeight = 30;
    let logoBottomY = 35;

    if (this.options.companyLogo) {
      try {
        // Get actual image dimensions to preserve aspect ratio
        const imgProps = this.pdf.getImageProperties(this.options.companyLogo);
        const aspectRatio = imgProps.width / imgProps.height;

        // Calculate dimensions that fit within bounds while preserving aspect ratio
        let finalWidth = coverLogoMaxWidth;
        let finalHeight = coverLogoMaxWidth / aspectRatio;

        // If height exceeds max, scale based on height instead
        if (finalHeight > coverLogoMaxHeight) {
          finalHeight = coverLogoMaxHeight;
          finalWidth = coverLogoMaxHeight * aspectRatio;
        }

        this.pdf.addImage(
          this.options.companyLogo,
          'AUTO',
          PAGE.marginLeft,
          10,
          finalWidth,
          finalHeight,
          undefined,
          'FAST'
        );
        logoBottomY = 10 + finalHeight + 5;
      } catch (e) {
        console.warn('Failed to add company logo on cover:', e);
      }
    }

    // Main Title - Blue text on white background
    this.pdf.setTextColor(...COLORS.primary);
    this.pdf.setFontSize(FONTS.coverTitle.size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ULTRASONIC INSPECTION', PAGE.width / 2, logoBottomY + 8, { align: 'center' });

    this.pdf.setFontSize(20);
    this.pdf.text('TECHNIQUE SHEET', PAGE.width / 2, logoBottomY + 20, { align: 'center' });

    // Company name subtitle
    if (this.options.companyName) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text(this.options.companyName, PAGE.width / 2, logoBottomY + 30, { align: 'center' });
    }

    // Accent line below title area
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(PAGE.marginLeft, logoBottomY + 35, PAGE.contentWidth, 1.5, 'F');

    // Gold accent line
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.rect(PAGE.marginLeft, logoBottomY + 37, PAGE.contentWidth, 1, 'F');

    this.pdf.setTextColor(...COLORS.text);

    // ========== DOCUMENT INFO BAR ==========
    let y = logoBottomY + 45;
    const docInfoBarHeight = 22;
    this.pdf.setFillColor(...COLORS.sectionBg);
    this.pdf.rect(0, y, PAGE.width, docInfoBarHeight, 'F');

    // Document info items with stylish icons/labels
    const docInfoItems = [
      { label: 'Document No:', value: formatValue(this.options.documentNumber || doc.procedureNumber) },
      { label: 'Date:', value: formatDate(doc.inspectionDate) },
      { label: 'Part No:', value: formatValue(setup.partNumber) },
    ];

    const infoWidth = PAGE.contentWidth / 3;
    docInfoItems.forEach((item, i) => {
      const x = PAGE.marginLeft + (i * infoWidth);

      // Label with small accent dot
      this.pdf.setFillColor(...COLORS.accentGold);
      this.pdf.circle(x + 1, y + 8, 0.5, 'F');

      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text(item.label, x + 3, y + 9);

      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(...COLORS.primaryDark);
      this.pdf.text(item.value, x, y + 17);
    });

    // ========== PART INFORMATION CARD ==========
    y = y + docInfoBarHeight + 8; // Dynamic positioning after doc info bar
    const cardHeight = 55;

    // Card shadow effect
    this.pdf.setFillColor(...COLORS.divider);
    this.pdf.roundedRect(PAGE.marginLeft + 1, y + 1, PAGE.contentWidth, cardHeight, 3, 3, 'F');

    // Card background
    this.pdf.setFillColor(...COLORS.white);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, cardHeight, 3, 3, 'F');

    // Card header with icon-style number
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 14, 3, 3, 'F');
    this.pdf.rect(PAGE.marginLeft, y + 7, PAGE.contentWidth, 7, 'F');

    // Section number badge
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.roundedRect(PAGE.marginLeft + 5, y + 2, 20, 10, 2, 2, 'F');
    this.pdf.setTextColor(...COLORS.primaryDark);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('01', PAGE.marginLeft + 15, y + 9, { align: 'center' });

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(11);
    this.pdf.text('PART IDENTIFICATION', PAGE.marginLeft + 32, y + 10);

    // Part details in grid with better spacing and contrast
    const partData = [
      ['Part Number', formatValue(setup.partNumber)],
      ['Part Name', formatValue(setup.partName)],
      ['Material', formatMaterial(setup.material, setup.customMaterialName)],
      ['Material Spec', formatValue(setup.materialSpec)],
      ['Geometry', formatPartType(setup.partType)],
      ['Drawing No', formatValue(setup.drawingNumber)],
    ];

    const partY = y + 24;
    partData.forEach((row, i) => {
      const col = i % 2;
      const x = PAGE.marginLeft + 10 + (col * (colWidth + 10));
      const currY = partY + Math.floor(i / 2) * 12;

      // Label
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(7.5);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text(row[0].toUpperCase(), x, currY);

      // Value
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9.5);
      this.pdf.setTextColor(...COLORS.text);
      this.pdf.text(row[1], x, currY + 4.5);

      // Decorative bottom line for each item
      this.pdf.setDrawColor(...COLORS.divider);
      this.pdf.setLineWidth(0.1);
      this.pdf.line(x, currY + 6, x + colWidth - 15, currY + 6);
    });

    // ========== INSPECTOR & CERTIFICATION CARD ==========
    y = y + cardHeight + 10; // Dynamic positioning after part info card
    const certCardHeight = 45;

    // Card shadow
    this.pdf.setFillColor(...COLORS.divider);
    this.pdf.roundedRect(PAGE.marginLeft + 1, y + 1, PAGE.contentWidth, certCardHeight, 3, 3, 'F');

    // Card background
    this.pdf.setFillColor(...COLORS.white);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, certCardHeight, 3, 3, 'F');

    // Card header
    this.pdf.setFillColor(...COLORS.secondary);
    this.pdf.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 14, 3, 3, 'F');
    this.pdf.rect(PAGE.marginLeft, y + 7, PAGE.contentWidth, 7, 'F');

    // Section number badge
    this.pdf.setFillColor(...COLORS.accentGold);
    this.pdf.roundedRect(PAGE.marginLeft + 5, y + 2, 20, 10, 2, 2, 'F');
    this.pdf.setTextColor(...COLORS.primaryDark);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('02', PAGE.marginLeft + 15, y + 9, { align: 'center' });

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(11);
    this.pdf.text('INSPECTOR & CERTIFICATION', PAGE.marginLeft + 32, y + 10);

    const certData = [
      ['Inspector', formatValue(doc.inspectorName)],
      ['Level', formatValue(doc.inspectorLevel)],
      ['Cert. Number', formatValue(doc.inspectorCertification)],
      ['Organization', formatValue(doc.certifyingOrganization)],
    ];

    const certY = y + 24;
    certData.forEach((row, i) => {
      const col = i % 2;
      const x = PAGE.marginLeft + 10 + (col * (colWidth + 10));
      const currY = certY + Math.floor(i / 2) * 12;

      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(7.5);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text(row[0].toUpperCase(), x, currY);

      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9.5);
      this.pdf.setTextColor(...COLORS.text);
      this.pdf.text(row[1], x, currY + 4.5);

      this.pdf.setDrawColor(...COLORS.divider);
      this.pdf.setLineWidth(0.1);
      this.pdf.line(x, currY + 6, x + colWidth - 15, currY + 6);
    });

    // ========== ACCEPTANCE CLASS (Clean Inline Design) ==========
    y = y + certCardHeight + 10; // Dynamic positioning after certification card
    const classInfo = formatAcceptanceClass(this.data.acceptanceCriteria.acceptanceClass);
    if (classInfo.class !== '-') {
      // Simple horizontal line with class info
      const lineY = y + 5;

      // Light background bar
      this.pdf.setFillColor(248, 250, 252);
      this.pdf.rect(PAGE.marginLeft, y, PAGE.contentWidth, 14, 'F');

      // Left accent line
      this.pdf.setFillColor(...COLORS.primary);
      this.pdf.rect(PAGE.marginLeft, y, 3, 14, 'F');

      // Label text
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text('Acceptance Class:', PAGE.marginLeft + 8, lineY + 5);

      // Class value
      this.pdf.setTextColor(...COLORS.primary);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(classInfo.class, PAGE.marginLeft + 45, lineY + 5);

      // Standard reference (if available)
      if (classInfo.description) {
        this.pdf.setTextColor(...COLORS.lightText);
        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(`(${classInfo.description})`, PAGE.marginLeft + 60, lineY + 5);
      }
    }

    // ========== CONFIDENTIALITY FOOTER ==========
    y = PAGE.height - 20;
    this.pdf.setFillColor(...COLORS.sectionBg);
    this.pdf.rect(0, y - 5, PAGE.width, 18, 'F');

    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...COLORS.confidential);
    this.pdf.text('CONFIDENTIAL', PAGE.width / 2, y, { align: 'center' });
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(...COLORS.lightText);
    this.pdf.text('This document contains proprietary inspection data. Unauthorized reproduction or distribution is strictly prohibited.', PAGE.width / 2, y + 6, { align: 'center' });
  }

  // =========================================================================
  // PAGE 2: TABLE OF CONTENTS
  // =========================================================================

  private buildTableOfContents(): void {
    this.addHeader();
    let y = PAGE.contentStart;

    y = this.addSectionTitle('TABLE OF CONTENTS', y);
    y += 5;

    // TOC ORDER MATCHES UI TABS: Setup → Equipment → Scan Params → Acceptance → Scan Details → Documentation → Reference Standard → Scan Plan
    const tocItems: { title: string; page: number }[] = [];
    let sectionNum = 1;

    // 1. Part Information (Setup tab)
    tocItems.push({ title: `${sectionNum}. Part Information`, page: this.pageMapping.get('setup') || 3 });
    if (this.data.capturedDrawing) {
      tocItems.push({ title: `   ${sectionNum}.1 Technical Drawing`, page: this.pageMapping.get('technical-drawing') || 4 });
    }
    sectionNum++;

    // 2. Equipment
    tocItems.push({ title: `${sectionNum}. Equipment`, page: this.pageMapping.get('equipment') || 4 });
    sectionNum++;

    // 3. Scan Parameters
    tocItems.push({ title: `${sectionNum}. Scan Parameters`, page: this.pageMapping.get('scan-parameters') || 5 });
    sectionNum++;

    // 4. Acceptance Criteria
    tocItems.push({ title: `${sectionNum}. Acceptance Criteria`, page: this.pageMapping.get('acceptance') || 6 });
    sectionNum++;

    // 5. Scan Details
    if (this.data.scanDetails) {
      tocItems.push({ title: `${sectionNum}. Scan Details & Directions`, page: this.pageMapping.get('scan-details') || 7 });
      if (this.data.e2375Diagram) {
        tocItems.push({ title: `   ${sectionNum}.1 E2375 Scan Directions Diagram`, page: this.pageMapping.get('e2375-diagram') || 8 });
      }
      if (this.data.scanDirectionsDrawing) {
        const subNum = this.data.e2375Diagram ? `${sectionNum}.2` : `${sectionNum}.1`;
        tocItems.push({ title: `   ${subNum} Inspection Plan Drawing`, page: this.pageMapping.get('scan-directions-drawing') || 9 });
      }
      sectionNum++;
    }

    // 6. Documentation
    tocItems.push({ title: `${sectionNum}. Documentation`, page: this.pageMapping.get('documentation') || 10 });
    sectionNum++;

    // 7. Reference Standard (Calibration)
    tocItems.push({ title: `${sectionNum}. Reference Standard`, page: this.pageMapping.get('calibration') || 11 });
    tocItems.push({ title: `   ${sectionNum}.1 Calibration Block Diagram`, page: this.pageMapping.get('calibration-diagram') || 12 });
    if (this.data.angleBeamDiagram) {
      tocItems.push({ title: `   ${sectionNum}.2 Angle Beam Calibration Block`, page: this.pageMapping.get('angle-beam-diagram') || 13 });
    }
    sectionNum++;

    // 8. Scan Plan (if available)
    const scanPlanDocsForToc = this.data.scanPlan?.documents || [];
    if (scanPlanDocsForToc.filter(d => d && d.isActive).length > 0) {
      tocItems.push({ title: `${sectionNum}. Scan Plan & Reference Documents`, page: this.pageMapping.get('scan-plan') || 14 });
      sectionNum++;
    }

    // Approvals (last)
    tocItems.push({ title: `${sectionNum}. Approval Signatures`, page: this.pageMapping.get('approvals') || 15 });

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
        // Calculate proper dimensions from actual image (preserves aspect ratio)
        const maxWidth = PAGE.contentWidth * 0.9;
        const maxHeight = Math.min(PAGE.height - y - PAGE.footerHeight - 30, 150);
        const { width: imgWidth, height: imgHeight } = this.calculateImageDimensions(
          this.data.calibrationBlockDiagram,
          maxWidth,
          maxHeight
        );

        // Center horizontally
        const xPos = PAGE.marginLeft + (PAGE.contentWidth - imgWidth) / 2;

        // Add border/frame around image
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(xPos - 2, y - 2, imgWidth + 4, imgHeight + 4);

        this.pdf.addImage(
          this.data.calibrationBlockDiagram,
          'PNG',
          xPos,
          y,
          imgWidth,
          imgHeight,
          undefined,
          'FAST' // High quality - minimal compression
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
        // Calculate proper dimensions from actual image (preserves aspect ratio)
        const maxWidth = PAGE.contentWidth * 0.9;
        const maxHeight = Math.min(PAGE.height - y - PAGE.footerHeight - 30, 140);
        const { width: imgWidth, height: imgHeight } = this.calculateImageDimensions(
          this.data.angleBeamDiagram,
          maxWidth,
          maxHeight
        );

        const xPos = PAGE.marginLeft + (PAGE.contentWidth - imgWidth) / 2;

        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(xPos - 2, y - 2, imgWidth + 4, imgHeight + 4);

        this.pdf.addImage(
          this.data.angleBeamDiagram,
          'PNG',
          xPos,
          y,
          imgWidth,
          imgHeight,
          undefined,
          'FAST' // High quality - minimal compression
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

    // Dynamic section numbering - E2375 is a subsection of Scan Details (section 6)
    const sectionNum = this.data.scanDetails ? '6.1' : '6';
    y = this.addSectionTitle(`${sectionNum} ASTM E2375 SCAN DIRECTIONS DIAGRAM`, y);

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
        // Calculate proper dimensions from actual image (preserves aspect ratio)
        const maxWidth = PAGE.contentWidth * 0.9;
        const maxHeight = Math.min(PAGE.height - y - PAGE.footerHeight - 40, 140);
        const { width: imgWidth, height: imgHeight } = this.calculateImageDimensions(
          this.data.e2375Diagram,
          maxWidth,
          maxHeight
        );

        const xPos = PAGE.marginLeft + (PAGE.contentWidth - imgWidth) / 2;

        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(xPos - 2, y - 2, imgWidth + 4, imgHeight + 4);

        this.pdf.addImage(
          this.data.e2375Diagram,
          'PNG',
          xPos,
          y,
          imgWidth,
          imgHeight,
          undefined,
          'FAST' // High quality - minimal compression
        );

        // Add note below the diagram
        const noteY = y + imgHeight + 10;
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

    // Format technique type for display
    const formatTechnique = (technique?: string): string => {
      if (!technique) return '-';
      const techniqueMap: Record<string, string> = {
        'conventional': 'Conventional',
        'bubbler': 'Bubbler',
        'squirt': 'Squirt / Water Jet',
        'phased_array': 'Phased Array',
      };
      return techniqueMap[technique] || technique;
    };

    // Main Scan Parameters
    const scanInfo = buildTableRows([
      ['Scan Method', formatScanMethod(scan.scanMethod)],
      ['Technique', formatTechnique(scan.technique)],
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

    // Get enabled scan directions
    const enabledDetails = sd.scanDetails?.filter(d => d.enabled) || [];

    if (enabledDetails.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.lightText);
      this.pdf.text('No scan directions configured.', PAGE.marginLeft, y + 10);
      this.pdf.setTextColor(...COLORS.text);
      this.addFooter();
      return;
    }

    // Table 1: Basic Direction Info
    y = this.addSubsectionTitle('Scan Directions Overview', y);

    const directionRows: string[][] = enabledDetails.map((detail) => [
      detail.scanningDirection,
      detail.waveMode || '-',
      detail.angle !== undefined ? `${detail.angle}°` : '-',
      detail.frequency ? `${detail.frequency} MHz` : '-',
      detail.make || '-',
      detail.probe || '-',
      detail.remarkDetails || '-',
    ]);

    autoTable(this.pdf, {
      startY: y,
      head: [['Dir.', 'Wave Mode', 'Angle', 'Freq.', 'Make', 'Probe/Size', 'Remarks']],
      body: directionRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 12, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 22 },
        5: { cellWidth: 25 },
        6: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = this.getTableEndY(y);

    // Table 2: Probe Details (P/N, S/N, Range, Attenuation, BWE, SSS)
    y = this.addSubsectionTitle('Probe Details', y);

    const probeRows: string[][] = enabledDetails.map((detail) => [
      detail.scanningDirection,
      detail.partNumber || '-',
      detail.serialNumber || '-',
      detail.rangeMm !== undefined ? `${detail.rangeMm} mm` : '-',
      detail.attenuation !== undefined ? `${detail.attenuation} dB` : '-',
      detail.backWallEcho !== undefined ? `${detail.backWallEcho}%` : '-',
      detail.sss || '-',
    ]);

    autoTable(this.pdf, {
      startY: y,
      head: [['Dir.', 'Part Number', 'Serial Number', 'Range', 'Attenuation', 'BWE', 'SSS']],
      body: probeRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 12, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 'auto' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = this.getTableEndY(y);

    // Table 3: Gate Settings
    y = this.addSubsectionTitle('Gate Settings', y);

    const formatGate = (gate?: { start: number; length: number; level: number }): string => {
      if (!gate) return '-';
      return `${gate.start}-${gate.length}-${gate.level}%`;
    };

    const gateRows: string[][] = enabledDetails.map((detail) => {
      // Access extended properties (they exist on the detail object from ScanDetailsTab)
      const extDetail = detail as typeof detail & {
        gate1?: { start: number; length: number; level: number };
        gate2?: { start: number; length: number; level: number };
      };
      return [
        detail.scanningDirection,
        formatGate(extDetail.gate1),
        formatGate(extDetail.gate2),
      ];
    });

    autoTable(this.pdf, {
      startY: y,
      head: [['Dir.', 'Gate 1 (Start-Length-Level)', 'Gate 2 (Start-Length-Level)']],
      body: gateRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 9 }, // Green
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70, halign: 'center' },
        2: { cellWidth: 'auto', halign: 'center' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    y = this.getTableEndY(y);

    // Table 4: Pulsar Parameters
    y = this.addSubsectionTitle('Pulsar Parameters', y);

    const pulsarRows: string[][] = enabledDetails.map((detail) => {
      // Access extended properties
      const extDetail = detail as typeof detail & {
        scanningFile?: string;
        pulsarParams?: string;
        prf?: number;
        indexMode?: string;
        db?: number;
        filter?: string;
        reject?: string;
        tcgMode?: boolean;
      };
      return [
        detail.scanningDirection,
        extDetail.scanningFile || '-',
        extDetail.pulsarParams || '-',
        extDetail.prf !== undefined ? `${extDetail.prf} Hz` : '-',
        extDetail.indexMode || '-',
        extDetail.db !== undefined ? `${extDetail.db} dB` : '-',
        extDetail.filter || '-',
        extDetail.reject || '-',
        extDetail.tcgMode !== undefined ? (extDetail.tcgMode ? 'ON' : 'OFF') : '-',
      ];
    });

    autoTable(this.pdf, {
      startY: y,
      head: [['Dir.', 'Scan File', 'Pulsar Params', 'PRF', 'Index', 'DB', 'Filter', 'Reject', 'TCG']],
      body: pulsarRows,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 2 },
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontSize: 7 }, // Purple
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 30 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 14, halign: 'center' },
        8: { cellWidth: 12, halign: 'center' },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

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
        // Calculate proper dimensions from actual image (preserves aspect ratio)
        const maxWidth = PAGE.contentWidth * 0.9;
        const maxHeight = Math.min(PAGE.height - y - PAGE.footerHeight - 35, 160);
        const { width: imgWidth, height: imgHeight } = this.calculateImageDimensions(
          this.data.scanDirectionsDrawing,
          maxWidth,
          maxHeight
        );

        const xPos = PAGE.marginLeft + (PAGE.contentWidth - imgWidth) / 2;

        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(xPos - 2, y - 2, imgWidth + 4, imgHeight + 4);

        this.pdf.addImage(
          this.data.scanDirectionsDrawing,
          'PNG',
          xPos,
          y,
          imgWidth,
          imgHeight,
          undefined,
          'FAST' // High quality - minimal compression
        );

        // Add caption below the image
        const captionY = y + imgHeight + 8;
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
        // Calculate proper dimensions from actual image (preserves aspect ratio)
        const maxWidth = PAGE.contentWidth * 0.9;
        const maxHeight = Math.min(PAGE.height - y - PAGE.footerHeight - 25, 160);
        const { width: imgWidth, height: imgHeight } = this.calculateImageDimensions(
          this.data.capturedDrawing,
          maxWidth,
          maxHeight
        );

        // Center horizontally
        const xPos = PAGE.marginLeft + (PAGE.contentWidth - imgWidth) / 2;

        // Add border/frame around image
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(xPos - 2, y - 2, imgWidth + 4, imgHeight + 4);

        this.pdf.addImage(
          this.data.capturedDrawing,
          'PNG',
          xPos,
          y,
          imgWidth,
          imgHeight,
          undefined,
          'FAST' // High quality - minimal compression
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
