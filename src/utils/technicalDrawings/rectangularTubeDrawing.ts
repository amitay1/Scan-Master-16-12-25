/**
 * Rectangular Tube Technical Drawing Module
 * Generates multi-view technical drawings for hollow rectangular tube parts
 */

import { TechnicalDrawingGenerator, Dimensions, LayoutConfig } from './TechnicalDrawingGenerator';

export function drawRectangularTubeTechnicalDrawing(
  generator: TechnicalDrawingGenerator,
  dimensions: Dimensions,
  layout: LayoutConfig
): void {
  const length = dimensions.length || 400;
  const width = dimensions.width || 100;
  const thickness = dimensions.thickness || 80;
  const wallThickness = dimensions.wallThickness || 5;
  
  // FRONT VIEW (Length × Thickness with hollow interior)
  drawFrontView(generator, length, thickness, wallThickness, layout.frontView);
  
  // TOP VIEW (Length × Width with hollow interior)
  drawTopView(generator, length, width, wallThickness, layout.topView);
  
  // SECTION A-A (Cross-section with hatching)
  drawSectionView(generator, width, thickness, wallThickness, layout.sideView);
  
  // ISOMETRIC VIEW
  drawIsometricView(generator, length, width, thickness, wallThickness, layout.isometric);
}

function drawFrontView(
  generator: TechnicalDrawingGenerator,
  length: number,
  thickness: number,
  wallThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + width / 2, y, 'FRONT VIEW');
  
  // Scale to fit
  const scale = Math.min(width / length, height / thickness) * 0.6;
  const scaledLength = length * scale;
  const scaledThickness = thickness * scale;
  const scaledWall = wallThickness * scale;
  
  const rectX = x + (width - scaledLength) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Outer rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledThickness, 'visible');
  
  // Inner rectangle (hollow interior) - using hidden lines to show it's hollow
  const innerX = rectX;
  const innerY = rectY + scaledWall;
  const innerWidth = scaledLength;
  const innerHeight = scaledThickness - (2 * scaledWall);
  
  generator.drawRectangle(innerX, innerY, innerWidth, innerHeight, 'hidden');
  
  // Centerlines
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  generator.drawLine(
    rectX - 20,
    centerY,
    rectX + scaledLength + 20,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    rectY - 20,
    centerX,
    rectY + scaledThickness + 20,
    'center'
  );
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledThickness + 35,
    rectX + scaledLength,
    rectY + scaledThickness + 35,
    `${length}`,
    '+0.5',
    '-0.5',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledLength + 35,
    rectY,
    rectX + scaledLength + 35,
    rectY + scaledThickness,
    `${thickness}`,
    '+0.3',
    '-0.3',
    5
  );
  
  // Wall thickness dimension
  generator.drawDimension(
    rectX + scaledLength + 55,
    rectY,
    rectX + scaledLength + 55,
    innerY,
    `t=${wallThickness}`,
    5
  );
  
  // Surface finish
  generator.drawSurfaceFinish(rectX + 30, rectY - 10, 'machined', '3.2');
  
  // Straightness tolerance
  generator.drawGeometricTolerance(
    centerX,
    rectY - 30,
    'straightness',
    '0.1',
    ''
  );
}

function drawTopView(
  generator: TechnicalDrawingGenerator,
  length: number,
  width: number,
  wallThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'TOP VIEW');
  
  // Scale to fit
  const scale = Math.min(viewWidth / length, height / width) * 0.6;
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledWall = wallThickness * scale;
  
  const rectX = x + (viewWidth - scaledLength) / 2;
  const rectY = y + (height - scaledWidth) / 2;
  
  // Outer rectangle
  generator.drawRectangle(rectX, rectY, scaledLength, scaledWidth, 'visible');
  
  // Inner rectangle (hollow interior)
  const innerX = rectX;
  const innerY = rectY + scaledWall;
  const innerWidth = scaledLength;
  const innerHeight = scaledWidth - (2 * scaledWall);
  
  generator.drawRectangle(innerX, innerY, innerWidth, innerHeight, 'hidden');
  
  // Centerlines
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;
  
  generator.drawLine(
    rectX - 20,
    centerY,
    rectX + scaledLength + 20,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    rectY - 20,
    centerX,
    rectY + scaledWidth + 20,
    'center'
  );
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledWidth + 30,
    rectX + scaledLength,
    rectY + scaledWidth + 30,
    `${length}`,
    '+0.5',
    '-0.5',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledLength + 30,
    rectY,
    rectX + scaledLength + 30,
    rectY + scaledWidth,
    `${width}`,
    '+0.3',
    '-0.3',
    5
  );
}

function drawSectionView(
  generator: TechnicalDrawingGenerator,
  width: number,
  thickness: number,
  wallThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'SECTION A-A');
  
  // Scale to fit
  const scale = Math.min(viewWidth / width, height / thickness) * 0.6;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;
  const scaledWall = Math.max(wallThickness * scale, 3); // Ensure visible wall
  
  const rectX = x + (viewWidth - scaledWidth) / 2;
  const rectY = y + (height - scaledThickness) / 2;
  
  // Draw cross-section with hollow center
  // Outer rectangle
  const outerPath = new scope.Path.Rectangle({
    point: [rectX, rectY],
    size: [scaledWidth, scaledThickness]
  });
  outerPath.strokeColor = new scope.Color('#FFFFFF');
  outerPath.strokeWidth = 2;
  
  // Inner hollow rectangle
  const innerX = rectX + scaledWall;
  const innerY = rectY + scaledWall;
  const innerWidth = scaledWidth - (2 * scaledWall);
  const innerHeight = scaledThickness - (2 * scaledWall);
  
  const innerPath = new scope.Path.Rectangle({
    point: [innerX, innerY],
    size: [innerWidth, innerHeight]
  });
  innerPath.strokeColor = new scope.Color('#FFFFFF');
  innerPath.strokeWidth = 2;
  
  // Hatching for walls only
  // Top wall
  generator.drawHatching(rectX, rectY, scaledWidth, scaledWall, 45, 3);
  
  // Bottom wall
  generator.drawHatching(rectX, rectY + scaledThickness - scaledWall, scaledWidth, scaledWall, 45, 3);
  
  // Left wall
  generator.drawHatching(rectX, rectY + scaledWall, scaledWall, innerHeight, 45, 3);
  
  // Right wall
  generator.drawHatching(rectX + scaledWidth - scaledWall, rectY + scaledWall, scaledWall, innerHeight, 45, 3);
  
  // Centerlines
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;
  
  generator.drawLine(
    rectX - 20,
    centerY,
    rectX + scaledWidth + 20,
    centerY,
    'center'
  );
  generator.drawLine(
    centerX,
    rectY - 20,
    centerX,
    rectY + scaledThickness + 20,
    'center'
  );
  
  // Section arrows
  generator.drawSectionArrow(rectX - 40, centerY, 'A', 'right');
  generator.drawSectionArrow(rectX + scaledWidth + 40, centerY, 'A', 'left');
  
  // Dimensions
  generator.drawDimensionWithTolerance(
    rectX,
    rectY + scaledThickness + 30,
    rectX + scaledWidth,
    rectY + scaledThickness + 30,
    `${width}`,
    '+0.3',
    '-0.3',
    5
  );
  
  generator.drawDimensionWithTolerance(
    rectX + scaledWidth + 30,
    rectY,
    rectX + scaledWidth + 30,
    rectY + scaledThickness,
    `${thickness}`,
    '+0.3',
    '-0.3',
    5
  );
  
  // Wall thickness
  generator.drawDimension(
    innerX,
    rectY - 30,
    rectX,
    rectY - 30,
    `t=${wallThickness}`,
    5
  );
  
  // Inside dimensions
  generator.drawDimension(
    innerX,
    innerY + innerHeight + 15,
    innerX + innerWidth,
    innerY + innerHeight + 15,
    `${(width - 2 * wallThickness).toFixed(1)}`,
    5
  );
  
  generator.drawDimension(
    innerX + innerWidth + 15,
    innerY,
    innerX + innerWidth + 15,
    innerY + innerHeight,
    `${(thickness - 2 * wallThickness).toFixed(1)}`,
    5
  );
}

function drawIsometricView(
  generator: TechnicalDrawingGenerator,
  length: number,
  width: number,
  thickness: number,
  wallThickness: number,
  viewConfig: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width: viewWidth, height } = viewConfig;
  const scope = generator.getScope();
  
  // View label
  generator.drawViewLabel(x + viewWidth / 2, y, 'ISOMETRIC VIEW');
  
  // Calculate scale
  const maxDim = Math.max(length, width, thickness);
  const scale = Math.min(viewWidth, height) * 0.4 / maxDim;
  
  const scaledLength = length * scale;
  const scaledWidth = width * scale;
  const scaledThickness = thickness * scale;
  const scaledWall = Math.max(wallThickness * scale, 2);
  
  const centerX = x + viewWidth / 2;
  const centerY = y + height / 2;
  
  // Isometric angles
  const angle = 30 * Math.PI / 180;
  
  // Outer box vertices
  const outerVertices = {
    // Back face
    bl: new scope.Point(
      centerX - scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
      centerY + scaledThickness / 2 + scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
    ),
    br: new scope.Point(
      centerX + scaledLength * Math.cos(angle) / 2 - scaledWidth * Math.cos(angle) / 2,
      centerY + scaledThickness / 2 - scaledLength * Math.sin(angle) / 2 - scaledWidth * Math.sin(angle) / 2
    ),
    // Front face
    fr: new scope.Point(
      centerX + scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
      centerY + scaledThickness / 2 - scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
    ),
    fl: new scope.Point(
      centerX - scaledLength * Math.cos(angle) / 2 + scaledWidth * Math.cos(angle) / 2,
      centerY + scaledThickness / 2 + scaledLength * Math.sin(angle) / 2 + scaledWidth * Math.sin(angle) / 2
    ),
  };
  
  // Top vertices
  const topVertices = {
    bl: new scope.Point(outerVertices.bl.x, outerVertices.bl.y - scaledThickness),
    br: new scope.Point(outerVertices.br.x, outerVertices.br.y - scaledThickness),
    fr: new scope.Point(outerVertices.fr.x, outerVertices.fr.y - scaledThickness),
    fl: new scope.Point(outerVertices.fl.x, outerVertices.fl.y - scaledThickness),
  };
  
  // Draw outer box
  // Bottom face (hidden)
  const bottomPath = new scope.Path();
  bottomPath.add(outerVertices.bl);
  bottomPath.add(outerVertices.br);
  bottomPath.strokeColor = new scope.Color('#B0B0B0');
  bottomPath.strokeWidth = 1;
  bottomPath.dashArray = [5, 3];
  
  // Visible edges of bottom
  const bottomVisible = new scope.Path();
  bottomVisible.add(outerVertices.br);
  bottomVisible.add(outerVertices.fr);
  bottomVisible.add(outerVertices.fl);
  bottomVisible.strokeColor = new scope.Color('#FFFFFF');
  bottomVisible.strokeWidth = 2;
  
  // Top face
  const topPath = new scope.Path();
  topPath.add(topVertices.bl);
  topPath.add(topVertices.br);
  topPath.add(topVertices.fr);
  topPath.add(topVertices.fl);
  topPath.closed = true;
  topPath.strokeColor = new scope.Color('#FFFFFF');
  topPath.strokeWidth = 2;
  
  // Vertical edges
  const edge1 = new scope.Path.Line(outerVertices.br, topVertices.br);
  edge1.strokeColor = new scope.Color('#FFFFFF');
  edge1.strokeWidth = 2;
  
  const edge2 = new scope.Path.Line(outerVertices.fr, topVertices.fr);
  edge2.strokeColor = new scope.Color('#FFFFFF');
  edge2.strokeWidth = 2;
  
  const edge3 = new scope.Path.Line(outerVertices.fl, topVertices.fl);
  edge3.strokeColor = new scope.Color('#FFFFFF');
  edge3.strokeWidth = 2;
  
  // Hidden back edge
  const hiddenEdge = new scope.Path.Line(outerVertices.bl, topVertices.bl);
  hiddenEdge.strokeColor = new scope.Color('#B0B0B0');
  hiddenEdge.strokeWidth = 1;
  hiddenEdge.dashArray = [5, 3];
  
  // Draw inner hollow (front face opening)
  const innerOffset = scaledWall;
  const innerFrontPath = new scope.Path();
  
  innerFrontPath.add(new scope.Point(
    outerVertices.fl.x + innerOffset * Math.cos(angle),
    outerVertices.fl.y - innerOffset - innerOffset * Math.sin(angle)
  ));
  innerFrontPath.add(new scope.Point(
    outerVertices.fr.x - innerOffset * Math.cos(angle),
    outerVertices.fr.y - innerOffset + innerOffset * Math.sin(angle)
  ));
  innerFrontPath.add(new scope.Point(
    topVertices.fr.x - innerOffset * Math.cos(angle),
    topVertices.fr.y + innerOffset + innerOffset * Math.sin(angle)
  ));
  innerFrontPath.add(new scope.Point(
    topVertices.fl.x + innerOffset * Math.cos(angle),
    topVertices.fl.y + innerOffset - innerOffset * Math.sin(angle)
  ));
  innerFrontPath.closed = true;
  innerFrontPath.strokeColor = new scope.Color('#FFFFFF');
  innerFrontPath.strokeWidth = 2;
  
  // Add shading to show depth
  const shadingPath = innerFrontPath.clone();
  shadingPath.fillColor = new scope.Color(0, 0, 0, 0.3);
  shadingPath.strokeColor = null;
  
  // Hidden back edge
  const hiddenBottom = new scope.Path();
  hiddenBottom.add(outerVertices.fl);
  hiddenBottom.add(outerVertices.bl);
  hiddenBottom.strokeColor = new scope.Color('#B0B0B0');
  hiddenBottom.strokeWidth = 1;
  hiddenBottom.dashArray = [5, 3];
  
  const hiddenTop = new scope.Path();
  hiddenTop.add(topVertices.fl);
  hiddenTop.add(topVertices.bl);
  hiddenTop.strokeColor = new scope.Color('#B0B0B0');
  hiddenTop.strokeWidth = 1;
  hiddenTop.dashArray = [5, 3];
}