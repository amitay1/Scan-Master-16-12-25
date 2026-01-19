/**
 * Professional Inspection Report PDF Exporter
 * Styled after TÜV SÜD / Metalscan inspection reports
 * Supports aerospace forging UT standards (AMS-STD-2154, ASTM E2375, ASTM A388)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionReportData } from '@/types/inspectionReport';

// Professional color scheme (TÜV-inspired)
const COLORS = {
  primary: { r: 0, g: 82, b: 147 },      // TÜV Blue
  secondary: { r: 70, g: 130, b: 180 },  // Steel Blue
  accent: { r: 220, g: 53, b: 69 },      // Red for reject
  success: { r: 40, g: 167, b: 69 },     // Green for accept
  dark: { r: 33, g: 37, b: 41 },         // Dark gray
  light: { r: 248, g: 249, b: 250 },     // Light gray
  border: { r: 206, g: 212, b: 218 },    // Border gray
};

// Page layout constants
const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 15,
  marginRight: 15,
  marginTop: 25,
  marginBottom: 20,
  contentWidth: 180,
};

interface ExportOptions {
  companyName?: string;
  companyLogo?: string;
  includeAerospaceSection?: boolean;
  language?: 'en' | 'it' | 'fr';
}

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
    language = 'en',
  } = options;

  let currentPage = 1;
  let yPos = PAGE.marginTop;

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const setColor = (color: { r: number; g: number; b: number }) => {
    doc.setTextColor(color.r, color.g, color.b);
  };

  const setDrawColor = (color: { r: number; g: number; b: number }) => {
    doc.setDrawColor(color.r, color.g, color.b);
  };

  const setFillColor = (color: { r: number; g: number; b: number }) => {
    doc.setFillColor(color.r, color.g, color.b);
  };

  const addHeader = (pageNum: number, totalPages: number) => {
    // Top border line
    setDrawColor(COLORS.primary);
    doc.setLineWidth(1);
    doc.line(PAGE.marginLeft, 8, PAGE.width - PAGE.marginRight, 8);

    // Company name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    doc.text(companyName, PAGE.marginLeft, 15);

    // Document title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.dark);
    doc.text('ULTRASONIC INSPECTION REPORT', 105, 15, { align: 'center' });

    // Document info (right side)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.dark);
    doc.text(`Doc. N°: ${data.documentNo || '-'}`, PAGE.width - PAGE.marginRight, 12, { align: 'right' });
    doc.text(`Rev: ${data.currentRevision || '0'}`, PAGE.width - PAGE.marginRight, 16, { align: 'right' });
    doc.text(`Page ${pageNum}/${totalPages}`, PAGE.width - PAGE.marginRight, 20, { align: 'right' });

    // Sub-header line
    doc.setLineWidth(0.3);
    setDrawColor(COLORS.border);
    doc.line(PAGE.marginLeft, 22, PAGE.width - PAGE.marginRight, 22);

    return 28; // Return Y position after header
  };

  const addFooter = () => {
    const footerY = PAGE.height - 12;

    doc.setLineWidth(0.3);
    setDrawColor(COLORS.border);
    doc.line(PAGE.marginLeft, footerY - 3, PAGE.width - PAGE.marginRight, footerY - 3);

    doc.setFontSize(7);
    setColor(COLORS.dark);
    doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE.marginLeft, footerY);
    doc.text('This document is confidential', 105, footerY, { align: 'center' });
    doc.text('SCAN-MASTER UT System', PAGE.width - PAGE.marginRight, footerY, { align: 'right' });
  };

  const addSectionTitle = (title: string, y: number): number => {
    setFillColor(COLORS.primary);
    doc.rect(PAGE.marginLeft, y, PAGE.contentWidth, 7, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor({ r: 255, g: 255, b: 255 });
    doc.text(title, PAGE.marginLeft + 3, y + 5);

    return y + 10;
  };

  const addSubSectionTitle = (title: string, y: number): number => {
    setFillColor(COLORS.light);
    doc.rect(PAGE.marginLeft, y, PAGE.contentWidth, 6, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    doc.text(title, PAGE.marginLeft + 2, y + 4.5);

    return y + 8;
  };

  const addField = (label: string, value: string, x: number, y: number, labelWidth: number = 45): number => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.dark);
    doc.text(label + ':', x, y);

    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', x + labelWidth, y);

    return y + 5;
  };

  const addFieldRow = (fields: Array<{ label: string; value: string; width?: number }>, y: number): number => {
    const fieldWidth = PAGE.contentWidth / fields.length;
    let maxY = y;

    fields.forEach((field, index) => {
      const x = PAGE.marginLeft + (index * fieldWidth);
      const newY = addField(field.label, field.value, x, y, field.width || 30);
      maxY = Math.max(maxY, newY);
    });

    return maxY;
  };

  const checkPageBreak = (requiredSpace: number): number => {
    if (yPos + requiredSpace > PAGE.height - PAGE.marginBottom) {
      doc.addPage();
      currentPage++;
      addFooter();
      return addHeader(currentPage, calculateTotalPages());
    }
    return yPos;
  };

  const calculateTotalPages = (): number => {
    let pages = 1; // Cover page
    pages += 1; // Equipment
    if (includeAerospaceSection) pages += 1; // Aerospace
    if (data.indications.length > 0) pages += 1; // Indications
    pages += Math.ceil(data.scans.length / 2); // Scans
    pages += 1; // Remarks & Signatures
    return Math.max(pages, 3);
  };

  // ============================================================
  // PAGE 1: COVER PAGE
  // ============================================================

  const totalPages = calculateTotalPages();
  yPos = addHeader(1, totalPages);

  // Document Information Section
  yPos = addSectionTitle('DOCUMENT INFORMATION / INFORMAZIONI DOCUMENTO', yPos);

  yPos = addFieldRow([
    { label: 'Document N°', value: data.documentNo },
    { label: 'Revision', value: data.currentRevision },
    { label: 'Date', value: data.revisionDate },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Batch N°', value: data.batchNumber || '-' },
    { label: 'Job N°', value: data.jobNumber || '-' },
    { label: 'Issue Date', value: data.issueDate },
  ], yPos);

  yPos += 3;

  // Customer Information Section
  yPos = addSectionTitle('CUSTOMER INFORMATION / CLIENTE', yPos);

  yPos = addFieldRow([
    { label: 'Customer', value: data.customerName },
    { label: 'PO Number', value: data.poNumber },
  ], yPos);

  yPos = addField('Address', data.customerAddress, PAGE.marginLeft, yPos, 20);

  yPos += 3;

  // Part Information Section
  yPos = addSectionTitle('PART INFORMATION / PEZZO', yPos);

  yPos = addFieldRow([
    { label: 'Description', value: data.itemDescription },
    { label: 'Part N°', value: data.partNumber },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Lot N°', value: data.lotNumber },
    { label: 'Drawing N°', value: data.drawingNumber },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Material Grade', value: data.materialGrade },
    { label: 'Cast/Heat N°', value: data.castNumber },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Heat Treatment', value: data.heatTreatmentCondition },
    { label: 'Thickness', value: data.thickness ? `${data.thickness} mm` : '-' },
  ], yPos);

  // Surface conditions
  const surfaceText = data.surfaceConditions?.join(', ') || '-';
  yPos = addFieldRow([
    { label: 'Surface Roughness', value: data.surfaceRoughness || '-' },
    { label: 'Surface Condition', value: surfaceText },
  ], yPos);

  yPos += 3;

  // Quantity Information Section
  yPos = addSectionTitle('QUANTITY / QUANTITÀ', yPos);

  yPos = addFieldRow([
    { label: 'Work Order', value: data.workOrderNumber },
    { label: 'Quantity', value: data.quantity },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Serial Numbers', value: data.individualNumbers || '-' },
  ], yPos);

  yPos += 3;

  // Testing Details Section
  yPos = addSectionTitle('TESTING DETAILS / DETTAGLI CONTROLLO', yPos);

  // Test types checkboxes
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.dark);
  doc.text('Test Methods:', PAGE.marginLeft, yPos);

  const testTypes = ['RT', 'MT', 'UT', 'PT', 'OT'];
  let xOffset = PAGE.marginLeft + 28;
  testTypes.forEach(type => {
    const isSelected = data.testTypes?.includes(type as any);
    doc.rect(xOffset, yPos - 3, 4, 4);
    if (isSelected) {
      doc.text('X', xOffset + 0.8, yPos);
    }
    doc.setFont('helvetica', 'normal');
    doc.text(type, xOffset + 6, yPos);
    xOffset += 18;
  });
  yPos += 6;

  yPos = addFieldRow([
    { label: 'Scan Type', value: data.typeOfScan },
    { label: 'Equipment', value: data.testingEquipment },
  ], yPos);

  yPos = addFieldRow([
    { label: 'TCG Applied', value: data.tcgApplied },
    { label: 'Test Standard', value: data.testStandard },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Test Extension', value: data.testExtension || '100%' },
    { label: 'Technique Sheet', value: data.technicalSheetRef || '-' },
  ], yPos);

  yPos += 3;

  // Observations & Results Section
  yPos = addSectionTitle('OBSERVATIONS & RESULTS / OSSERVAZIONI E RISULTATI', yPos);

  yPos = addField('Observations', data.observations || 'No recordable indications', PAGE.marginLeft, yPos, 25);

  // Results box with color coding
  const results = data.results || 'CONFORM';
  const isAccept = results.toLowerCase().includes('conform') || results.toLowerCase().includes('accept');

  setFillColor(isAccept ? COLORS.success : COLORS.accent);
  doc.rect(PAGE.marginLeft, yPos, 50, 8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor({ r: 255, g: 255, b: 255 });
  doc.text(results.toUpperCase(), PAGE.marginLeft + 25, yPos + 5.5, { align: 'center' });

  yPos += 12;

  addFooter();

  // ============================================================
  // PAGE 2: EQUIPMENT DETAILS
  // ============================================================

  doc.addPage();
  currentPage++;
  yPos = addHeader(currentPage, totalPages);

  yPos = addSectionTitle('EQUIPMENT DETAILS / APPARECCHIATURE', yPos);

  // Ultrasonic Generator
  yPos = addSubSectionTitle('Ultrasonic Generator / Générateur ultrasonore', yPos);

  const eq = data.equipmentDetails;
  yPos = addFieldRow([
    { label: 'Make', value: eq?.generatorMake || '-' },
    { label: 'Model', value: eq?.generatorModel || '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Serial N°', value: eq?.generatorSerial || '-' },
    { label: 'Cal. Date', value: eq?.generatorCalibrationDate || '-' },
  ], yPos);

  yPos += 2;

  // Immersion Transducer
  yPos = addSubSectionTitle('Immersion Transducer / Traducteur immersion', yPos);

  yPos = addFieldRow([
    { label: 'Model', value: eq?.immersionTransducerModel || '-' },
    { label: 'Serial N°', value: eq?.immersionTransducerSerial || '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Cal. Date', value: eq?.immersionTransducerCalibrationDate || '-' },
  ], yPos);

  yPos += 2;

  // Contact Transducer
  yPos = addSubSectionTitle('Contact Transducer / Traducteurs contact', yPos);

  yPos = addFieldRow([
    { label: 'Model', value: eq?.contactTransducerModel || '-' },
    { label: 'Serial N°', value: eq?.contactTransducerSerial || '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Cal. Date', value: eq?.contactTransducerCalibrationDate || '-' },
  ], yPos);

  yPos += 2;

  // Scan Parameters
  yPos = addSubSectionTitle('Scan Parameters / Paramètres', yPos);

  yPos = addFieldRow([
    { label: 'Frequency', value: eq?.frequency || '-' },
    { label: 'Probe Diameter', value: eq?.probeDiameter || '-' },
    { label: 'Water Path', value: eq?.waterPath || '-' },
  ], yPos);

  yPos += 2;

  // Software
  yPos = addSubSectionTitle('Software / Logiciel', yPos);

  yPos = addFieldRow([
    { label: 'Name', value: eq?.softwareName || '-' },
    { label: 'Version', value: eq?.softwareVersion || '-' },
    { label: 'Config', value: eq?.utConfigName || '-' },
  ], yPos);

  yPos += 2;

  // Calibration Block
  yPos = addSubSectionTitle('Calibration Block / Bloc de référence (ASTM E127)', yPos);

  yPos = addFieldRow([
    { label: 'Block Serial', value: eq?.calibrationBlockSerial || '-' },
    { label: 'Material', value: eq?.calibrationBlockMaterial || '-' },
  ], yPos);

  yPos = addFieldRow([
    { label: 'Thickness', value: eq?.calibrationBlockThickness || '-' },
    { label: 'Valid Until', value: eq?.calibrationValidUntil || '-' },
  ], yPos);

  // NIST Traceability checkbox
  doc.rect(PAGE.marginLeft, yPos - 3, 4, 4);
  if (eq?.nistTraceability) {
    doc.text('X', PAGE.marginLeft + 0.8, yPos);
  }
  doc.setFont('helvetica', 'normal');
  doc.text('NIST Traceable', PAGE.marginLeft + 6, yPos);
  yPos += 6;

  // Probe Details Table (if available)
  if (data.probeDetails && data.probeDetails.length > 0) {
    yPos = checkPageBreak(40);
    yPos = addSectionTitle('PROBE DETAILS / DETTAGLI SONDE', yPos);

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
        fillColor: [COLORS.primary.r, COLORS.primary.g, COLORS.primary.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  addFooter();

  // ============================================================
  // PAGE 3: AEROSPACE FORGING PARAMETERS (Optional)
  // ============================================================

  if (includeAerospaceSection) {
    doc.addPage();
    currentPage++;
    yPos = addHeader(currentPage, totalPages);

    yPos = addSectionTitle('AEROSPACE FORGING UT PARAMETERS (AMS-STD-2154 / ASTM E2375)', yPos);

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

    yPos += 2;

    // Environmental Conditions
    const env = data.environmentalConditions;
    yPos = addSubSectionTitle('Environmental Conditions', yPos);

    yPos = addFieldRow([
      { label: 'Ambient Temp', value: env?.ambientTemperature || '-' },
      { label: 'Part Temp', value: env?.partTemperature || '-' },
      { label: 'Humidity', value: env?.humidity || '-' },
      { label: 'Lighting', value: env?.lightingConditions || '-' },
    ], yPos);

    yPos += 2;

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

    yPos += 2;

    // Forging Information
    const forg = data.forgingDetails;
    yPos = addSubSectionTitle('Forging Information', yPos);

    yPos = addFieldRow([
      { label: 'Type', value: forg?.forgingType || '-' },
      { label: 'Grain Flow', value: forg?.grainFlowDirection || '-' },
      { label: 'Ratio', value: forg?.forgingRatio || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Min Thickness', value: forg?.minimumThicknessAfterMachining || '-' },
    ], yPos);

    // Inspection directions checkboxes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Directions:', PAGE.marginLeft, yPos);

    const directions = [
      { label: 'Axial', checked: forg?.axialInspection },
      { label: 'Radial', checked: forg?.radialInspection },
      { label: 'Circumferential', checked: forg?.circumferentialInspection },
      { label: 'Angle Beam', checked: forg?.angleBeamApplied },
    ];

    let dirX = PAGE.marginLeft + 40;
    directions.forEach(dir => {
      doc.rect(dirX, yPos - 3, 4, 4);
      if (dir.checked) doc.text('X', dirX + 0.8, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dir.label, dirX + 6, yPos);
      dirX += 30;
    });

    if (forg?.angleBeamApplied && forg?.angleBeamAngle) {
      doc.text(`(${forg.angleBeamAngle})`, dirX, yPos);
    }
    yPos += 6;

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

    // DAC/TCG checkboxes
    let checkX = PAGE.marginLeft;
    doc.rect(checkX, yPos - 3, 4, 4);
    if (sens?.dacApplied) doc.text('X', checkX + 0.8, yPos);
    doc.text('DAC Applied', checkX + 6, yPos);

    checkX += 35;
    doc.rect(checkX, yPos - 3, 4, 4);
    if (sens?.tcgApplied) doc.text('X', checkX + 0.8, yPos);
    doc.text('TCG Applied', checkX + 6, yPos);
    yPos += 6;

    // Transfer Correction
    const trans = data.transferCorrection;
    yPos = addSubSectionTitle('Transfer Correction (Critical for Forgings)', yPos);

    yPos = addFieldRow([
      { label: 'Cal Block BWE', value: trans?.calibrationBlockBwe || '-' },
      { label: 'Part BWE', value: trans?.partBweAtSameThickness || '-' },
      { label: 'Correction', value: trans?.transferCorrectionValue || '-' },
    ], yPos);

    doc.rect(PAGE.marginLeft, yPos - 3, 4, 4);
    if (trans?.correctionApplied) doc.text('X', PAGE.marginLeft + 0.8, yPos);
    doc.text('Correction Applied', PAGE.marginLeft + 6, yPos);
    yPos += 6;

    // BWE Monitoring
    const bwe = data.bweMonitoring;
    yPos = addSubSectionTitle('Back Wall Echo Monitoring (ASTM A388)', yPos);

    doc.rect(PAGE.marginLeft, yPos - 3, 4, 4);
    if (bwe?.bweMonitoringActive) doc.text('X', PAGE.marginLeft + 0.8, yPos);
    doc.text('BWE Monitoring Active', PAGE.marginLeft + 6, yPos);
    yPos += 5;

    yPos = addFieldRow([
      { label: 'Threshold', value: bwe?.bweAttenuationThreshold || '-' },
      { label: 'Loss Recorded', value: bwe?.bweLossRecorded || '-' },
      { label: 'Gate Start', value: bwe?.bweGateStart || '-' },
      { label: 'Gate End', value: bwe?.bweGateEnd || '-' },
    ], yPos);

    // Scan Coverage
    const cov = data.scanCoverage;
    yPos = addSubSectionTitle('Scan Index & Coverage (ASME V / ASTM E2375)', yPos);

    yPos = addFieldRow([
      { label: 'Index', value: cov?.scanIndex || '-' },
      { label: 'Overlap', value: cov?.overlapPercentage || '-' },
      { label: 'Beam Spot', value: cov?.beamSpotSize || '-' },
      { label: 'Coverage', value: cov?.coveragePercentage || '-' },
    ], yPos);

    doc.rect(PAGE.marginLeft, yPos - 3, 4, 4);
    if (cov?.consecutivePassDetection) doc.text('X', PAGE.marginLeft + 0.8, yPos);
    doc.text('3 Consecutive Pass Detection', PAGE.marginLeft + 6, yPos);
    yPos += 6;

    // Zoning Requirements
    const zone = data.zoningRequirements;
    yPos = addSubSectionTitle('Zoning Requirements (Parts > 18" / 457mm)', yPos);

    doc.rect(PAGE.marginLeft, yPos - 3, 4, 4);
    if (zone?.zoningRequired) doc.text('X', PAGE.marginLeft + 0.8, yPos);
    doc.text('Zoning Required', PAGE.marginLeft + 6, yPos);

    yPos = addFieldRow([
      { label: 'Zones', value: zone?.numberOfZones?.toString() || '-' },
      { label: 'Dead Zone', value: zone?.deadZone || '-' },
    ], yPos + 3);

    addFooter();
  }

  // ============================================================
  // INDICATIONS PAGE (if any)
  // ============================================================

  if (data.indications && data.indications.length > 0) {
    doc.addPage();
    currentPage++;
    yPos = addHeader(currentPage, totalPages);

    yPos = addSectionTitle('INDICATIONS DETECTED / INDICAZIONI RILEVATE', yPos);

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
        fillColor: [COLORS.primary.r, COLORS.primary.g, COLORS.primary.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 12 },
        2: { cellWidth: 14 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        6: { cellWidth: 14 },
        7: { cellWidth: 14 },
        8: { cellWidth: 16 },
        9: { cellWidth: 14 },
        10: { cellWidth: 14 },
        11: { cellWidth: 18 },
      },
      margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
      didParseCell: (data) => {
        // Color code the Result column
        if (data.column.index === 11 && data.section === 'body') {
          const value = data.cell.raw?.toString().toLowerCase() || '';
          if (value.includes('accept')) {
            data.cell.styles.textColor = [COLORS.success.r, COLORS.success.g, COLORS.success.b];
            data.cell.styles.fontStyle = 'bold';
          } else if (value.includes('reject')) {
            data.cell.styles.textColor = [COLORS.accent.r, COLORS.accent.g, COLORS.accent.b];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Legend
    doc.setFontSize(7);
    setColor(COLORS.dark);
    doc.text('Legend: X/Y Dist = Distance from reference | X/Y Ext = Indication size | Amp = Signal strength (% FSH)', PAGE.marginLeft, yPos);
    yPos += 4;
    doc.text('FBH = Flat Bottom Hole equivalent | vs Ref = dB relative to reference | Zone = Depth zone (Near/Mid/Far)', PAGE.marginLeft, yPos);

    addFooter();
  }

  // ============================================================
  // SCANS PAGES
  // ============================================================

  if (data.scans && data.scans.length > 0) {
    data.scans.forEach((scan, index) => {
      if (index % 2 === 0) {
        doc.addPage();
        currentPage++;
        yPos = addHeader(currentPage, totalPages);
        yPos = addSectionTitle(`SCAN DATA / DATI SCANSIONE`, yPos);
      }

      // Scan card
      yPos = checkPageBreak(80);

      setFillColor(COLORS.light);
      doc.rect(PAGE.marginLeft, yPos, PAGE.contentWidth, 6, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.primary);
      doc.text(`Scan ${scan.scanNumber}`, PAGE.marginLeft + 2, yPos + 4.5);
      yPos += 8;

      yPos = addFieldRow([
        { label: 'Type', value: scan.scanType || '-' },
        { label: 'Length', value: scan.scanLength || '-' },
        { label: 'Index', value: scan.indexLength || '-' },
      ], yPos);

      yPos = addFieldRow([
        { label: 'Probe', value: scan.probeType || '-' },
        { label: 'Elements', value: scan.numberOfElements || '-' },
      ], yPos);

      // C-Scan image
      if (scan.cScanImage) {
        try {
          yPos += 2;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('C-Scan:', PAGE.marginLeft, yPos);
          yPos += 2;
          doc.addImage(scan.cScanImage, 'PNG', PAGE.marginLeft, yPos, 85, 50);

          // A-Scan next to it if available
          if (scan.aScanImage) {
            doc.text('A-Scan:', PAGE.marginLeft + 95, yPos - 2);
            doc.addImage(scan.aScanImage, 'PNG', PAGE.marginLeft + 95, yPos, 85, 50);
          }
          yPos += 55;
        } catch (e) {
          doc.text('[Image not available]', PAGE.marginLeft, yPos);
          yPos += 10;
        }
      }

      // Parameters
      if (scan.gain || scan.range || scan.velocity) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const params = [];
        if (scan.gain) params.push(`Gain: ${scan.gain}`);
        if (scan.range) params.push(`Range: ${scan.range}`);
        if (scan.velocity) params.push(`Velocity: ${scan.velocity}`);
        doc.text(params.join(' | '), PAGE.marginLeft, yPos);
        yPos += 8;
      }

      addFooter();
    });
  }

  // ============================================================
  // FINAL PAGE: REMARKS & SIGNATURES
  // ============================================================

  doc.addPage();
  currentPage++;
  yPos = addHeader(currentPage, totalPages);

  // Remarks
  yPos = addSectionTitle('REMARKS / OSSERVAZIONI', yPos);

  if (data.remarks && data.remarks.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.dark);

    data.remarks.forEach((remark, index) => {
      if (remark.trim()) {
        const text = `${index + 1}. ${remark}`;
        const lines = doc.splitTextToSize(text, PAGE.contentWidth);
        doc.text(lines, PAGE.marginLeft, yPos);
        yPos += lines.length * 4 + 2;
      }
    });
  } else {
    doc.setFontSize(8);
    doc.text('No remarks.', PAGE.marginLeft, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Results Summary
  if (data.resultsSummary) {
    yPos = addSectionTitle('RESULTS SUMMARY / RIEPILOGO RISULTATI', yPos);

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

    yPos += 5;
  }

  // Inspector Certification
  if (data.inspectorCertification) {
    yPos = addSectionTitle('INSPECTOR CERTIFICATION / CERTIFICAZIONE OPERATORE', yPos);

    const cert = data.inspectorCertification;
    yPos = addFieldRow([
      { label: 'Level', value: cert.certificationLevel || '-' },
      { label: 'Standard', value: cert.certificationStandard || '-' },
    ], yPos);

    yPos = addFieldRow([
      { label: 'Certificate N°', value: cert.certificateNumber || '-' },
      { label: 'Expiry Date', value: cert.expiryDate || '-' },
    ], yPos);

    yPos += 5;
  }

  // Signatures
  yPos = addSectionTitle('SIGNATURES / FIRME', yPos);

  // Create signature boxes
  const sigWidth = 55;
  const sigHeight = 25;
  const sigGap = 7;
  const signatures = data.signatures || {};

  // Prepared By
  setDrawColor(COLORS.border);
  doc.rect(PAGE.marginLeft, yPos, sigWidth, sigHeight);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.dark);
  doc.text('PREPARED BY:', PAGE.marginLeft + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(signatures.preparedBy?.name || '________________', PAGE.marginLeft + 2, yPos + 12);
  doc.text(`Date: ${signatures.preparedBy?.date || '___________'}`, PAGE.marginLeft + 2, yPos + 18);

  // Approved By
  doc.rect(PAGE.marginLeft + sigWidth + sigGap, yPos, sigWidth, sigHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED BY:', PAGE.marginLeft + sigWidth + sigGap + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(signatures.approvedBy?.name || '________________', PAGE.marginLeft + sigWidth + sigGap + 2, yPos + 12);
  doc.text(`Date: ${signatures.approvedBy?.date || '___________'}`, PAGE.marginLeft + sigWidth + sigGap + 2, yPos + 18);

  // Witness
  doc.rect(PAGE.marginLeft + (sigWidth + sigGap) * 2, yPos, sigWidth, sigHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('WITNESS:', PAGE.marginLeft + (sigWidth + sigGap) * 2 + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(signatures.witness?.name || '________________', PAGE.marginLeft + (sigWidth + sigGap) * 2 + 2, yPos + 12);
  doc.text(`Date: ${signatures.witness?.date || '___________'}`, PAGE.marginLeft + (sigWidth + sigGap) * 2 + 2, yPos + 18);

  addFooter();

  // ============================================================
  // SAVE THE PDF
  // ============================================================

  const fileName = `UT_INSPECTION_REPORT_${data.partNumber?.replace(/\//g, '-') || 'REPORT'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default exportInspectionReportPDF;
