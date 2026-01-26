/**
 * Professional Inspection Report PDF Exporter
 * Styled after TÜV SÜD / FRISA professional inspection reports
 * Supports aerospace forging UT standards (AMS-STD-2154, ASTM E2375, ASTM A388)
 *
 * SYNCHRONIZED WITH TechniqueSheetPDF.ts - Same professional styling
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionReportData } from '@/types/inspectionReport';

// ============================================================================
// COLORS - Professional TÜV/FRISA style (matching TechniqueSheetPDF)
// ============================================================================
const COLORS = {
  // Primary colors
  primary: [0, 82, 147] as [number, number, number],       // TÜV blue - headers
  primaryDark: [0, 60, 110] as [number, number, number],   // Darker blue - cover page
  secondary: [64, 128, 178] as [number, number, number],   // Medium blue - subheaders
  accent: [0, 122, 194] as [number, number, number],       // Light blue - highlights
  accentGold: [212, 175, 55] as [number, number, number],  // Gold accent - premium styling

  // Background colors
  headerBg: [240, 245, 250] as [number, number, number],   // Light gray-blue
  sectionBg: [245, 247, 250] as [number, number, number],  // Section backgrounds
  rowAlt: [248, 250, 252] as [number, number, number],     // Alternating row
  labelBg: [230, 235, 240] as [number, number, number],    // Label background
  white: [255, 255, 255] as [number, number, number],

  // Border colors
  tableBorder: [200, 210, 220] as [number, number, number],
  divider: [220, 225, 230] as [number, number, number],

  // Text colors
  text: [30, 30, 30] as [number, number, number],          // Dark text
  lightText: [100, 100, 100] as [number, number, number],  // Secondary text
  mutedText: [130, 130, 130] as [number, number, number],  // Muted/subtle text

  // Status colors
  success: [34, 139, 34] as [number, number, number],      // Green - Accept
  warning: [255, 165, 0] as [number, number, number],      // Orange - warnings
  error: [220, 53, 69] as [number, number, number],        // Red - Reject
};

// ============================================================================
// PAGE SETTINGS
// ============================================================================
const PAGE = {
  width: 210,           // A4 width in mm
  height: 297,          // A4 height in mm
  marginLeft: 15,
  marginRight: 15,
  marginTop: 20,
  marginBottom: 20,
  headerHeight: 15,
  footerHeight: 10,
  contentWidth: 180,    // 210 - 15 - 15
  contentStart: 35,     // After header
};

// ============================================================================
// TYPES
// ============================================================================
interface ExportOptions {
  companyName?: string;
  companyLogo?: string;
  includeAerospaceSection?: boolean;
  language?: 'en' | 'it' | 'fr';
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
export const exportInspectionReportPDF = (
  data: InspectionReportData,
  options: ExportOptions = {}
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const {
    companyName = 'SCAN-MASTER',
    includeAerospaceSection = true,
  } = options;

  let currentPage = 1;
  let yPos = PAGE.marginTop;

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatValue = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  const formatDate = (date: string | undefined): string => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  };

  // ============================================================================
  // COVER PAGE HEADER (FRISA style with logo support)
  // ============================================================================
  const addCoverHeader = (): number => {
    const headerHeight = 28;
    const headerY = 10;

    // Logo box (white background on left) - if logo provided
    let titleStartX = PAGE.marginLeft;
    const { companyLogo } = options;

    if (companyLogo) {
      const logoBoxWidth = 30;
      const logoBoxHeight = headerHeight - 4;
      const logoBoxX = PAGE.marginLeft;
      const logoBoxY = headerY + 2;

      // White background for logo
      doc.setFillColor(...COLORS.white);
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 2, 2, 'F');

      // Gold right border accent
      doc.setFillColor(...COLORS.accentGold);
      doc.rect(logoBoxX + logoBoxWidth, logoBoxY, 1.5, logoBoxHeight, 'F');

      // Add logo image
      try {
        doc.addImage(companyLogo, 'PNG', logoBoxX + 3, logoBoxY + 3, logoBoxWidth - 6, logoBoxHeight - 6);
      } catch {
        // If logo fails, show placeholder text
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.lightText);
        doc.text('LOGO', logoBoxX + logoBoxWidth / 2, logoBoxY + logoBoxHeight / 2, { align: 'center' });
      }

      titleStartX = logoBoxX + logoBoxWidth + 6;
    }

    // Main blue header bar
    doc.setFillColor(...COLORS.primaryDark);
    if (companyLogo) {
      // Header starts after logo
      doc.rect(titleStartX - 2, headerY, PAGE.width - titleStartX + 2, headerHeight, 'F');
    } else {
      // Full width header
      doc.rect(0, headerY, PAGE.width, headerHeight, 'F');
    }

    // Gold accent line below
    doc.setFillColor(...COLORS.accentGold);
    doc.rect(0, headerY + headerHeight, PAGE.width, 1.5, 'F');

    // Company name (left of title area)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.white);
    if (companyName) {
      doc.text(companyName, titleStartX + 2, headerY + 8);
    }

    // Main title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('UT INSPECTION REPORT', titleStartX + 2, headerY + 20);

    // Document info box (white box on right)
    const boxWidth = 60;
    const boxHeight = 22;
    const boxX = PAGE.width - PAGE.marginRight - boxWidth;
    const boxY = headerY + 3;

    // White box with border
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.tableBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'S');

    // Document info text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightText);
    doc.text('Document No:', boxX + 3, boxY + 6);
    doc.text('Revision:', boxX + 3, boxY + 12);
    doc.text('Date:', boxX + 3, boxY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(formatValue(data.documentNo), boxX + 28, boxY + 6);
    doc.text(formatValue(data.currentRevision), boxX + 28, boxY + 12);
    doc.text(formatDate(data.issueDate), boxX + 28, boxY + 18);

    return headerY + headerHeight + 8;
  };

  // ============================================================================
  // PAGE HEADER (for non-cover pages)
  // ============================================================================
  const addHeader = (): number => {
    // Blue header bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE.width, PAGE.headerHeight, 'F');

    // Gold accent line
    doc.setFillColor(...COLORS.accentGold);
    doc.rect(0, PAGE.headerHeight, PAGE.width, 0.8, 'F');

    // Title (left)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('UT INSPECTION REPORT', PAGE.marginLeft, 10);

    // Document info (right)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const infoText = `Doc: ${formatValue(data.documentNo)} | Rev: ${formatValue(data.currentRevision)}`;
    doc.text(infoText, PAGE.width - PAGE.marginRight, 10, { align: 'right' });

    return PAGE.headerHeight + 8;
  };

  // ============================================================================
  // PAGE FOOTER
  // ============================================================================
  const addFooter = (pageNum: number, totalPages: number): void => {
    const footerY = PAGE.height - PAGE.footerHeight;

    // Gold accent line
    doc.setFillColor(...COLORS.accentGold);
    doc.rect(PAGE.marginLeft, footerY - 2, PAGE.contentWidth, 0.5, 'F');

    // Blue line below gold
    doc.setFillColor(...COLORS.primary);
    doc.rect(PAGE.marginLeft, footerY - 1.5, PAGE.contentWidth, 0.3, 'F');

    // Footer content
    doc.setFillColor(...COLORS.sectionBg);
    doc.rect(PAGE.marginLeft, footerY, PAGE.contentWidth, 8, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    // Part number (left)
    doc.setTextColor(...COLORS.lightText);
    doc.text(`P/N: ${formatValue(data.partNumber)}`, PAGE.marginLeft + 3, footerY + 5);

    // Confidential (center)
    doc.setTextColor(...COLORS.mutedText);
    doc.text('CONFIDENTIAL', PAGE.width / 2, footerY + 5, { align: 'center' });

    // Page number (right)
    doc.setTextColor(...COLORS.lightText);
    doc.text('Page ', PAGE.width - PAGE.marginRight - 20, footerY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`${pageNum}`, PAGE.width - PAGE.marginRight - 13, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightText);
    doc.text(` of ${totalPages}`, PAGE.width - PAGE.marginRight - 10, footerY + 5);
  };

  // ============================================================================
  // SECTION TITLE (FRISA style with gold accent)
  // ============================================================================
  const addSectionTitle = (title: string, y: number): number => {
    // Gold left accent
    doc.setFillColor(...COLORS.accentGold);
    doc.rect(PAGE.marginLeft, y, 4, 10, 'F');

    // Blue main bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(PAGE.marginLeft + 4, y, PAGE.contentWidth - 4, 10, 'F');

    // Shadow effect
    doc.setFillColor(0, 0, 0);
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.rect(PAGE.marginLeft + 1, y + 10, PAGE.contentWidth - 1, 1, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Title text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(title, PAGE.marginLeft + 8, y + 7);

    return y + 14;
  };

  // ============================================================================
  // SUBSECTION TITLE (with blue/gold accent bars)
  // ============================================================================
  const addSubSectionTitle = (title: string, y: number): number => {
    // Blue accent bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(PAGE.marginLeft, y, 2, 7, 'F');

    // Gold accent bar
    doc.setFillColor(...COLORS.accentGold);
    doc.rect(PAGE.marginLeft + 2, y, 2, 7, 'F');

    // Light gray background
    doc.setFillColor(...COLORS.sectionBg);
    doc.rect(PAGE.marginLeft + 4, y, PAGE.contentWidth - 4, 7, 'F');

    // Title text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(title, PAGE.marginLeft + 8, y + 5);

    return y + 10;
  };

  // ============================================================================
  // FIELD ROW (label: value format)
  // ============================================================================
  const addField = (label: string, value: string, x: number, y: number, labelWidth: number = 40): number => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.lightText);
    doc.text(label + ':', x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(formatValue(value), x + labelWidth, y);

    return y + 5;
  };

  const addFieldRow = (fields: Array<{ label: string; value: string; width?: number }>, y: number): number => {
    const fieldWidth = PAGE.contentWidth / fields.length;
    let maxY = y;

    fields.forEach((field, index) => {
      const x = PAGE.marginLeft + (index * fieldWidth);
      const newY = addField(field.label, field.value, x, y, field.width || 35);
      maxY = Math.max(maxY, newY);
    });

    return maxY;
  };

  // ============================================================================
  // PAGE BREAK CHECK
  // ============================================================================
  const calculateTotalPages = (): number => {
    let pages = 1; // Cover page
    pages += 1; // Equipment
    if (includeAerospaceSection) pages += 1; // Aerospace
    if (data.indications && data.indications.length > 0) pages += 1; // Indications
    pages += Math.ceil((data.scans?.length || 0) / 2); // Scans
    pages += 1; // Remarks & Signatures
    return Math.max(pages, 3);
  };

  const totalPages = calculateTotalPages();

  const checkPageBreak = (requiredSpace: number): number => {
    if (yPos + requiredSpace > PAGE.height - PAGE.marginBottom - 10) {
      doc.addPage();
      currentPage++;
      yPos = addHeader();
      addFooter(currentPage, totalPages);
      return yPos;
    }
    return yPos;
  };

  // ============================================================================
  // PAGE 1: COVER PAGE
  // ============================================================================

  yPos = addCoverHeader();

  // DOCUMENT SUMMARY section header
  doc.setFillColor(...COLORS.primary);
  doc.rect(PAGE.marginLeft, yPos, 3, 8, 'F');
  doc.setFillColor(...COLORS.sectionBg);
  doc.rect(PAGE.marginLeft + 3, yPos, PAGE.contentWidth - 3, 8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('DOCUMENT SUMMARY', PAGE.marginLeft + 8, yPos + 5.5);
  yPos += 12;

  // Document Summary Table (4-column layout like TechniqueSheet)
  const summaryRows = [
    ['Customer', formatValue(data.customerName), 'PO Number', formatValue(data.poNumber)],
    ['Part Number', formatValue(data.partNumber), 'Part Name', formatValue(data.itemDescription)],
    ['Material', formatValue(data.materialGrade), 'Cast/Heat N°', formatValue(data.castNumber)],
    ['Document N°', formatValue(data.documentNo), 'Revision', formatValue(data.currentRevision)],
    ['Test Standard', formatValue(data.testStandard), 'Test Method', 'UT'],
    ['Issue Date', formatDate(data.issueDate), 'Results', formatValue(data.results) || 'CONFORM'],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: COLORS.labelBg, textColor: COLORS.lightText, cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', fillColor: COLORS.labelBg, textColor: COLORS.lightText, cellWidth: 35 },
      3: { cellWidth: 55 },
    },
    alternateRowStyles: { fillColor: COLORS.rowAlt },
    tableLineColor: COLORS.tableBorder,
    tableLineWidth: 0.3,
    margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    didParseCell: (cellData) => {
      // Highlight Results cell
      if (cellData.row.index === 5 && cellData.column.index === 3) {
        const value = cellData.cell.raw?.toString().toLowerCase() || '';
        if (value.includes('conform') || value.includes('accept')) {
          cellData.cell.styles.textColor = COLORS.success;
          cellData.cell.styles.fontStyle = 'bold';
        } else if (value.includes('reject') || value.includes('non')) {
          cellData.cell.styles.textColor = COLORS.error;
          cellData.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Part Information Section
  yPos = addSectionTitle('PART INFORMATION', yPos);

  yPos = addFieldRow([
    { label: 'Description', value: data.itemDescription },
    { label: 'Drawing N°', value: data.drawingNumber },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Lot N°', value: data.lotNumber },
    { label: 'Batch N°', value: data.batchNumber || '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Heat Treatment', value: data.heatTreatmentCondition },
    { label: 'Thickness', value: data.thickness ? `${data.thickness} mm` : '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Surface Roughness', value: data.surfaceRoughness || '-' },
    { label: 'Surface Condition', value: data.surfaceConditions?.join(', ') || '-' },
  ], yPos);

  yPos += 5;

  // Quantity Section
  yPos = addSectionTitle('QUANTITY & SERIAL NUMBERS', yPos);

  yPos = addFieldRow([
    { label: 'Work Order', value: data.workOrderNumber },
    { label: 'Quantity', value: data.quantity },
  ], yPos);

  yPos = addField('Serial Numbers', data.individualNumbers || '-', PAGE.marginLeft, yPos, 30);

  yPos += 5;

  // Testing Details Section
  yPos = addSectionTitle('TESTING DETAILS', yPos);

  // Test methods checkboxes (styled)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Test Methods:', PAGE.marginLeft, yPos);

  const testTypes = ['RT', 'MT', 'UT', 'PT', 'OT'];
  let xOffset = PAGE.marginLeft + 30;
  testTypes.forEach(type => {
    const isSelected = data.testTypes?.includes(type as any);

    if (isSelected) {
      doc.setFillColor(...COLORS.primary);
      doc.rect(xOffset, yPos - 3, 4, 4, 'F');
      doc.setTextColor(...COLORS.white);
      doc.text('✓', xOffset + 0.5, yPos);
    } else {
      doc.setDrawColor(...COLORS.tableBorder);
      doc.rect(xOffset, yPos - 3, 4, 4, 'S');
    }

    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(type, xOffset + 6, yPos);
    xOffset += 20;
  });
  yPos += 7;

  yPos = addFieldRow([
    { label: 'Scan Type', value: data.typeOfScan },
    { label: 'Equipment', value: data.testingEquipment },
  ], yPos);

  yPos = addFieldRow([
    { label: 'TCG Applied', value: data.tcgApplied },
    { label: 'Technique Sheet', value: data.technicalSheetRef || '-' },
  ], yPos);

  yPos += 5;

  // Results Section
  yPos = addSectionTitle('OBSERVATIONS & RESULTS', yPos);

  // Observations text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  const obsText = data.observations || 'No recordable indications detected during ultrasonic examination.';
  const obsLines = doc.splitTextToSize(obsText, PAGE.contentWidth - 10);
  doc.text(obsLines, PAGE.marginLeft + 3, yPos);
  yPos += obsLines.length * 4 + 5;

  // Results box (colored)
  const results = data.results || 'CONFORM';
  const isAccept = results.toLowerCase().includes('conform') || results.toLowerCase().includes('accept');

  doc.setFillColor(...(isAccept ? COLORS.success : COLORS.error));
  doc.roundedRect(PAGE.marginLeft, yPos, 60, 12, 2, 2, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(results.toUpperCase(), PAGE.marginLeft + 30, yPos + 8, { align: 'center' });

  yPos += 18;

  addFooter(1, totalPages);

  // ============================================================================
  // PAGE 2: EQUIPMENT DETAILS
  // ============================================================================

  doc.addPage();
  currentPage++;
  yPos = addHeader();

  yPos = addSectionTitle('EQUIPMENT DETAILS', yPos);

  const eq = data.equipmentDetails;

  // Ultrasonic Generator
  yPos = addSubSectionTitle('Ultrasonic Generator', yPos);

  yPos = addFieldRow([
    { label: 'Make', value: eq?.generatorMake || '-' },
    { label: 'Model', value: eq?.generatorModel || '-' },
    { label: 'Serial N°', value: eq?.generatorSerial || '-' },
  ], yPos);

  yPos = addField('Calibration Date', eq?.generatorCalibrationDate || '-', PAGE.marginLeft, yPos, 35);

  yPos += 3;

  // Transducers
  yPos = addSubSectionTitle('Transducers', yPos);

  // Immersion
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondary);
  doc.text('Immersion:', PAGE.marginLeft, yPos);
  yPos += 4;

  yPos = addFieldRow([
    { label: 'Model', value: eq?.immersionTransducerModel || '-' },
    { label: 'Serial N°', value: eq?.immersionTransducerSerial || '-' },
    { label: 'Cal. Date', value: eq?.immersionTransducerCalibrationDate || '-' },
  ], yPos);

  // Contact
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondary);
  doc.text('Contact:', PAGE.marginLeft, yPos);
  yPos += 4;

  yPos = addFieldRow([
    { label: 'Model', value: eq?.contactTransducerModel || '-' },
    { label: 'Serial N°', value: eq?.contactTransducerSerial || '-' },
    { label: 'Cal. Date', value: eq?.contactTransducerCalibrationDate || '-' },
  ], yPos);

  yPos += 3;

  // Scan Parameters
  yPos = addSubSectionTitle('Scan Parameters', yPos);

  yPos = addFieldRow([
    { label: 'Frequency', value: eq?.frequency || '-' },
    { label: 'Probe Diameter', value: eq?.probeDiameter || '-' },
    { label: 'Water Path', value: eq?.waterPath || '-' },
  ], yPos);

  yPos += 3;

  // Software
  yPos = addSubSectionTitle('Software', yPos);

  yPos = addFieldRow([
    { label: 'Name', value: eq?.softwareName || '-' },
    { label: 'Version', value: eq?.softwareVersion || '-' },
    { label: 'Config', value: eq?.utConfigName || '-' },
  ], yPos);

  yPos += 3;

  // Calibration Block
  yPos = addSubSectionTitle('Calibration Block (ASTM E127)', yPos);

  yPos = addFieldRow([
    { label: 'Serial N°', value: eq?.calibrationBlockSerial || '-' },
    { label: 'Material', value: eq?.calibrationBlockMaterial || '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Thickness', value: eq?.calibrationBlockThickness || '-' },
    { label: 'Valid Until', value: eq?.calibrationValidUntil || '-' },
  ], yPos);

  // NIST checkbox
  const nistChecked = eq?.nistTraceability;
  if (nistChecked) {
    doc.setFillColor(...COLORS.success);
    doc.rect(PAGE.marginLeft, yPos - 3, 4, 4, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.text('✓', PAGE.marginLeft + 0.8, yPos);
  } else {
    doc.setDrawColor(...COLORS.tableBorder);
    doc.rect(PAGE.marginLeft, yPos - 3, 4, 4, 'S');
  }
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text('NIST Traceable', PAGE.marginLeft + 6, yPos);
  yPos += 8;

  // Probe Details Table
  if (data.probeDetails && data.probeDetails.length > 0) {
    yPos = checkPageBreak(50);
    yPos = addSectionTitle('PROBE DETAILS', yPos);

    const probeRows = data.probeDetails.map(probe => [
      probe.probeDescription || '-',
      probe.frequency || '-',
      probe.make || '-',
      probe.waveMode || '-',
      probe.scanningDirections || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Probe Description', 'Frequency', 'Make', 'Wave Mode', 'Scan Direction']],
      body: probeRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: COLORS.rowAlt },
      tableLineColor: COLORS.tableBorder,
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  addFooter(currentPage, totalPages);

  // ============================================================================
  // PAGE 3: AEROSPACE FORGING PARAMETERS (Optional)
  // ============================================================================

  if (includeAerospaceSection) {
    doc.addPage();
    currentPage++;
    yPos = addHeader();

    yPos = addSectionTitle('AEROSPACE FORGING UT PARAMETERS', yPos);

    // Subtitle
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.lightText);
    doc.text('Per AMS-STD-2154 / ASTM E2375 / ASTM A388', PAGE.marginLeft, yPos);
    yPos += 6;

    // Test Location & Timing
    const loc = data.testLocationTiming;
    yPos = addSubSectionTitle('Test Location & Timing', yPos);

    yPos = addFieldRow([
      { label: 'Location', value: loc?.inspectionLocation || '-' },
      { label: 'Facility', value: loc?.facilityName || '-' },
      { label: 'Test Date', value: loc?.testDate || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Start Time', value: loc?.testStartTime || '-' },
      { label: 'End Time', value: loc?.testEndTime || '-' },
      { label: 'Duration', value: loc?.inspectionDuration || '-' },
    ], yPos);

    yPos += 3;

    // Environmental Conditions
    const env = data.environmentalConditions;
    yPos = addSubSectionTitle('Environmental Conditions', yPos);

    yPos = addFieldRow([
      { label: 'Ambient Temp', value: env?.ambientTemperature || '-' },
      { label: 'Part Temp', value: env?.partTemperature || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Humidity', value: env?.humidity || '-' },
      { label: 'Lighting', value: env?.lightingConditions || '-' },
    ], yPos);

    yPos += 3;

    // Couplant Details
    const coup = data.couplantDetails;
    yPos = addSubSectionTitle('Couplant Details (AMS-STD-2154)', yPos);

    yPos = addFieldRow([
      { label: 'Type', value: coup?.couplantType || '-' },
      { label: 'Manufacturer', value: coup?.couplantManufacturer || '-' },
      { label: 'Batch', value: coup?.couplantBatchNumber || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Sulfur Content', value: coup?.sulfurContent || '-' },
      { label: 'Halide Content', value: coup?.halideContent || '-' },
    ], yPos);

    yPos += 3;

    // Forging Information
    const forg = data.forgingDetails;
    yPos = addSubSectionTitle('Forging Information', yPos);

    yPos = addFieldRow([
      { label: 'Type', value: forg?.forgingType || '-' },
      { label: 'Grain Flow', value: forg?.grainFlowDirection || '-' },
      { label: 'Ratio', value: forg?.forgingRatio || '-' },
    ], yPos);

    // Inspection directions as styled checkboxes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Inspection Directions:', PAGE.marginLeft, yPos);

    const directions = [
      { label: 'Axial', checked: forg?.axialInspection },
      { label: 'Radial', checked: forg?.radialInspection },
      { label: 'Circumf.', checked: forg?.circumferentialInspection },
      { label: 'Angle Beam', checked: forg?.angleBeamApplied },
    ];

    let dirX = PAGE.marginLeft + 42;
    directions.forEach(dir => {
      if (dir.checked) {
        doc.setFillColor(...COLORS.primary);
        doc.rect(dirX, yPos - 3, 4, 4, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(7);
        doc.text('✓', dirX + 0.8, yPos);
      } else {
        doc.setDrawColor(...COLORS.tableBorder);
        doc.rect(dirX, yPos - 3, 4, 4, 'S');
      }
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text(dir.label, dirX + 6, yPos);
      dirX += 30;
    });
    yPos += 8;

    // Sensitivity Settings
    const sens = data.sensitivitySettings;
    yPos = addSubSectionTitle('Sensitivity & Reference (AMS-STD-2154)', yPos);

    yPos = addFieldRow([
      { label: 'Ref FBH Size', value: sens?.referenceFbhSize || '-' },
      { label: 'FBH Depth', value: sens?.referenceFbhDepth || '-' },
      { label: 'Ref Level', value: sens?.referenceLevel || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Scanning Sens', value: sens?.scanningSensitivity || '-' },
      { label: 'Recording Level', value: sens?.recordingLevel || '-' },
      { label: 'Rejection Level', value: sens?.rejectionLevel || '-' },
    ], yPos);

    yPos += 3;

    // Transfer Correction
    const trans = data.transferCorrection;
    yPos = addSubSectionTitle('Transfer Correction', yPos);

    yPos = addFieldRow([
      { label: 'Cal Block BWE', value: trans?.calibrationBlockBwe || '-' },
      { label: 'Part BWE', value: trans?.partBweAtSameThickness || '-' },
      { label: 'Correction', value: trans?.transferCorrectionValue || '-' },
    ], yPos);

    yPos += 3;

    // BWE Monitoring
    const bwe = data.bweMonitoring;
    yPos = addSubSectionTitle('Back Wall Echo Monitoring (ASTM A388)', yPos);

    yPos = addFieldRow([
      { label: 'Threshold', value: bwe?.bweAttenuationThreshold || '-' },
      { label: 'Loss Recorded', value: bwe?.bweLossRecorded || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Gate Start', value: bwe?.bweGateStart || '-' },
      { label: 'Gate End', value: bwe?.bweGateEnd || '-' },
    ], yPos);

    yPos += 3;

    // Scan Coverage
    const cov = data.scanCoverage;
    yPos = addSubSectionTitle('Scan Index & Coverage', yPos);

    yPos = addFieldRow([
      { label: 'Index', value: cov?.scanIndex || '-' },
      { label: 'Overlap', value: cov?.overlapPercentage || '-' },
      { label: 'Coverage', value: cov?.coveragePercentage || '-' },
    ], yPos);

    addFooter(currentPage, totalPages);
  }

  // ============================================================================
  // INDICATIONS PAGE (if any)
  // ============================================================================

  if (data.indications && data.indications.length > 0) {
    doc.addPage();
    currentPage++;
    yPos = addHeader();

    yPos = addSectionTitle('INDICATIONS DETECTED', yPos);

    const indicationRows = data.indications.map(ind => [
      ind.indicationNumber?.toString() || '-',
      ind.scanId || '-',
      ind.xDistance || '-',
      ind.yDistance || '-',
      ind.xExtension || '-',
      ind.yExtension || '-',
      ind.amplitude || '-',
      ind.soundPath || '-',
      ind.fbhEquivalentSize || '-',
      ind.amplitudeVsReference || '-',
      ind.depthZone || '-',
      ind.assessment?.toUpperCase() || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Scan', 'X Dist', 'Y Dist', 'X Ext', 'Y Ext', 'Amp%', 'Depth', 'FBH', 'vs Ref', 'Zone', 'Result']],
      body: indicationRows,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: COLORS.rowAlt },
      tableLineColor: COLORS.tableBorder,
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 12 },
        11: { cellWidth: 18 },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
      didParseCell: (cellData) => {
        if (cellData.column.index === 11 && cellData.section === 'body') {
          const value = cellData.cell.raw?.toString().toLowerCase() || '';
          if (value.includes('accept')) {
            cellData.cell.styles.textColor = COLORS.success;
            cellData.cell.styles.fontStyle = 'bold';
          } else if (value.includes('reject')) {
            cellData.cell.styles.textColor = COLORS.error;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Legend
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.lightText);
    doc.text('Legend: X/Y Dist = Distance from reference | X/Y Ext = Indication size | Amp = Signal strength (% FSH)', PAGE.marginLeft, yPos);
    yPos += 4;
    doc.text('FBH = Flat Bottom Hole equivalent | vs Ref = dB relative to reference | Zone = Depth zone (Near/Mid/Far)', PAGE.marginLeft, yPos);

    addFooter(currentPage, totalPages);
  }

  // ============================================================================
  // SCANS PAGES
  // ============================================================================

  if (data.scans && data.scans.length > 0) {
    data.scans.forEach((scan, index) => {
      if (index % 2 === 0) {
        doc.addPage();
        currentPage++;
        yPos = addHeader();
        yPos = addSectionTitle('SCAN DATA', yPos);
      }

      // Scan card header
      yPos = checkPageBreak(80);

      doc.setFillColor(...COLORS.secondary);
      doc.rect(PAGE.marginLeft, yPos, 3, 6, 'F');
      doc.setFillColor(...COLORS.sectionBg);
      doc.rect(PAGE.marginLeft + 3, yPos, PAGE.contentWidth - 3, 6, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(`Scan ${scan.scanNumber}`, PAGE.marginLeft + 6, yPos + 4.5);
      yPos += 9;

      yPos = addFieldRow([
        { label: 'Type', value: scan.scanType || '-' },
        { label: 'Length', value: scan.scanLength || '-' },
        { label: 'Index', value: scan.indexLength || '-' },
      ], yPos);

      yPos = addFieldRow([
        { label: 'Probe', value: scan.probeType || '-' },
        { label: 'Elements', value: scan.numberOfElements || '-' },
      ], yPos);

      // C-Scan & A-Scan images
      if (scan.cScanImage) {
        try {
          yPos += 3;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...COLORS.secondary);
          doc.text('C-Scan:', PAGE.marginLeft, yPos);
          yPos += 3;
          doc.addImage(scan.cScanImage, 'PNG', PAGE.marginLeft, yPos, 85, 50);

          if (scan.aScanImage) {
            doc.text('A-Scan:', PAGE.marginLeft + 95, yPos - 3);
            doc.addImage(scan.aScanImage, 'PNG', PAGE.marginLeft + 95, yPos, 85, 50);
          }
          yPos += 55;
        } catch {
          doc.setTextColor(...COLORS.lightText);
          doc.text('[Image not available]', PAGE.marginLeft, yPos);
          yPos += 10;
        }
      }

      // Scan parameters
      if (scan.gain || scan.range || scan.velocity) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.lightText);
        const params = [];
        if (scan.gain) params.push(`Gain: ${scan.gain}`);
        if (scan.range) params.push(`Range: ${scan.range}`);
        if (scan.velocity) params.push(`Velocity: ${scan.velocity}`);
        doc.text(params.join(' | '), PAGE.marginLeft, yPos);
        yPos += 10;
      }

      addFooter(currentPage, totalPages);
    });
  }

  // ============================================================================
  // FINAL PAGE: REMARKS & SIGNATURES
  // ============================================================================

  doc.addPage();
  currentPage++;
  yPos = addHeader();

  // Remarks
  yPos = addSectionTitle('REMARKS', yPos);

  if (data.remarks && data.remarks.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);

    data.remarks.forEach((remark, index) => {
      if (remark.trim()) {
        const text = `${index + 1}. ${remark}`;
        const lines = doc.splitTextToSize(text, PAGE.contentWidth - 10);
        doc.text(lines, PAGE.marginLeft + 3, yPos);
        yPos += lines.length * 4 + 2;
      }
    });
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.lightText);
    doc.text('No additional remarks.', PAGE.marginLeft + 3, yPos);
    yPos += 6;
  }

  yPos += 8;

  // Results Summary
  if (data.resultsSummary) {
    yPos = addSectionTitle('RESULTS SUMMARY', yPos);

    const rs = data.resultsSummary;
    yPos = addFieldRow([
      { label: 'Parts Inspected', value: rs.partsInspected?.toString() || '-' },
      { label: 'Conforming', value: rs.partsConforming?.toString() || '-' },
      { label: 'Non-Conforming', value: rs.partsNonConforming?.toString() || '-' },
    ], yPos);

    if (rs.conformingSerialNumbers) {
      yPos = addField('Conforming S/N', rs.conformingSerialNumbers, PAGE.marginLeft, yPos, 35);
    }
    if (rs.nonConformingSerialNumbers) {
      yPos = addField('Non-Conforming S/N', rs.nonConformingSerialNumbers, PAGE.marginLeft, yPos, 35);
    }

    yPos += 8;
  }

  // Inspector Certification
  if (data.inspectorCertification) {
    yPos = addSectionTitle('INSPECTOR CERTIFICATION', yPos);

    const cert = data.inspectorCertification;
    yPos = addFieldRow([
      { label: 'Level', value: cert.certificationLevel || '-' },
      { label: 'Standard', value: cert.certificationStandard || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Certificate N°', value: cert.certificateNumber || '-' },
      { label: 'Expiry Date', value: cert.expiryDate || '-' },
    ], yPos);

    yPos += 8;
  }

  // Signatures
  yPos = addSectionTitle('APPROVAL SIGNATURES', yPos);

  // Create signature boxes
  const sigWidth = 55;
  const sigHeight = 28;
  const sigGap = 7;
  const signatures = data.signatures || {};

  // Draw signature boxes with professional styling
  const drawSignatureBox = (x: number, title: string, name?: string, date?: string) => {
    // Box background
    doc.setFillColor(...COLORS.sectionBg);
    doc.roundedRect(x, yPos, sigWidth, sigHeight, 2, 2, 'F');

    // Box border
    doc.setDrawColor(...COLORS.tableBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, sigWidth, sigHeight, 2, 2, 'S');

    // Title
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(title, x + 3, yPos + 5);

    // Divider line
    doc.setDrawColor(...COLORS.divider);
    doc.line(x + 3, yPos + 8, x + sigWidth - 3, yPos + 8);

    // Name
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(name || '________________________', x + 3, yPos + 15);

    // Date label and value
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.lightText);
    doc.text('Date:', x + 3, yPos + 22);
    doc.setTextColor(...COLORS.text);
    doc.text(date || '______________', x + 15, yPos + 22);
  };

  drawSignatureBox(PAGE.marginLeft, 'PREPARED BY', signatures.preparedBy?.name, signatures.preparedBy?.date);
  drawSignatureBox(PAGE.marginLeft + sigWidth + sigGap, 'APPROVED BY', signatures.approvedBy?.name, signatures.approvedBy?.date);
  drawSignatureBox(PAGE.marginLeft + (sigWidth + sigGap) * 2, 'WITNESS', signatures.witness?.name, signatures.witness?.date);

  addFooter(currentPage, totalPages);

  // ============================================================================
  // SAVE THE PDF
  // ============================================================================

  const fileName = `UT_INSPECTION_REPORT_${data.partNumber?.replace(/\//g, '-') || 'REPORT'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default exportInspectionReportPDF;
