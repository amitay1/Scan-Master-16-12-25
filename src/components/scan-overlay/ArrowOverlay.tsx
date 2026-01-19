/**
 * Arrow Overlay Component
 * Renders scan direction arrows on top of an uploaded drawing
 * Arrows are positioned using normalized coordinates (0-1)
 * Supports drag-and-drop repositioning
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import type { ScanArrow } from '@/types/scanOverlay';

interface ArrowOverlayProps {
  /** Uploaded drawing image (base64) */
  image: string;
  /** Width of the container */
  width: number;
  /** Height of the container */
  height: number;
  /** Scan direction arrows */
  arrows: ScanArrow[];
  /** Currently highlighted direction (hover) */
  highlightedDirection?: string | null;
  /** Callback when an arrow is hovered */
  onArrowHover?: (direction: string | null) => void;
  /** Callback when an arrow is clicked */
  onArrowClick?: (direction: string) => void;
  /** Callback when an arrow is moved (dragged) */
  onArrowMove?: (direction: string, x: number, y: number) => void;
  /** Show arrow labels */
  showLabels?: boolean;
  /** Arrow scale factor (1 = default) */
  arrowScale?: number;
  /** Enable drag mode */
  enableDrag?: boolean;
}

/**
 * Calculate arrow head points for SVG polygon
 */
function getArrowHeadPoints(
  tipX: number,
  tipY: number,
  angle: number,
  size: number
): string {
  // Convert angle to radians (angle is in degrees, 0 = right, 90 = down)
  const radians = (angle * Math.PI) / 180;

  // Arrow head points (triangle)
  const headLength = size;
  const headWidth = size * 0.6;

  // Base of arrow head (behind the tip)
  const baseX = tipX - Math.cos(radians) * headLength;
  const baseY = tipY - Math.sin(radians) * headLength;

  // Left and right points of arrow head
  const perpAngle = radians + Math.PI / 2;
  const leftX = baseX + Math.cos(perpAngle) * headWidth;
  const leftY = baseY + Math.sin(perpAngle) * headWidth;
  const rightX = baseX - Math.cos(perpAngle) * headWidth;
  const rightY = baseY - Math.sin(perpAngle) * headWidth;

  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}

/**
 * Single arrow component
 */
const ScanArrowElement: React.FC<{
  arrow: ScanArrow;
  containerWidth: number;
  containerHeight: number;
  isHighlighted: boolean;
  isDragging: boolean;
  onHover: (direction: string | null) => void;
  onClick: (direction: string) => void;
  onDragStart: (direction: string, e: React.MouseEvent) => void;
  showLabel: boolean;
  scale: number;
  enableDrag: boolean;
}> = ({
  arrow,
  containerWidth,
  containerHeight,
  isHighlighted,
  isDragging,
  onHover,
  onClick,
  onDragStart,
  showLabel,
  scale,
  enableDrag,
}) => {
  // Convert normalized coordinates to pixels
  const baseSize = Math.min(containerWidth, containerHeight);
  const arrowLength = arrow.length * baseSize * scale;
  const headSize = 8 * scale;
  const strokeWidth = isHighlighted || isDragging ? 3 : 2;

  // Calculate start position (where arrow originates)
  const startX = arrow.x * containerWidth;
  const startY = arrow.y * containerHeight;

  // Calculate end position (arrow tip) based on angle
  const radians = (arrow.angle * Math.PI) / 180;
  const endX = startX + Math.cos(radians) * arrowLength;
  const endY = startY + Math.sin(radians) * arrowLength;

  // Calculate position slightly behind the tip for the line to end
  const lineEndX = endX - Math.cos(radians) * headSize * 0.7;
  const lineEndY = endY - Math.sin(radians) * headSize * 0.7;

  // Label position (at arrow start, offset)
  const labelOffset = 12;
  const labelX = startX - Math.cos(radians) * labelOffset;
  const labelY = startY - Math.sin(radians) * labelOffset;

  // Color handling
  const baseColor = arrow.visible ? arrow.color : '#9ca3af';
  const color = isDragging ? '#3b82f6' : (isHighlighted ? '#dc2626' : baseColor);
  const opacity = arrow.visible ? 1 : 0.3;

  if (!arrow.visible && !isHighlighted) {
    return null; // Don't render invisible arrows unless highlighted
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (enableDrag) {
      e.preventDefault();
      e.stopPropagation();
      onDragStart(arrow.direction, e);
    }
  };

  return (
    <g
      opacity={opacity}
      onMouseEnter={() => onHover(arrow.direction)}
      onMouseLeave={() => !isDragging && onHover(null)}
      onClick={() => onClick(arrow.direction)}
      onMouseDown={handleMouseDown}
      style={{ cursor: enableDrag ? 'grab' : 'pointer' }}
    >
      {/* Drag handle circle (visible when drag enabled) */}
      {enableDrag && (
        <circle
          cx={startX}
          cy={startY}
          r={14}
          fill="transparent"
          stroke={isDragging ? '#3b82f6' : 'transparent'}
          strokeWidth={2}
          strokeDasharray={isDragging ? 'none' : '4,2'}
          className="hover:stroke-blue-400"
        />
      )}

      {/* Arrow line (dashed) */}
      <line
        x1={startX}
        y1={startY}
        x2={lineEndX}
        y2={lineEndY}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="6,3"
        strokeLinecap="round"
      />

      {/* Arrow head */}
      <polygon
        points={getArrowHeadPoints(endX, endY, arrow.angle, headSize)}
        fill={color}
      />

      {/* Direction label */}
      {showLabel && (
        <g>
          {/* Label background circle */}
          <circle
            cx={labelX}
            cy={labelY}
            r={10}
            fill="white"
            stroke={color}
            strokeWidth={1.5}
          />
          {/* Label text */}
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill={color}
          >
            {arrow.direction}
          </text>
        </g>
      )}

      {/* Hover tooltip with full label */}
      {(isHighlighted || isDragging) && (
        <g>
          <rect
            x={startX + 15}
            y={startY - 12}
            width={Math.max(arrow.label.length * 6 + 10, enableDrag ? 80 : 0)}
            height={20}
            rx={4}
            fill="rgba(0,0,0,0.8)"
          />
          <text
            x={startX + 20}
            y={startY + 2}
            fontSize="10"
            fill="white"
          >
            {isDragging ? '🎯 Drag to position' : arrow.label}
          </text>
        </g>
      )}
    </g>
  );
};

export const ArrowOverlay: React.FC<ArrowOverlayProps> = ({
  image,
  width,
  height,
  arrows,
  highlightedDirection = null,
  onArrowHover = () => {},
  onArrowClick = () => {},
  onArrowMove,
  showLabels = true,
  arrowScale = 1,
  enableDrag = true, // Enable drag by default
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingDirection, setDraggingDirection] = useState<string | null>(null);

  // Memoize visible arrows for performance
  const visibleArrows = useMemo(() => {
    return arrows.filter(a => a.visible || a.direction === highlightedDirection);
  }, [arrows, highlightedDirection]);

  // Handle drag start
  const handleDragStart = useCallback((direction: string, e: React.MouseEvent) => {
    if (!enableDrag || !onArrowMove) return;
    setDraggingDirection(direction);
  }, [enableDrag, onArrowMove]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingDirection || !svgRef.current || !onArrowMove) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp to valid range
    const clampedX = Math.min(1, Math.max(0, x));
    const clampedY = Math.min(1, Math.max(0, y));

    onArrowMove(draggingDirection, clampedX, clampedY);
  }, [draggingDirection, onArrowMove]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (draggingDirection) {
      console.log(`📍 Arrow ${draggingDirection} repositioned`);
      setDraggingDirection(null);
    }
  }, [draggingDirection]);

  // Handle mouse leave (cancel drag if leaving the container)
  const handleMouseLeave = useCallback(() => {
    if (draggingDirection) {
      setDraggingDirection(null);
    }
  }, [draggingDirection]);

  return (
    <div className="relative" style={{ width, height }}>
      {/* Background image */}
      <img
        src={image}
        alt="Technical drawing with scan direction overlay"
        className="absolute inset-0 w-full h-full object-contain bg-gray-100"
        style={{ pointerEvents: 'none' }}
      />

      {/* Drag mode indicator */}
      {enableDrag && onArrowMove && (
        <div className="absolute top-1 left-1 bg-blue-500/80 text-white text-[9px] px-1.5 py-0.5 rounded">
          🎯 גרור חצים למיקום
        </div>
      )}

      {/* SVG overlay for arrows */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: draggingDirection ? 'grabbing' : 'default' }}
      >
        {/* Render arrows */}
        {visibleArrows.map(arrow => (
          <ScanArrowElement
            key={arrow.direction}
            arrow={arrow}
            containerWidth={width}
            containerHeight={height}
            isHighlighted={highlightedDirection === arrow.direction}
            isDragging={draggingDirection === arrow.direction}
            onHover={onArrowHover}
            onClick={onArrowClick}
            onDragStart={handleDragStart}
            showLabel={showLabels}
            scale={arrowScale}
            enableDrag={enableDrag && !!onArrowMove}
          />
        ))}
      </svg>
    </div>
  );
};

export default ArrowOverlay;
