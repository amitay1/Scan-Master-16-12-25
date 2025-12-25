import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from "@/types/techniqueSheet";

interface TechniqueSheetExportData {
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
}

export function exportTechniqueSheetToPDF(data: TechniqueSheetExportData, filenameSuffix?: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  // Compact Header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("UT Technique Sheet", pageWidth / 2, 10, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.standard} | ${data.inspectionSetup.partNumber || "N/A"} | ${new Date().toLocaleDateString()}`, pageWidth / 2, 16, { align: "center" });

  yPos = 25;
  doc.setTextColor(0, 0, 0);

  // Two-column layout
  const leftCol = 14;
  const rightCol = pageWidth / 2 + 5;
  const colWidth = (pageWidth - 28) / 2 - 5;

  // 1. Inspection Setup (Left Column)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("1. Inspection Setup", leftCol, yPos);
  yPos += 3;

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: [
      ["Part Number", data.inspectionSetup.partNumber || "N/A"],
      ["Part Name", data.inspectionSetup.partName || "N/A"],
      ["Material", data.inspectionSetup.material || "N/A"],
      ["Material Spec", data.inspectionSetup.materialSpec || "N/A"],
      ["Type", data.inspectionSetup.partType || "N/A"],
      ["Thickness", data.inspectionSetup.partThickness?.toString() || "N/A"],
      ["Dimensions", `${data.inspectionSetup.partLength || "N/A"} × ${data.inspectionSetup.partWidth || "N/A"} mm`],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: leftCol },
    tableWidth: colWidth,
  });

  const setupEndY = (doc as any).lastAutoTable.finalY;

  // 2. Equipment (Right Column - parallel to setup)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("2. Equipment", rightCol, 25);

  autoTable(doc, {
    startY: 28,
    head: [["Parameter", "Value"]],
    body: [
      ["Manufacturer", data.equipment.manufacturer || "N/A"],
      ["Model", data.equipment.model || "N/A"],
      ["Serial Number", data.equipment.serialNumber || "N/A"],
      ["Frequency", data.equipment.frequency || "N/A"],
      ["Transducer", data.equipment.transducerType || "N/A"],
      ["Ø (in)", data.equipment.transducerDiameter?.toString() || "N/A"],
      ["Couplant", data.equipment.couplant || "N/A"],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: rightCol },
    tableWidth: colWidth,
  });

  yPos = Math.max(setupEndY, (doc as any).lastAutoTable.finalY) + 8;

  // 3. Calibration + Drawing (Left Column)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("3. Calibration", leftCol, yPos);

  autoTable(doc, {
    startY: yPos + 3,
    head: [["Parameter", "Value"]],
    body: [
      ["Standard", data.calibration.standardType || "N/A"],
      ["Material", data.calibration.referenceMaterial || "N/A"],
      ["FBH Sizes", data.calibration.fbhSizes || "N/A"],
      ["Metal Travel", data.calibration.metalTravelDistance?.toString() || "N/A"],
      ["Block SN", data.calibration.blockSerialNumber || "N/A"],
      ["Cal Date", data.calibration.lastCalibrationDate || "N/A"],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: leftCol },
    tableWidth: colWidth,
  });

  const calEndY = (doc as any).lastAutoTable.finalY + 5;

  // Draw calibration block
  if (data.calibration.standardType) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Calibration Block", leftCol, calEndY);
    
    const drawHeight = 35;
    doc.rect(leftCol, calEndY + 2, colWidth, drawHeight);
    drawCalibrationBlockSimple(doc, data.calibration.standardType, leftCol, calEndY + 2, colWidth, drawHeight);
  }

  // 4. Scan Parameters (Right Column - parallel to calibration)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("4. Scan Parameters", rightCol, yPos);

  autoTable(doc, {
    startY: yPos + 3,
    head: [["Parameter", "Value"]],
    body: [
      ["Method", data.scanParameters.scanMethod || "N/A"],
      ["Type", data.scanParameters.scanType || "N/A"],
      ["Speed", data.scanParameters.scanSpeed?.toString() || "N/A"],
      ["Index", data.scanParameters.scanIndex?.toString() || "N/A"],
      ["Coverage", data.scanParameters.coverage?.toString() || "N/A"],
      ["Pattern", data.scanParameters.scanPattern || "N/A"],
      ["Water Path", data.scanParameters.waterPath?.toString() || "N/A"],
      ["PRF", data.scanParameters.pulseRepetitionRate?.toString() || "N/A"],
      ["Gain", data.scanParameters.gainSettings || "N/A"],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: rightCol },
    tableWidth: colWidth,
  });

  yPos = Math.max(calEndY + 40, (doc as any).lastAutoTable.finalY) + 8;

  // 5. Acceptance Criteria (Left Column)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("5. Acceptance Criteria", leftCol, yPos);

  autoTable(doc, {
    startY: yPos + 3,
    head: [["Parameter", "Value"]],
    body: [
      ["Class", data.acceptanceCriteria.acceptanceClass || "N/A"],
      ["Single Disc.", data.acceptanceCriteria.singleDiscontinuity || "N/A"],
      ["Multiple Disc.", data.acceptanceCriteria.multipleDiscontinuities || "N/A"],
      ["Linear Disc.", data.acceptanceCriteria.linearDiscontinuity || "N/A"],
      ["Back Loss %", data.acceptanceCriteria.backReflectionLoss?.toString() || "N/A"],
      ["Noise Level", data.acceptanceCriteria.noiseLevel || "N/A"],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: leftCol },
    tableWidth: colWidth,
  });

  const acceptEndY = (doc as any).lastAutoTable.finalY;

  // 6. Documentation (Right Column - parallel to acceptance)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("6. Documentation", rightCol, yPos);

  autoTable(doc, {
    startY: yPos + 3,
    head: [["Parameter", "Value"]],
    body: [
      ["Inspector", data.documentation.inspectorName || "N/A"],
      ["Certification", data.documentation.inspectorCertification || "N/A"],
      ["Level", data.documentation.inspectorLevel || "N/A"],
      ["Organization", data.documentation.certifyingOrganization || "N/A"],
      ["Date", data.documentation.inspectionDate || "N/A"],
      ["Procedure", data.documentation.procedureNumber || "N/A"],
      ["Drawing Ref", data.documentation.drawingReference || "N/A"],
      ["Revision", data.documentation.revision || "N/A"],
      ["Approval Req.", data.documentation.approvalRequired ? "Yes" : "No"],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: rightCol },
    tableWidth: colWidth,
  });

  // Additional Notes (full width if exists)
  if (data.documentation.additionalNotes) {
    yPos = Math.max(acceptEndY, (doc as any).lastAutoTable.finalY) + 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Additional Notes:", leftCol, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const splitNotes = doc.splitTextToSize(data.documentation.additionalNotes, pageWidth - 28);
    doc.text(splitNotes, leftCol, yPos + 4);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i}/${totalPages} | ${new Date().toLocaleDateString()} | ${data.inspectionSetup.partNumber || "N/A"}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }

  // Save the PDF
  const baseName = `TS_${data.inspectionSetup.partNumber || "Unknown"}_${new Date().toISOString().split("T")[0]}`;
  const filename = filenameSuffix ? `${baseName}_${filenameSuffix}.pdf` : `${baseName}.pdf`;
  doc.save(filename);
}

// Simple calibration block drawing function
function drawCalibrationBlockSimple(
  doc: jsPDF,
  standardType: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.setFontSize(6);

  // Determine block type from standard
  if (standardType.toLowerCase().includes("flat") || standardType.toLowerCase().includes("v1")) {
    // Flat block with FBH
    const blockWidth = 40;
    const blockHeight = 20;
    doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
    
    // FBH holes
    doc.circle(centerX - 12, centerY, 1.5, 'S');
    doc.circle(centerX, centerY, 1.5, 'S');
    doc.circle(centerX + 12, centerY, 1.5, 'S');
    doc.text("FBH", centerX, centerY - blockHeight / 2 - 2, { align: 'center' });
    
  } else if (standardType.toLowerCase().includes("curved") || standardType.toLowerCase().includes("v2")) {
    // Curved block
    doc.ellipse(centerX, centerY, 20, 12, 'S');
    doc.setDrawColor(150);
    doc.line(centerX, centerY - 15, centerX, centerY + 15);
    doc.setDrawColor(0);
    doc.text("R=100mm", centerX + 5, centerY - 13);
    
  } else if (standardType.toLowerCase().includes("cylinder") || standardType.toLowerCase().includes("hollow")) {
    // Cylindrical block
    doc.circle(centerX, centerY, 15, 'S');
    doc.circle(centerX, centerY, 10, 'S');
    
    // FBH positions
    doc.circle(centerX + 12, centerY, 1, 'F');
    doc.circle(centerX, centerY + 12, 1, 'F');
    doc.circle(centerX - 12, centerY, 1, 'F');
    doc.text("Hollow Cylinder", centerX, centerY + 20, { align: 'center' });
    
  } else if (standardType.toLowerCase().includes("angle") || standardType.toLowerCase().includes("iiv")) {
    // Angle beam / IIV block
    const blockWidth = 45;
    const blockHeight = 18;
    doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
    
    // Steps/notches
    doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, 15, blockHeight / 2);
    doc.circle(centerX - 10, centerY, 1.5, 'S');
    doc.circle(centerX + 5, centerY, 1.5, 'S');
    doc.circle(centerX + 15, centerY, 1.5, 'S');
    doc.text("IIW Block", centerX, centerY - blockHeight / 2 - 2, { align: 'center' });
    
  } else {
    // Generic block
    const blockWidth = 40;
    const blockHeight = 20;
    doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
    doc.text("Calibration Block", centerX, centerY, { align: 'center' });
  }
}
