/**
 * Structural Profile Technical Drawing Module
 * Generates multi-view technical drawings for L, T, I, U, Z profiles
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

// L-Profile Drawing
export function drawLProfileTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  drawLProfileFrontView(generator, width, thickness, layout.frontView);
  drawProfileTopView(generator, length, width, layout.topView);
  drawLProfileSectionView(generator, width, thickness, layout.sideView);
  drawLProfileIsometric(generator, length, width, thickness, layout.isometric);
}

function drawLProfileFrontView(
  generator: TechnicalDrawingGenerator,
  size: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  const scale = Math.min(width, height) / size * 0.6;
  const scaledSize = size * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const startX = centerX - scaledSize / 2;
  const startY = centerY - scaledSize / 2;
  
  const scope = generator.getScope();
  
  // Draw L-shape
  const lShape = new scope.Path();
  lShape.add(new scope.Point(startX, startY));
  lShape.add(new scope.Point(startX + scaledSize, startY));
  lShape.add(new scope.Point(startX + scaledSize, startY + scaledThickness));
  lShape.add(new scope.Point(startX + scaledThickness, startY + scaledThickness));
  lShape.add(new scope.Point(startX + scaledThickness, startY + scaledSize));
  lShape.add(new scope.Point(startX, startY + scaledSize));
  lShape.closed = true;
  lShape.strokeColor = new scope.Color('#000000');
  lShape.strokeWidth = 2;
  lShape.fillColor = new scope.Color('#E0E0E0');
  
  // Dimensions
  generator.drawDimension(
    startX,
    startY + scaledSize + 30,
    startX + scaledSize,
    startY + scaledSize + 30,
    `${size}mm`,
    5
  );
  
  generator.drawDimension(
    startX + scaledSize + 30,
    startY,
    startX + scaledSize + 30,
    startY + scaledThickness,
    `t=${thickness}mm`,
    5
  );
}

// T-Profile Drawing
export function drawTProfileTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  drawTProfileFrontView(generator, width, thickness, layout.frontView);
  drawProfileTopView(generator, length, width, layout.topView);
  drawTProfileSectionView(generator, width, thickness, layout.sideView);
  drawTProfileIsometric(generator, length, width, thickness, layout.isometric);
}

function drawTProfileFrontView(
  generator: TechnicalDrawingGenerator,
  size: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  const scale = Math.min(width, height) / size * 0.6;
  const scaledSize = size * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const startX = centerX - scaledSize / 2;
  const startY = centerY - scaledSize / 2;
  
  const scope = generator.getScope();
  
  // Draw T-shape
  const tShape = new scope.Path();
  tShape.add(new scope.Point(startX, startY));
  tShape.add(new scope.Point(startX + scaledSize, startY));
  tShape.add(new scope.Point(startX + scaledSize, startY + scaledThickness));
  tShape.add(new scope.Point(centerX + scaledThickness / 2, startY + scaledThickness));
  tShape.add(new scope.Point(centerX + scaledThickness / 2, startY + scaledSize));
  tShape.add(new scope.Point(centerX - scaledThickness / 2, startY + scaledSize));
  tShape.add(new scope.Point(centerX - scaledThickness / 2, startY + scaledThickness));
  tShape.add(new scope.Point(startX, startY + scaledThickness));
  tShape.closed = true;
  tShape.strokeColor = new scope.Color('#000000');
  tShape.strokeWidth = 2;
  tShape.fillColor = new scope.Color('#E0E0E0');
  
  // Dimensions
  generator.drawDimension(
    startX,
    startY + scaledSize + 30,
    startX + scaledSize,
    startY + scaledSize + 30,
    `${size}mm`,
    5
  );
  
  generator.drawDimension(
    startX + scaledSize + 30,
    startY,
    startX + scaledSize + 30,
    startY + scaledThickness,
    `t=${thickness}mm`,
    5
  );
}

// I-Profile Drawing
export function drawIProfileTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  drawIProfileFrontView(generator, width, thickness, layout.frontView);
  drawProfileTopView(generator, length, width, layout.topView);
  drawIProfileSectionView(generator, width, thickness, layout.sideView);
  drawIProfileIsometric(generator, length, width, thickness, layout.isometric);
}

function drawIProfileFrontView(
  generator: TechnicalDrawingGenerator,
  size: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  const scale = Math.min(width, height) / size * 0.6;
  const scaledSize = size * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const startX = centerX - scaledSize / 2;
  const startY = centerY - scaledSize / 2;
  
  const scope = generator.getScope();
  
  // Draw I-shape (simplified)
  const iShape = new scope.Path();
  // Top flange
  iShape.add(new scope.Point(startX, startY));
  iShape.add(new scope.Point(startX + scaledSize, startY));
  iShape.add(new scope.Point(startX + scaledSize, startY + scaledThickness));
  iShape.add(new scope.Point(centerX + scaledThickness / 2, startY + scaledThickness));
  // Web
  iShape.add(new scope.Point(centerX + scaledThickness / 2, startY + scaledSize - scaledThickness));
  // Bottom flange
  iShape.add(new scope.Point(startX + scaledSize, startY + scaledSize - scaledThickness));
  iShape.add(new scope.Point(startX + scaledSize, startY + scaledSize));
  iShape.add(new scope.Point(startX, startY + scaledSize));
  iShape.add(new scope.Point(startX, startY + scaledSize - scaledThickness));
  iShape.add(new scope.Point(centerX - scaledThickness / 2, startY + scaledSize - scaledThickness));
  // Web
  iShape.add(new scope.Point(centerX - scaledThickness / 2, startY + scaledThickness));
  iShape.add(new scope.Point(startX, startY + scaledThickness));
  iShape.closed = true;
  iShape.strokeColor = new scope.Color('#000000');
  iShape.strokeWidth = 2;
  iShape.fillColor = new scope.Color('#E0E0E0');
  
  // Dimensions
  generator.drawDimension(
    startX,
    startY + scaledSize + 30,
    startX + scaledSize,
    startY + scaledSize + 30,
    `${size}mm`,
    5
  );
  
  generator.drawDimension(
    startX + scaledSize + 30,
    startY,
    startX + scaledSize + 30,
    startY + scaledSize,
    `H=${size}mm`,
    5
  );
}

// U-Profile Drawing
export function drawUProfileTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  drawUProfileFrontView(generator, width, thickness, layout.frontView);
  drawProfileTopView(generator, length, width, layout.topView);
  drawUProfileSectionView(generator, width, thickness, layout.sideView);
  drawUProfileIsometric(generator, length, width, thickness, layout.isometric);
}

function drawUProfileFrontView(
  generator: TechnicalDrawingGenerator,
  size: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  const scale = Math.min(width, height) / size * 0.6;
  const scaledSize = size * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const startX = centerX - scaledSize / 2;
  const startY = centerY - scaledSize / 2;
  
  const scope = generator.getScope();
  
  // Draw U-shape
  const uShape = new scope.Path();
  uShape.add(new scope.Point(startX, startY));
  uShape.add(new scope.Point(startX + scaledThickness, startY));
  uShape.add(new scope.Point(startX + scaledThickness, startY + scaledSize - scaledThickness));
  uShape.add(new scope.Point(startX + scaledSize - scaledThickness, startY + scaledSize - scaledThickness));
  uShape.add(new scope.Point(startX + scaledSize - scaledThickness, startY));
  uShape.add(new scope.Point(startX + scaledSize, startY));
  uShape.add(new scope.Point(startX + scaledSize, startY + scaledSize));
  uShape.add(new scope.Point(startX, startY + scaledSize));
  uShape.closed = true;
  uShape.strokeColor = new scope.Color('#000000');
  uShape.strokeWidth = 2;
  uShape.fillColor = new scope.Color('#E0E0E0');
  
  // Dimensions
  generator.drawDimension(
    startX,
    startY + scaledSize + 30,
    startX + scaledSize,
    startY + scaledSize + 30,
    `${size}mm`,
    5
  );
  
  generator.drawDimension(
    startX + scaledSize + 30,
    startY,
    startX + scaledSize + 30,
    startY + scaledSize,
    `H=${size}mm`,
    5
  );
}

// Z-Profile Drawing
export function drawZProfileTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const { length, width, thickness } = dimensions;
  
  drawZProfileFrontView(generator, width, thickness, layout.frontView);
  drawProfileTopView(generator, length, width, layout.topView);
  drawZProfileSectionView(generator, width, thickness, layout.sideView);
  drawZProfileIsometric(generator, length, width, thickness, layout.isometric);
}

function drawZProfileFrontView(
  generator: TechnicalDrawingGenerator,
  size: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  const scale = Math.min(width, height) / size * 0.6;
  const scaledSize = size * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const startX = centerX - scaledSize / 2;
  const startY = centerY - scaledSize / 2;
  
  const scope = generator.getScope();
  
  // Draw Z-shape
  const zShape = new scope.Path();
  zShape.add(new scope.Point(startX, startY));
  zShape.add(new scope.Point(startX + scaledSize, startY));
  zShape.add(new scope.Point(startX + scaledSize, startY + scaledThickness));
  zShape.add(new scope.Point(startX + scaledThickness, startY + scaledSize - scaledThickness));
  zShape.add(new scope.Point(startX + scaledSize, startY + scaledSize - scaledThickness));
  zShape.add(new scope.Point(startX + scaledSize, startY + scaledSize));
  zShape.add(new scope.Point(startX, startY + scaledSize));
  zShape.add(new scope.Point(startX, startY + scaledSize - scaledThickness));
  zShape.add(new scope.Point(startX + scaledSize - scaledThickness, startY + scaledThickness));
  zShape.add(new scope.Point(startX, startY + scaledThickness));
  zShape.closed = true;
  zShape.strokeColor = new scope.Color('#000000');
  zShape.strokeWidth = 2;
  zShape.fillColor = new scope.Color('#E0E0E0');
  
  // Dimensions
  generator.drawDimension(
    startX,
    startY + scaledSize + 30,
    startX + scaledSize,
    startY + scaledSize + 30,
    `${size}mm`,
    5
  );
}

// Shared helper functions for profiles
function drawProfileTopView(
  generator: TechnicalDrawingGenerator,
  length: number,
  width: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  
  generator.drawViewLabel(x + viewWidth / 2, y, 'TOP VIEW');
  
  const scale = Math.min(viewWidth / length, height / 10) * 0.6;
  const scaledLength = length * scale;
  const scaledWidth = 10 * scale;
  
  const rectX = x + (viewWidth - scaledLength) / 2;
  const rectY = y + (height - scaledWidth) / 2;
  
  generator.drawRectangle(rectX, rectY, scaledLength, scaledWidth, 'visible');
  
  generator.drawDimension(
    rectX,
    rectY + scaledWidth + 25,
    rectX + scaledLength,
    rectY + scaledWidth + 25,
    `L=${length}mm`,
    5
  );
}

function drawLProfileSectionView(
  generator: TechnicalDrawingGenerator,
  size: number,
  thickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  generator.drawViewLabel(x + width / 2, y, 'SECTION VIEW');
  
  const scale = Math.min(width, height) / size * 0.6;
  const scaledSize = size * scale;
  const scaledThickness = thickness * scale;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const startX = centerX - scaledSize / 2;
  const startY = centerY - scaledSize / 2;
  
  const scope = generator.getScope();
  
  const lShape = new scope.Path();
  lShape.add(new scope.Point(startX, startY));
  lShape.add(new scope.Point(startX + scaledSize, startY));
  lShape.add(new scope.Point(startX + scaledSize, startY + scaledThickness));
  lShape.add(new scope.Point(startX + scaledThickness, startY + scaledThickness));
  lShape.add(new scope.Point(startX + scaledThickness, startY + scaledSize));
  lShape.add(new scope.Point(startX, startY + scaledSize));
  lShape.closed = true;
  lShape.strokeColor = new scope.Color('#000000');
  lShape.strokeWidth = 2;
  lShape.fillColor = null;
  
  generator.drawHatching(startX, startY, scaledSize, scaledThickness, 45, 6);
  generator.drawHatching(startX, startY + scaledThickness, scaledThickness, scaledSize - scaledThickness, 45, 6);
}

// Placeholder isometric functions
function drawLProfileIsometric(generator: TechnicalDrawingGenerator, length: number, width: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'ISOMETRIC VIEW');
}

function drawTProfileSectionView(generator: TechnicalDrawingGenerator, size: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'SECTION VIEW');
}

function drawTProfileIsometric(generator: TechnicalDrawingGenerator, length: number, width: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'ISOMETRIC VIEW');
}

function drawIProfileSectionView(generator: TechnicalDrawingGenerator, size: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'SECTION VIEW');
}

function drawIProfileIsometric(generator: TechnicalDrawingGenerator, length: number, width: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'ISOMETRIC VIEW');
}

function drawUProfileSectionView(generator: TechnicalDrawingGenerator, size: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'SECTION VIEW');
}

function drawUProfileIsometric(generator: TechnicalDrawingGenerator, length: number, width: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'ISOMETRIC VIEW');
}

function drawZProfileSectionView(generator: TechnicalDrawingGenerator, size: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'SECTION VIEW');
}

function drawZProfileIsometric(generator: TechnicalDrawingGenerator, length: number, width: number, thickness: number, viewConfig: any) {
  generator.drawViewLabel(viewConfig.x + viewConfig.width / 2, viewConfig.y, 'ISOMETRIC VIEW');
}
