/**
 * Patch Visualizer Component
 *
 * Displays a 2D visualization of scan patches overlaid on the part geometry.
 * Shows coverage, patch boundaries, scan directions, and validation status.
 *
 * Used in: Scan Details Tab, CSI Export Preview
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  PatchPlan,
  Patch,
  PatchGeometry,
  PartGeometry,
  PatchValidationResult,
} from '@/types/techniqueSheet';

// ============================================================================
// Types
// ============================================================================

interface PatchVisualizerProps {
  patchPlan: PatchPlan;
  partDimensions: {
    length: number;
    width: number;
    thickness?: number;
    outerDiameter?: number;
    innerDiameter?: number;
  };
  partGeometry: PartGeometry;
  validationResults?: PatchValidationResult[];
  selectedPatchId?: string;
  onPatchSelect?: (patchId: string) => void;
  showLabels?: boolean;
  showDirections?: boolean;
  showCoverage?: boolean;
  className?: string;
}

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

// ============================================================================
// Color Schemes
// ============================================================================

const PATCH_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#a855f7', // purple
];

const STATUS_COLORS = {
  planned: '#3b82f6',
  validated: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

// ============================================================================
// Helper Functions
// ============================================================================

function getPatchColor(index: number, status?: Patch['status']): string {
  if (status === 'error') return STATUS_COLORS.error;
  if (status === 'warning') return STATUS_COLORS.warning;
  if (status === 'validated') return STATUS_COLORS.validated;
  return PATCH_COLORS[index % PATCH_COLORS.length];
}

function calculateViewBox(
  partDimensions: PatchVisualizerProps['partDimensions'],
  partGeometry: PartGeometry
): ViewBox {
  const padding = 20;

  // For circular parts
  if (['cylinder', 'tube', 'pipe', 'disk', 'ring'].includes(partGeometry)) {
    const diameter = partDimensions.outerDiameter || partDimensions.width;
    const size = diameter + padding * 2;
    return {
      minX: -size / 2,
      minY: -size / 2,
      width: size,
      height: size,
    };
  }

  // For flat/rectangular parts
  return {
    minX: -padding,
    minY: -padding,
    width: partDimensions.length + padding * 2,
    height: partDimensions.width + padding * 2,
  };
}

function getDirectionArrow(direction: string): { dx: number; dy: number; label: string } {
  const arrows: Record<string, { dx: number; dy: number; label: string }> = {
    A: { dx: 0, dy: -1, label: 'A (Top)' },
    B: { dx: 0, dy: 1, label: 'B (Bottom)' },
    C: { dx: 1, dy: 0, label: 'C (Right)' },
    D: { dx: -1, dy: 0, label: 'D (Left)' },
    E: { dx: 0.7, dy: -0.7, label: 'E (45°)' },
    F: { dx: -0.7, dy: -0.7, label: 'F (135°)' },
    G: { dx: -0.7, dy: 0.7, label: 'G (225°)' },
    H: { dx: 0.7, dy: 0.7, label: 'H (315°)' },
  };
  return arrows[direction] || { dx: 0, dy: -1, label: direction };
}

// ============================================================================
// Sub-Components
// ============================================================================

interface PatchShapeProps {
  patch: Patch;
  color: string;
  isSelected: boolean;
  showLabel: boolean;
  showDirection: boolean;
  onClick?: () => void;
  validation?: PatchValidationResult;
}

const PatchShape: React.FC<PatchShapeProps> = ({
  patch,
  color,
  isSelected,
  showLabel,
  showDirection,
  onClick,
  validation,
}) => {
  const { geometry } = patch;

  // Calculate center for labels
  const center = useMemo(() => {
    if (geometry.shape === 'rectangle') {
      return {
        x: (geometry.x || 0) + (geometry.width || 0) / 2,
        y: (geometry.y || 0) + (geometry.height || 0) / 2,
      };
    }
    if (geometry.shape === 'arc' || geometry.shape === 'annular') {
      const midAngle = ((geometry.startAngle || 0) + (geometry.endAngle || 360)) / 2;
      const midRadius = ((geometry.innerRadius || 0) + (geometry.outerRadius || 0)) / 2;
      return {
        x: Math.cos((midAngle * Math.PI) / 180) * midRadius,
        y: Math.sin((midAngle * Math.PI) / 180) * midRadius,
      };
    }
    return { x: 0, y: 0 };
  }, [geometry]);

  const arrow = getDirectionArrow(patch.direction);

  // Render based on shape
  if (geometry.shape === 'rectangle') {
    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <rect
          x={geometry.x || 0}
          y={geometry.y || 0}
          width={geometry.width || 0}
          height={geometry.height || 0}
          fill={color}
          fillOpacity={isSelected ? 0.5 : 0.3}
          stroke={isSelected ? '#000' : color}
          strokeWidth={isSelected ? 2 : 1}
          strokeDasharray={validation?.isValid === false ? '5,5' : undefined}
        />
        {showLabel && (
          <text
            x={center.x}
            y={center.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#000"
          >
            {patch.id}
          </text>
        )}
        {showDirection && (
          <line
            x1={center.x}
            y1={center.y}
            x2={center.x + arrow.dx * 15}
            y2={center.y + arrow.dy * 15}
            stroke="#000"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        )}
      </g>
    );
  }

  if (geometry.shape === 'arc') {
    const startAngle = ((geometry.startAngle || 0) * Math.PI) / 180;
    const endAngle = ((geometry.endAngle || 360) * Math.PI) / 180;
    const outerR = geometry.outerRadius || 50;
    const innerR = geometry.innerRadius || 0;

    // Calculate arc path
    const x1 = Math.cos(startAngle) * outerR;
    const y1 = Math.sin(startAngle) * outerR;
    const x2 = Math.cos(endAngle) * outerR;
    const y2 = Math.sin(endAngle) * outerR;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const path = innerR > 0
      ? `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
         L ${Math.cos(endAngle) * innerR} ${Math.sin(endAngle) * innerR}
         A ${innerR} ${innerR} 0 ${largeArc} 0 ${Math.cos(startAngle) * innerR} ${Math.sin(startAngle) * innerR} Z`
      : `M 0 0 L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <path
          d={path}
          fill={color}
          fillOpacity={isSelected ? 0.5 : 0.3}
          stroke={isSelected ? '#000' : color}
          strokeWidth={isSelected ? 2 : 1}
          strokeDasharray={validation?.isValid === false ? '5,5' : undefined}
        />
        {showLabel && (
          <text
            x={center.x}
            y={center.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#000"
          >
            {patch.id}
          </text>
        )}
      </g>
    );
  }

  if (geometry.shape === 'annular') {
    const outerR = geometry.outerRadius || 50;
    const innerR = geometry.innerRadius || 20;

    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <circle
          cx={0}
          cy={0}
          r={outerR}
          fill={color}
          fillOpacity={isSelected ? 0.5 : 0.3}
          stroke={isSelected ? '#000' : color}
          strokeWidth={isSelected ? 2 : 1}
        />
        <circle
          cx={0}
          cy={0}
          r={innerR}
          fill="#fff"
        />
        {showLabel && (
          <text
            x={(outerR + innerR) / 2}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#000"
          >
            {patch.id}
          </text>
        )}
      </g>
    );
  }

  return null;
};

// ============================================================================
// Part Outline Component
// ============================================================================

interface PartOutlineProps {
  partDimensions: PatchVisualizerProps['partDimensions'];
  partGeometry: PartGeometry;
}

const PartOutline: React.FC<PartOutlineProps> = ({ partDimensions, partGeometry }) => {
  // Circular parts
  if (['cylinder', 'tube', 'pipe', 'disk', 'ring'].includes(partGeometry)) {
    const outerR = (partDimensions.outerDiameter || partDimensions.width) / 2;
    const innerR = partDimensions.innerDiameter ? partDimensions.innerDiameter / 2 : 0;

    return (
      <g>
        <circle
          cx={0}
          cy={0}
          r={outerR}
          fill="none"
          stroke="#374151"
          strokeWidth="2"
        />
        {innerR > 0 && (
          <circle
            cx={0}
            cy={0}
            r={innerR}
            fill="#f3f4f6"
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}
        {/* Center mark */}
        <line x1={-5} y1={0} x2={5} y2={0} stroke="#9ca3af" strokeWidth="1" />
        <line x1={0} y1={-5} x2={0} y2={5} stroke="#9ca3af" strokeWidth="1" />
      </g>
    );
  }

  // Rectangular parts
  return (
    <rect
      x={0}
      y={0}
      width={partDimensions.length}
      height={partDimensions.width}
      fill="none"
      stroke="#374151"
      strokeWidth="2"
    />
  );
};

// ============================================================================
// Legend Component
// ============================================================================

interface LegendProps {
  patches: Patch[];
  validationResults?: PatchValidationResult[];
}

const Legend: React.FC<LegendProps> = ({ patches, validationResults }) => {
  const validCount = validationResults?.filter(v => v.isValid).length || 0;
  const warningCount = validationResults?.filter(v => v.warnings.length > 0 && v.isValid).length || 0;
  const errorCount = validationResults?.filter(v => !v.isValid).length || 0;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Badge variant="outline" className="text-xs">
        {patches.length} Patches
      </Badge>
      {validationResults && (
        <>
          {validCount > 0 && (
            <Badge className="bg-green-500 text-xs">
              {validCount} Valid
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="bg-yellow-500 text-xs">
              {warningCount} Warnings
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge className="bg-red-500 text-xs">
              {errorCount} Errors
            </Badge>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const PatchVisualizer: React.FC<PatchVisualizerProps> = ({
  patchPlan,
  partDimensions,
  partGeometry,
  validationResults,
  selectedPatchId,
  onPatchSelect,
  showLabels = true,
  showDirections = true,
  showCoverage = true,
  className,
}) => {
  const viewBox = useMemo(
    () => calculateViewBox(partDimensions, partGeometry),
    [partDimensions, partGeometry]
  );

  const validationMap = useMemo(() => {
    if (!validationResults) return {};
    return Object.fromEntries(validationResults.map(v => [v.patchId, v]));
  }, [validationResults]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Patch Plan Visualization</CardTitle>
          {showCoverage && (
            <Badge variant={patchPlan.totalCoverage >= 100 ? 'default' : 'destructive'}>
              {patchPlan.totalCoverage.toFixed(1)}% Coverage
            </Badge>
          )}
        </div>
        <Legend patches={patchPlan.patches} validationResults={validationResults} />
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <svg
            viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
            className="w-full h-auto border rounded-lg bg-gray-50"
            style={{ minHeight: '300px', maxHeight: '500px' }}
          >
            {/* Definitions */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
              </marker>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            {/* Background grid */}
            <rect
              x={viewBox.minX}
              y={viewBox.minY}
              width={viewBox.width}
              height={viewBox.height}
              fill="url(#grid)"
            />

            {/* Part outline */}
            <PartOutline partDimensions={partDimensions} partGeometry={partGeometry} />

            {/* Patches */}
            {patchPlan.patches.map((patch, index) => (
              <Tooltip key={patch.id}>
                <TooltipTrigger asChild>
                  <g>
                    <PatchShape
                      patch={patch}
                      color={getPatchColor(index, patch.status)}
                      isSelected={selectedPatchId === patch.id}
                      showLabel={showLabels}
                      showDirection={showDirections}
                      onClick={onPatchSelect ? () => onPatchSelect(patch.id) : undefined}
                      validation={validationMap[patch.id]}
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{patch.name}</p>
                    <p>Direction: {patch.direction}</p>
                    <p>Strategy: {patch.scanStrategy}</p>
                    <p>Speed: {patch.scanSpeed} mm/s</p>
                    <p>Index: {patch.scanIndex} mm</p>
                    <p>Coverage: {patch.coverage}%</p>
                    <p>Est. Time: {patch.estimatedTime.toFixed(0)}s</p>
                    {validationMap[patch.id] && !validationMap[patch.id].isValid && (
                      <p className="text-red-500 font-bold">
                        {validationMap[patch.id].errors.join(', ')}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Excluded zones */}
            {patchPlan.excludedZones.map((zone, index) => (
              <Tooltip key={`zone-${index}`}>
                <TooltipTrigger asChild>
                  <g>
                    {zone.geometry.shape === 'rectangle' && (
                      <rect
                        x={zone.geometry.x || 0}
                        y={zone.geometry.y || 0}
                        width={zone.geometry.width || 0}
                        height={zone.geometry.height || 0}
                        fill="#ef4444"
                        fillOpacity={0.2}
                        stroke="#ef4444"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                    )}
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Excluded: {zone.reason}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Scale indicator */}
            <g transform={`translate(${viewBox.minX + 10}, ${viewBox.minY + viewBox.height - 20})`}>
              <line x1={0} y1={0} x2={50} y2={0} stroke="#374151" strokeWidth="2" />
              <line x1={0} y1={-3} x2={0} y2={3} stroke="#374151" strokeWidth="2" />
              <line x1={50} y1={-3} x2={50} y2={3} stroke="#374151" strokeWidth="2" />
              <text x={25} y={12} textAnchor="middle" fontSize="8" fill="#374151">
                50mm
              </text>
            </g>
          </svg>
        </TooltipProvider>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-gray-600">
          <div className="text-center">
            <div className="font-bold text-lg">{patchPlan.totalPatches}</div>
            <div>Patches</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{patchPlan.totalPasses}</div>
            <div>Passes</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{Math.round(patchPlan.estimatedTotalTime / 60)}</div>
            <div>Minutes</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{patchPlan.optimizationScore}</div>
            <div>Score</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatchVisualizer;
