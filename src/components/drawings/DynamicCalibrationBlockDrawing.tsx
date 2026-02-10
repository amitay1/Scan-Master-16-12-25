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
}: DynamicCalibrationBlockDrawingProps) {
  const uniqueId = useId().replace(/:/g, '');

  // Calculate block specification
  const blockSpec = useMemo(() => {
    return calculateCalibrationBlockSpec(
      partGeometry,
      partDimensions,
      standard,
      acceptanceClass,
      partMaterial
    );
  }, [partGeometry, partDimensions, standard, acceptanceClass, partMaterial]);

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
  // Scale calculation
  const margin = 60;
  const drawingWidth = width - margin * 2;
  const drawingHeight = height - margin * 2 - 100; // Leave space for table

  // Calculate scale to fit block
  const { dimensions, fbhSpecs } = spec;
  const scaleX = drawingWidth / (dimensions.length * 1.5);
  const scaleY = drawingHeight / (dimensions.height * 4);
  const scale = Math.min(scaleX, scaleY, 3); // Max scale 3

  const scaledLength = dimensions.length * scale;
  const scaledWidth = dimensions.width * scale;
  const scaledHeight = dimensions.height * scale;

  // View positions
  const topViewY = margin;
  const sideViewY = margin + scaledWidth + 80;

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
      <g transform={`translate(${margin}, ${topViewY})`}>
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          TOP VIEW
        </text>

        {/* Block outline */}
        <rect
          x="0" y="0"
          width={scaledLength}
          height={scaledWidth}
          fill="#f8fafc"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Center lines */}
        <line x1={scaledLength / 2} y1="-8" x2={scaledLength / 2} y2={scaledWidth + 8}
          stroke="#dc2626" strokeWidth="0.5" strokeDasharray="10,3,3,3" />
        <line x1="-8" y1={scaledWidth / 2} x2={scaledLength + 8} y2={scaledWidth / 2}
          stroke="#dc2626" strokeWidth="0.5" strokeDasharray="10,3,3,3" />

        {/* FBH holes */}
        {fbhSpecs.depths.map((depth, index) => {
          const spacing = scaledLength / (fbhSpecs.depths.length + 1);
          const x = spacing * (index + 1);
          const holeRadius = Math.max(fbhSpecs.diameter * scale * 3, 4);

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
              <text x={x} y={scaledWidth / 2 + holeRadius + 12}
                textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e293b">
                {depth.toFixed(1)}mm
              </text>
            </g>
          );
        })}

        {/* Dimensions */}
        {showDimensions && (
          <>
            {/* Length */}
            <g transform={`translate(0, ${scaledWidth + 25})`}>
              <line x1="0" y1="-10" x2="0" y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line x1={scaledLength} y1="-10" x2={scaledLength} y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line x1="5" y1="0" x2={scaledLength - 5} y2="0" stroke="#1e293b" strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`} markerEnd={`url(#arrow-${uniqueId})`} />
              <rect x={scaledLength / 2 - 30} y="-8" width="60" height="16" fill="white" />
              <text x={scaledLength / 2} y="5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                {dimensions.length.toFixed(1)} {dimensions.lengthTolerance}
              </text>
            </g>

            {/* Width */}
            <g transform={`translate(${scaledLength + 20}, 0)`}>
              <line x1="-10" y1="0" x2="5" y2="0" stroke="#1e293b" strokeWidth="0.5" />
              <line x1="-10" y1={scaledWidth} x2="5" y2={scaledWidth} stroke="#1e293b" strokeWidth="0.5" />
              <line x1="0" y1="5" x2="0" y2={scaledWidth - 5} stroke="#1e293b" strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`} markerEnd={`url(#arrow-${uniqueId})`} />
              <rect x="-25" y={scaledWidth / 2 - 8} width="50" height="16" fill="white" />
              <text x="0" y={scaledWidth / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                {dimensions.width.toFixed(1)}
              </text>
            </g>
          </>
        )}
      </g>

      {/* SIDE VIEW (SECTION) */}
      <g transform={`translate(${margin}, ${sideViewY})`}>
        <text x={scaledLength / 2} y="-10" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          SIDE VIEW - Section with FBH
        </text>

        {/* Block with hatching */}
        <rect
          x="0" y="0"
          width={scaledLength}
          height={scaledHeight * 2}
          fill={`url(#hatch-${uniqueId})`}
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* FBH holes in section */}
        {fbhSpecs.depths.map((depth, index) => {
          const spacing = scaledLength / (fbhSpecs.depths.length + 1);
          const x = spacing * (index + 1);
          const depthScaled = (depth / dimensions.height) * scaledHeight * 2;

          return (
            <g key={`section-hole-${index}`}>
              <line
                x1={x} y1="0"
                x2={x} y2={Math.min(depthScaled, scaledHeight * 2 - 5)}
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <line
                x1={x - 4} y1={Math.min(depthScaled, scaledHeight * 2 - 5)}
                x2={x + 4} y2={Math.min(depthScaled, scaledHeight * 2 - 5)}
                stroke="#3b82f6"
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* Height dimension */}
        {showDimensions && (
          <g transform={`translate(${scaledLength + 20}, 0)`}>
            <line x1="-10" y1="0" x2="5" y2="0" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="-10" y1={scaledHeight * 2} x2="5" y2={scaledHeight * 2} stroke="#1e293b" strokeWidth="0.5" />
            <line x1="0" y1="5" x2="0" y2={scaledHeight * 2 - 5} stroke="#1e293b" strokeWidth="0.8"
              markerStart={`url(#arrow-rev-${uniqueId})`} markerEnd={`url(#arrow-${uniqueId})`} />
            <rect x="-25" y={scaledHeight - 8} width="50" height="16" fill="white" />
            <text x="0" y={scaledHeight + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              {dimensions.height.toFixed(1)}
            </text>
          </g>
        )}
      </g>

      {/* FBH Info Box */}
      <g transform={`translate(${width - 220}, ${margin})`}>
        <rect x="0" y="0" width="200" height="100" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="4" />
        <rect x="0" y="0" width="200" height="25" fill="#3b82f6" rx="4 4 0 0" />
        <text x="100" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
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
          {fbhSpecs.depths.map(d => d.toFixed(1)).join(', ')}mm
        </text>

        <text x="10" y="87" fontSize="9" fill="#64748b">Drilling:</text>
        <text x="80" y="87" fontSize="9" fontWeight="600" fill="#1e293b">Perpendicular (0°)</text>
      </g>
    </svg>
  );
}

// ============================================================================
// CYLINDER NOTCHED BLOCK DRAWING
// ============================================================================

function CylinderNotchedBlockDrawing({ spec, width, height, showDimensions, uniqueId }: BlockDrawingProps) {
  const margin = 60;
  const { dimensions, notches } = spec;

  // Use OD/ID from spec when available.
  // Fallback: height represents wall thickness for cylinder_notched blocks,
  // so derive OD/ID from it using realistic proportions rather than arbitrary
  // multipliers. If only one of OD or ID is known, compute the other from
  // OD = ID + 2*wall (wall = dimensions.height).
  let od: number;
  let id: number;
  if (dimensions.outerDiameter) {
    od = dimensions.outerDiameter;
    id = dimensions.innerDiameter || od - 2 * dimensions.height;
  } else if (dimensions.innerDiameter) {
    id = dimensions.innerDiameter;
    od = id + 2 * dimensions.height;
  } else {
    // Neither available -- estimate a plausible tube cross-section.
    // Use 5x wall thickness as OD (typical thin-wall ratio) with a
    // floor of 40mm so the drawing remains legible for very thin walls.
    od = Math.max(dimensions.height * 5, 40);
    id = od - 2 * dimensions.height;
  }
  const wall = (od - id) / 2;

  // Scale
  const scale = Math.min((width - margin * 2) / (od * 2), (height - margin * 2 - 150) / (dimensions.length * 1.5), 2);

  const scaledOD = od * scale;
  const scaledID = id * scale;
  const scaledLength = dimensions.length * scale;

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

      {/* END VIEW - Circular cross-section */}
      <g transform={`translate(${margin + scaledOD / 2 + 20}, ${margin + scaledOD / 2 + 20})`}>
        <text x="0" y={-scaledOD / 2 - 15} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          END VIEW - Cross Section
        </text>

        {/* Outer circle */}
        <circle cx="0" cy="0" r={scaledOD / 2} fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />

        {/* Inner circle (bore) */}
        <circle cx="0" cy="0" r={scaledID / 2} fill="white" stroke="#1e293b" strokeWidth="2" />

        {/* Wall hatching */}
        <path
          d={`M 0 ${-scaledOD / 2} A ${scaledOD / 2} ${scaledOD / 2} 0 1 1 0 ${scaledOD / 2} A ${scaledOD / 2} ${scaledOD / 2} 0 1 1 0 ${-scaledOD / 2}
              M 0 ${-scaledID / 2} A ${scaledID / 2} ${scaledID / 2} 0 1 0 0 ${scaledID / 2} A ${scaledID / 2} ${scaledID / 2} 0 1 0 0 ${-scaledID / 2}`}
          fill={`url(#hatch-${uniqueId})`}
          fillRule="evenodd"
        />

        {/* Center lines */}
        <line x1={-scaledOD / 2 - 10} y1="0" x2={scaledOD / 2 + 10} y2="0"
          stroke="#dc2626" strokeWidth="0.5" strokeDasharray="10,3,3,3" />
        <line x1="0" y1={-scaledOD / 2 - 10} x2="0" y2={scaledOD / 2 + 10}
          stroke="#dc2626" strokeWidth="0.5" strokeDasharray="10,3,3,3" />

        {/* Notch indicators */}
        {notches && notches.length > 0 && (
          <>
            {/* OD Axial notch */}
            <rect x={scaledOD / 2 - 8} y="-3" width="10" height="6" fill="#ef4444" />
            <text x={scaledOD / 2 + 15} y="4" fontSize="7" fill="#ef4444">OD-A</text>

            {/* OD Circumferential notch */}
            <rect x="-3" y={-scaledOD / 2 - 2} width="6" height="10" fill="#f59e0b" />
            <text x="8" y={-scaledOD / 2 + 5} fontSize="7" fill="#f59e0b">OD-C</text>

            {/* ID Axial notch */}
            <rect x={-scaledID / 2 - 2} y="-3" width="10" height="6" fill="#22c55e" />
            <text x={-scaledID / 2 - 25} y="4" fontSize="7" fill="#22c55e">ID-A</text>

            {/* ID Circumferential notch */}
            <rect x="-3" y={scaledID / 2 - 8} width="6" height="10" fill="#3b82f6" />
            <text x="8" y={scaledID / 2 - 2} fontSize="7" fill="#3b82f6">ID-C</text>
          </>
        )}

        {/* Dimensions */}
        {showDimensions && (
          <>
            {/* OD */}
            <g transform={`translate(0, ${scaledOD / 2 + 25})`}>
              <line x1={-scaledOD / 2} y1="-10" x2={-scaledOD / 2} y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line x1={scaledOD / 2} y1="-10" x2={scaledOD / 2} y2="5" stroke="#1e293b" strokeWidth="0.5" />
              <line x1={-scaledOD / 2 + 5} y1="0" x2={scaledOD / 2 - 5} y2="0" stroke="#1e293b" strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`} markerEnd={`url(#arrow-${uniqueId})`} />
              <rect x="-35" y="-8" width="70" height="16" fill="white" />
              <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                OD: {od.toFixed(1)}mm
              </text>
            </g>

            {/* Wall thickness */}
            <g transform={`translate(${scaledOD / 2 + 30}, 0)`}>
              <line x1="-10" y1={-scaledOD / 2} x2="5" y2={-scaledOD / 2} stroke="#1e293b" strokeWidth="0.5" />
              <line x1="-10" y1={-scaledID / 2} x2="5" y2={-scaledID / 2} stroke="#1e293b" strokeWidth="0.5" />
              <line x1="0" y1={-scaledOD / 2 + 5} x2="0" y2={-scaledID / 2 - 5} stroke="#1e293b" strokeWidth="0.8"
                markerStart={`url(#arrow-rev-${uniqueId})`} markerEnd={`url(#arrow-${uniqueId})`} />
              <rect x="-20" y={(-scaledOD / 2 - scaledID / 2) / 2 - 8} width="40" height="16" fill="white" />
              <text x="0" y={(-scaledOD / 2 - scaledID / 2) / 2 + 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b">
                t={wall.toFixed(1)}
              </text>
            </g>
          </>
        )}
      </g>

      {/* SIDE VIEW - Cylinder length */}
      <g transform={`translate(${margin + scaledOD + 100}, ${margin + 30})`}>
        <text x={scaledLength / 2} y="-15" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          SIDE VIEW - Notch Locations
        </text>

        {/* Outer rectangle (cylinder profile) */}
        <rect
          x="0" y="0"
          width={scaledLength}
          height={scaledOD}
          fill="#f8fafc"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Notch representations */}
        {notches && notches.map((notch, i) => {
          const notchScaled = notch.length * scale * 0.3;
          const positions = [
            { x: scaledLength * 0.2, y: 0, label: 'OD-A' },
            { x: scaledLength * 0.4, y: 0, label: 'OD-C' },
            { x: scaledLength * 0.6, y: scaledOD - 5, label: 'ID-A' },
            { x: scaledLength * 0.8, y: scaledOD - 5, label: 'ID-C' },
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

        {/* Length dimension */}
        {showDimensions && (
          <g transform={`translate(0, ${scaledOD + 25})`}>
            <line x1="0" y1="-10" x2="0" y2="5" stroke="#1e293b" strokeWidth="0.5" />
            <line x1={scaledLength} y1="-10" x2={scaledLength} y2="5" stroke="#1e293b" strokeWidth="0.5" />
            <line x1="5" y1="0" x2={scaledLength - 5} y2="0" stroke="#1e293b" strokeWidth="0.8"
              markerStart={`url(#arrow-rev-${uniqueId})`} markerEnd={`url(#arrow-${uniqueId})`} />
            <rect x={scaledLength / 2 - 30} y="-8" width="60" height="16" fill="white" />
            <text x={scaledLength / 2} y="5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              L: {dimensions.length.toFixed(1)}mm
            </text>
          </g>
        )}
      </g>

      {/* Notch Specs Box */}
      {notches && notches.length > 0 && (
        <g transform={`translate(${width - 240}, ${height - 180})`}>
          <rect x="0" y="0" width="220" height="160" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="4" />
          <rect x="0" y="0" width="220" height="25" fill="#ef4444" rx="4 4 0 0" />
          <text x="110" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
            NOTCH SPECIFICATIONS
          </text>

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

          <line x1="10" y1="95" x2="210" y2="95" stroke="#e2e8f0" strokeWidth="1" />

          <text x="10" y="110" fontSize="8" fontWeight="600" fill="#1e293b">Locations (4 notches):</text>
          <text x="15" y="125" fontSize="8" fill="#ef4444">• OD Axial</text>
          <text x="80" y="125" fontSize="8" fill="#f59e0b">• OD Circumferential</text>
          <text x="15" y="140" fontSize="8" fill="#22c55e">• ID Axial</text>
          <text x="80" y="140" fontSize="8" fill="#3b82f6">• ID Circumferential</text>

          <text x="10" y="155" fontSize="7" fill="#64748b">Tolerance: {notches[0].depthTolerance}</text>
        </g>
      )}
    </svg>
  );
}

// ============================================================================
// CURVED FBH BLOCK DRAWING
// ============================================================================

function CurvedFBHBlockDrawing({ spec, width, height, showDimensions, uniqueId }: BlockDrawingProps) {
  // Similar to flat but with curved profile
  const margin = 60;
  const { dimensions, fbhSpecs } = spec;

  const od = dimensions.outerDiameter || dimensions.height * 3;
  const scale = Math.min((width - margin * 2) / (od * 1.5), (height - margin * 2 - 100) / (dimensions.length), 2);

  const scaledOD = od * scale;
  const scaledLength = dimensions.length * scale;
  const arcAngle = dimensions.arcAngle || 90;

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

      {/* Arc View */}
      <g transform={`translate(${width / 2}, ${margin + scaledOD / 2 + 50})`}>
        <text x="0" y={-scaledOD / 2 - 30} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
          CURVED REFERENCE BLOCK - {arcAngle}° Arc Segment
        </text>

        {/* Arc segment */}
        <path
          d={`M ${-scaledOD / 2} 0
              A ${scaledOD / 2} ${scaledOD / 2} 0 0 1 0 ${-scaledOD / 2}
              L 0 ${-scaledOD / 2 + dimensions.height * scale}
              A ${scaledOD / 2 - dimensions.height * scale} ${scaledOD / 2 - dimensions.height * scale} 0 0 0 ${-scaledOD / 2 + dimensions.height * scale} 0
              Z`}
          fill={`url(#hatch-${uniqueId})`}
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* FBH holes along the arc */}
        {fbhSpecs.depths.map((depth, index) => {
          const angle = -45 + (90 / (fbhSpecs.depths.length + 1)) * (index + 1);
          const angleRad = (angle * Math.PI) / 180;
          const x = (scaledOD / 2 - 10) * Math.cos(angleRad);
          const y = (scaledOD / 2 - 10) * Math.sin(angleRad);

          return (
            <g key={`arc-hole-${index}`}>
              <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" />
              <text
                x={x + Math.cos(angleRad) * 20}
                y={y + Math.sin(angleRad) * 20}
                textAnchor="middle"
                fontSize="8"
                fill="#1e293b"
              >
                {depth.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Dimensions */}
        {showDimensions && (
          <>
            <text x="0" y={scaledOD / 2 + 30} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              OD: {od.toFixed(1)}mm | Arc: {arcAngle}°
            </text>
            <text x="0" y={scaledOD / 2 + 45} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              Thickness: {dimensions.height.toFixed(1)}mm | Length: {dimensions.length.toFixed(1)}mm
            </text>
          </>
        )}
      </g>

      {/* FBH Specs Box */}
      <g transform={`translate(${width - 220}, ${height - 150})`}>
        <rect x="0" y="0" width="200" height="130" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="4" />
        <rect x="0" y="0" width="200" height="25" fill="#3b82f6" rx="4 4 0 0" />
        <text x="100" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
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
          {fbhSpecs.depths.map(d => d.toFixed(1)).join(', ')}
        </text>

        <text x="10" y="87" fontSize="9" fill="#64748b">Arc Angle:</text>
        <text x="90" y="87" fontSize="9" fontWeight="600" fill="#1e293b">{arcAngle}°</text>

        <line x1="10" y1="95" x2="190" y2="95" stroke="#e2e8f0" strokeWidth="1" />

        <text x="10" y="110" fontSize="8" fill="#64748b">
          Block curvature matches part OD
        </text>
        <text x="10" y="122" fontSize="8" fill="#64748b">
          within ±10% tolerance
        </text>
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
