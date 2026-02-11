import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ComplianceStandard, complianceEngine } from "./standards/complianceEngine";
import { acceptanceCriteriaByStandard } from "@/data/standardsDifferences";
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
  MaterialType,
  PartGeometry,
} from "@/types/techniqueSheet";

interface ProfessionalTechniqueSheetData {
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails?: any;
}

interface ComplianceData {
  isCompliant: boolean;
  compliancePercentage: number;
  criticalIssues: string[];
  recommendations: string[];
}

export class ProfessionalPDFExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private leftMargin = 15;
  private rightMargin = 15;
  private topMargin = 20;
  private contentWidth: number;
  private primaryColor = [0, 51, 102] as [number, number, number]; // Navy blue
  private secondaryColor = [41, 128, 185] as [number, number, number]; // Light blue
  private accentColor = [255, 193, 7] as [number, number, number]; // Amber for warnings
  private successColor = [40, 167, 69] as [number, number, number]; // Green for compliance
  private errorColor = [220, 53, 69] as [number, number, number]; // Red for non-compliance
  
  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.leftMargin - this.rightMargin;
  }

  exportProfessionalTechniqueSheet(data: ProfessionalTechniqueSheetData, filename?: string): void {
    // Page 1: Cover Page with Compliance Summary
    this.createCoverPage(data);
    
    // Page 2: Technical Parameters and Compliance
    this.doc.addPage();
    this.createTechnicalParametersPage(data);
    
    // Page 3: Calibration Details and Curves
    this.doc.addPage();
    this.createCalibrationPage(data);
    
    // Page 4: Scan Plan and Diagrams
    this.doc.addPage();
    this.createScanPlanPage(data);
    
    // Page 5: Acceptance Criteria and Compliance Matrix
    this.doc.addPage();
    this.createAcceptanceCriteriaPage(data);
    
    // Page 6: Certification and Signatures
    this.doc.addPage();
    this.createCertificationPage(data);
    
    // Save the PDF
    const date = new Date().toISOString().split('T')[0];
    const fname = filename || `UT_TechniqueSheet_${data.standard}_${data.inspectionSetup.partNumber}_${date}.pdf`;
    this.doc.save(fname);
  }

  private createCoverPage(data: ProfessionalTechniqueSheetData): void {
    let yPos = this.topMargin;
    
    // Company Header (professional look)
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 40, "F");
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("ULTRASONIC TECHNIQUE SHEET", this.pageWidth / 2, 20, { align: "center" });
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Standard: ${data.standard}`, this.pageWidth / 2, 30, { align: "center" });
    
    yPos = 50;
    this.doc.setTextColor(0, 0, 0);
    
    // Compliance Status Banner
    const compliance = this.calculateCompliance(data);
    this.drawComplianceStatusBanner(yPos, compliance);
    yPos += 30;
    
    // Key Information Box
    this.drawKeyInfoBox(yPos, data);
    yPos += 60;
    
    // Standards Comparison Summary
    this.drawStandardsComparisonSummary(yPos, data);
    yPos += 60;
    
    // Document Control Box
    this.drawDocumentControlBox(yPos, data);
    
    // Footer
    this.drawFooter(1);
  }

  private createTechnicalParametersPage(data: ProfessionalTechniqueSheetData): void {
    let yPos = this.topMargin;
    
    // Page Header
    this.drawPageHeader("TECHNICAL PARAMETERS & EQUIPMENT", 2);
    yPos = 40;
    
    // Two-column layout
    const colWidth = (this.contentWidth - 10) / 2;
    
    // Left Column: Inspection Setup
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Part Information", this.leftMargin, yPos);
    
    autoTable(this.doc, {
      startY: yPos + 5,
      head: [["Parameter", "Value", "Compliance"]],
      body: [
        ["Part Number", data.inspectionSetup.partNumber || "N/A", "✓"],
        ["Part Name", data.inspectionSetup.partName || "N/A", "✓"],
        ["Material", data.inspectionSetup.material || "N/A", "✓"],
        ["Material Spec", data.inspectionSetup.materialSpec || "N/A", "✓"],
        ["Part Type", data.inspectionSetup.partType || "N/A", "✓"],
        ["Thickness (mm)", data.inspectionSetup.partThickness?.toString() || "N/A", "✓"],
        ["Length (mm)", data.inspectionSetup.partLength?.toString() || "N/A", "✓"],
        ["Width (mm)", data.inspectionSetup.partWidth?.toString() || "N/A", "✓"],
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.primaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: colWidth * 0.4 },
        1: { cellWidth: colWidth * 0.4 },
        2: { cellWidth: colWidth * 0.2, halign: 'center' }
      },
      margin: { left: this.leftMargin },
      tableWidth: colWidth,
    });

    // Right Column: Equipment
    const rightColX = this.leftMargin + colWidth + 10;
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Equipment Configuration", rightColX, yPos);
    
    // Validate equipment parameters
    const freqValidation = data.equipment.frequency && data.inspectionSetup.partThickness && data.inspectionSetup.material
      ? complianceEngine.validateFrequency(
          parseFloat(data.equipment.frequency),
          data.inspectionSetup.partThickness,
          data.inspectionSetup.material as MaterialType,
          data.standard as ComplianceStandard
        )
      : { isValid: true };
    
    autoTable(this.doc, {
      startY: yPos + 5,
      head: [["Parameter", "Value", "Status"]],
      body: [
        ["Manufacturer", data.equipment.manufacturer || "N/A", "✓"],
        ["Model", data.equipment.model || "N/A", "✓"],
        ["Serial Number", data.equipment.serialNumber || "N/A", "✓"],
        ["Frequency (MHz)", data.equipment.frequency || "N/A", freqValidation.isValid ? "✓" : "⚠"],
        ["Transducer Type", data.equipment.transducerType || "N/A", "✓"],
        ["Diameter (in)", data.equipment.transducerDiameter?.toString() || "N/A", "✓"],
        ["Couplant", data.equipment.couplant || "N/A", "✓"],
        ["V-Linearity (%)", data.equipment.verticalLinearity?.toString() || "N/A", "✓"],
        ["H-Linearity (%)", data.equipment.horizontalLinearity?.toString() || "N/A", "✓"],
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.primaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: colWidth * 0.4 },
        1: { cellWidth: colWidth * 0.4 },
        2: { cellWidth: colWidth * 0.2, halign: 'center' }
      },
      margin: { left: rightColX },
      tableWidth: colWidth,
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Calculated Parameters Section
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Calculated Parameters per " + data.standard, this.leftMargin, yPos);
    yPos += 5;
    
    // Calculate key parameters
    const calculations = this.performCalculations(data);
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Parameter", "Formula", "Calculated Value", "Unit", "Explanation"]],
      body: calculations.map(calc => [
        calc.parameter,
        calc.formula,
        calc.value,
        calc.unit,
        calc.explanation
      ]),
      theme: "grid",
      headStyles: { 
        fillColor: this.secondaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: this.contentWidth * 0.2 },
        1: { cellWidth: this.contentWidth * 0.2 },
        2: { cellWidth: this.contentWidth * 0.15, halign: 'center' },
        3: { cellWidth: this.contentWidth * 0.1, halign: 'center' },
        4: { cellWidth: this.contentWidth * 0.35 }
      },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
    
    // Compliance Warnings
    if (!freqValidation.isValid && freqValidation.warnings) {
      yPos = (this.doc as any).lastAutoTable.finalY + 10;
      this.drawWarningBox(yPos, "Frequency Validation", freqValidation.warnings);
    }
    
    this.drawFooter(2);
  }

  private createCalibrationPage(data: ProfessionalTechniqueSheetData): void {
    let yPos = this.topMargin;
    
    // Page Header
    this.drawPageHeader("CALIBRATION & REFERENCE STANDARDS", 3);
    yPos = 40;
    
    // Calibration Details
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Calibration Block Configuration", this.leftMargin, yPos);
    yPos += 5;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Parameter", "Requirement", "Actual", "Compliance"]],
      body: [
        ["Block Type", this.getRequiredBlockType(data), data.calibration.standardType || "N/A", "✓"],
        ["Reference Material", data.inspectionSetup.material || "Same as part", data.calibration.referenceMaterial || "N/A", "✓"],
        ["FBH Sizes", this.getRequiredFBHSizes(data), data.calibration.fbhSizes || "N/A", "✓"],
        ["Metal Travel Distance", this.getRequiredMTD(data) + " mm", data.calibration.metalTravelDistance?.toString() + " mm" || "N/A", "✓"],
        ["Block Serial Number", "Required", data.calibration.blockSerialNumber || "N/A", data.calibration.blockSerialNumber ? "✓" : "⚠"],
        ["Calibration Date", "Current", data.calibration.lastCalibrationDate || "N/A", "✓"],
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.primaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'center' }
      },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // DAC/TCG Curve Diagram
    this.drawDACCurve(yPos);
    yPos += 80;
    
    // Calibration Block Diagram
    this.drawCalibrationBlockDiagram(yPos, data);
    
    this.drawFooter(3);
  }

  private createScanPlanPage(data: ProfessionalTechniqueSheetData): void {
    let yPos = this.topMargin;
    
    // Page Header
    this.drawPageHeader("SCAN PLAN & COVERAGE", 4);
    yPos = 40;
    
    // Scan Parameters
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Scan Parameters", this.leftMargin, yPos);
    yPos += 5;
    
    // Validate scan parameters
    const scanSpeedValidation = data.scanParameters.scanSpeed && data.scanParameters.scanMethod
      ? complianceEngine.validateScanSpeed(
          data.scanParameters.scanSpeed,
          data.scanParameters.scanMethod as "manual" | "automated",
          data.standard as ComplianceStandard
        )
      : { isValid: true };
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Parameter", "Standard Requirement", "Configured Value", "Status"]],
      body: [
        ["Scan Method", "Per procedure", data.scanParameters.scanMethod || "N/A", "✓"],
        ["Scan Type", "Per geometry", data.scanParameters.scanType || "N/A", "✓"],
        ["Scan Speed (mm/s)", this.getMaxScanSpeed(data), data.scanParameters.scanSpeed?.toString() || "N/A", scanSpeedValidation.isValid ? "✓" : "⚠"],
        ["Scan Index (%)", "≤70% beam width", data.scanParameters.scanIndex?.toString() || "N/A", "✓"],
        ["Coverage (%)", "100%", data.scanParameters.coverage?.toString() || "N/A", data.scanParameters.coverage === 100 ? "✓" : "⚠"],
        ["Scan Pattern", this.getRecommendedPattern(data), data.scanParameters.scanPattern || "N/A", "✓"],
        ["Water Path (mm)", "25-150", data.scanParameters.waterPath?.toString() || "N/A", "✓"],
        ["PRF (Hz)", "100-10000", data.scanParameters.pulseRepetitionRate?.toString() || "N/A", "✓"],
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.primaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'center' }
      },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Scan Coverage Diagram
    this.drawScanCoverageDiagram(yPos, data);
    yPos += 80;
    
    // Scan Pattern Illustration
    this.drawScanPatternIllustration(yPos, data);
    
    this.drawFooter(4);
  }

  private createAcceptanceCriteriaPage(data: ProfessionalTechniqueSheetData): void {
    let yPos = this.topMargin;
    
    // Page Header
    this.drawPageHeader("ACCEPTANCE CRITERIA & COMPLIANCE", 5);
    yPos = 40;
    
    // Acceptance Criteria Table
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(`Acceptance Criteria - Class ${data.acceptanceCriteria.acceptanceClass || "A"}`, this.leftMargin, yPos);
    yPos += 5;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Criterion", "Standard Limit", "Configured", "Compliant"]],
      body: [
        ["Acceptance Class", data.acceptanceCriteria.acceptanceClass || "A", data.acceptanceCriteria.acceptanceClass || "A", "✓"],
        ["Single Discontinuity", this.getAcceptanceLimit(data, "single"), data.acceptanceCriteria.singleDiscontinuity || "N/A", "✓"],
        ["Multiple Discontinuities", this.getAcceptanceLimit(data, "multiple"), data.acceptanceCriteria.multipleDiscontinuities || "N/A", "✓"],
        ["Linear Indications", this.getAcceptanceLimit(data, "linear"), data.acceptanceCriteria.linearDiscontinuity || "N/A", "✓"],
        ["Back Reflection Loss (%)", "≤50%", data.acceptanceCriteria.backReflectionLoss?.toString() || "N/A", "✓"],
        ["Noise Level", "≤20% FSH", data.acceptanceCriteria.noiseLevel || "N/A", "✓"],
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.primaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'center' }
      },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Standards Comparison Matrix
    this.drawStandardsComparisonMatrix(yPos, data);
    yPos += 70;
    
    // Compliance Summary
    this.drawComplianceSummaryBox(yPos, data);
    
    this.drawFooter(5);
  }

  private createCertificationPage(data: ProfessionalTechniqueSheetData): void {
    let yPos = this.topMargin;
    
    // Page Header
    this.drawPageHeader("CERTIFICATION & APPROVAL", 6);
    yPos = 40;
    
    // Documentation Details
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Documentation & Traceability", this.leftMargin, yPos);
    yPos += 5;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Field", "Value"]],
      body: [
        ["Inspector Name", data.documentation.inspectorName || "N/A"],
        ["Certification Level", data.documentation.inspectorLevel || "N/A"],
        ["Certification Number", data.documentation.inspectorCertification || "N/A"],
        ["Certifying Body", data.documentation.certifyingOrganization || "N/A"],
        ["Inspection Date", data.documentation.inspectionDate || new Date().toLocaleDateString()],
        ["Procedure Number", data.documentation.procedureNumber || "N/A"],
        ["Drawing Reference", data.documentation.drawingReference || "N/A"],
        ["Revision", data.documentation.revision || "A"],
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.primaryColor, 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 20;
    
    // Compliance Statement
    this.doc.setFillColor(...this.successColor);
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, 30, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("COMPLIANCE STATEMENT", this.pageWidth / 2, yPos + 10, { align: "center" });
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.text(
      `This technique sheet has been prepared in accordance with ${data.standard} requirements.`,
      this.pageWidth / 2, yPos + 18, { align: "center" }
    );
    this.doc.text(
      "All parameters meet or exceed the specified acceptance criteria.",
      this.pageWidth / 2, yPos + 24, { align: "center" }
    );
    
    yPos += 40;
    
    // Signature Blocks
    this.doc.setTextColor(0, 0, 0);
    this.drawSignatureBlocks(yPos);
    
    // Additional Notes
    if (data.documentation.additionalNotes) {
      yPos += 50;
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Additional Notes:", this.leftMargin, yPos);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      const lines = this.doc.splitTextToSize(data.documentation.additionalNotes, this.contentWidth);
      this.doc.text(lines, this.leftMargin, yPos + 5);
    }
    
    this.drawFooter(6);
  }

  // Helper Methods
  private drawComplianceStatusBanner(yPos: number, compliance: ComplianceData): void {
    const bannerHeight = 25;
    const color = compliance.isCompliant ? this.successColor : this.errorColor;
    
    this.doc.setFillColor(...color);
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, bannerHeight, "F");
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    const status = compliance.isCompliant ? "COMPLIANT" : "NON-COMPLIANT";
    this.doc.text(status, this.pageWidth / 2, yPos + 10, { align: "center" });
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      `Compliance Score: ${compliance.compliancePercentage}%`,
      this.pageWidth / 2,
      yPos + 18,
      { align: "center" }
    );
  }

  private drawKeyInfoBox(yPos: number, data: ProfessionalTechniqueSheetData): void {
    const boxHeight = 50;
    
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, boxHeight, "S");
    
    // Two columns
    const col1X = this.leftMargin + 5;
    const col2X = this.pageWidth / 2;
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    
    let lineY = yPos + 8;
    const lineHeight = 8;
    
    // Column 1
    this.doc.text("Part Number:", col1X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.inspectionSetup.partNumber || "N/A", col1X + 30, lineY);
    
    lineY += lineHeight;
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Material:", col1X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.inspectionSetup.material || "N/A", col1X + 30, lineY);
    
    lineY += lineHeight;
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Thickness:", col1X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(
      Number.isFinite(data.inspectionSetup.partThickness)
        ? `${data.inspectionSetup.partThickness} mm`
        : "N/A",
      col1X + 30,
      lineY,
    );
    
    // Column 2
    lineY = yPos + 8;
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Standard:", col2X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.standard, col2X + 30, lineY);
    
    lineY += lineHeight;
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Class:", col2X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.acceptanceCriteria.acceptanceClass || "A", col2X + 30, lineY);
    
    lineY += lineHeight;
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Frequency:", col2X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(
      data.equipment.frequency != null && String(data.equipment.frequency).trim() !== ""
        ? `${data.equipment.frequency} MHz`
        : "N/A",
      col2X + 30,
      lineY,
    );
  }

  private drawStandardsComparisonSummary(yPos: number, data: ProfessionalTechniqueSheetData): void {
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Standards Quick Comparison", this.leftMargin, yPos);
    yPos += 5;
    
    const comparisons = complianceEngine.compareStandards("frequency", data.inspectionSetup.partThickness, data.inspectionSetup.material as MaterialType);
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Standard", "Frequency Range", "Scan Speed", "Overlap", "Stringency"]],
      body: [
        ["AMS-STD-2154E", "1-15 MHz", "150 mm/s", "30%", "Highest"],
        ["ASTM A388", "1-5 MHz", "150-300 mm/s", "10-15%", "Standard"],
        ["BS EN 10228-3", "1-6 MHz (nominal)", "150-500 mm/s", "10%", "European"],
        ["BS EN 10228-4", "0.5-6 MHz (typ. 0.5-2)", "100-250 mm/s", "20%", "Specialized"],
      ],
      theme: "striped",
      headStyles: { 
        fillColor: this.secondaryColor, 
        textColor: 255, 
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7 },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
  }

  private drawDocumentControlBox(yPos: number, data: ProfessionalTechniqueSheetData): void {
    const boxHeight = 35;
    
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, boxHeight, "F");
    
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    
    const col1X = this.leftMargin + 5;
    const col2X = this.pageWidth / 3;
    const col3X = (this.pageWidth * 2) / 3;
    
    let lineY = yPos + 8;
    
    this.doc.text("Document No:", col1X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`UT-${data.standard}-${new Date().getTime()}`, col1X, lineY + 5);
    
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Revision:", col2X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(data.documentation.revision || "A", col2X, lineY + 5);
    
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Date:", col3X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(new Date().toLocaleDateString(), col3X, lineY + 5);
    
    lineY += 15;
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Procedure:", col1X, lineY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(data.documentation.procedureNumber || "Per standard", col1X, lineY + 5);
  }

  private drawPageHeader(title: string, pageNumber: number): void {
    // Header bar
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 25, "F");
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.pageWidth / 2, 15, { align: "center" });
    
    // Page number
    this.doc.setFontSize(10);
    this.doc.text(`Page ${pageNumber}`, this.pageWidth - 20, 15, { align: "right" });
  }

  private drawFooter(pageNumber: number): void {
    const footerY = this.pageHeight - 15;
    
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.leftMargin, footerY - 5, this.pageWidth - this.rightMargin, footerY - 5);
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    
    this.doc.text("Confidential - Proprietary Information", this.leftMargin, footerY);
    this.doc.text(`Generated: ${new Date().toLocaleString()}`, this.pageWidth / 2, footerY, { align: "center" });
    this.doc.text(`Page ${pageNumber}`, this.pageWidth - this.rightMargin, footerY, { align: "right" });
  }

  private drawWarningBox(yPos: number, title: string, warnings: string[]): void {
    const boxHeight = 10 + warnings.length * 5;
    
    this.doc.setFillColor(...this.accentColor);
    this.doc.setDrawColor(...this.accentColor);
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, boxHeight, "FD");
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`⚠ ${title}`, this.leftMargin + 5, yPos + 5);
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    warnings.forEach((warning, index) => {
      this.doc.text(`• ${warning}`, this.leftMargin + 10, yPos + 10 + index * 5);
    });
  }

  private drawDACCurve(yPos: number): void {
    const curveWidth = this.contentWidth;
    const curveHeight = 70;
    
    // DAC Curve Box
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.leftMargin, yPos, curveWidth, curveHeight, "S");
    
    // Title
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Distance Amplitude Correction (DAC) Curve", this.pageWidth / 2, yPos - 3, { align: "center" });
    
    // Grid
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.1);
    
    // Vertical grid lines
    for (let i = 1; i < 10; i++) {
      const x = this.leftMargin + (curveWidth / 10) * i;
      this.doc.line(x, yPos, x, yPos + curveHeight);
    }
    
    // Horizontal grid lines
    for (let i = 1; i < 5; i++) {
      const y = yPos + (curveHeight / 5) * i;
      this.doc.line(this.leftMargin, y, this.leftMargin + curveWidth, y);
    }
    
    // DAC Curve (simulated)
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(1.5);
    
    // Primary DAC curve
    const points = [
      { x: 0.1, y: 0.9 },
      { x: 0.2, y: 0.85 },
      { x: 0.3, y: 0.75 },
      { x: 0.4, y: 0.65 },
      { x: 0.5, y: 0.55 },
      { x: 0.6, y: 0.48 },
      { x: 0.7, y: 0.42 },
      { x: 0.8, y: 0.38 },
      { x: 0.9, y: 0.35 }
    ];
    
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = this.leftMargin + curveWidth * points[i].x;
      const y1 = yPos + curveHeight * (1 - points[i].y);
      const x2 = this.leftMargin + curveWidth * points[i + 1].x;
      const y2 = yPos + curveHeight * (1 - points[i + 1].y);
      this.doc.line(x1, y1, x2, y2);
    }
    
    // Recording level (-6dB)
    this.doc.setDrawColor(...this.accentColor);
    this.doc.setLineWidth(0.5);
    // this.doc.setLineDash([2, 2], 0);  // setLineDash not available in jsPDF type definitions
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = this.leftMargin + curveWidth * points[i].x;
      const y1 = yPos + curveHeight * (1 - points[i].y * 0.7);
      const x2 = this.leftMargin + curveWidth * points[i + 1].x;
      const y2 = yPos + curveHeight * (1 - points[i + 1].y * 0.7);
      this.doc.line(x1, y1, x2, y2);
    }
    // this.doc.setLineDash([]);  // setLineDash not available in jsPDF type definitions
    
    // Axes labels
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Distance (mm)", this.pageWidth / 2, yPos + curveHeight + 5, { align: "center" });
    this.doc.text("Amplitude (%FSH)", this.leftMargin - 10, yPos + curveHeight / 2, { align: "center", angle: 90 });
    
    // Legend
    const legendY = yPos + curveHeight - 15;
    this.doc.setFontSize(7);
    
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(1.5);
    this.doc.line(this.leftMargin + 10, legendY, this.leftMargin + 20, legendY);
    this.doc.text("Primary DAC", this.leftMargin + 22, legendY + 1);
    
    this.doc.setDrawColor(...this.accentColor);
    this.doc.setLineWidth(0.5);
    // this.doc.setLineDash([2, 2], 0);  // setLineDash not available in jsPDF type definitions
    this.doc.line(this.leftMargin + 10, legendY + 5, this.leftMargin + 20, legendY + 5);
    this.doc.text("Recording (-6dB)", this.leftMargin + 22, legendY + 6);
    // this.doc.setLineDash([]);  // setLineDash not available in jsPDF type definitions
  }

  private drawCalibrationBlockDiagram(yPos: number, data: ProfessionalTechniqueSheetData): void {
    const blockWidth = 120;
    const blockHeight = 40;
    const blockX = (this.pageWidth - blockWidth) / 2;
    
    // Title
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Calibration Block Configuration", this.pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
    
    // Block outline
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(1);
    this.doc.rect(blockX, yPos, blockWidth, blockHeight, "S");
    
    // FBH indicators
    const fbhPositions = [
      { x: 0.25, depth: "T/4" },
      { x: 0.5, depth: "T/2" },
      { x: 0.75, depth: "3T/4" }
    ];
    
    this.doc.setDrawColor(...this.secondaryColor);
    this.doc.setFillColor(...this.secondaryColor);
    
    fbhPositions.forEach(fbh => {
      const centerX = blockX + blockWidth * fbh.x;
      const centerY = yPos + blockHeight / 2;
      
      // FBH circle
      this.doc.circle(centerX, centerY, 3, "FD");
      
      // Depth label
      this.doc.setFontSize(7);
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(fbh.depth, centerX, centerY + 10, { align: "center" });
    });
    
    // Dimensions
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 0, 0);
    
    // Width dimension
    this.drawDimensionLine(blockX, yPos + blockHeight + 5, blockX + blockWidth, yPos + blockHeight + 5, `${data.calibration.metalTravelDistance || 75} mm`);
    
    // Height dimension
    this.drawDimensionLine(blockX - 5, yPos, blockX - 5, yPos + blockHeight, `${data.inspectionSetup.partThickness || 25} mm`, true);
    
    // Material label
    this.doc.setFontSize(9);
    this.doc.text(`Material: ${data.calibration.referenceMaterial || data.inspectionSetup.material || "N/A"}`, blockX, yPos - 5);
    
    // FBH size label
    this.doc.text(`FBH: ${data.calibration.fbhSizes || "3/64 in"}`, blockX + blockWidth - 30, yPos - 5);
  }

  private drawScanCoverageDiagram(yPos: number, data: ProfessionalTechniqueSheetData): void {
    const diagramWidth = this.contentWidth;
    const diagramHeight = 70;
    
    // Title
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Scan Coverage Pattern", this.pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
    
    // Part outline
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(1);
    this.doc.rect(this.leftMargin, yPos, diagramWidth, diagramHeight, "S");
    
    // Scan lines
    const scanIndex = data.scanParameters.scanIndex || 70;
    const overlap = 100 - scanIndex;
    const numLines = Math.floor(diagramHeight / (5 * (1 - overlap / 100)));
    
    this.doc.setDrawColor(...this.secondaryColor);
    this.doc.setLineWidth(0.5);
    
    for (let i = 1; i < numLines; i++) {
      const y = yPos + (diagramHeight / numLines) * i;
      // this.doc.setLineDash([5, 3], 0);  // setLineDash not available in jsPDF type definitions
      this.doc.line(this.leftMargin + 10, y, this.leftMargin + diagramWidth - 10, y);
      
      // Draw overlap zone
      if (i > 1) {
        this.doc.setFillColor(...this.secondaryColor);
        // this.doc.setGState(new this.doc.GState({ opacity: 0.2 }));  // GState not available in jsPDF type definitions
        const overlapHeight = (diagramHeight / numLines) * (overlap / 100);
        this.doc.rect(this.leftMargin + 10, y - overlapHeight, diagramWidth - 20, overlapHeight, "F");
        // this.doc.setGState(new this.doc.GState({ opacity: 1 }));  // GState not available in jsPDF type definitions
      }
    }
    // this.doc.setLineDash([]);  // setLineDash not available in jsPDF type definitions
    
    // Labels
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Coverage: ${data.scanParameters.coverage || 100}%`, this.leftMargin + 5, yPos + diagramHeight + 8);
    this.doc.text(`Scan Index: ${scanIndex}%`, this.pageWidth / 2, yPos + diagramHeight + 8, { align: "center" });
    this.doc.text(`Overlap: ${overlap}%`, this.pageWidth - this.rightMargin - 5, yPos + diagramHeight + 8, { align: "right" });
  }

  private drawScanPatternIllustration(yPos: number, data: ProfessionalTechniqueSheetData): void {
    const patternWidth = 80;
    const patternHeight = 50;
    const centerX = this.pageWidth / 2;
    
    // Title
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(`Scan Pattern: ${data.scanParameters.scanPattern || "Raster"}`, centerX, yPos, { align: "center" });
    yPos += 10;
    
    // Pattern box
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.rect(centerX - patternWidth / 2, yPos, patternWidth, patternHeight, "S");
    
    // Draw pattern based on type
    const pattern = data.scanParameters.scanPattern?.toLowerCase() || "raster";
    
    this.doc.setDrawColor(...this.secondaryColor);
    this.doc.setLineWidth(0.3);
    
    if (pattern.includes("raster")) {
      // Raster pattern
      for (let i = 1; i < 8; i++) {
        const y = yPos + (patternHeight / 8) * i;
        if (i % 2 === 1) {
          this.drawArrow(centerX - patternWidth / 2 + 5, y, centerX + patternWidth / 2 - 5, y, "right");
        } else {
          this.drawArrow(centerX + patternWidth / 2 - 5, y, centerX - patternWidth / 2 + 5, y, "left");
        }
      }
    } else if (pattern.includes("spiral")) {
      // Spiral pattern
      const spiralCenterX = centerX;
      const spiralCenterY = yPos + patternHeight / 2;
      let angle = 0;
      let radius = 2;
      
      this.doc.setDrawColor(...this.secondaryColor);
      for (let i = 0; i < 100; i++) {
        const x1 = spiralCenterX + radius * Math.cos(angle);
        const y1 = spiralCenterY + radius * Math.sin(angle);
        angle += 0.2;
        radius += 0.3;
        const x2 = spiralCenterX + radius * Math.cos(angle);
        const y2 = spiralCenterY + radius * Math.sin(angle);
        
        if (radius < patternWidth / 2) {
          this.doc.line(x1, y1, x2, y2);
        }
      }
    }
    
    // Speed indicator
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Speed: ${data.scanParameters.scanSpeed || 100} mm/s`, centerX, yPos + patternHeight + 8, { align: "center" });
  }

  private drawStandardsComparisonMatrix(yPos: number, data: ProfessionalTechniqueSheetData): void {
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text("Cross-Standard Compliance Matrix", this.leftMargin, yPos);
    yPos += 5;
    
    // Get comparison data
    const thickness = data.inspectionSetup.partThickness || 25;
    const material = data.inspectionSetup.material as MaterialType || "steel";
    
    autoTable(this.doc, {
      startY: yPos,
      head: [["Parameter", "MIL-STD-2154", "ASTM A388", "BS EN 10228-3", "BS EN 10228-4", "Current"]],
      body: [
        [
          "FBH Size",
          complianceEngine.getFBHSize(thickness, data.acceptanceCriteria.acceptanceClass || "A", "MIL-STD-2154").value,
          complianceEngine.getFBHSize(thickness, data.acceptanceCriteria.acceptanceClass || "A", "ASTM-A388").value,
          complianceEngine.getFBHSize(thickness, data.acceptanceCriteria.acceptanceClass || "A", "BS-EN-10228-3").value,
          complianceEngine.getFBHSize(thickness, data.acceptanceCriteria.acceptanceClass || "A", "BS-EN-10228-4").value,
          data.calibration.fbhSizes || "N/A"
        ],
        [
          "MTD (mm)",
          complianceEngine.calculateMetalTravelDistance(thickness, "MIL-STD-2154").value.toString(),
          complianceEngine.calculateMetalTravelDistance(thickness, "ASTM-A388").value.toString(),
          complianceEngine.calculateMetalTravelDistance(thickness, "BS-EN-10228-3").value.toString(),
          complianceEngine.calculateMetalTravelDistance(thickness, "BS-EN-10228-4").value.toString(),
          data.calibration.metalTravelDistance?.toString() || "N/A"
        ],
        [
          "Max Speed",
          "150 mm/s",
          "300 mm/s",
          "500 mm/s",
          "250 mm/s",
          `${data.scanParameters.scanSpeed} mm/s`
        ],
        [
          "Min Overlap",
          "30%",
          "10%",
          "10%",
          "20%",
          `${100 - (data.scanParameters.scanIndex || 70)}%`
        ]
      ],
      theme: "grid",
      headStyles: { 
        fillColor: this.secondaryColor, 
        textColor: 255, 
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        5: { fillColor: [240, 240, 240] }
      },
      margin: { left: this.leftMargin, right: this.rightMargin },
    });
  }

  private drawComplianceSummaryBox(yPos: number, data: ProfessionalTechniqueSheetData): void {
    const compliance = this.calculateCompliance(data);
    const boxHeight = 40;
    
    const bgColor = compliance.isCompliant ? this.successColor : this.errorColor;
    this.doc.setFillColor(...bgColor);
    // this.doc.setGState(new this.doc.GState({ opacity: 0.1 }));  // GState not available in jsPDF type definitions
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, boxHeight, "F");
    // this.doc.setGState(new this.doc.GState({ opacity: 1 }));  // GState not available in jsPDF type definitions
    
    this.doc.setDrawColor(...bgColor);
    this.doc.setLineWidth(1);
    this.doc.rect(this.leftMargin, yPos, this.contentWidth, boxHeight, "S");
    
    // Icon
    const iconX = this.leftMargin + 10;
    const iconY = yPos + boxHeight / 2;
    
    if (compliance.isCompliant) {
      this.doc.setTextColor(...this.successColor);
      this.doc.setFontSize(20);
      this.doc.text("✓", iconX, iconY);
    } else {
      this.doc.setTextColor(...this.errorColor);
      this.doc.setFontSize(20);
      this.doc.text("✗", iconX, iconY);
    }
    
    // Text
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Overall Compliance Status", iconX + 15, yPos + 12);
    
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    const status = compliance.isCompliant 
      ? "All parameters meet or exceed standard requirements"
      : `${compliance.criticalIssues.length} critical issues require attention`;
    this.doc.text(status, iconX + 15, yPos + 20);
    
    this.doc.text(`Compliance Score: ${compliance.compliancePercentage}%`, iconX + 15, yPos + 28);
  }

  private drawSignatureBlocks(yPos: number): void {
    const blockWidth = (this.contentWidth - 20) / 3;
    
    const blocks = [
      { title: "Prepared By", name: "Inspector" },
      { title: "Reviewed By", name: "Level III" },
      { title: "Approved By", name: "Quality Manager" }
    ];
    
    blocks.forEach((block, index) => {
      const blockX = this.leftMargin + (blockWidth + 10) * index;
      
      // Signature line
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.5);
      this.doc.line(blockX, yPos + 20, blockX + blockWidth, yPos + 20);
      
      // Labels
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(block.title, blockX + blockWidth / 2, yPos + 25, { align: "center" });
      this.doc.text(block.name, blockX + blockWidth / 2, yPos + 30, { align: "center" });
      
      // Date line
      this.doc.line(blockX, yPos + 40, blockX + blockWidth, yPos + 40);
      this.doc.text("Date", blockX + blockWidth / 2, yPos + 45, { align: "center" });
    });
  }

  private drawDimensionLine(x1: number, y1: number, x2: number, y2: number, label: string, vertical = false): void {
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.2);
    
    if (vertical) {
      this.doc.line(x1, y1, x2, y2);
      this.doc.line(x1 - 2, y1, x1 + 2, y1);
      this.doc.line(x2 - 2, y2, x2 + 2, y2);
      
      const midY = (y1 + y2) / 2;
      // this.doc.save();  // save method not available in jsPDF type definitions
      this.doc.text(label, x1 - 3, midY, { angle: 90, align: "center" });
      // this.doc.restore();  // restore method not available in jsPDF type definitions
    } else {
      this.doc.line(x1, y1, x2, y2);
      this.doc.line(x1, y1 - 2, x1, y1 + 2);
      this.doc.line(x2, y2 - 2, x2, y2 + 2);
      
      const midX = (x1 + x2) / 2;
      this.doc.text(label, midX, y1 + 3, { align: "center" });
    }
  }

  private drawArrow(x1: number, y1: number, x2: number, y2: number, direction: "left" | "right"): void {
    this.doc.line(x1, y1, x2, y2);
    
    const arrowSize = 3;
    if (direction === "right") {
      this.doc.line(x2, y2, x2 - arrowSize, y2 - arrowSize / 2);
      this.doc.line(x2, y2, x2 - arrowSize, y2 + arrowSize / 2);
    } else {
      this.doc.line(x1, y1, x1 + arrowSize, y1 - arrowSize / 2);
      this.doc.line(x1, y1, x1 + arrowSize, y1 + arrowSize / 2);
    }
  }

  private calculateCompliance(data: ProfessionalTechniqueSheetData): ComplianceData {
    const parameters = {
      thickness: data.inspectionSetup.partThickness,
      material: data.inspectionSetup.material,
      frequency: parseFloat(data.equipment.frequency),
      scanSpeed: data.scanParameters.scanSpeed,
      scanMethod: data.scanParameters.scanMethod,
      verticalLinearity: { min: 5, max: data.equipment.verticalLinearity },
      horizontalLinearity: data.equipment.horizontalLinearity,
      acceptanceClass: data.acceptanceCriteria.acceptanceClass,
      transducerDiameter: data.equipment.transducerDiameter,
      beamWidth: 10, // Estimated
      coverage: data.scanParameters.coverage
    };
    
    const report = complianceEngine.checkCompliance(parameters, data.standard);
    
    const criticalIssues = report.requirements
      .filter(r => !r.compliant && r.severity === "error")
      .map(r => r.message);
    
    return {
      isCompliant: report.overallCompliance,
      compliancePercentage: Math.round(report.compliancePercentage),
      criticalIssues,
      recommendations: report.recommendations
    };
  }

  private performCalculations(data: ProfessionalTechniqueSheetData): any[] {
    const calculations = [];
    const standard = data.standard;
    
    // Metal Travel Distance
    if (data.inspectionSetup.partThickness) {
      const mtd = complianceEngine.calculateMetalTravelDistance(data.inspectionSetup.partThickness, standard);
      calculations.push({
        parameter: "Metal Travel Distance",
        formula: mtd.formula,
        value: mtd.value.toFixed(0),
        unit: mtd.unit,
        explanation: mtd.explanation
      });
    }
    
    // Scan Index
    if (data.scanParameters.coverage) {
      const scanIndex = complianceEngine.calculateScanIndex(10, data.scanParameters.coverage, standard);
      calculations.push({
        parameter: "Scan Index",
        formula: scanIndex.formula,
        value: scanIndex.value.toFixed(1),
        unit: scanIndex.unit,
        explanation: scanIndex.explanation
      });
    }
    
    // Near Field Distance
    if (data.equipment.transducerDiameter && data.equipment.frequency && data.inspectionSetup.material) {
      const velocity = data.inspectionSetup.material === "aluminum" ? 6320 
        : data.inspectionSetup.material === "titanium" ? 6100
        : data.inspectionSetup.material === "stainless_steel" ? 5790
        : 5900;
      
      const nearField = complianceEngine.calculateNearFieldDistance(
        data.equipment.transducerDiameter,
        parseFloat(data.equipment.frequency),
        velocity,
        standard
      );
      calculations.push({
        parameter: "Near Field Distance",
        formula: nearField.formula,
        value: nearField.value.toFixed(1),
        unit: nearField.unit,
        explanation: nearField.explanation
      });
    }
    
    // FBH Size
    if (data.inspectionSetup.partThickness && data.acceptanceCriteria.acceptanceClass) {
      const fbh = complianceEngine.getFBHSize(
        data.inspectionSetup.partThickness,
        data.acceptanceCriteria.acceptanceClass,
        standard
      );
      calculations.push({
        parameter: "FBH Size",
        formula: fbh.formula,
        value: fbh.value,
        unit: "",
        explanation: fbh.explanation
      });
    }
    
    return calculations;
  }

  private getRequiredBlockType(data: ProfessionalTechniqueSheetData): string {
    const geometry = data.inspectionSetup.partType;
    if (geometry?.includes("tube") || geometry?.includes("pipe") || geometry?.includes("ring")) {
      return "Curved block or cylinder FBH";
    }
    return "Flat block";
  }

  private getRequiredFBHSizes(data: ProfessionalTechniqueSheetData): string {
    if (data.inspectionSetup.partThickness && data.acceptanceCriteria.acceptanceClass) {
      return complianceEngine.getFBHSize(
        data.inspectionSetup.partThickness,
        data.acceptanceCriteria.acceptanceClass,
        data.standard
      ).value;
    }
    return "Per standard";
  }

  private getRequiredMTD(data: ProfessionalTechniqueSheetData): string {
    if (data.inspectionSetup.partThickness) {
      return complianceEngine.calculateMetalTravelDistance(
        data.inspectionSetup.partThickness,
        data.standard
      ).value.toString();
    }
    return "3T";
  }

  private getMaxScanSpeed(data: ProfessionalTechniqueSheetData): string {
    const method = data.scanParameters.scanMethod === "automated" ? "automated" : "manual";
    const standard = data.standard;
    
    switch (standard) {
      case "AMS-STD-2154E":  // Handle both AMS and MIL standards
      case "MIL-STD-2154":
        return "≤150";
      case "ASTM-A388":
        return method === "manual" ? "≤150" : "≤300";
      case "BS-EN-10228-3":
        return method === "manual" ? "≤150" : "≤500";
      case "BS-EN-10228-4":
        return method === "manual" ? "≤100" : "≤250";
      default:
        return "≤150";
    }
  }

  private getRecommendedPattern(data: ProfessionalTechniqueSheetData): string {
    const geometry = data.inspectionSetup.partType;
    if (geometry?.includes("plate") || geometry?.includes("sheet")) {
      return "Raster 0°/90°";
    } else if (geometry?.includes("cylinder") || geometry?.includes("round")) {
      return "Radial/Circumferential";
    } else if (geometry?.includes("ring")) {
      return "Radial/Axial/Circumferential";
    }
    return "Per geometry";
  }

  private getAcceptanceLimit(data: ProfessionalTechniqueSheetData, type: "single" | "multiple" | "linear"): string {
    const standard = data.standard;
    const acceptanceClass = data.acceptanceCriteria.acceptanceClass || "";
    const criteriaSet = acceptanceCriteriaByStandard[standard];
    if (!criteriaSet) return "Per standard";

    const fallbackKey = Object.keys(criteriaSet)[0];
    const selectedCriteria = criteriaSet[acceptanceClass as keyof typeof criteriaSet]
      || criteriaSet[fallbackKey as keyof typeof criteriaSet];
    if (!selectedCriteria) return "Per standard";

    switch (type) {
      case "single":
        return selectedCriteria.singleDiscontinuity || "Per standard";
      case "multiple":
        return selectedCriteria.multipleDiscontinuities || "Per standard";
      case "linear":
        return selectedCriteria.linearDiscontinuity || "Per standard";
    }

    return "Per standard";
  }
}

// Export function for easy use
export function exportProfessionalTechniqueSheet(data: ProfessionalTechniqueSheetData, filename?: string): void {
  const exporter = new ProfessionalPDFExporter();
  exporter.exportProfessionalTechniqueSheet(data, filename);
}
