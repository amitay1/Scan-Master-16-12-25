/**
 * Dynamic Calibration Block Drawing Component
 *
 * Renders calibration block technical drawings with calculated dimensions
 * based on part geometry, dimensions, and standard requirements.
 *
 * Supports:
 * - Flat FBH blocks (Figure 4)
 * - Cylinder notched blocks (Figure 5)
 * - Cylinder FBH blocks (Figure 6)
 * - Curved FBH blocks (Figure 7)
 */

import React, { useMemo, useId } from 'react';
import {
  calculateCalibrationBlockSpec,
  type CalibrationBlockSpecification,
  type CalculatedBlockType,
  type PartGeometry,
  type PartDimensions,
} from '@/rules/calibrationBlockDimensions';
import type { StandardType } from '@/types/techniqueSheet';

// ============================================================================
// TYPES
// ============================================================================

interface DynamicCalibrationBlockDrawingProps {
  /** Part geometry type */
  partGeometry: PartGeometry;
  /** Part dimensions */
  partDimensions: PartDimensions;
  /** Standard being used */
  standard: StandardType | string;
  /** Acceptance class */
  acceptanceClass: string;
  /** Part material */
  partMaterial?: string;
  /** Drawing width in pixels */
  width?: number;
  /** Drawing height in pixels */
  height?: number;
  /** Show dimensions */
  showDimensions?: boolean;
  /** Show specifications table */
  showSpecsTable?: boolean;
  /** Custom title */
  title?: string;
  /** Optional block type override from scan-aware recommendation */
  forcedBlockType?: CalculatedBlockType;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DynamicCalibrationBlockDrawing({
  partGeometry,
  partDimensions,
  standard,
  acceptanceClass,
  partMaterial = 'steel',
  width = 900,
  height = 700,
  showDimensions = true,
  showSpecsTable = true,
  title,
  forcedBlockType,
}: DynamicCalibrationBlockDrawingProps) {
  const uniqueId = useId().replace(/:/g, '');

  // Calculate block specification
  const blockSpec = useMemo(() => {
    return calculateCalibrationBlockSpec(
      partGeometry,
      partDimensions,
      standard,
      acceptanceClass,
      partMaterial,
      forcedBlockType
    );
  }, [partGeometry, partDimensions, standard, acceptanceClass, partMaterial, forcedBlockType]);

  // Determine which drawing to render based on block type
  const renderBlockDrawing = () => {
    switch (blockSpec.blockType) {
      case 'flat_fbh':
        return (
          <FlatFBHBlockDrawing
            spec={blockSpec}
            width={width}
            height={height}
            showDimensions={showDimensions}
            uniqueId={uniqueId}
          />
        );
      case 'cylinder_notched':
        return (
          <CylinderNotchedBlockDrawing
            spec={blockSpec}
            width={width}
            height={height}
            showDimensions={showDimensions}
            uniqueId={uniqueId}
          />
        );
      case 'cylinder_fbh':
      case 'curved_fbh':
        return (
          <CurvedFBHBlockDrawing
            spec={blockSpec}
            width={width}
            height={height}
            showDimensions={showDimensions}
            uniqueId={uniqueId}
          />
        );
      default:
        return (
          <FlatFBHBlockDrawing
            spec={blockSpec}
            width={width}
            height={height}
            showDimensions={showDimensions}
            uniqueId={uniqueId}
          />
        );
    }
  };

  // Get block type display name
  const blockTypeName = {
    'flat_fbh': 'Flat FBH Reference Block',
    'cylinder_notched': 'Notched Cylinder Reference Block',
    'cylinder_fbh': 'Cylinder FBH Reference Block',
    'curved_fbh': 'Curved FBH Reference Block',
    'custom': 'Custom Reference Block',
  }[blockSpec.blockType] || 'Reference Block';

  return (
    <div className="dynamic-calibration-block-drawing bg-white rounded-lg border-2 border-blue-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {title || blockTypeName}
            </h3>
            <p className="text-sm opacity-90">
              {standard} | {blockSpec.figureReference}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold bg-white/20 px-3 py-1 rounded">
              CALCULATED DIMENSIONS
            </div>
            <div className="text-xs opacity-80 mt-1">
              Based on part: {partGeometry}
            </div>
          </div>
        </div>
      </div>

      {/* Drawing */}
      {renderBlockDrawing()}

      {/* Specifications Table */}
      {showSpecsTable && (
        <div className="p-4 bg-gray-50 border-t">
          <SpecificationsTable spec={blockSpec} />
        </div>
      )}

      {/* Warnings and Notes */}
      {(blockSpec.warnings.length > 0 || blockSpec.notes.length > 0) && (
        <div className="p-4 border-t space-y-3">
          {blockSpec.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-semibold text-amber-800 text-sm mb-1">Warnings:</h4>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                {blockSpec.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {blockSpec.notes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-semibold text-blue-800 text-sm mb-1">Notes:</h4>
              <ul className="text-xs text-blue-700 list-disc list-inside space-y-0.5">
                {blockSpec.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FLAT FBH BLOCK DRAWING
// ============================================================================

interface BlockDrawingProps {
  spec: CalibrationBlockSpecification;
  width: number;
  height: number;
  showDimensions: boolean;
  uniqueId: string;
}

function FlatFBHBlockDrawing({ spec, width, height, showDimensions, uniqueId }: BlockDrawingProps) {
  const margin = 36;
  const paneGap = 24;
  const rightPaneWidth = Math.max(195, Math.min(240, width * 0.26));
  const mainWidth = Math.max(320, width - margin * 2 - rightPaneWidth - paneGap);
  const mainHeight = Math.max(360, height - margin * 2);
  const { dimensions, fbhSpecs } = spec;

  // Layout-aware scale so the drawing and text never overlap.
  const scaleX = (mainWidth - 40) / Math.max(dimensions.length, 1);
  const scaleY =
    (mainHeight - 150) /
    Math.max(dimensions.width + dimensions.height * 2, 1);
  const scale = Math.max(0.55, Math.min(scaleX, scaleY, 3));

  const scaledLength = dimensions.length * scale;
  const scaledWidth = dimensions.width * scale;
  const sideSectionHeight = dimensions.height * scale * 2;
  const topViewY = margin + 22;
  const sideViewY = topViewY + scaledWidth + 78;
  const originX = margin + Math.max(0, (mainWidth - scaledLength) / 2);
  const specsX = margin + mainWidth + paneGap;
  const specsY = margin + 20;
  const holeRadiusBase = fbhSpecs.diameter * scale * 1.8;
  const holeRadius = Math.max(3.5, Math.min(holeRadiusBase, 7.5));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block mx-auto bg-white"
    >
      <defs>
        <marker id={`arrow-${uniqueId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#1e293b" />
        </marker>
        <marker id={`arrow-rev-${uniqueId}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto">
          <path d="M8,0 L0,4 L8,8 L6,4 Z" fill="#1e293b" />
        </marker>
        <pattern id={`hatch-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* TOP VIEW */}
      <g transform={`translate(${originX}, ${topViewY})`}>
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          TOP VIEW
        </text>

        <rect
          x="0"
          y="0"
          width={scaledLength}
          height={scaledWidth}
          fill="#f8fafc"
          stroke="#1e293b"
          strokeWidth="2"
        />

        <line
          x1={scaledLength / 2}
          y1="-8"
          x2={scaledLength / 2}
          y2={scaledWidth + 8}
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="10,3,3,3"
        />
        <line
          x1="-8"
          y1={scaledWidth / 2}
          x2={scaledLength + 8}
          y2={scaledWidth / 2}
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="10,3,3,3"
        />

        {fbhSpecs.depths.map((depth, index) => {
          const spacing = scaledLength / (fbhSpecs.depths.length + 1);
          const x = spacing * (index + 1);

          return (
            <g key={`hole-${index}`}>
              <circle
                cx={x}
                cy={scaledWidth / 2}
                r={holeRadius}
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={scaledWidth / 2 + holeRadius + 12}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                fill="#1e293b"
              >
                {depth.toFixed(1)}mm
              </text>
            </g>
          );
        })}

        {showDimensions && (
          <>
            <g transform={`translate(0, ${scaledWidth + 25})`}>
              <line x1="0" y1="-10" x2="0" y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line x1={scaledLength} y1="-10" x2={scaledLength} y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line
                x1="5"
                y1="0"
                x2={scaledLength - 5}
                y2="0"
                stroke="#1e293b"
                strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`}
                markerEnd={`url(#arrow-${uniqueId})`}
              />
              <rect x={scaledLength / 2 - 35} y="-8" width="70" height="16" fill="white" />
              <text x={scaledLength / 2} y="5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                {dimensions.length.toFixed(1)} {dimensions.lengthTolerance}
              </text>
            </g>

            <g transform={`translate(${scaledLength + 18}, 0)`}>
              <line x1="-10" y1="0" x2="5" y2="0" stroke="#1e293b" strokeWidth="0.5" />
              <line x1="-10" y1={scaledWidth} x2="5" y2={scaledWidth} stroke="#1e293b" strokeWidth="0.5" />
              <line
                x1="0"
                y1="5"
                x2="0"
                y2={scaledWidth - 5}
                stroke="#1e293b"
                strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`}
                markerEnd={`url(#arrow-${uniqueId})`}
              />
              <rect x="-25" y={scaledWidth / 2 - 8} width="50" height="16" fill="white" />
              <text x="0" y={scaledWidth / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                {dimensions.width.toFixed(1)}
              </text>
            </g>
          </>
        )}
      </g>

      {/* SIDE VIEW (SECTION) */}
      <g transform={`translate(${originX}, ${sideViewY})`}>
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          SIDE VIEW - Section with FBH
        </text>

        <rect
          x="0"
          y="0"
          width={scaledLength}
          height={sideSectionHeight}
          fill={`url(#hatch-${uniqueId})`}
          stroke="#1e293b"
          strokeWidth="2"
        />

        {fbhSpecs.depths.map((depth, index) => {
          const spacing = scaledLength / (fbhSpecs.depths.length + 1);
          const x = spacing * (index + 1);
          const depthScaled = (depth / Math.max(dimensions.height, 1)) * sideSectionHeight;
          const yDepth = Math.min(depthScaled, sideSectionHeight - 6);

          return (
            <g key={`section-hole-${index}`}>
              <line x1={x} y1="0" x2={x} y2={yDepth} stroke="#3b82f6" strokeWidth="2" />
              <line x1={x - 4} y1={yDepth} x2={x + 4} y2={yDepth} stroke="#3b82f6" strokeWidth="2.5" />
            </g>
          );
        })}

        {showDimensions && (
          <g transform={`translate(${scaledLength + 20}, 0)`}>
            <line x1="-10" y1="0" x2="5" y2="0" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="-10" y1={sideSectionHeight} x2="5" y2={sideSectionHeight} stroke="#1e293b" strokeWidth="0.5" />
            <line
              x1="0"
              y1="5"
              x2="0"
              y2={sideSectionHeight - 5}
              stroke="#1e293b"
              strokeWidth="0.8"
              markerStart={`url(#arrow-rev-${uniqueId})`}
              markerEnd={`url(#arrow-${uniqueId})`}
            />
            <rect x="-25" y={sideSectionHeight / 2 - 8} width="50" height="16" fill="white" />
            <text x="0" y={sideSectionHeight / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              {dimensions.height.toFixed(1)}
            </text>
          </g>
        )}
      </g>

      {/* FBH Info Box */}
      <g transform={`translate(${specsX}, ${specsY})`}>
        <rect x="0" y="0" width={rightPaneWidth} height="132" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="4" />
        <rect x="0" y="0" width={rightPaneWidth} height="25" fill="#3b82f6" rx="4 4 0 0" />
        <text x={rightPaneWidth / 2} y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
          FBH SPECIFICATION
        </text>

        <text x="10" y="42" fontSize="9" fill="#64748b">Diameter:</text>
        <text x="80" y="42" fontSize="9" fontWeight="600" fill="#1e293b">
          {fbhSpecs.diameterInch} ({fbhSpecs.diameter.toFixed(2)}mm)
        </text>

        <text x="10" y="57" fontSize="9" fill="#64748b">FBH Number:</text>
        <text x="80" y="57" fontSize="9" fontWeight="600" fill="#1e293b">#{fbhSpecs.fbhNumber}</text>

        <text x="10" y="72" fontSize="9" fill="#64748b">Depths:</text>
        <text x="80" y="72" fontSize="9" fontWeight="600" fill="#1e293b">
          {fbhSpecs.depths.map((d) => d.toFixed(1)).join(', ')}mm
        </text>

        <text x="10" y="87" fontSize="9" fill="#64748b">Drilling:</text>
        <text x="80" y="87" fontSize="9" fontWeight="600" fill="#1e293b">Perpendicular (0 deg)</text>

        <line x1="10" y1="96" x2={rightPaneWidth - 10} y2="96" stroke="#e2e8f0" strokeWidth="1" />
        <text x="10" y="111" fontSize="8" fill="#64748b">Units: mm</text>
        <text x="10" y="123" fontSize="8" fill="#64748b">
          Tol: L/W +/-0.5, H +/-0.25
        </text>
      </g>
    </svg>
  );
}

// ============================================================================
// CYLINDER NOTCHED BLOCK DRAWING
// ============================================================================

function CylinderNotchedBlockDrawing({ spec, width, height, showDimensions, uniqueId }: BlockDrawingProps) {
  const margin = 34;
  const paneGap = 24;
  const rightPaneWidth = Math.max(220, Math.min(260, width * 0.28));
  const columnGap = 24;
  const { dimensions, notches } = spec;

  // Use OD/ID from spec when available.
  let od: number;
  let id: number;
  if (dimensions.outerDiameter) {
    od = dimensions.outerDiameter;
    id = dimensions.innerDiameter || od - 2 * dimensions.height;
  } else if (dimensions.innerDiameter) {
    id = dimensions.innerDiameter;
    od = id + 2 * dimensions.height;
  } else {
    od = Math.max(dimensions.height * 5, 40);
    id = od - 2 * dimensions.height;
  }
  const wall = Math.max((od - id) / 2, 0.1);

  const drawingWidth = Math.max(420, width - margin * 2 - rightPaneWidth - paneGap);
  const leftWidth = Math.max(220, Math.min(drawingWidth * 0.5, drawingWidth - 220));
  const rightWidth = Math.max(200, drawingWidth - leftWidth - columnGap);
  const drawingHeight = Math.max(300, height - margin * 2 - 40);

  const scaleByEndX = (leftWidth - 70) / Math.max(od, 1);
  const scaleByEndY = (drawingHeight - 120) / Math.max(od, 1);
  const scaleBySideX = (rightWidth - 45) / Math.max(dimensions.length, 1);
  const scaleBySideY = (drawingHeight - 140) / Math.max(od, 1);
  const scale = Math.max(0.45, Math.min(scaleByEndX, scaleByEndY, scaleBySideX, scaleBySideY, 2));

  const scaledOD = od * scale;
  const scaledID = id * scale;
  const scaledLength = dimensions.length * scale;

  const endCx = margin + leftWidth / 2;
  const endCy = margin + 56 + scaledOD / 2;

  const sideX = margin + leftWidth + columnGap + Math.max(0, (rightWidth - scaledLength) / 2);
  const sideY = margin + 56;

  const specsX = width - margin - rightPaneWidth;
  const specsY = margin + 18;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block mx-auto bg-white"
    >
      <defs>
        <marker id={`arrow-${uniqueId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#1e293b" />
        </marker>
        <marker id={`arrow-rev-${uniqueId}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto">
          <path d="M8,0 L0,4 L8,8 L6,4 Z" fill="#1e293b" />
        </marker>
        <pattern id={`hatch-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* END VIEW */}
      <g transform={`translate(${endCx}, ${endCy})`}>
        <text x="0" y={-scaledOD / 2 - 14} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          END VIEW - Cross Section
        </text>

        <circle cx="0" cy="0" r={scaledOD / 2} fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />
        <circle cx="0" cy="0" r={scaledID / 2} fill="white" stroke="#1e293b" strokeWidth="2" />

        <path
          d={`M 0 ${-scaledOD / 2} A ${scaledOD / 2} ${scaledOD / 2} 0 1 1 0 ${scaledOD / 2} A ${scaledOD / 2} ${scaledOD / 2} 0 1 1 0 ${-scaledOD / 2}
              M 0 ${-scaledID / 2} A ${scaledID / 2} ${scaledID / 2} 0 1 0 0 ${scaledID / 2} A ${scaledID / 2} ${scaledID / 2} 0 1 0 0 ${-scaledID / 2}`}
          fill={`url(#hatch-${uniqueId})`}
          fillRule="evenodd"
        />

        <line
          x1={-scaledOD / 2 - 10}
          y1="0"
          x2={scaledOD / 2 + 10}
          y2="0"
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="10,3,3,3"
        />
        <line
          x1="0"
          y1={-scaledOD / 2 - 10}
          x2="0"
          y2={scaledOD / 2 + 10}
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="10,3,3,3"
        />

        {notches && notches.length > 0 && (
          <>
            <rect x={scaledOD / 2 - 8} y="-3" width="10" height="6" fill="#ef4444" />
            <text x={scaledOD / 2 + 15} y="4" fontSize="7" fill="#ef4444">OD-A</text>

            <rect x="-3" y={-scaledOD / 2 - 2} width="6" height="10" fill="#f59e0b" />
            <text x="8" y={-scaledOD / 2 + 5} fontSize="7" fill="#f59e0b">OD-C</text>

            <rect x={-scaledID / 2 - 2} y="-3" width="10" height="6" fill="#22c55e" />
            <text x={-scaledID / 2 - 25} y="4" fontSize="7" fill="#22c55e">ID-A</text>

            <rect x="-3" y={scaledID / 2 - 8} width="6" height="10" fill="#3b82f6" />
            <text x="8" y={scaledID / 2 - 2} fontSize="7" fill="#3b82f6">ID-C</text>
          </>
        )}

        {showDimensions && (
          <>
            <g transform={`translate(0, ${scaledOD / 2 + 25})`}>
              <line x1={-scaledOD / 2} y1="-10" x2={-scaledOD / 2} y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line x1={scaledOD / 2} y1="-10" x2={scaledOD / 2} y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line
                x1={-scaledOD / 2 + 5}
                y1="0"
                x2={scaledOD / 2 - 5}
                y2="0"
                stroke="#1e293b"
                strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`}
                markerEnd={`url(#arrow-${uniqueId})`}
              />
              <rect x="-36" y="-8" width="72" height="16" fill="white" />
              <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                OD: {od.toFixed(1)}mm
              </text>
            </g>

            <g transform={`translate(${scaledOD / 2 + 30}, 0)`}>
              <line x1="-10" y1={-scaledOD / 2} x2="5" y2={-scaledOD / 2} stroke="#1e293b" strokeWidth="0.5" />
              <line x1="-10" y1={-scaledID / 2} x2="5" y2={-scaledID / 2} stroke="#1e293b" strokeWidth="0.5" />
              <line
                x1="0"
                y1={-scaledOD / 2 + 5}
                x2="0"
                y2={-scaledID / 2 - 5}
                stroke="#1e293b"
                strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`}
                markerEnd={`url(#arrow-${uniqueId})`}
              />
              <rect x="-22" y={(-scaledOD / 2 - scaledID / 2) / 2 - 8} width="44" height="16" fill="white" />
              <text x="0" y={(-scaledOD / 2 - scaledID / 2) / 2 + 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b">
                t={wall.toFixed(1)}
              </text>
            </g>
          </>
        )}
      </g>

      {/* SIDE VIEW */}
      <g transform={`translate(${sideX}, ${sideY})`}>
        <text x={scaledLength / 2} y="-15" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          SIDE VIEW - Notch Locations
        </text>

        <rect
          x="0"
          y="0"
          width={scaledLength}
          height={scaledOD}
          fill="#f8fafc"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {notches && notches.map((notch, i) => {
          const notchScaled = Math.max(5, notch.length * scale * 0.3);
          const positions = [
            { x: scaledLength * 0.18, y: 0, label: 'OD-A' },
            { x: scaledLength * 0.38, y: 0, label: 'OD-C' },
            { x: scaledLength * 0.62, y: scaledOD - 8, label: 'ID-A' },
            { x: scaledLength * 0.82, y: scaledOD - 8, label: 'ID-C' },
          ];
          const pos = positions[i] || positions[0];
          const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

          return (
            <g key={`notch-side-${i}`}>
              <rect
                x={pos.x - notchScaled / 2}
                y={pos.y}
                width={notchScaled}
                height="8"
                fill={colors[i]}
              />
              <text
                x={pos.x}
                y={pos.y + (pos.y === 0 ? 20 : -5)}
                textAnchor="middle"
                fontSize="7"
                fill={colors[i]}
              >
                {pos.label}
              </text>
            </g>
          );
        })}

        {showDimensions && (
          <g transform={`translate(0, ${scaledOD + 25})`}>
            <line x1="0" y1="-10" x2="0" y2="5" stroke="#1e293b" strokeWidth="0.5" />
            <line x1={scaledLength} y1="-10" x2={scaledLength} y2="5" stroke="#1e293b" strokeWidth="0.5" />
            <line
              x1="5"
              y1="0"
              x2={scaledLength - 5}
              y2="0"
              stroke="#1e293b"
              strokeWidth="0.8"
              markerStart={`url(#arrow-rev-${uniqueId})`}
              markerEnd={`url(#arrow-${uniqueId})`}
            />
            <rect x={scaledLength / 2 - 32} y="-8" width="64" height="16" fill="white" />
            <text x={scaledLength / 2} y="5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              L: {dimensions.length.toFixed(1)}mm
            </text>
          </g>
        )}
      </g>

      {/* Specs box */}
      <g transform={`translate(${specsX}, ${specsY})`}>
        <rect x="0" y="0" width={rightPaneWidth} height="178" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="4" />
        <rect x="0" y="0" width={rightPaneWidth} height="25" fill="#ef4444" rx="4 4 0 0" />
        <text x={rightPaneWidth / 2} y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
          NOTCH SPECIFICATIONS
        </text>

        {notches && notches.length > 0 ? (
          <>
            <text x="10" y="42" fontSize="9" fill="#64748b">Type:</text>
            <text x="80" y="42" fontSize="9" fontWeight="600" fill="#1e293b">{notches[0].type.toUpperCase()}</text>

            <text x="10" y="57" fontSize="9" fill="#64748b">Depth:</text>
            <text x="80" y="57" fontSize="9" fontWeight="600" fill="#1e293b">
              {notches[0].depth.toFixed(2)}mm ({notches[0].depthPercent.toFixed(1)}% wall)
            </text>

            <text x="10" y="72" fontSize="9" fill="#64748b">Width:</text>
            <text x="80" y="72" fontSize="9" fontWeight="600" fill="#1e293b">{notches[0].width}mm</text>

            <text x="10" y="87" fontSize="9" fill="#64748b">Length:</text>
            <text x="80" y="87" fontSize="9" fontWeight="600" fill="#1e293b">{notches[0].length}mm</text>

            <line x1="10" y1="96" x2={rightPaneWidth - 10} y2="96" stroke="#e2e8f0" strokeWidth="1" />
            <text x="10" y="111" fontSize="8" fontWeight="600" fill="#1e293b">Locations (4):</text>
            <text x="15" y="126" fontSize="8" fill="#ef4444">- OD Axial</text>
            <text x="95" y="126" fontSize="8" fill="#f59e0b">- OD Circumferential</text>
            <text x="15" y="141" fontSize="8" fill="#22c55e">- ID Axial</text>
            <text x="95" y="141" fontSize="8" fill="#3b82f6">- ID Circumferential</text>
            <text x="10" y="157" fontSize="8" fill="#64748b">Units: mm</text>
            <text x="10" y="169" fontSize="8" fill="#64748b">Tol depth: {notches[0].depthTolerance}</text>
          </>
        ) : (
          <>
            <text x="10" y="48" fontSize="9" fill="#dc2626">No notch data available.</text>
            <text x="10" y="64" fontSize="8" fill="#64748b">Provide wall thickness / OD for full notch spec.</text>
          </>
        )}
      </g>
    </svg>
  );
}

// ============================================================================
// CURVED FBH BLOCK DRAWING
// ============================================================================

function CurvedFBHBlockDrawing({ spec, width, height, showDimensions, uniqueId }: BlockDrawingProps) {
  const margin = 36;
  const paneGap = 24;
  const rightPaneWidth = Math.max(195, Math.min(230, width * 0.25));
  const mainWidth = Math.max(320, width - margin * 2 - rightPaneWidth - paneGap);
  const { dimensions, fbhSpecs } = spec;

  const od = dimensions.outerDiameter || Math.max(dimensions.height * 3, 40);
  const arcAngle = Math.max(30, Math.min(180, dimensions.arcAngle || 90));

  const scaleX = (mainWidth - 90) / Math.max(od, 1);
  const scaleY = (height - margin * 2 - 180) / Math.max(od, 1);
  const scale = Math.max(0.45, Math.min(scaleX, scaleY, 2));

  const outerR = (od * scale) / 2;
  const innerR = Math.max(outerR - dimensions.height * scale, outerR * 0.45);
  const centerX = margin + mainWidth / 2;
  const centerY = margin + 72 + outerR;

  const startDeg = -arcAngle / 2;
  const endDeg = arcAngle / 2;
  const largeArcFlag = arcAngle > 180 ? 1 : 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const polar = (r: number, deg: number) => ({
    x: r * Math.cos(toRad(deg)),
    y: r * Math.sin(toRad(deg)),
  });

  const outerStart = polar(outerR, startDeg);
  const outerEnd = polar(outerR, endDeg);
  const innerStart = polar(innerR, startDeg);
  const innerEnd = polar(innerR, endDeg);

  const specsX = margin + mainWidth + paneGap;
  const specsY = margin + 20;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block mx-auto bg-white"
    >
      <defs>
        <marker id={`arrow-${uniqueId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#1e293b" />
        </marker>
        <marker id={`arrow-rev-${uniqueId}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto">
          <path d="M8,0 L0,4 L8,8 L6,4 Z" fill="#1e293b" />
        </marker>
        <pattern id={`hatch-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.5" />
        </pattern>
      </defs>

      <g transform={`translate(${centerX}, ${centerY})`}>
        <text x="0" y={-outerR - 24} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          CURVED REFERENCE BLOCK - PLAN VIEW
        </text>

        <path
          d={`M ${outerStart.x} ${outerStart.y}
              A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}
              L ${innerEnd.x} ${innerEnd.y}
              A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
              Z`}
          fill={`url(#hatch-${uniqueId})`}
          stroke="#1e293b"
          strokeWidth="2"
        />

        <line
          x1={-outerR - 10}
          y1="0"
          x2={outerR + 10}
          y2="0"
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="10,3,3,3"
        />
        <line
          x1="0"
          y1={-outerR - 10}
          x2="0"
          y2={outerR + 10}
          stroke="#dc2626"
          strokeWidth="0.5"
          strokeDasharray="10,3,3,3"
        />

        {fbhSpecs.depths.map((depth, index) => {
          const angle = startDeg + (arcAngle / (fbhSpecs.depths.length + 1)) * (index + 1);
          const p = polar((outerR + innerR) / 2, angle);
          const label = polar(outerR + 18, angle);

          return (
            <g key={`arc-hole-${index}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" />
              <text x={label.x} y={label.y} textAnchor="middle" fontSize="8" fill="#1e293b">
                {depth.toFixed(1)}
              </text>
            </g>
          );
        })}

        {showDimensions && (
          <>
            <text x="0" y={outerR + 28} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              OD: {od.toFixed(1)}mm | Arc: {arcAngle.toFixed(0)} deg
            </text>
            <text x="0" y={outerR + 43} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              Thickness: {dimensions.height.toFixed(1)}mm | Length: {dimensions.length.toFixed(1)}mm
            </text>
          </>
        )}
      </g>

      {/* Specs box */}
      <g transform={`translate(${specsX}, ${specsY})`}>
        <rect x="0" y="0" width={rightPaneWidth} height="145" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="4" />
        <rect x="0" y="0" width={rightPaneWidth} height="25" fill="#3b82f6" rx="4 4 0 0" />
        <text x={rightPaneWidth / 2} y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
          CURVED BLOCK SPECS
        </text>

        <text x="10" y="42" fontSize="9" fill="#64748b">Part OD Match:</text>
        <text x="90" y="42" fontSize="9" fontWeight="600" fill="#1e293b">{od.toFixed(1)}mm</text>

        <text x="10" y="57" fontSize="9" fill="#64748b">FBH Size:</text>
        <text x="90" y="57" fontSize="9" fontWeight="600" fill="#1e293b">
          #{fbhSpecs.fbhNumber} ({fbhSpecs.diameterInch})
        </text>

        <text x="10" y="72" fontSize="9" fill="#64748b">FBH Depths:</text>
        <text x="90" y="72" fontSize="9" fontWeight="600" fill="#1e293b">
          {fbhSpecs.depths.map((d) => d.toFixed(1)).join(', ')}
        </text>

        <text x="10" y="87" fontSize="9" fill="#64748b">Arc Angle:</text>
        <text x="90" y="87" fontSize="9" fontWeight="600" fill="#1e293b">{arcAngle.toFixed(0)} deg</text>

        <line x1="10" y1="96" x2={rightPaneWidth - 10} y2="96" stroke="#e2e8f0" strokeWidth="1" />

        <text x="10" y="111" fontSize="8" fill="#64748b">Units: mm</text>
        <text x="10" y="123" fontSize="8" fill="#64748b">Tol: L/W +/-0.5, H +/-0.25</text>
        <text x="10" y="135" fontSize="8" fill="#64748b">Curvature within +/-10% OD</text>
      </g>
    </svg>
  );
}

// ============================================================================
// SPECIFICATIONS TABLE
// ============================================================================

function SpecificationsTable({ spec }: { spec: CalibrationBlockSpecification }) {
  const { dimensions, fbhSpecs, material, notches } = spec;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Block Dimensions */}
      <div className="bg-white border rounded-lg p-3">
        <h4 className="font-semibold text-sm text-gray-800 mb-2 border-b pb-1">Block Dimensions</h4>
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="text-gray-500 py-0.5">Length:</td>
              <td className="font-medium">{dimensions.length.toFixed(1)}mm {dimensions.lengthTolerance}</td>
            </tr>
            <tr>
              <td className="text-gray-500 py-0.5">Width:</td>
              <td className="font-medium">{dimensions.width.toFixed(1)}mm {dimensions.widthTolerance}</td>
            </tr>
            <tr>
              <td className="text-gray-500 py-0.5">Height:</td>
              <td className="font-medium">{dimensions.height.toFixed(1)}mm {dimensions.heightTolerance}</td>
            </tr>
            {dimensions.outerDiameter && (
              <tr>
                <td className="text-gray-500 py-0.5">OD:</td>
                <td className="font-medium">{dimensions.outerDiameter.toFixed(1)}mm</td>
              </tr>
            )}
            <tr>
              <td className="text-gray-500 py-0.5">Surface:</td>
              <td className="font-medium">Ra ≤ {dimensions.surfaceFinishRa}μm</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FBH Specifications */}
      <div className="bg-white border rounded-lg p-3">
        <h4 className="font-semibold text-sm text-gray-800 mb-2 border-b pb-1">FBH Specifications</h4>
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="text-gray-500 py-0.5">FBH #:</td>
              <td className="font-medium">#{fbhSpecs.fbhNumber}</td>
            </tr>
            <tr>
              <td className="text-gray-500 py-0.5">Diameter:</td>
              <td className="font-medium">{fbhSpecs.diameterInch} ({fbhSpecs.diameter.toFixed(2)}mm)</td>
            </tr>
            <tr>
              <td className="text-gray-500 py-0.5">Depths:</td>
              <td className="font-medium">{fbhSpecs.depths.map(d => d.toFixed(1)).join(', ')}mm</td>
            </tr>
            <tr>
              <td className="text-gray-500 py-0.5">Drilling:</td>
              <td className="font-medium">{fbhSpecs.drillingAngle}° (perpendicular)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Material & Notches */}
      <div className="bg-white border rounded-lg p-3">
        <h4 className="font-semibold text-sm text-gray-800 mb-2 border-b pb-1">
          {notches && notches.length > 0 ? 'Notch Specs' : 'Material'}
        </h4>
        {notches && notches.length > 0 ? (
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="text-gray-500 py-0.5">Type:</td>
                <td className="font-medium">{notches[0].type.toUpperCase()}</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Depth:</td>
                <td className="font-medium">{notches[0].depth.toFixed(2)}mm ({notches[0].depthPercent.toFixed(1)}%)</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Width:</td>
                <td className="font-medium">{notches[0].width}mm</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Length:</td>
                <td className="font-medium">{notches[0].length}mm</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Count:</td>
                <td className="font-medium">{notches.length} notches</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="text-gray-500 py-0.5">Material:</td>
                <td className="font-medium">{material.name}</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Spec:</td>
                <td className="font-medium text-[10px]">{material.specification}</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Velocity:</td>
                <td className="font-medium">{material.acousticVelocity} m/s</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">Impedance:</td>
                <td className="font-medium">{material.acousticImpedance} MRayl</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DynamicCalibrationBlockDrawing;

