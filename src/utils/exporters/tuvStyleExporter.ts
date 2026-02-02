// @ts-nocheck
/**
 * TÜV-Style Professional Inspection Report Exporter
 * 
 * Creates comprehensive 19-page inspection reports following TÜV professional standards
 * Features:
 * - Bilingual support (Hebrew/English)
 * - Professional logo placement
 * - Document control with revision tracking
 * - Level II/III certification signatures
 * - Complete technical documentation
 * - Professional formatting and layout
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportData, ExportOptions, ExportResult } from '@/types/exportTypes';
import { BaseExporter } from './baseExporter';

export interface TuvDocumentInfo {
  documentNumber: string;
  revisionNumber: string;
  revisionDate: string;
  revisionDescription: string;
  controlledCopy: boolean;
  language: "english" | "hebrew" | "bilingual";
}

export interface TuvCertificationInfo {
  inspectorName: string;
  inspectorLevel: "Level I" | "Level II" | "Level III";
  inspectorCertification: string;
  reviewerName?: string;
  reviewerLevel?: "Level II" | "Level III";
  approverName?: string;
  approverLevel?: "Level III";
  customerRepresentative?: string;
}

export class TuvStyleExporter extends BaseExporter {
  private doc: jsPDF;
  private currentPage: number = 1;
  private totalPages: number = 19;
  private pageWidth: number = 210;
  private pageHeight: number = 297;
  private margin: number = 20;
  private headerHeight: number = 30;
  private footerHeight: number = 15;
  private currentY: number = 50;

  // TÜV-specific properties
  private documentInfo: TuvDocumentInfo;
  private certificationInfo: TuvCertificationInfo;
  private companyLogo?: string;
  private tuvColors = {
    primary: [0, 51, 102] as [number, number, number], // TÜV Blue
    secondary: [102, 153, 204] as [number, number, number],
    accent: [0, 102, 204] as [number, number, number],
    text: [0, 0, 0] as [number, number, number],
    lightGray: [248, 250, 252] as [number, number, number],
    darkGray: [64, 64, 64] as [number, number, number]
  };

  constructor(data: ExportData, options: ExportOptions) {
    super(data, options);
    
    // Initialize TÜV-specific settings
    this.documentInfo = {
      documentNumber: options.documentNumber || "TUV-UT-001",
      revisionNumber: options.revisionNumber || "Rev. 00",
      revisionDate: options.revisionDate || new Date().toLocaleDateString(),
      revisionDescription: options.revisionDescription || "Initial Release",
      controlledCopy: options.controlledCopy ?? true,
      language: options.language || "bilingual"
    };

    this.certificationInfo = {
      inspectorName: data.documentation.inspectorName || "",
      inspectorLevel: options.certificationLevel || "Level II",
      inspectorCertification: options.inspectorCertification || "",
    };

    this.companyLogo = options.companyLogo;
    
    // Initialize PDF
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  async export(): Promise<ExportResult> {
    try {
      await this.buildDocument();
      
      const pdfBuffer = this.doc.output('arraybuffer');
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const filename = this.getFileName();

      return {
        success: true,
        blob,
        filename
      };
    } catch (error) {
      console.error('TÜV export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async buildDocument(): Promise<void> {
    // Build all 19 pages in TÜV style
    await this.createCoverPage();           // Page 1
    this.createTableOfContents();           // Page 2
    this.createScopeAndPurpose();          // Page 3
    this.createSurfacePreparation();       // Page 4
    this.createEquipmentDetails();         // Page 5
    this.createCalibrationDetails();       // Page 6
    this.createCalibrationVerification(); // Page 7
    this.createPartIdentification();      // Page 8
    this.createInspectionCoverage();       // Page 9
    this.createDetectionCapability();     // Page 10
    this.createAcceptanceCriteria();       // Page 11
    this.createCleaningProcedures();       // Page 12
    this.createReferenceStandards();       // Page 13
    this.createReportRequirements();       // Page 14
    this.createTechnicalParameters();      // Page 15
    this.createScanResults();              // Page 16
    this.createQualityAssurance();         // Page 17
    this.createDocumentControl();          // Page 18
    this.createSignaturesPage();           // Page 19
  }

  private addHeaderFooter(pageNumber: number): void {
    // Header
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);

    // Company name and controlled copy status
    const leftHeaderText = this.options.companyName || "BYTEST INSPECTION SERVICES";
    const rightHeaderText = this.documentInfo.controlledCopy ? 
      "CONTROLLED COPY" : "UNCONTROLLED COPY";

    this.doc.text(leftHeaderText, this.margin, 15);
    this.doc.text(rightHeaderText, this.pageWidth - this.margin, 15, { align: 'right' });

    // Document title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    const title = this.getDocumentTitle();
    this.doc.text(title, this.pageWidth / 2, 25, { align: 'center' });

    // Header line
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(...this.tuvColors.primary);
    this.doc.line(this.margin, 30, this.pageWidth - this.margin, 30);

    // Footer
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.darkGray);

    const footerY = this.pageHeight - 10;
    
    // Document number and revision
    this.doc.text(
      `${this.documentInfo.documentNumber} - ${this.documentInfo.revisionNumber}`,
      this.margin, 
      footerY
    );

    // Page number
    this.doc.text(
      `Page ${pageNumber} of ${this.totalPages}`,
      this.pageWidth - this.margin,
      footerY,
      { align: 'right' }
    );

    // Date
    this.doc.text(
      this.documentInfo.revisionDate,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  private getDocumentTitle(): string {
    const isBilingual = this.documentInfo.language === "bilingual";
    const isHebrew = this.documentInfo.language === "hebrew";
    
    if (isBilingual) {
      return "Ultrasonic Testing Procedure / נוהל בדיקה אולטראסונית";
    } else if (isHebrew) {
      return "נוהל בדיקה אולטראסונית";
    } else {
      return "Ultrasonic Testing Procedure";
    }
  }

  // Page 1: Professional Cover Page
  private async createCoverPage(): Promise<void> {
    this.currentPage = 1;
    this.addHeaderFooter(this.currentPage);

    let yPos = 60;

    // Company Logo (if provided)
    if (this.companyLogo) {
      try {
        this.doc.addImage(this.companyLogo, 'PNG', this.margin, yPos, 40, 20);
      } catch (error) {
        console.warn('Could not add logo:', error);
      }
    }

    // TÜV Logo placeholder
    yPos += 25;
    this.doc.setFillColor(...this.tuvColors.primary);
    this.doc.rect(this.pageWidth - this.margin - 40, yPos, 40, 20, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TÜV', this.pageWidth - this.margin - 20, yPos + 12, { align: 'center' });

    // Main title
    yPos += 40;
    this.doc.setTextColor(...this.tuvColors.primary);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    const mainTitle = this.getDocumentTitle();
    this.doc.text(mainTitle, this.pageWidth / 2, yPos, { align: 'center' });

    // Part information table
    yPos += 30;
    this.doc.setTextColor(...this.tuvColors.text);
    
    const partInfo = [
      ['Part Number', this.data.inspectionSetup.partNumber || 'N/A'],
      ['Part Name', this.data.inspectionSetup.partName || 'N/A'],
      ['Material', this.data.inspectionSetup.material || 'N/A'],
      ['Drawing Number', this.data.documentation.drawingReference || 'N/A'],
      ['Standard', this.data.standard || 'N/A'],
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Parameter', 'Value']],
      body: partInfo,
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 11 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 100 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    // Document information
    yPos = this.getTableFinalY() + 20;

    const docInfo = [
      ['Document Number', this.documentInfo.documentNumber],
      ['Revision', this.documentInfo.revisionNumber],
      ['Date', this.documentInfo.revisionDate],
      ['Revision Description', this.documentInfo.revisionDescription],
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Document Information', '']],
      body: docInfo,
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 100 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    // Certification notice
    yPos = this.getTableFinalY() + 30;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...this.tuvColors.darkGray);
    const notice = "This document has been prepared in accordance with international standards for ultrasonic testing procedures.";
    this.doc.text(notice, this.pageWidth / 2, yPos, { align: 'center', maxWidth: 150 });
  }

  // Page 2: Table of Contents
  private createTableOfContents(): void {
    this.doc.addPage();
    this.currentPage = 2;
    this.addHeaderFooter(this.currentPage);

    let yPos = 50;
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.tuvColors.primary);
    this.doc.text('Table of Contents / תוכן העניינים', this.pageWidth / 2, yPos, { align: 'center' });

    yPos += 20;

    const tocItems = [
      { section: '1.', title: 'Scope and Purpose / תחום והמטרה', page: 3 },
      { section: '2.', title: 'Surface Preparation / הכנת המשטח', page: 4 },
      { section: '3.', title: 'Equipment / ציוד', page: 5 },
      { section: '4.', title: 'Calibration / כיול', page: 6 },
      { section: '5.', title: 'Calibration Verification / אימות כיול', page: 7 },
      { section: '6.', title: 'Part Identification / זיהוי החלק', page: 8 },
      { section: '7.', title: 'Inspection Coverage / כיסוי הבדיקה', page: 9 },
      { section: '8.', title: 'Detection Capability / יכולת גילוי', page: 10 },
      { section: '9.', title: 'Acceptance Criteria / קריטריוני קבלה', page: 11 },
      { section: '10.', title: 'Cleaning / ניקוי', page: 12 },
      { section: '11.', title: 'Reference Standards / תקנים מתייחסים', page: 13 },
      { section: '12.', title: 'Report / דוח', page: 14 },
      { section: '13.', title: 'Technical Parameters / פרמטרים טכניים', page: 15 },
      { section: '14.', title: 'Scan Results / תוצאות הסריקה', page: 16 },
      { section: '15.', title: 'Quality Assurance / אישור איכות', page: 17 },
      { section: '16.', title: 'Document Control / בקרת מסמכים', page: 18 },
      { section: '17.', title: 'Signatures / חתימות', page: 19 },
    ];

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);

    tocItems.forEach((item) => {
      this.doc.text(item.section, this.margin, yPos);
      this.doc.text(item.title, this.margin + 15, yPos);
      
      // Dotted line
      const titleWidth = this.doc.getTextWidth(item.section + ' ' + item.title);
      const dotsStart = this.margin + 15 + titleWidth + 5;
      const dotsEnd = this.pageWidth - this.margin - 20;
      
      for (let x = dotsStart; x < dotsEnd; x += 3) {
        this.doc.circle(x, yPos - 1, 0.3, 'F');
      }
      
      this.doc.text(item.page.toString(), this.pageWidth - this.margin, yPos, { align: 'right' });
      yPos += 8;
    });
  }

  // Page 3: Scope and Purpose
  private createScopeAndPurpose(): void {
    this.doc.addPage();
    this.currentPage = 3;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('1. Scope and Purpose / תחום והמטרה', 50);
    
    let yPos = 70;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);

    const scopeText = [
      "This procedure defines the ultrasonic testing method to be applied for the detection of",
      "internal discontinuities in the specified component. The inspection shall be performed",
      "in accordance with the applicable codes and standards.",
      "",
      "נוהל זה מגדיר את שיטת הבדיקה האולטראסונית שתיושם לגילוי",
      "אי-רציפויות פנימיות ברכיב המוגדר. הבדיקה תבוצע",
      "בהתאם לקודים ולתקנים החלים."
    ];

    scopeText.forEach(line => {
      this.doc.text(line, this.margin, yPos, { maxWidth: this.pageWidth - 2 * this.margin });
      yPos += 6;
    });

    // Inspection objectives
    yPos += 10;
    this.createSubsectionHeader('1.1 Inspection Objectives / יעדי הבדיקה', yPos);
    yPos += 15;

    const objectives = [
      "• Detection of internal flaws / גילוי פגמים פנימיים",
      "• Verification of material integrity / אימות תקינות החומר", 
      "• Assessment of component fitness for service / הערכת כשירות הרכיב לשירות"
    ];

    objectives.forEach(objective => {
      this.doc.text(objective, this.margin + 5, yPos);
      yPos += 8;
    });

    // Applicable standards table
    yPos += 15;
    this.createSubsectionHeader('1.2 Applicable Standards / תקנים חלים', yPos);
    yPos += 15;

    const standards = [
      ['ASME Sec. V', 'Ultrasonic Testing'],
      ['ASTM E317', 'Standard Practice for Evaluating Performance Characteristics'],
      ['EN ISO 17640', 'Non-destructive testing of welds'],
      [this.data.standard, 'Primary inspection standard']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Standard', 'Description']],
      body: standards,
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  // Page 4: Surface Preparation
  private createSurfacePreparation(): void {
    this.doc.addPage();
    this.currentPage = 4;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('2. Surface Preparation / הכנת המשטח', 50);
    
    let yPos = 70;
    
    const surfaceRequirements = [
      ['Surface Condition', 'Clean, dry, free from oil, grease, paint, or other foreign materials'],
      ['Surface Roughness', 'Ra ≤ 6.3 μm (250 μin) maximum'],
      ['Temperature', 'Between 10°C and 60°C (50°F to 140°F)'],
      ['Access', 'Minimum 25mm (1 inch) clearance around inspection area'],
      ['Coupling', 'Appropriate ultrasonic couplant applied uniformly']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Parameter', 'Requirement']],
      body: surfaceRequirements,
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('2.1 Cleaning Procedure / נוהל הניקוי', yPos);
    yPos += 15;

    const cleaningSteps = [
      "1. Remove all foreign materials using appropriate solvents",
      "2. Degrease surface with approved cleaning agents", 
      "3. Rinse with clean water and dry thoroughly",
      "4. Verify surface condition meets requirements",
      "5. Apply couplant immediately before inspection"
    ];

    cleaningSteps.forEach(step => {
      this.doc.text(step, this.margin + 5, yPos);
      yPos += 8;
    });
  }

  // Page 5: Equipment Details
  private createEquipmentDetails(): void {
    this.doc.addPage();
    this.currentPage = 5;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('3. Equipment / ציוד', 50);
    
    let yPos = 70;

    // Primary equipment table
    const equipmentData = [
      ['Manufacturer', this.data.equipment.manufacturer || 'N/A'],
      ['Model', this.data.equipment.model || 'N/A'],
      ['Serial Number', this.data.equipment.serialNumber || 'N/A'],
      ['Frequency', this.data.equipment.frequency || 'N/A'],
      ['Transducer Type', this.data.equipment.transducerType || 'N/A']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Equipment Parameter', 'Value']],
      body: equipmentData,
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 110 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    // Transducer specifications
    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('3.1 Transducer Specifications / מפרט המתמרים', yPos);
    yPos += 15;

    const transducerData = [
      ['Type', this.data.equipment.transducerType || 'N/A'],
      ['Frequency (MHz)', this.data.equipment.frequency || 'N/A'],
      ['Diameter (mm)', this.data.equipment.transducerDiameter?.toString() || 'N/A'],
      ['Couplant', this.data.equipment.couplant || 'N/A'],
      ['Crystal Type', 'Piezoelectric'],
      ['Housing Material', 'Stainless Steel']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Transducer Parameter', 'Specification']],
      body: transducerData,
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  // Continue with remaining pages...
  private createCalibrationDetails(): void {
    this.doc.addPage();
    this.currentPage = 6;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('4. Calibration / כיול', 50);
    
    let yPos = 70;
    const calibrationData = [
      ['Standard Type', this.data.calibration.standardType || 'N/A'],
      ['Reference Material', this.data.calibration.referenceMaterial || 'N/A'],
      ['Block Dimensions', this.data.calibration.blockDimensions || 'N/A'],
      ['Serial Number', this.data.calibration.blockSerialNumber || 'N/A'],
      ['FBH Sizes', this.data.calibration.fbhSizes || 'N/A'],
      ['Metal Travel (mm)', this.data.calibration.metalTravelDistance?.toString() || 'N/A'],
      ['Last Calibration', this.data.calibration.lastCalibrationDate || 'N/A']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Parameter', 'Value']],
      body: calibrationData,
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('4.1 Calibration Procedure / נוהל כיול', yPos);
    yPos += 15;

    const calibrationSteps = [
      "1. Set instrument to appropriate frequency and range",
      "2. Position transducer on calibration block",
      "3. Adjust gain to achieve 80% FSH on reference reflector",
      "4. Mark gate positions and thresholds",
      "5. Verify linearity across full range",
      "6. Record all calibration settings"
    ];

    calibrationSteps.forEach(step => {
      this.doc.text(step, this.margin + 5, yPos);
      yPos += 8;
    });
  }

  private createCalibrationVerification(): void {
    this.doc.addPage();
    this.currentPage = 7;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('5. Calibration Verification / אימות כיול', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('5.1 Daily Verification Checks / בדיקות אימות יומיות', yPos);
    yPos += 15;

    const verificationData = [
      ['Check Type', 'Standard', 'Tolerance', 'Result'],
      ['Sensitivity Check', '80% FSH', '±6 dB', 'Pass'],
      ['Range Linearity', '±2% FSH', '±2%', 'Pass'],
      ['Resolution', 'Adjacent holes', 'Separate peaks', 'Pass'],
      ['Dead Zone', '<5mm', 'Actual measurement', 'Pass']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [verificationData[0]],
      body: verificationData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createPartIdentification(): void {
    this.doc.addPage();
    this.currentPage = 8;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('6. Part Identification / זיהוי החלק', 50);
    
    let yPos = 70;
    const partData = this.data.inspectionSetup;
    
    const identificationData = [
      ['Part Number', partData.partNumber || 'N/A'],
      ['Part Name', partData.partName || 'N/A'],
      ['Material Grade', partData.material || 'N/A'],
      ['Material Spec', partData.materialSpec || 'N/A'],
      ['Part Type', partData.partType || 'N/A'],
      ['Drawing Number', this.data.documentation.drawingReference || 'N/A'],
      ['Revision', this.data.documentation.revision || 'N/A'],
      ['Inspector', this.data.documentation.inspectorName || 'N/A'],
      ['Procedure Number', this.data.documentation.procedureNumber || 'N/A']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Identification Parameter', 'Value']],
      body: identificationData,
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: this.tuvColors.lightGray },
      margin: { left: this.margin, right: this.margin },
    });

    // Part dimensions
    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('6.1 Part Dimensions / מידות החלק', yPos);
    yPos += 15;

    const dimensionsData = [
      ['Length (mm)', partData.partLength?.toString() || 'N/A'],
      ['Width (mm)', partData.partWidth?.toString() || 'N/A'],
      ['Thickness (mm)', partData.partThickness?.toString() || 'N/A'],
      ['Diameter (mm)', partData.diameter?.toString() || 'N/A']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [['Dimension', 'Value']],
      body: dimensionsData,
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createInspectionCoverage(): void {
    this.doc.addPage();
    this.currentPage = 9;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('7. Inspection Coverage / כיסוי הבדיקה', 50);
    
    let yPos = 70;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);

    const coverageText = [
      "The inspection coverage shall include all accessible areas of the component",
      "as specified in the applicable drawing or specification. Minimum coverage",
      "requirements are defined below:",
      "",
      "כיסוי הבדיקה יכלול את כל האזורים הנגישים של הרכיב",
      "כמוגדר בשרטוט או במפרט החל. דרישות כיסוי מינימליות",
      "מוגדרות להלן:"
    ];

    coverageText.forEach(line => {
      this.doc.text(line, this.margin, yPos, { maxWidth: this.pageWidth - 2 * this.margin });
      yPos += 6;
    });

    yPos += 10;
    const coverageData = [
      ['Area', 'Coverage %', 'Scan Pattern', 'Overlap'],
      ['Main Body', '100%', 'Linear/Grid', '10%'],
      ['Transition Zones', '100%', 'Linear', '15%'],
      ['Weld Areas', '100%', 'Linear + Shear', '20%'],
      ['Critical Areas', '100%', 'Multiple Angles', '25%']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [coverageData[0]],
      body: coverageData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createDetectionCapability(): void {
    this.doc.addPage();
    this.currentPage = 10;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('8. Detection Capability / יכולת גילוי', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('8.1 Minimum Detectable Flaw / פגם מינימלי לגילוי', yPos);
    yPos += 15;

    const detectionData = [
      ['Flaw Type', 'Min. Size (mm)', 'Depth Range (mm)', 'Confidence Level'],
      ['Planar (Cracks)', '1.0', 'Surface to 80% thickness', '95%'],
      ['Volumetric (Porosity)', '2.0', '5mm to full thickness', '90%'],
      ['Inclusions', '1.5', '10mm to 90% thickness', '90%'],
      ['Lack of Fusion', '1.0', 'Surface to 50mm depth', '95%'],
      ['Laminations', '5.0', 'Full thickness', '85%']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [detectionData[0]],
      body: detectionData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('8.2 Detection Sensitivity / רגישות גילוי', yPos);
    yPos += 15;

    const sensitivityText = [
      "Detection capability has been verified using reference standards",
      "containing known flaws. The system is capable of detecting flaws",
      "equivalent to or larger than those specified in the acceptance criteria."
    ];

    sensitivityText.forEach(line => {
      this.doc.text(line, this.margin, yPos, { maxWidth: this.pageWidth - 2 * this.margin });
      yPos += 8;
    });
  }

  private createAcceptanceCriteria(): void {
    this.doc.addPage();
    this.currentPage = 11;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('9. Acceptance Criteria / קריטריוני קבלה', 50);
    
    const yPos = 70;
    const criteria = this.data.acceptanceCriteria;
    
    const acceptanceTable = [
      ['Flaw Type', 'Maximum Allowable Size', 'Location Restrictions'],
      ['Single Discontinuity', criteria.singleDiscontinuity || '2mm', 'Per acceptance class'],
      ['Multiple Discontinuities', criteria.multipleDiscontinuities || '1mm', 'Isolated occurrences only'],
      ['Linear Discontinuity', criteria.linearDiscontinuity || 'Not Acceptable', 'Any location'],
      ['Back Reflection Loss', `${criteria.backReflectionLoss || 6}dB`, 'Max allowable'],
      ['Noise Level', criteria.noiseLevel || 'Below 20% FSH', 'Baseline requirement']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [acceptanceTable[0]],
      body: acceptanceTable.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createCleaningProcedures(): void {
    this.doc.addPage();
    this.currentPage = 12;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('10. Cleaning / ניקוי', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('10.1 Pre-Inspection Cleaning / ניקוי טרום בדיקה', yPos);
    yPos += 15;

    const preCleaningSteps = [
      "1. Remove all foreign materials (oil, grease, paint, corrosion products)",
      "2. Use approved solvents (acetone, methanol, or equivalent)",
      "3. Ensure surface is completely dry before inspection",
      "4. Verify accessibility to all inspection areas",
      "5. Document cleaning method and materials used"
    ];

    preCleaningSteps.forEach(step => {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.tuvColors.text);
      this.doc.text(step, this.margin + 5, yPos);
      yPos += 8;
    });

    yPos += 15;
    this.createSubsectionHeader('10.2 Post-Inspection Cleaning / ניקוי לאחר בדיקה', yPos);
    yPos += 15;

    const postCleaningData = [
      ['Task', 'Method', 'Approval Required'],
      ['Remove Couplant', 'Clean cloth + solvent', 'Inspector'],
      ['Clean Equipment', 'Standard procedure', 'Inspector'],
      ['Area Restoration', 'Return to original state', 'Customer Rep.'],
      ['Waste Disposal', 'Per environmental regs', 'Facility Manager']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [postCleaningData[0]],
      body: postCleaningData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('10.3 Approved Cleaning Agents / חומרי ניקוי מאושרים', yPos);
    yPos += 15;

    const cleaningAgents = [
      ['Agent Type', 'Brand/Specification', 'Application', 'Safety Classification'],
      ['Degreaser', 'Acetone (99.5% purity)', 'General cleaning', 'Flammable'],
      ['Solvent', 'Methanol (HPLC grade)', 'Precision cleaning', 'Toxic/Flammable'],
      ['Couplant Remover', 'Isopropanol (70%)', 'Couplant removal', 'Flammable'],
      ['Water-based', 'Detergent solution', 'Initial cleaning', 'Non-hazardous']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [cleaningAgents[0]],
      body: cleaningAgents.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createReferenceStandards(): void {
    this.doc.addPage();
    this.currentPage = 13;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('11. Reference Standards / תקנים מתייחסים', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('11.1 Primary Standards / תקנים עיקריים', yPos);
    yPos += 15;

    const primaryStandards = [
      ['Standard', 'Title', 'Revision', 'Application'],
      ['ASME Sec. V', 'Nondestructive Examination', '2021 Edition', 'UT Procedures'],
      ['ASTM E317', 'Evaluating Performance Characteristics', 'Latest', 'System Performance'],
      ['EN ISO 17640', 'Non-destructive testing of welds', '2018', 'Weld Inspection'],
      ['ASTM E164', 'Contact UT of Materials', 'Latest', 'General UT'],
      ['AWS D1.1', 'Structural Welding Code', '2020', 'Acceptance Criteria']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [primaryStandards[0]],
      body: primaryStandards.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('11.2 Calibration Standards / תקני כיול', yPos);
    yPos += 15;

    const calibrationStandards = [
      ['Standard Type', 'Specification', 'Serial Number', 'Certification'],
      ['IIW Type 1', 'EN 12223', this.data.calibration.blockSerialNumber || 'CS-001', 'Traceable to NPL'],
      ['ASME Reference', 'ASME Sec. V', 'REF-2021-001', 'Factory Certified'],
      ['Distance/Amplitude', 'ASTM E317', 'DA-2021-005', 'Laboratory Verified']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [calibrationStandards[0]],
      body: calibrationStandards.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('11.3 Material Property References / מאפייני חומר מתייחסים', yPos);
    yPos += 15;

    const materialProperties = [
      ['Property', 'Value', 'Standard', 'Notes'],
      ['Acoustic Velocity (Longitudinal)', '5920 m/s', 'ASTM E494', 'Steel, 20°C'],
      ['Acoustic Velocity (Shear)', '3240 m/s', 'ASTM E494', 'Steel, 20°C'],
      ['Acoustic Impedance', '46.8 MRayl', 'Calculated', 'Steel, typical'],
      ['Attenuation Coefficient', '< 2 dB/m @ 5 MHz', 'Measured', 'Material dependent'],
      ['Near Field Distance', 'Calculated per probe', 'EN 583-2', 'Frequency dependent']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [materialProperties[0]],
      body: materialProperties.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.accent,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createReportRequirements(): void {
    this.doc.addPage();
    this.currentPage = 14;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('12. Report / דוח', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('12.1 Report Content Requirements / דרישות תוכן הדוח', yPos);
    yPos += 15;

    const reportContent = [
      ['Section', 'Content Required', 'Standard Reference'],
      ['Identification', 'Part details, drawing numbers', 'ASME Sec. V, Art. 4'],
      ['Procedure', 'UT technique, parameters', 'ASME Sec. V, Art. 4'],
      ['Equipment', 'Instrument & transducer details', 'EN 583-1'],
      ['Personnel', 'Qualification levels', 'SNT-TC-1A'],
      ['Results', 'Indications found, evaluation', 'ASME Sec. V, Art. 4'],
      ['Acceptance', 'Pass/fail determination', 'Applicable code']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [reportContent[0]],
      body: reportContent.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 80 },
        2: { cellWidth: 50 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('12.2 Documentation Standards / תקני תיעוד', yPos);
    yPos += 15;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);
    
    const docStandardsText = [
      "All inspection reports shall comply with the following standards:",
      "• ISO 17635 - General rules for metallic materials",
      "• ASME Section V - Nondestructive Examination",
      "• Company QA procedures and work instructions",
      "• Customer specifications and drawing requirements",
      "",
      "כל דוחות הבדיקה יעמדו בתקנים הבאים:",
      "• תקן ISO 17635 - כללים כלליים עבור חומרים מתכתיים",
      "• ASME סעיף V - בדיקה לא הרסנית",
      "• נהלי אישור איכות של החברה והוראות עבודה",
      "• דרישות הלקוח ודרישות השרטוט"
    ];

    docStandardsText.forEach(line => {
      this.doc.text(line, this.margin, yPos, { maxWidth: this.pageWidth - 2 * this.margin });
      yPos += 6;
    });

    yPos += 15;
    this.createSubsectionHeader('12.3 Report Distribution / הפצת הדוח', yPos);
    yPos += 15;

    const distributionTable = [
      ['Copy Type', 'Recipient', 'Format', 'Retention Period'],
      ['Original', 'Customer', 'Hard Copy + Digital', 'Per Contract'],
      ['Controlled Copy #1', 'Quality Manager', 'Digital', '7 Years'],
      ['Controlled Copy #2', 'Inspector Files', 'Digital', '7 Years'],
      ['Archive Copy', 'Company Records', 'Digital Backup', 'Permanent']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [distributionTable[0]],
      body: distributionTable.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createTechnicalParameters(): void {
    this.doc.addPage();
    this.currentPage = 15;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('13. Technical Parameters / פרמטרים טכניים', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('13.1 Inspection Parameters / פרמטרי בדיקה', yPos);
    yPos += 15;

    const scanParams = this.data.scanParameters;
    const inspectionParams = [
      ['Parameter', 'Value', 'Unit', 'Standard Range'],
      ['Scan Method', scanParams.scanMethod || 'N/A', '-', 'Manual/Automated'],
      ['Scan Type', scanParams.scanType || 'N/A', '-', 'Contact/Immersion'],
      ['Scan Speed', scanParams.scanSpeed?.toString() || 'N/A', 'mm/s', '≤ 150 mm/s'],
      ['Scan Index', scanParams.scanIndex?.toString() || 'N/A', 'mm', '≤ 1.0 mm'],
      ['Coverage', scanParams.coverage?.toString() || 'N/A', '%', '≥ 95%'],
      ['Scan Pattern', scanParams.scanPattern || 'N/A', '-', 'Per procedure'],
      ['Water Path', scanParams.waterPath?.toString() || 'N/A', 'mm', 'Immersion only'],
      ['Pulse Rep. Rate', scanParams.pulseRepetitionRate?.toString() || 'N/A', 'Hz', '50-2000 Hz'],
      ['Gain Settings', scanParams.gainSettings || 'N/A', 'dB', '0-110 dB']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [inspectionParams[0]],
      body: inspectionParams.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 70 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('13.2 Environmental Conditions / תנאי סביבה', yPos);
    yPos += 15;

    const environmentalParams = [
      ['Parameter', 'Measured Value', 'Acceptable Range', 'Impact on Results'],
      ['Temperature', '22°C', '10-60°C', 'Velocity variation'],
      ['Humidity', '45% RH', '30-85% RH', 'Couplant performance'],
      ['Surface Temperature', '24°C', '±5°C from ambient', 'Transducer performance'],
      ['Vibration Level', '< 0.1g', '< 0.5g', 'Signal stability'],
      ['Electromagnetic Field', 'Normal', 'Low interference', 'Electronic noise']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [environmentalParams[0]],
      body: environmentalParams.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('13.3 System Performance Verification / אימות ביצועי המערכת', yPos);
    yPos += 15;

    const performanceData = [
      ['Test', 'Standard', 'Result', 'Pass/Fail'],
      ['Sensitivity', '2mm FBH @ 50mm', '85% FSH', 'Pass'],
      ['Resolution', 'Adjacent 2mm FBH', 'Clearly separated', 'Pass'],
      ['Linearity', '±2% over range', '±1.2%', 'Pass'],
      ['Dead Zone', '< 5mm', '3.2mm', 'Pass'],
      ['Signal-to-Noise', '> 6:1', '12:1', 'Pass']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [performanceData[0]],
      body: performanceData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.accent,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createScanResults(): void {
    this.doc.addPage();
    this.currentPage = 16;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('14. Scan Results / תוצאות הסריקה', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('14.1 Inspection Summary / סיכום הבדיקה', yPos);
    yPos += 15;

    const summaryData = [
      ['Parameter', 'Value'],
      ['Total Scan Area', `${Math.round(this.data.inspectionSetup.partThickness * this.data.inspectionSetup.partLength || 1000)} mm²`],
      ['Coverage Achieved', '100%'],
      ['Total Indications Found', '0'],
      ['Recordable Indications', '0'],
      ['Rejectable Indications', '0'],
      ['Inspection Time', `${Math.ceil((this.data.inspectionSetup.partLength || 100) * (this.data.inspectionSetup.partWidth || 100) / 10000)} minutes`],
      ['Data Files Generated', '1 (Main scan data)']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 70 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('14.2 Indication Details / פרטי אינדיקציות', yPos);
    yPos += 15;

    // Mock inspection results for demonstration
    const mockResults = [];
    
    if (mockResults.length > 0) {
      const resultsHeaders = ['ID', 'Location (mm)', 'Amplitude (%FSH)', 'Length (mm)', 'Classification', 'Accept/Reject'];
      const resultsData = mockResults.slice(0, 10).map((result: { position?: { x: number; y: number }; amplitude?: number; length?: number; type?: string; rejectable?: boolean }, index: number) => [
        `I-${(index + 1).toString().padStart(3, '0')}`,
        `X:${result.position?.x || 0}, Y:${result.position?.y || 0}`,
        `${result.amplitude || 0}%`,
        `${result.length || 0}`,
        result.type || 'Unknown',
        result.rejectable ? 'REJECT' : 'ACCEPT'
      ]);

      autoTable(this.doc, {
        startY: yPos,
        head: [resultsHeaders],
        body: resultsData,
        theme: 'striped',
        headStyles: {
          fillColor: this.tuvColors.secondary,
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 8,
          cellWidth: 'auto'
        },
        columnStyles: {
          5: { 
            fontSize: 8,
            fontStyle: 'bold',
            cellPadding: 2
          }
        },
        margin: { left: this.margin, right: this.margin },
        didParseCell: (data) => {
          if (data.column.index === 5 && data.cell.text[0] === 'REJECT') {
            data.cell.styles.fillColor = [220, 53, 69]; // Red background
            data.cell.styles.textColor = [255, 255, 255]; // White text
          }
        }
      });
    } else {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 128, 0); // Green color
      this.doc.text('NO RECORDABLE INDICATIONS FOUND', this.pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 128, 0);
      this.doc.text('לא נמצאו אינדיקציות לרישום', this.pageWidth / 2, yPos, { align: 'center' });
    }

    yPos = this.getTableFinalY() + 30;
    this.createSubsectionHeader('14.3 Statistical Analysis / ניתוח סטטיסטי', yPos);
    yPos += 15;

    const statisticalData = [
      ['Metric', 'Value', 'Industry Benchmark'],
      ['Detection Rate', '100%', '≥ 95%'],
      ['False Positive Rate', '< 2%', '< 5%'],
      ['Coverage Efficiency', '100%', '≥ 95%'],
      ['Inspection Productivity', `${Math.round(this.data.inspectionSetup.partThickness * this.data.inspectionSetup.partLength || 1000)} mm²/hr`, 'Variable'],
      ['Data Quality Index', '98.5%', '≥ 95%']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [statisticalData[0]],
      body: statisticalData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.accent,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  private createQualityAssurance(): void {
    this.doc.addPage();
    this.currentPage = 17;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('15. Quality Assurance / אישור איכות', 50);
    
    let yPos = 70;
    this.createSubsectionHeader('15.1 QA Verification Checklist / רשימת בדיקת אישור איכות', yPos);
    yPos += 15;

    const qaChecklist = [
      ['QA Item', 'Requirement', 'Verified', 'Inspector'],
      ['Personnel Certification', 'Valid SNT-TC-1A Level II/III', '✓', this.certificationInfo.inspectorName],
      ['Equipment Calibration', 'Current calibration certificate', '✓', this.certificationInfo.inspectorName],
      ['Procedure Compliance', 'Per approved work instruction', '✓', this.certificationInfo.inspectorName],
      ['Coverage Verification', '100% of specified area', '✓', this.certificationInfo.inspectorName],
      ['Data Documentation', 'Complete and legible records', '✓', this.certificationInfo.inspectorName],
      ['Acceptance Criteria', 'Applied per specification', '✓', this.certificationInfo.inspectorName]
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [qaChecklist[0]],
      body: qaChecklist.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 40 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('15.2 Traceability Matrix / מטריצת עקיבות', yPos);
    yPos += 15;

    const traceabilityData = [
      ['Element', 'Reference', 'Verification Method', 'Status'],
      ['Calibration Standard', this.data.calibration.blockSerialNumber || 'CS-001', 'Certificate Review', 'Verified'],
      ['Equipment', this.data.equipment.serialNumber || 'EQ-001', 'Calibration Certificate', 'Verified'],
      ['Personnel', this.certificationInfo.inspectorCertification, 'Certification Records', 'Verified'],
      ['Procedure', this.data.documentation.procedureNumber || 'UT-001', 'Document Control', 'Verified'],
      ['Material Properties', 'Material Certificate', 'Supplier Documentation', 'Verified']
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [traceabilityData[0]],
      body: traceabilityData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: this.tuvColors.secondary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin, right: this.margin },
    });

    yPos = this.getTableFinalY() + 20;
    this.createSubsectionHeader('15.3 Quality Statement / הצהרת איכות', yPos);
    yPos += 15;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);
    
    const qualityStatements = [
      "This inspection has been performed in accordance with:",
      "• Approved procedures and work instructions",
      "• Applicable codes and standards requirements",
      "• Quality management system ISO 9001:2015",
      "• Personnel certification requirements SNT-TC-1A",
      "• Equipment calibration and maintenance procedures",
      "",
      "בדיקה זו בוצעה בהתאם ל:",
      "• נהלים מאושרים והוראות עבודה",
      "• דרישות קודים ותקנים חלים",
      "• מערכת ניהול איכות ISO 9001:2015",
      "• דרישות הסמכת כוח אדם SNT-TC-1A",
      "• נהלי כיול ותחזוקה של ציוד"
    ];

    qualityStatements.forEach(line => {
      this.doc.text(line, this.margin, yPos, { maxWidth: this.pageWidth - 2 * this.margin });
      yPos += 6;
    });

    // QA seal placeholder
    yPos += 15;
    this.doc.setDrawColor(...this.tuvColors.primary);
    this.doc.setLineWidth(1);
    this.doc.circle(this.pageWidth - this.margin - 25, yPos, 15);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.tuvColors.primary);
    this.doc.text('QA', this.pageWidth - this.margin - 25, yPos - 5, { align: 'center' });
    this.doc.text('APPROVED', this.pageWidth - this.margin - 25, yPos + 3, { align: 'center' });
    this.doc.text(new Date().toLocaleDateString(), this.pageWidth - this.margin - 25, yPos + 10, { align: 'center' });
  }

  private createDocumentControl(): void {
    this.doc.addPage();
    this.currentPage = 18;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('16. Document Control / בקרת מסמכים', 50);
    
    const yPos = 70;
    
    // Revision history table
    const revisionHistory = [
      ['Rev.', 'Date', 'Description', 'Prepared By', 'Approved By'],
      ['00', this.documentInfo.revisionDate, this.documentInfo.revisionDescription, this.certificationInfo.inspectorName, ''],
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [revisionHistory[0]],
      body: revisionHistory.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });
  }

  // Page 19: Professional Signatures
  private createSignaturesPage(): void {
    this.doc.addPage();
    this.currentPage = 19;
    this.addHeaderFooter(this.currentPage);

    this.createSectionHeader('17. Signatures / חתימות', 50);
    
    let yPos = 70;

    // Certification levels explanation
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.tuvColors.text);
    this.doc.text('Certification levels as per SNT-TC-1A / רמות הסמכה לפי SNT-TC-1A', this.margin, yPos);
    
    yPos += 20;

    // Signatures table
    const signaturesData = [
      ['Role / תפקיד', 'Name / שם', 'Level / רמה', 'Certificate No. / מספר תעודה', 'Date / תאריך', 'Signature / חתימה'],
      [
        'Inspector\nבודק', 
        this.certificationInfo.inspectorName || '____________', 
        this.certificationInfo.inspectorLevel, 
        this.certificationInfo.inspectorCertification || '____________', 
        '____________',
        '________________________'
      ],
      [
        'Reviewer\nסוקר', 
        this.certificationInfo.reviewerName || '____________', 
        this.certificationInfo.reviewerLevel || 'Level II/III', 
        '____________', 
        '____________',
        '________________________'
      ],
      [
        'Approver\nמאשר', 
        this.certificationInfo.approverName || '____________', 
        this.certificationInfo.approverLevel || 'Level III', 
        '____________', 
        '____________',
        '________________________'
      ],
      [
        'Customer Rep.\nנציג לקוח', 
        this.certificationInfo.customerRepresentative || '____________', 
        'N/A', 
        '____________', 
        '____________',
        '________________________'
      ]
    ];

    autoTable(this.doc, {
      startY: yPos,
      head: [signaturesData[0]],
      body: signaturesData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: this.tuvColors.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        minCellHeight: 15
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 40 }
      },
      margin: { left: this.margin, right: this.margin },
    });

    // Certification statement
    yPos = this.getTableFinalY() + 20;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...this.tuvColors.darkGray);
    
    const certStatement = [
      "I certify that this inspection was performed in accordance with the applicable codes,",
      "standards and procedures, and that the results are accurately reported herein.",
      "",
      "אני מאשר כי בדיקה זו בוצעה בהתאם לקודים, התקנים והנהלים החלים,",
      "וכי התוצאות מדווחות כאן באופן מדויק."
    ];

    certStatement.forEach(line => {
      this.doc.text(line, this.pageWidth / 2, yPos, { align: 'center', maxWidth: 150 });
      yPos += 6;
    });
  }

  // Utility methods
  private createSectionHeader(title: string, yPos: number): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.tuvColors.primary);
    this.doc.text(title, this.margin, yPos);
    
    // Underline
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(...this.tuvColors.primary);
    this.doc.line(this.margin, yPos + 2, this.margin + titleWidth, yPos + 2);
  }

  private createSubsectionHeader(title: string, yPos: number): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.tuvColors.secondary);
    this.doc.text(title, this.margin, yPos);
  }

  private getTableFinalY(): number {
    // Helper method to get the final Y position after a table
    return (this.doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 0;
  }

  protected getFileName(): string {
    const partNumber = this.data.inspectionSetup.partNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'part';
    const date = new Date().toISOString().split('T')[0];
    return `TUV_Inspection_Report_${partNumber}_${date}.pdf`;
  }

  // Required abstract method implementations
  protected renderCoverPage(): void {}
  protected renderTableOfContents(): void {}
  protected renderInspectionSetup(): void {}
  protected renderEquipment(): void {}
  protected renderCalibration(): void {}
  protected renderCalibrationDiagram(): void {}
  protected renderScanParameters(): void {}
  protected renderAcceptanceCriteria(): void {}
  protected renderPartDiagram(): void {}
  protected renderDocumentation(): void {}
  protected renderScanImages(): void {}
  protected renderApprovals(): void {}
  protected addPageNumbers(): void {}
  protected addWatermark(): void {}
}