import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalibrationBlockType } from '@/types/techniqueSheet';

interface CalibrationBlockData {
  blockType: CalibrationBlockType;
  figure: string;
  standard: string;
  material: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    radius?: number;
    wallThickness?: number;
  };
  fbhData?: {
    diameter: number;
    depth: number;
    position: string;
    quantity: number;
  }[];
  notchData?: {
    depth: number;
    width: number;
    length: number;
    position: string;
  }[];
  drillingData?: {
    idNum: string;
    blockLength: number;
    fbhDiameter: number;
    depth: number;
    tolerance: string;
    note: string;
  }[];
}

export function generateCalibrationBlockPDF(
  blockData: CalibrationBlockData,
  techniqueSheetId?: string
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Header with document info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Top-right header box
  doc.rect(pageWidth - 70, 10, 60, 30);
  doc.text('Document:', pageWidth - 68, 15);
  doc.text(techniqueSheetId || 'CAL-001', pageWidth - 68, 20);
  doc.setFontSize(8);
  doc.text('Type:', pageWidth - 68, 25);
  doc.text('CALIBRATION BLOCK', pageWidth - 68, 29);
  doc.text(`Figure: ${blockData.figure}`, pageWidth - 68, 33);
  doc.text('Rev: 01', pageWidth - 68, 37);

  // Title
  currentY = 50;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = `Calibration Block - ${blockData.blockType}`;
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });

  currentY += 10;
  doc.setFontSize(12);
  doc.text(blockData.figure, pageWidth / 2, currentY, { align: 'center' });

  currentY += 15;

  // Block specifications table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Block Specifications', margin, currentY);
  currentY += 5;

  const specsData = [
    ['Standard Reference', blockData.standard],
    ['Material', blockData.material],
    ['Block Type', blockData.blockType],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter', 'Value']],
    body: specsData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Dimensions table
  doc.setFont('helvetica', 'bold');
  doc.text('Dimensions (mm)', margin, currentY);
  currentY += 5;

  const dimensionsData: string[][] = [];
  
  if (blockData.dimensions.length) {
    dimensionsData.push(['Length (L)', blockData.dimensions.length.toString()]);
  }
  if (blockData.dimensions.width) {
    dimensionsData.push(['Width (W)', blockData.dimensions.width.toString()]);
  }
  if (blockData.dimensions.height) {
    dimensionsData.push(['Height (H)', blockData.dimensions.height.toString()]);
  }
  if (blockData.dimensions.radius) {
    dimensionsData.push(['Radius (R)', blockData.dimensions.radius.toString()]);
  }
  if (blockData.dimensions.wallThickness) {
    dimensionsData.push(['Wall Thickness (t)', blockData.dimensions.wallThickness.toString()]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Dimension', 'Value (mm)']],
    body: dimensionsData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // FBH Data table (if applicable)
  if (blockData.fbhData && blockData.fbhData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Flat-Bottom Hole (FBH) Specifications', margin, currentY);
    currentY += 5;

    const fbhTableData = blockData.fbhData.map((fbh, index) => [
      (index + 1).toString(),
      fbh.diameter.toFixed(2),
      fbh.depth.toFixed(1),
      fbh.position,
      fbh.quantity.toString(),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Diameter (mm)', 'Depth (mm)', 'Position', 'Qty']],
      body: fbhTableData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - 2 * margin,
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notch Data table (if applicable)
  if (blockData.notchData && blockData.notchData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notch Specifications', margin, currentY);
    currentY += 5;

    const notchTableData = blockData.notchData.map((notch, index) => [
      (index + 1).toString(),
      notch.depth.toFixed(1),
      notch.width.toFixed(1),
      notch.length.toFixed(1),
      notch.position,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Depth (mm)', 'Width (mm)', 'Length (mm)', 'Position']],
      body: notchTableData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - 2 * margin,
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Drilling Data table (detailed specifications)
  if (blockData.drillingData && blockData.drillingData.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Drilling Data', margin, currentY);
    currentY += 5;

    const drillingTableData = blockData.drillingData.map((drill) => [
      drill.idNum,
      drill.blockLength.toFixed(1),
      drill.fbhDiameter.toFixed(2),
      drill.depth.toFixed(1),
      drill.tolerance,
      drill.note,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID Number', 'Block Length\n(mm)', 'FBH Ø\n(mm)', 'Depth\n(mm)', 'Tolerance', 'Note']],
      body: drillingTableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add technical drawing placeholder
  if (currentY > pageHeight - 100) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Technical Drawing', margin, currentY);
  currentY += 5;

  // Drawing area
  const drawingHeight = 80;
  const drawingWidth = pageWidth - 2 * margin;
  doc.rect(margin, currentY, drawingWidth, drawingHeight);
  
  // Add drawing based on block type
  drawCalibrationBlock(doc, blockData, margin, currentY, drawingWidth, drawingHeight);

  currentY += drawingHeight + 10;

  // Notes section
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Notes:', margin, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const notes = [
    '• All dimensions are in millimeters unless otherwise specified',
    '• Tolerance: ±0.1mm unless otherwise specified',
    '• Surface finish: Ra ≤ 6.3μm',
    '• Material certification required',
    '• FBH depths measured from calibration surface',
    '• Block must be properly identified with marking',
  ];

  notes.forEach((note) => {
    doc.text(note, margin + 2, currentY);
    currentY += 5;
  });

  // Footer
  const footer = 'This document contains proprietary information. Do not reproduce without authorization.';
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `Calibration_Block_${blockData.blockType.replace(/\s+/g, '_')}_${blockData.figure}.pdf`;
  doc.save(fileName);
}

function drawCalibrationBlock(
  doc: jsPDF,
  blockData: CalibrationBlockData,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  switch (blockData.blockType) {
    case 'flat_block':
      drawFlatBlock(doc, centerX, centerY, blockData);
      break;
    case 'curved_block':
      drawCurvedBlock(doc, centerX, centerY, blockData);
      break;
    case 'cylinder_fbh':
      drawHollowCylindricalFBH(doc, centerX, centerY, blockData);
      break;
    case 'angle_beam':
      drawAngleBeamBlock(doc, centerX, centerY, blockData);
      break;
    case 'cylinder_notched':
      drawHollowCylindricalNotched(doc, centerX, centerY, blockData);
      break;
    case 'iiw_block':
      drawIIVBlock(doc, centerX, centerY, blockData);
      break;
  }

  // Add dimension arrows and labels
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
}

function drawFlatBlock(doc: jsPDF, centerX: number, centerY: number, blockData: CalibrationBlockData) {
  const blockWidth = 60;
  const blockHeight = 30;
  
  // Main block rectangle
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
  
  // FBH positions
  if (blockData.fbhData) {
    blockData.fbhData.forEach((fbh, index) => {
      const fbhX = centerX - blockWidth / 3 + (index * 20);
      doc.circle(fbhX, centerY, 2, 'S');
      doc.setFontSize(6);
      doc.text(`Ø${fbh.diameter}`, fbhX, centerY - 5, { align: 'center' });
    });
  }
  
  // Dimension lines
  doc.setDrawColor(150);
  doc.line(centerX - blockWidth / 2 - 5, centerY - blockHeight / 2, centerX - blockWidth / 2 - 5, centerY + blockHeight / 2);
  doc.setDrawColor(0);
  doc.setFontSize(8);
  doc.text(`H=${blockData.dimensions.height}`, centerX - blockWidth / 2 - 15, centerY, { angle: 90 });
}

function drawCurvedBlock(doc: jsPDF, centerX: number, centerY: number, blockData: CalibrationBlockData) {
  const blockWidth = 60;
  const blockHeight = 30;
  const radius = blockData.dimensions.radius || 50;
  
  // Curved surface
  doc.ellipse(centerX, centerY, blockWidth / 2, blockHeight / 2, 'S');
  
  // Center line
  doc.setDrawColor(150);
  doc.line(centerX, centerY - blockHeight / 2 - 5, centerX, centerY + blockHeight / 2 + 5);
  doc.setDrawColor(0);
  
  // Radius annotation
  doc.setFontSize(8);
  doc.text(`R=${radius}`, centerX + 5, centerY - blockHeight / 2 - 10);
}

function drawHollowCylindricalFBH(doc: jsPDF, centerX: number, centerY: number, blockData: CalibrationBlockData) {
  const outerRadius = 25;
  const innerRadius = blockData.dimensions.wallThickness ? outerRadius - blockData.dimensions.wallThickness : 18;
  
  // Outer circle
  doc.circle(centerX, centerY, outerRadius, 'S');
  
  // Inner circle (hollow)
  doc.circle(centerX, centerY, innerRadius, 'S');
  
  // FBH positions
  if (blockData.fbhData) {
    blockData.fbhData.forEach((fbh, index) => {
      const angle = (index * 60) * (Math.PI / 180);
      const fbhX = centerX + (outerRadius + innerRadius) / 2 * Math.cos(angle);
      const fbhY = centerY + (outerRadius + innerRadius) / 2 * Math.sin(angle);
      doc.circle(fbhX, fbhY, 1.5, 'F');
    });
  }
  
  // Wall thickness dimension
  doc.setDrawColor(150);
  doc.line(centerX, centerY, centerX + outerRadius, centerY);
  doc.line(centerX, centerY, centerX + innerRadius, centerY + 5);
  doc.setDrawColor(0);
  doc.setFontSize(7);
  doc.text(`t=${blockData.dimensions.wallThickness || 7}`, centerX + outerRadius / 2, centerY - 3);
}

function drawAngleBeamBlock(doc: jsPDF, centerX: number, centerY: number, blockData: CalibrationBlockData) {
  const blockWidth = 70;
  const blockHeight = 25;
  
  // Main block
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
  
  // Side-drilled holes (SDH)
  const holeY = centerY;
  doc.circle(centerX - 20, holeY, 2, 'S');
  doc.circle(centerX, holeY, 2, 'S');
  doc.circle(centerX + 20, holeY, 2, 'S');
  
  // Beam angle indicator
  doc.setDrawColor(150);
  doc.line(centerX - blockWidth / 2 - 10, centerY + blockHeight / 2, centerX, centerY - 5);
  doc.setDrawColor(0);
  doc.setFontSize(7);
  doc.text('45° / 60° / 70°', centerX - blockWidth / 2 - 15, centerY + blockHeight / 2 + 5);
}

function drawHollowCylindricalNotched(doc: jsPDF, centerX: number, centerY: number, blockData: CalibrationBlockData) {
  const outerRadius = 25;
  const innerRadius = 18;
  
  // Outer and inner circles
  doc.circle(centerX, centerY, outerRadius, 'S');
  doc.circle(centerX, centerY, innerRadius, 'S');
  
  // Notches
  if (blockData.notchData) {
    blockData.notchData.forEach((notch, index) => {
      const angle = (index * 90) * (Math.PI / 180);
      const notchX = centerX + outerRadius * Math.cos(angle);
      const notchY = centerY + outerRadius * Math.sin(angle);
      
      // Draw notch as small rectangle
      doc.rect(notchX - 2, notchY - 1, 4, 2, 'F');
    });
  }
  
  doc.setFontSize(7);
  doc.text('Notches', centerX, centerY + outerRadius + 8, { align: 'center' });
}

function drawIIVBlock(doc: jsPDF, centerX: number, centerY: number, blockData: CalibrationBlockData) {
  const blockWidth = 65;
  const blockHeight = 28;
  
  // Main block with steps
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
  
  // Step
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, 20, blockHeight / 2);
  
  // Radius section
  const radiusX = centerX + blockWidth / 4;
  doc.ellipse(radiusX, centerY, 15, blockHeight / 2, 'S');
  
  // Annotations
  doc.setFontSize(7);
  doc.text('IIW Type 1', centerX, centerY - blockHeight / 2 - 5, { align: 'center' });
  doc.text('100mm', centerX, centerY + blockHeight / 2 + 5, { align: 'center' });
}
