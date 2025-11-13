import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionReportData } from '@/types/inspectionReport';

export const exportInspectionReportToPDF = (
  data: InspectionReportData,
  partNumber: string,
  drawingReference: string,
  inspectionDate: string,
  inspectorName: string,
  procedureNumber: string,
  acceptanceCriteriaText: string
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentPage = 1;
  const totalPages = 19;

  // Helper function to add header
  const addHeader = (pageNum: number) => {
    doc.setFontSize(10);
    doc.text('CHW', 14, 10);
    doc.text('CHW Forge Private Limited', 50, 10);
    doc.text(`Doc. No. : ${data.documentNo}`, 140, 10);
    
    if (pageNum === 1) {
      doc.text('Ultrasonic Examination Report', 14, 15);
    } else {
      doc.text('Ultrasonic Examination Report', 14, 15);
    }
    
    doc.text(`Current Rev. : ${data.currentRevision}`, 140, 15);
    doc.text(`Date of Rev. : ${data.revisionDate}`, 140, 20);
    doc.text(`(Part No. ${partNumber})`, 14, 20);
    doc.text(`No. of Pages : Page ${pageNum} of ${totalPages}`, 140, 25);
    
    doc.line(14, 27, 196, 27);
  };

  // PAGE 1: Cover Page
  addHeader(1);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ultrasonic Inspection Report', 14, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 45;
  const leftCol = 14;
  const rightCol = 110;
  
  // Left column
  doc.text(`Document No.: ${data.documentNo}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Test Date: ${inspectionDate}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Customer Name: ${data.customerName}`, leftCol, yPos);
  yPos += 6;
  doc.text(`PO No: ${data.poNumber}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Item Description: ${data.itemDescription}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Part No.: ${partNumber}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Material Grade: ${data.materialGrade}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Drawing No.: ${drawingReference}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Work Order No.: ${data.workOrderNumber}`, leftCol, yPos);
  yPos += 6;
  doc.text(`PO Sr. No.: ${data.poSerialNumber}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Quantity: ${data.quantity}`, leftCol, yPos);
  
  // Sample details table
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Sample details:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  autoTable(doc, {
    startY: yPos + 2,
    head: [['PO Sl No.', 'Serial No', 'Qty.']],
    body: [[data.samplePoSlNo, data.sampleSerialNo, data.sampleQuantity]],
    theme: 'grid',
    styles: { fontSize: 9 },
    margin: { left: leftCol },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 8;
  
  doc.text(`Thickness: ${data.thickness}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Type of scan: ${data.typeOfScan}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Testing equipment: ${data.testingEquipment}`, leftCol, yPos);
  yPos += 6;
  doc.text(`TCG applied: ${data.tcgApplied}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Technique Sheet No.: ${procedureNumber}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Test Standard: ${data.testStandard}`, leftCol, yPos);
  yPos += 6;
  doc.text(`Acceptance Criteria: ${acceptanceCriteriaText}`, leftCol, yPos);
  
  // Observations
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Observations:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  autoTable(doc, {
    startY: yPos + 2,
    body: [
      [data.observations, data.results],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    margin: { left: leftCol },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.text('Remarks:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  autoTable(doc, {
    startY: yPos + 2,
    head: [['Tested By', 'Approved By']],
    body: [[inspectorName, data.approvedBy]],
    theme: 'grid',
    styles: { fontSize: 9 },
    margin: { left: leftCol },
  });

  // PAGE 2: Part Diagram
  doc.addPage();
  currentPage++;
  addHeader(2);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Part Diagram', 14, 35);
  doc.setFont('helvetica', 'normal');
  
  if (data.partDiagramImage) {
    try {
      doc.addImage(data.partDiagramImage, 'PNG', 14, 40, 180, 120);
    } catch (error) {
      doc.setFontSize(10);
      doc.text('[Part Diagram Image]', 14, 45);
    }
  } else {
    doc.setFontSize(10);
    doc.text('[No part diagram provided]', 14, 45);
  }

  // PAGE 3: Probe Details
  doc.addPage();
  currentPage++;
  addHeader(3);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Search Unit Details', 14, 35);
  doc.setFont('helvetica', 'normal');
  
  const probeTableBody = data.probeDetails.map(probe => [
    probe.probeDescription,
    probe.frequency,
    probe.make,
    probe.waveMode,
    probe.scanningDirections,
    probe.pageNumber.toString(),
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [['Probe Details (Crystal Size, Type, Angle, Probe Sl. No)', 'Frequency', 'Make', 'Wave Mode', 'Scanning Directions', 'Page no.']],
    body: probeTableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 15 },
    },
    margin: { left: 14, right: 14 },
  });

  // PAGES 4-18: Scan Pages (up to 15 scans)
  data.scans.slice(0, 15).forEach((scan, index) => {
    doc.addPage();
    currentPage++;
    addHeader(currentPage);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Scan ${scan.scanNumber}`, 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Scan details table
    const scanDetails = [
      ['Scan type', scan.scanType],
      ['Scan length', scan.scanLength],
      ['Index length', scan.indexLength],
      ['Probe', scan.probeType],
      ['No of Element', scan.numberOfElements],
    ];
    
    autoTable(doc, {
      startY: 40,
      body: scanDetails,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 60 },
      },
      margin: { left: 14 },
    });
    
    let imageYPos = (doc as any).lastAutoTable.finalY + 5;
    
    // C-Scan Image
    if (scan.cScanImage) {
      try {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('C-Scan Image:', 14, imageYPos);
        imageYPos += 3;
        doc.addImage(scan.cScanImage, 'PNG', 14, imageYPos, 180, 80);
        imageYPos += 85;
      } catch (error) {
        doc.text('[C-Scan Image]', 14, imageYPos);
        imageYPos += 10;
      }
    }
    
    // A-Scan Waveform
    if (scan.aScanImage) {
      try {
        if (imageYPos > 200) {
          doc.addPage();
          currentPage++;
          addHeader(currentPage);
          imageYPos = 35;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('A-Scan Waveform:', 14, imageYPos);
        imageYPos += 3;
        doc.addImage(scan.aScanImage, 'PNG', 14, imageYPos, 180, 60);
      } catch (error) {
        doc.text('[A-Scan Waveform]', 14, imageYPos);
      }
    }
    
    // Parameters (if provided)
    if (scan.gain || scan.range) {
      let paramsYPos = imageYPos + 65;
      if (paramsYPos > 260) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        paramsYPos = 35;
      }
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let paramText = '';
      if (scan.gain) paramText += `Gain: ${scan.gain}  `;
      if (scan.range) paramText += `Range: ${scan.range}  `;
      if (scan.velocity) paramText += `Velocity: ${scan.velocity}`;
      
      doc.text(paramText, 14, paramsYPos);
    }
  });

  // PAGE 19: Remarks
  doc.addPage();
  currentPage = 19;
  addHeader(19);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Remarks:', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  let remarkYPos = 45;
  data.remarks.forEach((remark, index) => {
    if (remark.trim()) {
      const remarkText = `${index + 1}. ${remark}`;
      const lines = doc.splitTextToSize(remarkText, 180);
      doc.text(lines, 14, remarkYPos);
      remarkYPos += lines.length * 6 + 3;
      
      if (remarkYPos > 270) {
        doc.addPage();
        addHeader(19);
        remarkYPos = 35;
      }
    }
  });

  // Save the PDF
  const fileName = `UT_REPORT_${partNumber.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
