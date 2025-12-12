/**
 * Isometric Drawing Component
 * Generates dynamic isometric technical drawings for calibration blocks
 * Similar to professional calibration block drawings with proper perspective
 */

import React, { useMemo, useId } from 'react';
import {
  CustomBlockShape,
  DesignerHole,
  BlockGeometryType,
  MATERIAL_PROPERTIES,
  BlockMaterial,
} from '@/types/blockDesigner.types';

interface IsometricDrawingProps {
  blockShape: CustomBlockShape;
  holes: DesignerHole[];
  material: BlockMaterial;
  selectedHoleId?: string | null;
  onHoleClick?: (holeId: string) => void;
  width?: number;
  height?: number;
}

// Isometric projection constants
const ISO_ANGLE = 30 * (Math.PI / 180); // 30 degrees
const COS_ISO = Math.cos(ISO_ANGLE);
const SIN_ISO = Math.sin(ISO_ANGLE);

// Convert 3D point to 2D isometric projection
function toIsometric(x: number, y: number, z: number): { x: number; y: number } {
  return {
    x: (x - z) * COS_ISO,
    y: (x + z) * SIN_ISO - y,
  };
}

// Draw isometric box outline
function drawBoxPath(
  length: number,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number
): string {
  // 8 corners of the box
  const corners = {
    // Bottom face
    b0: toIsometric(0, 0, 0),
    b1: toIsometric(length, 0, 0),
    b2: toIsometric(length, 0, width),
    b3: toIsometric(0, 0, width),
    // Top face
    t0: toIsometric(0, height, 0),
    t1: toIsometric(length, height, 0),
    t2: toIsometric(length, height, width),
    t3: toIsometric(0, height, width),
  };

  // Apply offset
  const c = Object.fromEntries(
    Object.entries(corners).map(([k, v]) => [k, { x: v.x + offsetX, y: v.y + offsetY }])
  ) as typeof corners;

  // Visible edges only (back-face culling)
  return `
    M ${c.t0.x} ${c.t0.y}
    L ${c.t1.x} ${c.t1.y}
    L ${c.t2.x} ${c.t2.y}
    L ${c.t3.x} ${c.t3.y}
    Z
    M ${c.t1.x} ${c.t1.y}
    L ${c.b1.x} ${c.b1.y}
    L ${c.b2.x} ${c.b2.y}
    L ${c.t2.x} ${c.t2.y}
    M ${c.t2.x} ${c.t2.y}
    L ${c.b2.x} ${c.b2.y}
    L ${c.b3.x} ${c.b3.y}
    L ${c.t3.x} ${c.t3.y}
  `;
}

// Draw curved block (like in the reference image)
function drawCurvedBlockPath(
  length: number,
  width: number,
  height: number,
  curveRadius: number,
  offsetX: number,
  offsetY: number
): string {
  const segments = 20;
  const curveHeight = Math.min(height * 0.3, curveRadius * 0.2);

  // Generate curved top surface points
  const topCurve: { x: number; y: number }[] = [];
  const bottomFront: { x: number; y: number }[] = [];
  const bottomBack: { x: number; y: number }[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    const curveY = height + curveHeight * Math.sin(t * Math.PI);

    // Top curve - front edge
    const pFront = toIsometric(x, curveY, width);
    topCurve.push({ x: pFront.x + offsetX, y: pFront.y + offsetY });

    // Bottom points
    const bFront = toIsometric(x, 0, width);
    const bBack = toIsometric(x, 0, 0);
    bottomFront.push({ x: bFront.x + offsetX, y: bFront.y + offsetY });
    bottomBack.push({ x: bBack.x + offsetX, y: bBack.y + offsetY });
  }

  // Top curve - back edge
  const topCurveBack: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    const curveY = height + curveHeight * Math.sin(t * Math.PI);
    const p = toIsometric(x, curveY, 0);
    topCurveBack.push({ x: p.x + offsetX, y: p.y + offsetY });
  }

  // Build path
  let path = '';

  // Top surface (curved)
  path += `M ${topCurve[0].x} ${topCurve[0].y}`;
  for (let i = 1; i < topCurve.length; i++) {
    path += ` L ${topCurve[i].x} ${topCurve[i].y}`;
  }
  // Connect to back curve
  path += ` L ${topCurveBack[segments].x} ${topCurveBack[segments].y}`;
  for (let i = segments - 1; i >= 0; i--) {
    path += ` L ${topCurveBack[i].x} ${topCurveBack[i].y}`;
  }
  path += ' Z';

  // Front face
  path += ` M ${topCurve[0].x} ${topCurve[0].y}`;
  for (let i = 1; i < topCurve.length; i++) {
    path += ` L ${topCurve[i].x} ${topCurve[i].y}`;
  }
  path += ` L ${bottomFront[segments].x} ${bottomFront[segments].y}`;
  for (let i = segments - 1; i >= 0; i--) {
    path += ` L ${bottomFront[i].x} ${bottomFront[i].y}`;
  }
  path += ' Z';

  // Right side face
  const rightTop = toIsometric(length, height + curveHeight * Math.sin(Math.PI), width);
  const rightTopBack = toIsometric(length, height + curveHeight * Math.sin(Math.PI), 0);
  const rightBottom = toIsometric(length, 0, width);
  const rightBottomBack = toIsometric(length, 0, 0);

  path += ` M ${rightTop.x + offsetX} ${rightTop.y + offsetY}`;
  path += ` L ${rightTopBack.x + offsetX} ${rightTopBack.y + offsetY}`;
  path += ` L ${rightBottomBack.x + offsetX} ${rightBottomBack.y + offsetY}`;
  path += ` L ${rightBottom.x + offsetX} ${rightBottom.y + offsetY}`;
  path += ' Z';

  // Left side face (partial - visible part)
  const leftTop = toIsometric(0, height + curveHeight * Math.sin(0), width);
  const leftTopBack = toIsometric(0, height + curveHeight * Math.sin(0), 0);
  const leftBottom = toIsometric(0, 0, width);
  const leftBottomBack = toIsometric(0, 0, 0);

  path += ` M ${leftTop.x + offsetX} ${leftTop.y + offsetY}`;
  path += ` L ${leftTopBack.x + offsetX} ${leftTopBack.y + offsetY}`;
  path += ` L ${leftBottomBack.x + offsetX} ${leftBottomBack.y + offsetY}`;
  path += ` L ${leftBottom.x + offsetX} ${leftBottom.y + offsetY}`;
  path += ' Z';

  return path;
}

// Draw cylinder in isometric
function drawCylinderPath(
  diameter: number,
  length: number,
  innerDiameter: number,
  offsetX: number,
  offsetY: number,
  horizontal: boolean = true
): string {
  const radius = diameter / 2;
  const innerRadius = innerDiameter / 2;
  const segments = 24;

  // For horizontal cylinder (lying on side)
  if (horizontal) {
    // Front ellipse (visible half)
    const frontEllipse: { x: number; y: number }[] = [];
    const backEllipse: { x: number; y: number }[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const y = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      const pFront = toIsometric(0, y + radius, z + radius);
      const pBack = toIsometric(length, y + radius, z + radius);

      frontEllipse.push({ x: pFront.x + offsetX, y: pFront.y + offsetY });
      backEllipse.push({ x: pBack.x + offsetX, y: pBack.y + offsetY });
    }

    let path = '';

    // Front ellipse outline
    path += `M ${frontEllipse[0].x} ${frontEllipse[0].y}`;
    for (let i = 1; i < frontEllipse.length; i++) {
      path += ` L ${frontEllipse[i].x} ${frontEllipse[i].y}`;
    }

    // Back ellipse outline
    path += ` M ${backEllipse[0].x} ${backEllipse[0].y}`;
    for (let i = 1; i < backEllipse.length; i++) {
      path += ` L ${backEllipse[i].x} ${backEllipse[i].y}`;
    }

    // Top connecting lines (visible part only - top half)
    const topStart = Math.floor(segments * 0.25);
    const topEnd = Math.floor(segments * 0.75);
    path += ` M ${frontEllipse[topStart].x} ${frontEllipse[topStart].y}`;
    path += ` L ${backEllipse[topStart].x} ${backEllipse[topStart].y}`;
    path += ` M ${frontEllipse[topEnd].x} ${frontEllipse[topEnd].y}`;
    path += ` L ${backEllipse[topEnd].x} ${backEllipse[topEnd].y}`;

    // Inner hole for tube
    if (innerDiameter > 0) {
      const innerFront: { x: number; y: number }[] = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const y = innerRadius * Math.cos(angle);
        const z = innerRadius * Math.sin(angle);
        const p = toIsometric(0, y + radius, z + radius);
        innerFront.push({ x: p.x + offsetX, y: p.y + offsetY });
      }

      path += ` M ${innerFront[0].x} ${innerFront[0].y}`;
      for (let i = 1; i < innerFront.length; i++) {
        path += ` L ${innerFront[i].x} ${innerFront[i].y}`;
      }
    }

    return path;
  }

  // Vertical cylinder
  const topEllipse: { x: number; y: number }[] = [];
  const bottomEllipse: { x: number; y: number }[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    const pTop = toIsometric(x + radius, length, z + radius);
    const pBottom = toIsometric(x + radius, 0, z + radius);

    topEllipse.push({ x: pTop.x + offsetX, y: pTop.y + offsetY });
    bottomEllipse.push({ x: pBottom.x + offsetX, y: pBottom.y + offsetY });
  }

  let path = '';

  // Top ellipse
  path += `M ${topEllipse[0].x} ${topEllipse[0].y}`;
  for (let i = 1; i < topEllipse.length; i++) {
    path += ` L ${topEllipse[i].x} ${topEllipse[i].y}`;
  }

  // Visible edges of cylinder body
  const leftIdx = Math.floor(segments * 0.75);
  const rightIdx = Math.floor(segments * 0.25);

  path += ` M ${topEllipse[leftIdx].x} ${topEllipse[leftIdx].y}`;
  path += ` L ${bottomEllipse[leftIdx].x} ${bottomEllipse[leftIdx].y}`;
  path += ` M ${topEllipse[rightIdx].x} ${topEllipse[rightIdx].y}`;
  path += ` L ${bottomEllipse[rightIdx].x} ${bottomEllipse[rightIdx].y}`;

  // Bottom visible arc
  path += ` M ${bottomEllipse[leftIdx].x} ${bottomEllipse[leftIdx].y}`;
  for (let i = leftIdx; i <= segments + rightIdx; i++) {
    const idx = i % segments;
    path += ` L ${bottomEllipse[idx].x} ${bottomEllipse[idx].y}`;
  }

  // Inner hole for tube
  if (innerDiameter > 0) {
    const innerTop: { x: number; y: number }[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = innerRadius * Math.cos(angle);
      const z = innerRadius * Math.sin(angle);
      const p = toIsometric(x + radius, length, z + radius);
      innerTop.push({ x: p.x + offsetX, y: p.y + offsetY });
    }

    path += ` M ${innerTop[0].x} ${innerTop[0].y}`;
    for (let i = 1; i < innerTop.length; i++) {
      path += ` L ${innerTop[i].x} ${innerTop[i].y}`;
    }
  }

  return path;
}

// Draw a hole on a surface
function drawHoleOnSurface(
  hole: DesignerHole,
  blockShape: CustomBlockShape,
  offsetX: number,
  offsetY: number,
  scale: number
): { path: string; center: { x: number; y: number }; label: string } {
  const holeRadius = hole.diameter / 2;
  const segments = 12;

  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';

  // For cylinders/tubes: the cylinder lies horizontally along X axis
  // In the 3D model: X = along cylinder length, Y/Z = radial
  // hole.position.x = position along cylinder length (0 to cylinderLength)
  // hole.position.y = angular position (in degrees or radians) or just Y coordinate
  // For top surface of cylinder: the hole is on the outer curved surface at the "top"

  let centerPos: { x: number; y: number; z: number };
  let holeNormal: 'vertical' | 'horizontal_z' | 'horizontal_x' = 'vertical';

  if (isCylindrical) {
    const radius = blockShape.outerDiameter / 2;
    const cylinderLength = blockShape.cylinderLength;

    // For cylindrical shapes, hole.position.x is position along length
    // hole.position.y is angular position around the cylinder (in degrees, 0 = top)
    // The 3D model puts the cylinder along X axis, centered at origin

    // Convert hole position to 3D coordinates
    // In the isometric view, cylinder is drawn with:
    // - X axis = length direction (0 to cylinderLength)
    // - Y axis = vertical (up/down in world space)
    // - Z axis = depth (towards/away from viewer)

    // For a hole on the "top" surface of a horizontal cylinder:
    // The hole is at the top of the cylinder's curved surface
    const xPos = hole.position.x; // Position along cylinder length

    // For simplicity, assume holes are on the top of the cylinder (Y = radius + radius offset)
    // The isometric drawing uses: y = height (upward), so for top of cylinder: y = 2*radius
    centerPos = {
      x: xPos,
      y: radius * 2, // Top of cylinder in isometric coords
      z: radius // Center depth
    };
    holeNormal = 'vertical'; // Hole drilled from top, vertical normal
  } else {
    // Rectangular/curved block positioning (original logic)
    switch (hole.surface) {
      case 'top':
        centerPos = { x: hole.position.x, y: blockShape.height, z: hole.position.y };
        holeNormal = 'vertical';
        break;
      case 'bottom':
        centerPos = { x: hole.position.x, y: 0, z: hole.position.y };
        holeNormal = 'vertical';
        break;
      case 'front':
        centerPos = { x: hole.position.x, y: hole.position.y, z: blockShape.width };
        holeNormal = 'horizontal_z';
        break;
      case 'back':
        centerPos = { x: hole.position.x, y: hole.position.y, z: 0 };
        holeNormal = 'horizontal_z';
        break;
      case 'left':
        centerPos = { x: 0, y: hole.position.y, z: hole.position.x };
        holeNormal = 'horizontal_x';
        break;
      case 'right':
        centerPos = { x: blockShape.length, y: hole.position.y, z: hole.position.x };
        holeNormal = 'horizontal_x';
        break;
      default:
        centerPos = { x: hole.position.x, y: blockShape.height, z: hole.position.y };
        holeNormal = 'vertical';
    }
  }

  // Draw ellipse for hole opening
  const ellipsePoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    let px: number, py: number, pz: number;

    if (holeNormal === 'vertical') {
      // Hole drilled vertically (top/bottom surface)
      px = centerPos.x + holeRadius * Math.cos(angle);
      py = centerPos.y;
      pz = centerPos.z + holeRadius * Math.sin(angle);
    } else if (holeNormal === 'horizontal_z') {
      // Hole drilled along Z axis (front/back surface)
      px = centerPos.x + holeRadius * Math.cos(angle);
      py = centerPos.y + holeRadius * Math.sin(angle);
      pz = centerPos.z;
    } else {
      // Hole drilled along X axis (left/right surface)
      px = centerPos.x;
      py = centerPos.y + holeRadius * Math.sin(angle);
      pz = centerPos.z + holeRadius * Math.cos(angle);
    }

    const p = toIsometric(px * scale, py * scale, pz * scale);
    ellipsePoints.push({ x: p.x + offsetX, y: p.y + offsetY });
  }

  let path = `M ${ellipsePoints[0].x} ${ellipsePoints[0].y}`;
  for (let i = 1; i < ellipsePoints.length; i++) {
    path += ` L ${ellipsePoints[i].x} ${ellipsePoints[i].y}`;
  }

  // Center crosshair
  const center = toIsometric(centerPos.x * scale, centerPos.y * scale, centerPos.z * scale);
  const centerScreen = { x: center.x + offsetX, y: center.y + offsetY };

  path += ` M ${centerScreen.x - 3} ${centerScreen.y} L ${centerScreen.x + 3} ${centerScreen.y}`;
  path += ` M ${centerScreen.x} ${centerScreen.y - 3} L ${centerScreen.x} ${centerScreen.y + 3}`;

  return {
    path,
    center: centerScreen,
    label: `${hole.size}" D=${hole.depth}`,
  };
}

export function IsometricDrawing({
  blockShape,
  holes,
  material,
  selectedHoleId,
  onHoleClick,
  width = 600,
  height = 400,
}: IsometricDrawingProps) {
  const uniqueId = useId();

  // Calculate scale to fit the drawing - always ensures it fits in view
  const { scale, offsetX, offsetY } = useMemo(() => {
    let maxDim: number;

    if (blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube') {
      maxDim = Math.max(blockShape.outerDiameter, blockShape.cylinderLength);
    } else {
      maxDim = Math.max(blockShape.length, blockShape.width, blockShape.height);
    }

    // Use smaller factor to ensure drawing always fits with padding
    const availableHeight = height - 80; // Leave room for title and legend
    const availableWidth = width - 150; // Leave room for legend on sides
    const targetSize = Math.min(availableWidth, availableHeight) * 0.45;
    const s = Math.max(0.1, targetSize / Math.max(1, maxDim));

    return {
      scale: s,
      offsetX: width / 2,
      offsetY: height / 2 + 20,
    };
  }, [blockShape, width, height]);

  // Generate main shape path
  const shapePath = useMemo(() => {
    const { geometryType, length, width: w, height: h, outerDiameter, innerDiameter, cylinderLength, topCurvature } = blockShape;

    switch (geometryType) {
      case 'cylinder':
        return drawCylinderPath(outerDiameter * scale, cylinderLength * scale, 0, offsetX, offsetY, true);

      case 'tube':
        return drawCylinderPath(outerDiameter * scale, cylinderLength * scale, innerDiameter * scale, offsetX, offsetY, true);

      case 'curved_block':
        return drawCurvedBlockPath(length * scale, w * scale, h * scale, topCurvature.radius * scale, offsetX, offsetY);

      case 'rectangular':
      default:
        return drawBoxPath(length * scale, w * scale, h * scale, offsetX, offsetY);
    }
  }, [blockShape, scale, offsetX, offsetY]);

  // Generate hole drawings
  const holeDrawings = useMemo(() => {
    return holes.map((hole) => drawHoleOnSurface(hole, blockShape, offsetX, offsetY, scale));
  }, [holes, blockShape, offsetX, offsetY, scale]);

  // Blueprint-style dark theme colors
  const colors = {
    background: '#1a2332',
    gridLines: '#243447',
    mainStroke: '#60a5fa',
    secondaryStroke: '#3b82f6',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    holeDefault: '#22d3ee',
    holeSelected: '#f97316',
    holeFill: 'rgba(34, 211, 238, 0.15)',
    holeSelectedFill: 'rgba(249, 115, 22, 0.25)',
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ background: colors.background }}
    >
      {/* Grid pattern for blueprint look */}
      <defs>
        <pattern id={`grid-${uniqueId}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colors.gridLines} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${uniqueId})`} />

      {/* Title */}
      <text x={width / 2} y={22} textAnchor="middle" fontSize="14" fontWeight="600" fill={colors.text}>
        Calibration Block - {MATERIAL_PROPERTIES[material].label}
      </text>
      <text x={width / 2} y={40} textAnchor="middle" fontSize="11" fill={colors.textMuted}>
        {blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube'
          ? `OD: ${blockShape.outerDiameter}mm | L: ${blockShape.cylinderLength}mm${blockShape.innerDiameter > 0 ? ` | ID: ${blockShape.innerDiameter}mm` : ''}`
          : `${blockShape.length} x ${blockShape.width} x ${blockShape.height} mm`}
      </text>

      {/* Main shape outline - glowing effect */}
      <path
        d={shapePath}
        fill="none"
        stroke={colors.secondaryStroke}
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d={shapePath}
        fill="none"
        stroke={colors.mainStroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Holes */}
      {holeDrawings.map((holeDrawing, index) => {
        const hole = holes[index];
        const isSelected = hole.id === selectedHoleId;

        return (
          <g
            key={hole.id}
            onClick={() => onHoleClick?.(hole.id)}
            style={{ cursor: onHoleClick ? 'pointer' : 'default' }}
          >
            {/* Hole outline */}
            <path
              d={holeDrawing.path}
              fill={isSelected ? colors.holeSelectedFill : colors.holeFill}
              stroke={isSelected ? colors.holeSelected : colors.holeDefault}
              strokeWidth={isSelected ? 2 : 1}
            />

            {/* Hole label */}
            <text
              x={holeDrawing.center.x + 12}
              y={holeDrawing.center.y - 5}
              fontSize="10"
              fill={isSelected ? colors.holeSelected : colors.holeDefault}
            >
              {hole.size}"
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(15, ${height - 55})`}>
        <text fontSize="11" fontWeight="600" fill={colors.text}>FBH Holes: {holes.length}</text>
        {holes.slice(0, 4).map((hole, i) => (
          <text key={hole.id} y={14 + i * 11} fontSize="10" fill={colors.textMuted}>
            #{i + 1}: {hole.size}" - {hole.depth}mm
          </text>
        ))}
      </g>

      {/* Scale indicator */}
      <g transform={`translate(${width - 90}, ${height - 25})`}>
        <line x1="0" y1="0" x2="50" y2="0" stroke={colors.mainStroke} strokeWidth="1" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke={colors.mainStroke} strokeWidth="1" />
        <line x1="50" y1="-4" x2="50" y2="4" stroke={colors.mainStroke} strokeWidth="1" />
        <text x="25" y="12" textAnchor="middle" fontSize="9" fill={colors.textMuted}>
          {Math.round(50 / scale)}mm
        </text>
      </g>
    </svg>
  );
}
