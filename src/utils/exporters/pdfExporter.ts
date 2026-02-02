// @ts-nocheck
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BaseExporter } from "./baseExporter";
import { ExportResult, defaultColorScheme } from "@/types/exportTypes";
import { CalibrationBlockType } from "@/types/techniqueSheet";
import { EnhancedCalibrationBlockDrawings, BlockDrawingOptions } from "@/utils/drawings/enhancedCalibrationBlockDrawings";

export class PDFExporter extends BaseExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private margin = 15;
  private colors = this.options.colorScheme || defaultColorScheme;

  async export(): Promise<ExportResult> {
    try {
      this.doc = new jsPDF("portrait", "mm", "a4");
      this.pageWidth = this.doc.internal.pageSize.getWidth();
      this.pageHeight = this.doc.internal.pageSize.getHeight();
      
      await this.buildDocument();
      
      const filename = `${this.getFileName()}.pdf`;
      this.doc.save(filename);
      
      return {
        success: true,
        filename,
      };
    } catch (error) {
      console.error("PDF export error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  private async buildDocument(): Promise<void> {
    // Cover Page
    if (this.shouldIncludeSection("coverPage")) {
      this.renderCoverPage();
      this.doc.addPage();
    }

    // Table of Contents
    if (this.shouldIncludeSection("tableOfContents") && this.options.includeTableOfContents) {
      this.renderTableOfContents();
      this.doc.addPage();
    }

    // Main Content
    this.currentY = this.margin;

    if (this.shouldIncludeSection("inspectionSetup")) {
      this.renderInspectionSetup();
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("equipment")) {
      this.checkPageBreak(80);
      this.renderEquipment();
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("calibration")) {
      this.checkPageBreak(100);
      this.renderCalibration();
      
      if (this.shouldIncludeSection("calibrationDiagram")) {
        await this.renderCalibrationDiagram();
      }
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("scanParameters")) {
      this.checkPageBreak(80);
      this.renderScanParameters();
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("acceptanceCriteria")) {
      this.checkPageBreak(80);
      this.renderAcceptanceCriteria();
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("partDiagram") && this.data.partDiagram) {
      this.checkPageBreak(120);
      this.renderPartDiagram();
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("documentation")) {
      this.checkPageBreak(80);
      this.renderDocumentation();
      this.addSectionSpacer();
    }

    if (this.shouldIncludeSection("scanImages") && this.data.scanImages?.length) {
      this.renderScanImages();
    }

    if (this.shouldIncludeSection("approvals")) {
      this.doc.addPage();
      this.renderApprovals();
    }

    // Add page numbers and watermark
    this.addPageNumbers();
    
    if (this.options.includeWatermark) {
      this.addWatermark();
    }
  }

  protected renderCoverPage(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    // Header background
    this.doc.setFillColor(rgb.r, rgb.g, rgb.b);
    this.doc.rect(0, 0, this.pageWidth, 60, "F");
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("ULTRASONIC INSPECTION", this.pageWidth / 2, 25, { align: "center" });
    this.doc.setFontSize(18);
    this.doc.text("TECHNIQUE SHEET", this.pageWidth / 2, 40, { align: "center" });
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    
    // Document info box
    this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, 80, this.pageWidth - 2 * this.margin, 50);
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Document Information", this.margin + 5, 90);
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Standard: ${this.data.standard}`, this.margin + 5, 100);
    this.doc.text(`Document No: ${this.data.documentation.procedureNumber || "UT-TS-001"}`, this.margin + 5, 108);
    this.doc.text(`Revision: ${this.data.documentation.revision || "A"}`, this.margin + 5, 116);
    this.doc.text(`Date: ${this.formatDate(this.data.documentation.inspectionDate)}`, this.margin + 5, 124);
    
    // Part Information
    this.doc.rect(this.margin, 150, this.pageWidth - 2 * this.margin, 60);
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Part Information", this.margin + 5, 160);
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Part Number: ${this.data.inspectionSetup.partNumber || "N/A"}`, this.margin + 5, 170);
    this.doc.text(`Part Name: ${this.data.inspectionSetup.partName || "N/A"}`, this.margin + 5, 178);
    this.doc.text(`Material: ${this.data.inspectionSetup.material || "N/A"}`, this.margin + 5, 186);
    this.doc.text(`Type: ${this.data.inspectionSetup.partType || "N/A"}`, this.margin + 5, 194);
    this.doc.text(`Thickness: ${this.formatValue(this.data.inspectionSetup.partThickness, "mm")}`, this.margin + 5, 202);
    
    // Inspector Information
    this.doc.rect(this.margin, 230, this.pageWidth - 2 * this.margin, 40);
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Inspector Information", this.margin + 5, 240);
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Inspector: ${this.data.documentation.inspectorName || "N/A"}`, this.margin + 5, 250);
    this.doc.text(`Level: ${this.data.documentation.inspectorLevel || "N/A"}`, this.margin + 5, 258);
    this.doc.text(`Organization: ${this.data.documentation.certifyingOrganization || "N/A"}`, this.margin + 5, 266);
    
    // Company logo/name placeholder
    if (this.options.companyName) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(this.options.companyName, this.pageWidth / 2, this.pageHeight - 20, { align: "center" });
    }
  }

  protected renderTableOfContents(): void {
    this.currentY = this.margin;
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Table of Contents", this.margin, this.currentY);
    this.currentY += 15;
    
    const tocItems = [
      { title: "1. Inspection Setup", page: 2 },
      { title: "2. Equipment", page: 2 },
      { title: "3. Calibration", page: 3 },
      { title: "4. Scan Parameters", page: 3 },
      { title: "5. Acceptance Criteria", page: 4 },
      { title: "6. Documentation", page: 4 },
      { title: "7. Approvals", page: 5 },
    ];
    
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    
    tocItems.forEach((item) => {
      if (this.shouldIncludeSection(item.title.toLowerCase().replace(/\s+/g, ""))) {
        this.doc.text(item.title, this.margin, this.currentY);
        this.doc.text(item.page.toString(), this.pageWidth - this.margin - 10, this.currentY);
        this.doc.line(this.margin + 50, this.currentY - 2, this.pageWidth - this.margin - 15, this.currentY - 2);
        this.currentY += 8;
      }
    });
  }

  protected renderInspectionSetup(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("1. Inspection Setup", this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
    
    const tableData = [
      ["Part Number", this.formatValue(this.data.inspectionSetup.partNumber)],
      ["Part Name", this.formatValue(this.data.inspectionSetup.partName)],
      ["Material", this.formatValue(this.data.inspectionSetup.material)],
      ["Material Spec", this.formatValue(this.data.inspectionSetup.materialSpec)],
      ["Type", this.formatValue(this.data.inspectionSetup.partType)],
      ["Thickness", this.formatValue(this.data.inspectionSetup.partThickness, "mm")],
      ["Dimensions", `${this.formatValue(this.data.inspectionSetup.partLength)} × ${this.formatValue(this.data.inspectionSetup.partWidth)} mm`],
    ];
    
    if (this.data.inspectionSetup.diameter) {
      tableData.push(["Diameter", this.formatValue(this.data.inspectionSetup.diameter, "mm")]);
    }
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  protected renderEquipment(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("2. Equipment", this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
    
    const tableData = [
      ["Manufacturer", this.formatValue(this.data.equipment.manufacturer)],
      ["Model", this.formatValue(this.data.equipment.model)],
      ["Serial Number", this.formatValue(this.data.equipment.serialNumber)],
      ["Frequency", this.formatValue(this.data.equipment.frequency, "MHz")],
      ["Transducer Type", this.formatValue(this.data.equipment.transducerType)],
      ["Transducer Ø", this.formatValue(this.data.equipment.transducerDiameter, "in")],
      ["Couplant", this.formatValue(this.data.equipment.couplant)],
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  protected renderCalibration(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("3. Calibration", this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
    
    const tableData = [
      ["Standard Type", this.formatValue(this.data.calibration.standardType)],
      ["Reference Material", this.formatValue(this.data.calibration.referenceMaterial)],
      ["FBH Sizes", this.formatValue(this.data.calibration.fbhSizes)],
      ["Metal Travel", this.formatValue(this.data.calibration.metalTravelDistance, "mm")],
      ["Block Dimensions", this.formatValue(this.data.calibration.blockDimensions)],
      ["Block S/N", this.formatValue(this.data.calibration.blockSerialNumber)],
      ["Cal Date", this.formatDate(this.data.calibration.lastCalibrationDate)],
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  protected async renderCalibrationDiagram(): Promise<void> {
    if (!this.data.calibration.standardType) return;
    
    this.currentY += 10;
    
    const rgb = this.hexToRgb(this.colors.secondary);
    
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Calibration Block Diagram", this.margin, this.currentY);
    this.currentY += 5;
    
    try {
      // Create enhanced calibration block drawing
      const drawingOptions: BlockDrawingOptions = {
        type: this.data.calibration.standardType as CalibrationBlockType,
        dimensions: {
          length: 200,
          width: 100,
          height: 50,
          diameter: 150,
          radius: 100,
        },
        material: this.data.calibration.referenceMaterial || 'Steel',
        serialNumber: this.data.calibration.blockSerialNumber || 'CAL-001',
        showGrid: true,
        showDimensions: true,
        showCrossSection: true,
        showIsometric: false,
        showLegend: true,
        showTitleBlock: false,
        scale: 1,
        dpi: 150, // Reduced for PDF embedding
      };

      // Parse FBH sizes if available
      if (this.data.calibration.fbhSizes) {
        const fbhSizesArray = this.data.calibration.fbhSizes.split(',').map(s => s.trim());
        drawingOptions.fbhData = fbhSizesArray.map((size, index) => ({
          diameter: parseFloat(size) || 3,
          depth: 10 + index * 5,
          position: { x: 50 + index * 50, y: 50 },
          label: `FBH ${size}`,
        }));
      }

      const blockDrawing = new EnhancedCalibrationBlockDrawings(drawingOptions);
      const views = await blockDrawing.generateDrawings();
      
      // Get the main view
      const mainView = views.get('top');
      if (mainView) {
        // Calculate image dimensions to fit in PDF
        const maxWidth = this.pageWidth - 2 * this.margin;
        const maxHeight = 100;
        
        // Add the high-resolution calibration block image
        this.doc.addImage(
          mainView.dataUrl,
          'PNG',
          this.margin,
          this.currentY,
          maxWidth,
          maxHeight,
          undefined,
          'FAST'
        );
        
        this.currentY += maxHeight + 5;
        
        // Add section view if available
        const sectionView = views.get('section');
        if (sectionView) {
          this.doc.setFontSize(10);
          this.doc.text("Cross-Section View", this.margin, this.currentY);
          this.currentY += 5;
          
          this.doc.addImage(
            sectionView.dataUrl,
            'PNG',
            this.margin,
            this.currentY,
            maxWidth,
            50,
            undefined,
            'FAST'
          );
          
          this.currentY += 55;
        }
      }
    } catch (error) {
      console.error('Failed to generate enhanced calibration drawing:', error);
      // Fallback to simple drawing
      this.drawSimpleCalibrationBlock(
        this.data.calibration.standardType as CalibrationBlockType,
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        40
      );
      this.currentY += 40;
    }
  }

  private drawSimpleCalibrationBlock(
    type: CalibrationBlockType,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    this.doc.setDrawColor(100, 100, 100);
    this.doc.setLineWidth(0.3);
    
    // Simple fallback drawing
    this.doc.rect(x, y, width, height);
    this.doc.setFontSize(10);
    this.doc.text(`${type.toUpperCase()} CALIBRATION BLOCK`, centerX, centerY, { align: "center" });
  }

  protected renderScanParameters(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("4. Scan Parameters", this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
    
    const tableData = [
      ["Method", this.formatValue(this.data.scanParameters.scanMethod)],
      ["Type", this.formatValue(this.data.scanParameters.scanType)],
      ["Speed", this.formatValue(this.data.scanParameters.scanSpeed, "mm/s")],
      ["Index", this.formatValue(this.data.scanParameters.scanIndex, "%")],
      ["Coverage", this.formatValue(this.data.scanParameters.coverage, "%")],
      ["Pattern", this.formatValue(this.data.scanParameters.scanPattern)],
      ["Water Path", this.formatValue(this.data.scanParameters.waterPath, "mm")],
      ["PRF", this.formatValue(this.data.scanParameters.pulseRepetitionRate, "Hz")],
      ["Gain", this.formatValue(this.data.scanParameters.gainSettings)],
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  protected renderAcceptanceCriteria(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("5. Acceptance Criteria", this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
    
    const tableData = [
      ["Class", this.formatValue(this.data.acceptanceCriteria.acceptanceClass)],
      ["Single Disc.", this.formatValue(this.data.acceptanceCriteria.singleDiscontinuity)],
      ["Multiple Disc.", this.formatValue(this.data.acceptanceCriteria.multipleDiscontinuities)],
      ["Linear Disc.", this.formatValue(this.data.acceptanceCriteria.linearDiscontinuity)],
      ["Back Loss %", this.formatValue(this.data.acceptanceCriteria.backReflectionLoss, "%")],
      ["Noise Level", this.formatValue(this.data.acceptanceCriteria.noiseLevel)],
      ["Special Req.", this.formatValue(this.data.acceptanceCriteria.specialRequirements)],
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  protected renderPartDiagram(): void {
    if (!this.data.partDiagram) return;
    
    this.currentY += 10;
    
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Part Diagram", this.margin, this.currentY);
    this.currentY += 5;
    
    try {
      this.doc.addImage(
        this.data.partDiagram,
        "PNG",
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        80
      );
      this.currentY += 85;
    } catch (error) {
      console.error("Failed to add part diagram:", error);
      this.doc.setFontSize(9);
      this.doc.text("[Part Diagram Not Available]", this.margin, this.currentY);
      this.currentY += 10;
    }
  }

  protected renderDocumentation(): void {
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("6. Documentation", this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
    
    const tableData = [
      ["Inspector", this.formatValue(this.data.documentation.inspectorName)],
      ["Certification", this.formatValue(this.data.documentation.inspectorCertification)],
      ["Level", this.formatValue(this.data.documentation.inspectorLevel)],
      ["Organization", this.formatValue(this.data.documentation.certifyingOrganization)],
      ["Date", this.formatDate(this.data.documentation.inspectionDate)],
      ["Procedure No.", this.formatValue(this.data.documentation.procedureNumber)],
      ["Drawing Ref.", this.formatValue(this.data.documentation.drawingReference)],
      ["Revision", this.formatValue(this.data.documentation.revision)],
    ];
    
    if (this.data.documentation.additionalNotes) {
      tableData.push(["Notes", this.formatValue(this.data.documentation.additionalNotes)]);
    }
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
  }

  protected renderScanImages(): void {
    if (!this.data.scanImages || this.data.scanImages.length === 0) return;
    
    this.data.scanImages.forEach((image, index) => {
      this.doc.addPage();
      this.currentY = this.margin;
      
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(`Scan Image ${index + 1}`, this.margin, this.currentY);
      this.currentY += 10;
      
      try {
        this.doc.addImage(
          image,
          "PNG",
          this.margin,
          this.currentY,
          this.pageWidth - 2 * this.margin,
          150
        );
      } catch (error) {
        console.error(`Failed to add scan image ${index + 1}:`, error);
        this.doc.setFontSize(9);
        this.doc.text("[Scan Image Not Available]", this.margin, this.currentY);
      }
    });
  }

  protected renderApprovals(): void {
    this.currentY = this.margin;
    
    const rgb = this.hexToRgb(this.colors.primary);
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    this.doc.text("Approval Signatures", this.pageWidth / 2, this.currentY, { align: "center" });
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 20;
    
    const approvalData = [
      ["Prepared by", this.data.documentation.inspectorName || "", this.data.documentation.inspectorLevel || "", this.formatDate(this.data.documentation.inspectionDate), "__________________"],
      ["Reviewed by", "", "Level III", "", "__________________"],
      ["Approved by", "", "", "", "__________________"],
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Role", "Name", "Level", "Date", "Signature"]],
      body: approvalData,
      theme: "grid",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: 255,
        fontSize: 11,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 10,
        minCellHeight: 15,
      },
      columnStyles: {
        4: { cellWidth: 40 },
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
    
    // Add notes section
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Notes:", this.margin, this.currentY);
    this.currentY += 5;
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    const notes = [
      "• This technique sheet has been prepared in accordance with applicable standards and procedures.",
      "• All equipment used has been calibrated and verified.",
      "• The inspection shall be performed by qualified personnel only.",
      "• Any deviations from this technique sheet require written approval.",
    ];
    
    notes.forEach((note) => {
      this.doc.text(note, this.margin + 5, this.currentY);
      this.currentY += 5;
    });
  }

  protected addPageNumbers(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      
      const text = `Page ${i} of ${pageCount}`;
      this.doc.text(text, this.pageWidth / 2, this.pageHeight - 10, { align: "center" });
      
      // Add document reference
      this.doc.text(
        `${this.data.documentation.procedureNumber || "UT-TS-001"} Rev ${this.data.documentation.revision || "A"}`,
        this.margin,
        this.pageHeight - 10
      );
      
      // Add date
      this.doc.text(
        this.formatDate(this.data.documentation.inspectionDate),
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: "right" }
      );
    }
  }

  protected addWatermark(): void {
    if (!this.options.includeWatermark) return;
    
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setTextColor(200, 200, 200);
      this.doc.setFontSize(50);
      this.doc.setFont("helvetica", "bold");
      
      // Save the current state
      this.doc.saveGraphicsState();
      
      // Set opacity
      this.doc.setGState(this.doc.GState({ opacity: 0.2 }));
      
      // Add watermark text
      const watermarkText = this.options.companyName || "DRAFT";
      
      // Calculate text position for diagonal watermark
      const textWidth = this.doc.getTextWidth(watermarkText);
      const angle = -45;
      const radians = (angle * Math.PI) / 180;
      
      // Position text in center of page
      const x = this.pageWidth / 2;
      const y = this.pageHeight / 2;
      
      // Rotate and add text
      this.doc.text(watermarkText, x, y, {
        angle: angle,
        align: "center",
      });
      
      // Restore the state
      this.doc.restoreGraphicsState();
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 15) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addSectionSpacer(): void {
    this.currentY += 10;
  }
}