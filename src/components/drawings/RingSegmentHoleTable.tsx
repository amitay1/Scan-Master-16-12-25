/**
 * Ring Segment Hole Table Component
 *
 * Displays a table of hole specifications for a ring segment calibration block.
 * Shows hole ID, type, diameter, depth, angular position, and axial position.
 */

import type { ResolvedHole } from '@/types/ringSegmentBlock.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface RingSegmentHoleTableProps {
  /** Array of resolved holes */
  holes: ResolvedHole[];
  /** Show the "adjusted" indicator for modified depths */
  showAdjustedIndicator?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function RingSegmentHoleTable({
  holes,
  showAdjustedIndicator = true,
  className = '',
}: RingSegmentHoleTableProps) {
  if (holes.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        No holes defined in this block
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">ID</TableHead>
            <TableHead className="w-16 text-center">Type</TableHead>
            <TableHead className="w-20 text-right">Dia (mm)</TableHead>
            <TableHead className="w-24 text-right">Depth (mm)</TableHead>
            <TableHead className="w-20 text-right">Angle (°)</TableHead>
            <TableHead className="w-24 text-right">Axial (mm)</TableHead>
            <TableHead className="w-32">Definition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holes.map((hole) => (
            <TableRow key={hole.label}>
              <TableCell className="text-center font-bold text-red-600">
                {hole.label}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={hole.reflectorType === 'SDH' ? 'default' : 'secondary'}>
                  {hole.reflectorType}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {hole.diameterMm.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono">{hole.depthMm.toFixed(1)}</span>
                {showAdjustedIndicator && hole.wasAdjusted && (
                  <span
                    className="ml-1 inline-flex items-center"
                    title={`Original: ${hole.originalDepthMm.toFixed(1)}mm`}
                  >
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">
                {hole.angleOnArcDeg.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {hole.axialPositionMm.toFixed(1)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {hole.depthDefinition === 'radial_depth' ? 'Radial' : 'Drill Axis'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Legend for adjusted indicator */}
      {showAdjustedIndicator && holes.some((h) => h.wasAdjusted) && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
          <span>Depth adjusted due to thin-wall policy</span>
        </div>
      )}
    </div>
  );
}

export default RingSegmentHoleTable;
