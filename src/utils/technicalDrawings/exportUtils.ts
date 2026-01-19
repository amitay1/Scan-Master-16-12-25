/**
 * Export utilities for technical drawings
 * Supports SVG, DXF (AutoCAD), and PDF formats
 */

import { jsPDF } from 'jspdf';
import dxfWriter from 'dxf-writer';
import { TechnicalDrawingGenerator } from './TechnicalDrawingGenerator';

/**
 * Export drawing to SVG format
 */
export function exportToSVG(generator: TechnicalDrawingGenerator): string {
  return generator.exportToSVG();
}

/**
 * Export drawing to DXF format (AutoCAD compatible)
 */
export function exportToDXF(
  partType: string,
  dimensions: {
    length: number;
    width: number;
    thickness: number;
    diameter?: number;
  }
): string {
  const Drawing = dxfWriter;
  const drawing = new Drawing();
  
  // Set units to millimeters
  drawing.setUnits('Millimeters');
  
  // Add layers
  drawing.addLayer('DIMENSIONS', 8, 'CONTINUOUS'); // Gray for dimensions
  drawing.addLayer('HIDDEN', 8, 'DASHED'); // Gray for hidden lines
  drawing.addLayer('CENTER', 8, 'DASHDOT'); // Gray for center lines
  drawing.addLayer('OUTLINE', 7, 'CONTINUOUS'); // Black/White for outlines
  
  drawing.setActiveLayer('OUTLINE');
  
  // Draw based on part type
  switch(partType) {
    // BOX FAMILY - Solid rectangular shapes
    case 'box':
    case 'sheet':
    case 'slab':
    case 'flat_bar':
    case 'square_bar':
    case 'billet':
    case 'block':
    case 'rectangular_forging_stock':
    case 'machined_component':
    case 'custom':
    case 'plate':
    case 'bar':
    case 'rectangular_bar':
      drawBoxDXF(drawing, dimensions);
      break;

    // RECTANGULAR TUBE - Hollow rectangular shapes
    case 'rectangular_tube':
    case 'square_tube':
      drawRectangularTubeDXF(drawing, dimensions);
      break;

    // CYLINDER FAMILY - Solid circular shapes
    case 'cylinder':
    case 'round_bar':
    case 'shaft':
    case 'hub':
    case 'round_forging_stock':
    case 'disk':
    case 'disk_forging':
    case 'impeller':
      drawCylinderDXF(drawing, dimensions);
      break;

    // TUBE FAMILY - Hollow circular shapes
    case 'tube':
    case 'pipe':
    case 'sleeve':
    case 'bushing':
    case 'ring':
    case 'ring_forging':
    case 'blisk':
      drawTubeDXF(drawing, dimensions);
      break;

    // HEXAGON FAMILY
    case 'hexagon':
    case 'hex_bar':
      drawHexagonDXF(drawing, dimensions);
      break;

    // SPHERE
    case 'sphere':
      drawSphereDXF(drawing, dimensions);
      break;

    // CONE
    case 'cone':
      drawConeDXF(drawing, dimensions);
      break;

    // FORGING FAMILY
    case 'forging':
    case 'near_net_forging':
    case 'pyramid':
    case 'ellipse':
    case 'irregular':
      // For complex shapes, use simplified box representation
      drawBoxDXF(drawing, dimensions);
      break;

    default:
      drawBoxDXF(drawing, dimensions);
  }
  
  return drawing.toDxfString();
}

function drawBoxDXF(drawing: any, dimensions: any) {
  const { length, width, thickness } = dimensions;
  
  // Front view
  drawing.drawRect(0, 0, length, thickness);
  
  // Top view
  drawing.drawRect(0, thickness + 50, length, width);
  
  // Side view
  drawing.drawRect(length + 50, 0, width, thickness);
  
  // Add dimensions
  drawing.setActiveLayer('DIMENSIONS');
  drawing.drawDimension(0, -20, length, -20, `${length}mm`);
  drawing.drawDimension(-20, 0, -20, thickness, `${thickness}mm`);
  
  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(length / 2, -10, length / 2, thickness + 10);
  drawing.drawLine(-10, thickness / 2, length + 10, thickness / 2);
}

function drawCylinderDXF(drawing: any, dimensions: any) {
  const { length, diameter = 50 } = dimensions;
  const radius = diameter / 2;

  // Front view (rectangle)
  drawing.drawRect(0, 0, length, diameter);

  // End view (circle)
  drawing.drawCircle(length + 50 + radius, radius, radius);

  // Add dimensions
  drawing.setActiveLayer('DIMENSIONS');
  drawing.drawDimension(0, -20, length, -20, `${length}mm`);
  drawing.drawDimension(length + 50 + diameter + 20, 0,
                        length + 50 + diameter + 20, diameter, `Ø${diameter}mm`);

  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(length / 2, -10, length / 2, diameter + 10);
  drawing.drawLine(-10, diameter / 2, length + 10, diameter / 2);
  drawing.drawLine(length + 50 + radius, -10, length + 50 + radius, diameter + 10);
  drawing.drawLine(length + 40, radius, length + 60 + diameter, radius);
}

function drawTubeDXF(drawing: any, dimensions: any) {
  const outerDiameter = dimensions.diameter || 100;
  const length = dimensions.length || 200;

  // Calculate inner diameter - Tubes are ALWAYS hollow
  let innerDiameter: number;
  if (dimensions.innerDiameter && dimensions.innerDiameter > 0) {
    innerDiameter = dimensions.innerDiameter;
  } else if (dimensions.wallThickness && dimensions.wallThickness > 0) {
    innerDiameter = outerDiameter - (2 * dimensions.wallThickness);
  } else {
    // Default: ID is 60% of OD
    innerDiameter = outerDiameter * 0.6;
  }

  const outerRadius = outerDiameter / 2;
  const innerRadius = innerDiameter / 2;

  // Front view (rectangle with inner lines)
  drawing.drawRect(0, 0, length, outerDiameter);
  // Inner diameter lines (hidden)
  drawing.setActiveLayer('HIDDEN');
  drawing.drawLine(0, outerRadius - innerRadius, length, outerRadius - innerRadius);
  drawing.drawLine(0, outerRadius + innerRadius, length, outerRadius + innerRadius);

  // End view (concentric circles)
  drawing.setActiveLayer('OUTLINE');
  drawing.drawCircle(length + 50 + outerRadius, outerRadius, outerRadius);
  drawing.drawCircle(length + 50 + outerRadius, outerRadius, innerRadius);

  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(length / 2, -10, length / 2, outerDiameter + 10);
  drawing.drawLine(-10, outerDiameter / 2, length + 10, outerDiameter / 2);
}

function drawRectangularTubeDXF(drawing: any, dimensions: any) {
  const { length, width, thickness, wallThickness = 5 } = dimensions;

  // Front view (outer rectangle)
  drawing.drawRect(0, 0, length, thickness);
  // Inner rectangle (hidden)
  drawing.setActiveLayer('HIDDEN');
  drawing.drawRect(wallThickness, wallThickness, length - 2 * wallThickness, thickness - 2 * wallThickness);

  // Side view
  drawing.setActiveLayer('OUTLINE');
  drawing.drawRect(length + 50, 0, width, thickness);
  drawing.setActiveLayer('HIDDEN');
  drawing.drawRect(length + 50 + wallThickness, wallThickness, width - 2 * wallThickness, thickness - 2 * wallThickness);

  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(length / 2, -10, length / 2, thickness + 10);
}

function drawHexagonDXF(drawing: any, dimensions: any) {
  const { length, diameter = 50 } = dimensions;
  const acrossFlats = diameter;
  const radius = acrossFlats / Math.sqrt(3);
  const cx = length + 50 + acrossFlats / 2;
  const cy = acrossFlats / 2;

  // Front view (rectangle)
  drawing.drawRect(0, 0, length, acrossFlats);

  // End view (hexagon)
  for (let i = 0; i < 6; i++) {
    const angle1 = (i * 60 + 30) * Math.PI / 180;
    const angle2 = ((i + 1) * 60 + 30) * Math.PI / 180;
    drawing.drawLine(
      cx + radius * Math.cos(angle1),
      cy + radius * Math.sin(angle1),
      cx + radius * Math.cos(angle2),
      cy + radius * Math.sin(angle2)
    );
  }

  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(length / 2, -10, length / 2, acrossFlats + 10);
}

function drawSphereDXF(drawing: any, dimensions: any) {
  const { diameter = 50 } = dimensions;
  const radius = diameter / 2;

  // Front view (circle)
  drawing.drawCircle(radius, radius, radius);

  // Side view (circle - same for sphere)
  drawing.drawCircle(diameter + 50 + radius, radius, radius);

  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(radius, -10, radius, diameter + 10);
  drawing.drawLine(-10, radius, diameter + 10, radius);
}

function drawConeDXF(drawing: any, dimensions: any) {
  const { length = 100, diameter = 50 } = dimensions;
  const baseRadius = diameter / 2;
  const topRadius = diameter / 4; // Assuming truncated cone

  // Front view (trapezoid)
  drawing.drawLine(0, 0, length, 0); // Bottom
  drawing.drawLine(0, diameter, length, diameter); // Top
  drawing.drawLine(0, baseRadius - topRadius, 0, baseRadius + topRadius); // Left
  drawing.drawLine(length, 0, length, diameter); // Right

  // End view (circle - base)
  drawing.drawCircle(length + 50 + baseRadius, baseRadius, baseRadius);

  // Add center lines
  drawing.setActiveLayer('CENTER');
  drawing.drawLine(length / 2, -10, length / 2, diameter + 10);
}

/**
 * Export drawing to PDF format
 */
export function exportToPDF(
  canvas: HTMLCanvasElement,
  partType: string,
  dimensions: any,
  material: string = 'ALUMINUM'
): jsPDF {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });
  
  // Add header
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Technical Drawing', 210, 20, { align: 'center' });
  
  // Add part information
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Part Type: ${partType.toUpperCase()}`, 20, 35);
  pdf.text(`Material: ${material}`, 20, 42);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 49);
  
  // Add dimensions table
  pdf.setFontSize(10);
  const dimensionText = [];
  if (dimensions.length) dimensionText.push(`Length: ${dimensions.length}mm`);
  if (dimensions.width) dimensionText.push(`Width: ${dimensions.width}mm`);
  if (dimensions.thickness) dimensionText.push(`Thickness: ${dimensions.thickness}mm`);
  if (dimensions.diameter) dimensionText.push(`Diameter: Ø${dimensions.diameter}mm`);
  
  let yPos = 56;
  dimensionText.forEach(text => {
    pdf.text(text, 20, yPos);
    yPos += 7;
  });
  
  // Add the canvas drawing
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 350;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;
  
  pdf.addImage(imgData, 'PNG', 30, 90, imgWidth, imgHeight);
  
  // Add footer
  pdf.setFontSize(8);
  pdf.setTextColor(102, 102, 102);
  pdf.text('Generated by Scan Master Inspection Pro', 210, 290, { align: 'center' });
  pdf.text('ISO 128 Compliant Technical Drawing', 210, 295, { align: 'center' });
  
  // Add border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(10, 10, 400, 287);
  
  return pdf;
}

/**
 * Download file utility
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}