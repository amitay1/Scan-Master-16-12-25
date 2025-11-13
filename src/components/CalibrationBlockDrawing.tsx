import { useId } from 'react';
import { CalibrationBlockType } from '@/types/techniqueSheet';

interface CalibrationBlockDrawingProps {
  blockType: CalibrationBlockType;
  width?: number;
  height?: number;
}

export const CalibrationBlockDrawing = ({ 
  blockType, 
  width = 400, 
  height = 300 
}: CalibrationBlockDrawingProps) => {
  // Generate unique ID for SVG pattern references to prevent conflicts
  const uniqueId = useId().replace(/:/g, '-');
  // Technical drawing labels and metadata
  const blockInfo: Record<CalibrationBlockType, { figure: string; title: string; standard: string }> = {
    'flat_block': {
      figure: 'FIGURE 4',
      title: 'Flat Block with Flat-Bottom Holes',
      standard: 'MIL-STD-2154 Type I'
    },
    'curved_block': {
      figure: 'FIGURE 3',
      title: 'Convex Surface Reference Block',
      standard: 'MIL-STD-2154 Type I'
    },
    'cylinder_fbh': {
      figure: 'FIGURE 6',
      title: 'Hollow Cylindrical Block with FBH',
      standard: 'MIL-STD-2154 Type I'
    },
    'angle_beam': {
      figure: 'FIGURE 4A',
      title: 'Angle Beam Test Block',
      standard: 'MIL-STD-2154 Type II'
    },
    'cylinder_notched': {
      figure: 'FIGURE 5',
      title: 'Hollow Cylindrical Block (Notched)',
      standard: 'MIL-STD-2154 Type II'
    },
    'iiv_block': {
      figure: 'FIGURE 7',
      title: 'IIW Type Block',
      standard: 'ISO 2400 / AWS'
    },
    'step_wedge': {
      figure: 'FIGURE 8',
      title: 'Step Wedge Calibration Block',
      standard: 'ASTM E164'
    },
    'iow_block': {
      figure: 'FIGURE 9',
      title: 'IOW Reference Block',
      standard: 'ASTM E428'
    },
    'custom': {
      figure: 'CUSTOM',
      title: 'Custom Calibration Block',
      standard: 'User Defined'
    }
  };

  const info = blockInfo[blockType];

  return (
    <div className="relative w-full bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden">
      {/* Title Bar - Classic Technical Drawing Style */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-3 px-6 border-b-2 border-gray-400">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs font-semibold tracking-wider opacity-90">{info.figure}</div>
            <div className="text-sm font-bold mt-0.5">{info.title}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-90">{info.standard}</div>
            <div className="text-xs opacity-75 mt-0.5">ULTRASONIC CALIBRATION</div>
          </div>
        </div>
      </div>

      {/* Drawing Area */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8" style={{ minHeight: `${height}px` }}>
        {/* Technical Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`grid-${uniqueId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${uniqueId})`} />
          </svg>
        </div>

        {/* Technical Drawing SVG */}
        <div className="relative flex items-center justify-center" style={{ height: `${height - 100}px` }}>
          {renderTechnicalDrawing(blockType, width - 100, height - 100, uniqueId)}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-gray-100 border-t-2 border-gray-300 px-6 py-2 flex justify-between items-center text-xs text-gray-600">
        <div className="font-mono">REF: {blockType.toUpperCase()}</div>
        <div className="flex gap-4">
          <span>SCALE: NTS</span>
          <span className="font-semibold">UNITS: mm</span>
        </div>
      </div>
    </div>
  );
};

function renderTechnicalDrawing(blockType: CalibrationBlockType, width: number, height: number, uniqueId: string) {
  const centerX = width / 2;
  const centerY = height / 2;

  switch (blockType) {
    case 'flat_block':
      return <FlatBlockDrawing cx={centerX} cy={centerY} scale={1} uniqueId={uniqueId} />;
    case 'curved_block':
      return <CurvedBlockDrawing cx={centerX} cy={centerY} scale={1} uniqueId={uniqueId} />;
    case 'cylinder_fbh':
      return <HollowCylinderFBHDrawing cx={centerX} cy={centerY} scale={1} uniqueId={uniqueId} />;
    case 'angle_beam':
      return <AngleBeamBlockDrawing cx={centerX} cy={centerY} scale={1} uniqueId={uniqueId} />;
    case 'cylinder_notched':
      return <HollowCylinderNotchedDrawing cx={centerX} cy={centerY} scale={1} uniqueId={uniqueId} />;
    case 'iiv_block':
      return <IIWBlockDrawing cx={centerX} cy={centerY} scale={1} uniqueId={uniqueId} />;
    default:
      return null;
  }
}

// ==================== FLAT BLOCK WITH FBH ====================
function FlatBlockDrawing({ cx, cy, scale, uniqueId }: { cx: number; cy: number; scale: number; uniqueId: string }) {
  const blockL = 100 * scale;
  const blockW = 50 * scale;
  const blockH = 25 * scale;
  
  return (
    <svg width="100%" height="100%" viewBox={`${-cx * 0.35} ${-cy * 0.35} ${cx * 2.7} ${cy * 2.7}`} preserveAspectRatio="xMidYMid meet">
      {/* TOP VIEW */}
      <g transform={`translate(${cx - blockL/2 - 120}, ${cy - blockW/2 - 100})`}>
        <text x={blockL/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">TOP VIEW</text>
        
        {/* Block outline */}
        <rect x="0" y="0" width={blockL} height={blockW} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Center lines */}
        <line x1={blockL/2} y1="-15" x2={blockL/2} y2={blockW + 15} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        <line x1="-15" y1={blockW/2} x2={blockL + 15} y2={blockW/2} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* FBH positions - 3/64", 5/64", 8/64" */}
        <circle cx={blockL * 0.25} cy={blockW/2} r="2" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockL * 0.5} cy={blockW/2} r="3" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockL * 0.75} cy={blockW/2} r="4" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        
        {/* FBH labels */}
        <text x={blockL * 0.25} y="-8" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø3/64"</text>
        <text x={blockL * 0.5} y="-8" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø5/64"</text>
        <text x={blockL * 0.75} y="-8" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø8/64"</text>
        
        {/* Spacing dimensions */}
        <DimensionLine x1={0} y1={blockW + 25} x2={blockL * 0.25} y2={blockW + 25} label="25.0" />
        <DimensionLine x1={blockL * 0.25} y1={blockW + 25} x2={blockL * 0.5} y2={blockW + 25} label="25.0" />
        <DimensionLine x1={blockL * 0.5} y1={blockW + 25} x2={blockL * 0.75} y2={blockW + 25} label="25.0" />
        <DimensionLine x1={blockL * 0.75} y1={blockW + 25} x2={blockL} y2={blockW + 25} label="25.0" />
        
        {/* Width dimension */}
        <DimensionLine x1={blockL + 20} y1={0} x2={blockL + 20} y2={blockW} label="50.0±0.1" vertical />
      </g>
      
      {/* FRONT VIEW (SECTION A-A) */}
      <g transform={`translate(${cx + 60}, ${cy - blockH - 100})`}>
        <text x={blockL/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">SECTION A-A</text>
        
        {/* Block outline */}
        <rect x="0" y="0" width={blockL} height={blockH} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Section hatching */}
        <defs>
          <pattern id={`sectionHatch-${uniqueId}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#3b82f6" strokeWidth="0.3" opacity="0.4" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={blockL} height={blockH} fill={`url(#sectionHatch-${uniqueId})`} opacity="0.3" />
        
        {/* FBH holes - shown as depth from top */}
        <g>
          {/* Hole 1 - depth 12.5mm (T/2) */}
          <line x1={blockL * 0.25} y1="0" x2={blockL * 0.25} y2={blockH * 0.5} stroke="#ef4444" strokeWidth="1" />
          <circle cx={blockL * 0.25} cy={blockH * 0.5} r="1" fill="#ef4444" />
          <text x={blockL * 0.25} y={blockH * 0.5 - 8} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">12.5</text>
          
          {/* Hole 2 - depth 18.75mm (3T/4) */}
          <line x1={blockL * 0.5} y1="0" x2={blockL * 0.5} y2={blockH * 0.75} stroke="#ef4444" strokeWidth="1" />
          <circle cx={blockL * 0.5} cy={blockH * 0.75} r="1.5" fill="#ef4444" />
          <text x={blockL * 0.5} y={blockH * 0.75 - 8} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">18.75</text>
          
          {/* Hole 3 - depth 22.5mm (0.9T) */}
          <line x1={blockL * 0.75} y1="0" x2={blockL * 0.75} y2={blockH * 0.9} stroke="#ef4444" strokeWidth="1" />
          <circle cx={blockL * 0.75} cy={blockH * 0.9} r="2" fill="#ef4444" />
          <text x={blockL * 0.75} y={blockH * 0.9 - 8} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">22.5</text>
        </g>
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={blockH + 20} x2={blockL} y2={blockH + 20} label="100.0±0.1" />
        <DimensionLine x1={blockL + 20} y1={0} x2={blockL + 20} y2={blockH} label="25.0±0.1" vertical />
      </g>
      
      {/* Material & Notes */}
      <g transform={`translate(${cx - blockL/2 - 120}, ${cy + 120})`}>
        <text x="0" y="0" fontSize="14" fill="#374151" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">MATERIAL: 7075-T6 Aluminum</text>
        <text x="0" y="20" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SURFACE FINISH: Ra ≤ 3.2μm (125μin)</text>
        <text x="0" y="40" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">TOLERANCES: ±0.1mm unless noted</text>
        <text x="0" y="60" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">FBH TOLERANCE: ±0.025mm (±0.001")</text>
      </g>
    </svg>
  );
}

// ==================== CURVED BLOCK ====================
function CurvedBlockDrawing({ cx, cy, scale, uniqueId }: { cx: number; cy: number; scale: number; uniqueId: string }) {
  const blockL = 120 * scale;
  const blockW = 60 * scale;
  const blockH = 30 * scale;
  const radius = 50 * scale;

  return (
    <svg width="100%" height="100%" viewBox={`${-cx * 0.35} ${-cy * 0.35} ${cx * 2.7} ${cy * 2.7}`} preserveAspectRatio="xMidYMid meet">
      {/* SIDE VIEW - showing convex curvature */}
      <g transform={`translate(${cx - blockL/2 - 100}, ${cy - radius - 80})`}>
        <text x={blockL/2} y="-35" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">SIDE VIEW</text>
        
        {/* Convex surface arc */}
        <path 
          d={`M 0 ${radius} 
              A ${radius} ${radius} 0 0 1 ${blockL} ${radius}
              L ${blockL} ${radius + blockH}
              L 0 ${radius + blockH}
              Z`}
          fill="#f0f0f0"
          stroke="#1e40af"
          strokeWidth="2"
        />
        
        {/* Center line */}
        <line x1={blockL/2} y1="-20" x2={blockL/2} y2={radius + blockH + 20} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* Radius indicator */}
        <g>
          <circle cx={blockL/2} cy="0" r="2" fill="#10b981" />
          <line x1={blockL/2} y1="0" x2={blockL/2} y2={radius} stroke="#10b981" strokeWidth="1.2" />
          <line x1={blockL/2} y1="0" x2={blockL * 0.8} y2={radius * 0.6} stroke="#10b981" strokeWidth="1.2" />
          <text x={blockL * 0.65} y={radius * 0.4} fontSize="14" fill="#059669" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">R50±0.5</text>
        </g>
        
        {/* FBH positions along curve */}
        <circle cx={blockL * 0.3} cy={radius * 0.85} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        <circle cx={blockL/2} cy={radius} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        <circle cx={blockL * 0.7} cy={radius * 0.85} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={radius + blockH + 35} x2={blockL} y2={radius + blockH + 35} label="120.0±0.1" />
        <DimensionLine x1={blockL + 25} y1={radius} x2={blockL + 25} y2={radius + blockH} label="30.0±0.1" vertical />
      </g>
      
      {/* TOP VIEW */}
      <g transform={`translate(${cx + 100}, ${cy - blockW/2 - 60})`}>
        <text x={blockL/2} y="-25" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">TOP VIEW</text>
        
        {/* Block outline */}
        <rect x={0} y={0} width={blockL} height={blockW} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Center lines */}
        <line x1={blockL/2} y1={-10} x2={blockL/2} y2={blockW + 10} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* FBH positions */}
        <circle cx={blockL * 0.3} cy={blockW/2} r={2} fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <text x={blockL * 0.3} y={blockW/2 - 12} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø3/64"</text>
        
        <circle cx={blockL/2} cy={blockW/2} r={2.5} fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <text x={blockL/2} y={blockW/2 - 12} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø5/64"</text>
        
        <circle cx={blockL * 0.7} cy={blockW/2} r={2} fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <text x={blockL * 0.7} y={blockW/2 - 12} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø3/64"</text>
        
        {/* Width dimension */}
        <DimensionLine x1={blockL + 20} y1={0} x2={blockL + 20} y2={blockW} label="60.0±0.1" vertical />
      </g>
      
      {/* Material & Notes */}
      <g transform={`translate(${cx - blockL/2 - 100}, ${cy + 130})`}>
        <text x="0" y="0" fontSize="14" fill="#374151" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">MATERIAL: 7075-T6 Aluminum</text>
        <text x="0" y="20" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SURFACE FINISH: Ra ≤ 3.2μm on curved surface</text>
        <text x="0" y="40" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">CURVATURE: Convex radius per part geometry</text>
        <text x="0" y="60" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">FBH DEPTH: Perpendicular to curved surface</text>
      </g>
    </svg>
  );
}

// ==================== HOLLOW CYLINDER WITH FBH ====================
function HollowCylinderFBHDrawing({ cx, cy, scale, uniqueId }: { cx: number; cy: number; scale: number; uniqueId: string }) {
  const OD = 76 * scale;
  const ID = 50 * scale;
  const height = 50 * scale;
  const wall = (OD - ID) / 2;

  return (
    <svg width="100%" height="100%" viewBox={`${-cx * 0.35} ${-cy * 0.35} ${cx * 2.7} ${cy * 2.7}`} preserveAspectRatio="xMidYMid meet">
      {/* END VIEW - showing circular cross-section */}
      <g transform={`translate(${cx - OD - 80}, ${cy - OD/2})`}>
        <text x={OD/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">END VIEW</text>
        
        {/* Outer circle */}
        <circle cx={OD/2} cy={OD/2} r={OD/2} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Inner circle */}
        <circle cx={OD/2} cy={OD/2} r={ID/2} fill="#ffffff" stroke="#1e40af" strokeWidth="2" />
        
        {/* Cross-section hatching */}
        <defs>
          <pattern id={`wallHatch-${uniqueId}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#3b82f6" strokeWidth="0.3" opacity="0.4" />
          </pattern>
        </defs>
        <circle cx={OD/2} cy={OD/2} r={(OD + ID) / 4} fill={`url(#wallHatch-${uniqueId})`} opacity="0.3" />
        
        {/* Center lines */}
        <line x1={OD/2} y1="-10" x2={OD/2} y2={OD + 10} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        <line x1="-10" y1={OD/2} x2={OD + 10} y2={OD/2} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* FBH positions at 0°, 90°, 180°, 270° */}
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const fbhR = (OD + ID) / 4;
          const x = OD/2 + fbhR * Math.cos(rad);
          const y = OD/2 + fbhR * Math.sin(rad);
          
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="3.5" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
              <text x={x} y={y - 10} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">{angle}°</text>
            </g>
          );
        })}
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={OD + 25} x2={OD} y2={OD + 25} label="Ø76.0±0.2 (OD)" />
        <line x1={OD/2 - ID/2} y1={OD/2} x2={OD/2 + ID/2} y2={OD/2} stroke="#f59e0b" strokeWidth="1.2" />
        <text x={OD/2} y={OD/2 - 8} textAnchor="middle" fontSize="14" fill="#d97706" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø50.0±0.2</text>
      </g>
      
      {/* SIDE VIEW (SECTION B-B) */}
      <g transform={`translate(${cx + 70}, ${cy - height/2 - 30})`}>
        <text x={OD/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">SECTION B-B</text>
        
        {/* Outer walls */}
        <rect x="0" y="0" width={wall} height={height} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        <rect x={OD - wall} y="0" width={wall} height={height} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Section hatching */}
        <rect x="0" y="0" width={wall} height={height} fill={`url(#wallHatch-${uniqueId})`} opacity="0.3" />
        <rect x={OD - wall} y="0" width={wall} height={height} fill={`url(#wallHatch-${uniqueId})`} opacity="0.3" />
        
        {/* Inner bore */}
        <line x1={wall} y1="0" x2={wall} y2={height} stroke="#1e40af" strokeWidth="1.5" />
        <line x1={OD - wall} y1="0" x2={OD - wall} y2={height} stroke="#1e40af" strokeWidth="1.5" />
        
        {/* FBH positions - mid-wall */}
        <circle cx={wall/2} cy={height * 0.25} r="1.5" fill="#ef4444" />
        <circle cx={wall/2} cy={height * 0.75} r="1.5" fill="#ef4444" />
        <circle cx={OD - wall/2} cy={height * 0.25} r="1.5" fill="#ef4444" />
        <circle cx={OD - wall/2} cy={height * 0.75} r="1.5" fill="#ef4444" />
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={height + 25} x2={OD} y2={height + 25} label="76.0±0.2" />
        <DimensionLine x1={OD + 20} y1={0} x2={OD + 20} y2={height} label="50.0±0.2" vertical />
        
        {/* Wall thickness */}
        <line x1={0} y1={-15} x2={wall} y2={-15} stroke="#f59e0b" strokeWidth="1.2" />
        <text x={wall/2} y="-20" textAnchor="middle" fontSize="14" fill="#d97706" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">t=13±0.1</text>
      </g>
      
      {/* Material & Notes */}
      <g transform={`translate(${cx - OD - 80}, ${cy + OD + 40})`}>
        <text x="0" y="0" fontSize="14" fill="#374151" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">MATERIAL: 7075-T6 Aluminum</text>
        <text x="0" y="20" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">FBH: 4 × Ø3/64" (1.19mm) at mid-wall depth</text>
        <text x="0" y="40" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">POSITIONS: 0°, 90°, 180°, 270° ±2°</text>
        <text x="0" y="60" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SURFACE FINISH: Ra ≤ 3.2μm all surfaces</text>
      </g>
    </svg>
  );
}

// ==================== ANGLE BEAM TEST BLOCK ====================
function AngleBeamBlockDrawing({ cx, cy, scale, uniqueId }: { cx: number; cy: number; scale: number; uniqueId: string }) {
  const blockL = 100 * scale;
  const blockW = 50 * scale;
  const blockH = 25 * scale;
  
  return (
    <svg width="100%" height="100%" viewBox={`${-cx * 0.35} ${-cy * 0.35} ${cx * 2.7} ${cy * 2.7}`} preserveAspectRatio="xMidYMid meet">
      {/* TOP VIEW */}
      <g transform={`translate(${cx - blockL/2 - 120}, ${cy - blockW/2 - 100})`}>
        <text x={blockL/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">TOP VIEW</text>
        
        {/* Block outline */}
        <rect x="0" y="0" width={blockL} height={blockW} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Center lines */}
        <line x1={blockL/2} y1="-15" x2={blockL/2} y2={blockW + 15} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        <line x1="-15" y1={blockW/2} x2={blockL + 15} y2={blockW/2} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* SDH positions - 3 side-drilled holes */}
        <circle cx={blockL * 0.25} cy={blockW/2} r="2" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockL/2} cy={blockW/2} r="2" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockL * 0.75} cy={blockW/2} r="2" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        
        {/* SDH labels */}
        <text x={blockL * 0.25} y="-8" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø1.5mm</text>
        <text x={blockL/2} y="-8" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø1.5mm</text>
        <text x={blockL * 0.75} y="-8" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">Ø1.5mm</text>
        
        {/* Spacing dimensions */}
        <DimensionLine x1={0} y1={blockW + 25} x2={blockL * 0.25} y2={blockW + 25} label="25.0±0.1" />
        <DimensionLine x1={blockL * 0.25} y1={blockW + 25} x2={blockL/2} y2={blockW + 25} label="25.0±0.1" />
        <DimensionLine x1={blockL/2} y1={blockW + 25} x2={blockL * 0.75} y2={blockW + 25} label="25.0±0.1" />
        <DimensionLine x1={blockL * 0.75} y1={blockW + 25} x2={blockL} y2={blockW + 25} label="25.0±0.1" />
        
        {/* Total length dimension */}
        <DimensionLine x1={0} y1={blockW + 45} x2={blockL} y2={blockW + 45} label="100.0±0.1" />
        
        {/* Width dimension */}
        <DimensionLine x1={blockL + 20} y1={0} x2={blockL + 20} y2={blockW} label="50.0±0.1" vertical />
      </g>
      
      {/* SECTION A-A (Side view showing SDH depths) */}
      <g transform={`translate(${cx + 60}, ${cy - blockH - 100})`}>
        <text x={blockL/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">SECTION A-A</text>
        
        {/* Block outline */}
        <rect x="0" y="0" width={blockL} height={blockH} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Section hatching */}
        <defs>
          <pattern id={`angleBeamHatch-${uniqueId}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#3b82f6" strokeWidth="0.3" opacity="0.4" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={blockL} height={blockH} fill={`url(#angleBeamHatch-${uniqueId})`} opacity="0.3" />
        
        {/* SDH holes - drilled from side at mid-height */}
        <g>
          {/* Hole 1 - at 25mm from left edge */}
          <line x1={blockL * 0.25} y1={blockH} x2={blockL * 0.25} y2={blockH/2} stroke="#ef4444" strokeWidth="1" />
          <circle cx={blockL * 0.25} cy={blockH/2} r="1.5" fill="#ef4444" />
          <text x={blockL * 0.25} y={blockH/2 - 10} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SDH-1</text>
          
          {/* Hole 2 - at 50mm from left edge */}
          <line x1={blockL/2} y1={blockH} x2={blockL/2} y2={blockH/2} stroke="#ef4444" strokeWidth="1" />
          <circle cx={blockL/2} cy={blockH/2} r="1.5" fill="#ef4444" />
          <text x={blockL/2} y={blockH/2 - 10} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SDH-2</text>
          
          {/* Hole 3 - at 75mm from left edge */}
          <line x1={blockL * 0.75} y1={blockH} x2={blockL * 0.75} y2={blockH/2} stroke="#ef4444" strokeWidth="1" />
          <circle cx={blockL * 0.75} cy={blockH/2} r="1.5" fill="#ef4444" />
          <text x={blockL * 0.75} y={blockH/2 - 10} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SDH-3</text>
        </g>
        
        {/* Angle beam paths - showing beam trajectories */}
        <g opacity="0.5">
          <line x1="-20" y1={blockH + 15} x2={blockL * 0.25} y2={blockH/2} stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="-20" y1={blockH + 15} x2={blockL/2} y2={blockH/2} stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="-20" y1={blockH + 15} x2={blockL * 0.75} y2={blockH/2} stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
          <text x="-25" y={blockH + 20} fontSize="14" fill="#059669" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">45°/60°/70°</text>
        </g>
        
        {/* SDH Position dimensions */}
        <DimensionLine x1={0} y1={blockH + 12} x2={blockL * 0.25} y2={blockH + 12} label="25.0" />
        <DimensionLine x1={blockL * 0.25} y1={blockH + 12} x2={blockL/2} y2={blockH + 12} label="25.0" />
        <DimensionLine x1={blockL/2} y1={blockH + 12} x2={blockL * 0.75} y2={blockH + 12} label="25.0" />
        <DimensionLine x1={blockL * 0.75} y1={blockH + 12} x2={blockL} y2={blockH + 12} label="25.0" />
        
        {/* Total length */}
        <DimensionLine x1={0} y1={blockH + 30} x2={blockL} y2={blockH + 30} label="100.0±0.1" />
        
        {/* Height dimension */}
        <DimensionLine x1={blockL + 20} y1={0} x2={blockL + 20} y2={blockH} label="25.0±0.1" vertical />
      </g>
      
      {/* END VIEW (Showing SDH from the end) */}
      <g transform={`translate(${cx - blockL/2 - 120}, ${cy + 80})`}>
        <text x={blockW/2} y="-25" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">END VIEW</text>
        
        {/* Block outline */}
        <rect x="0" y="0" width={blockW} height={blockH} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Center lines */}
        <line x1={blockW/2} y1="-10" x2={blockW/2} y2={blockH + 10} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        <line x1="-10" y1={blockH/2} x2={blockW + 10} y2={blockH/2} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* SDH entry point */}
        <circle cx={blockW/2} cy={blockH/2} r="1.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
        <text x={blockW/2} y={blockH/2 - 10} textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SDH Entry</text>
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={blockH + 20} x2={blockW} y2={blockH + 20} label="50.0±0.1" />
        <DimensionLine x1={blockW + 20} y1={0} x2={blockW + 20} y2={blockH} label="25.0±0.1" vertical />
      </g>
      
      {/* Material & Notes */}
      <g transform={`translate(${cx + 60}, ${cy + 80})`}>
        <text x="0" y="0" fontSize="14" fill="#374151" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">MATERIAL: 7075-T6 Aluminum</text>
        <text x="0" y="20" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SDH: 3 × Ø1.5mm ±0.05mm (Side-Drilled Holes)</text>
        <text x="0" y="40" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">POSITIONS: 25mm, 50mm, 75mm from left edge</text>
        <text x="0" y="60" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">SURFACE FINISH: Ra ≤ 3.2μm (125μin)</text>
        <text x="0" y="80" fontSize="14" fill="#6b7280" fontWeight="600" stroke="white" strokeWidth="1" paintOrder="stroke">PURPOSE: Angle beam calibration 45°, 60°, 70°</text>
      </g>
    </svg>
  );
}

// ==================== HOLLOW CYLINDER NOTCHED ====================
function HollowCylinderNotchedDrawing({ cx, cy, scale, uniqueId }: { cx: number; cy: number; scale: number; uniqueId: string }) {
  const OD = 76 * scale;
  const ID = 50 * scale;
  const height = 50 * scale;
  const wall = (OD - ID) / 2;
  const notchDepth = wall * 0.2; // 20% of wall thickness

  return (
    <svg width="100%" height="100%" viewBox={`${-cx * 0.35} ${-cy * 0.35} ${cx * 2.7} ${cy * 2.7}`} preserveAspectRatio="xMidYMid meet">
      {/* END VIEW - showing circular cross-section with notches */}
      <g transform={`translate(${cx - OD - 100}, ${cy - OD/2})`}>
        <text x={OD/2} y="-30" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">END VIEW</text>
        
        {/* Outer circle */}
        <circle cx={OD/2} cy={OD/2} r={OD/2} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Inner circle */}
        <circle cx={OD/2} cy={OD/2} r={ID/2} fill="#ffffff" stroke="#1e40af" strokeWidth="2" />
        
        {/* Cross-section hatching */}
        <defs>
          <pattern id={`notchHatch-${uniqueId}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#3b82f6" strokeWidth="0.3" opacity="0.4" />
          </pattern>
        </defs>
        <circle cx={OD/2} cy={OD/2} r={(OD + ID) / 4} fill={`url(#notchHatch-${uniqueId})`} opacity="0.3" />
        
        {/* Center lines */}
        <line x1={OD/2} y1="-5" x2={OD/2} y2={OD + 5} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        <line x1="-5" y1={OD/2} x2={OD + 5} y2={OD/2} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* Notch positions at 0°, 90°, 180°, 270° on OD */}
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const notchR = OD/2;
          const x = OD/2 + notchR * Math.cos(rad);
          const y = OD/2 + notchR * Math.sin(rad);
          
          return (
            <g key={i}>
              {/* Notch indicator (radial line showing notch depth) */}
              <line 
                x1={OD/2 + (notchR - notchDepth * 2) * Math.cos(rad)} 
                y1={OD/2 + (notchR - notchDepth * 2) * Math.sin(rad)}
                x2={x}
                y2={y}
                stroke="#f59e0b" 
                strokeWidth="2.5" 
              />
              {/* Notch label */}
              <text 
                x={OD/2 + (notchR + 10) * Math.cos(rad)} 
                y={OD/2 + (notchR + 10) * Math.sin(rad)} 
                textAnchor="middle" 
                fontSize="7" 
                fill="#d97706" 
                fontWeight="600"
              >
                {angle}°
              </text>
            </g>
          );
        })}
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={OD + 15} x2={OD} y2={OD + 15} label="Ø76.0±0.2 (OD)" />
        <line x1={OD/2 - ID/2} y1={OD/2} x2={OD/2 + ID/2} y2={OD/2} stroke="#f59e0b" strokeWidth="1.2" />
        <text x={OD/2} y={OD/2 - 5} textAnchor="middle" fontSize="8" fill="#d97706" fontWeight="600">Ø50.0±0.2</text>
      </g>
      
      {/* SIDE VIEW (SECTION B-B showing notch profiles) */}
      <g transform={`translate(${cx + 50}, ${cy - height/2 - 20})`}>
        <text x={OD/2} y="-20" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="700">SECTION B-B</text>
        
        {/* Outer walls with notches */}
        <path
          d={`M 0 0 
              L 0 ${height * 0.4}
              L ${notchDepth * 1.5} ${height * 0.425}
              L ${notchDepth * 1.5} ${height * 0.575}
              L 0 ${height * 0.6}
              L 0 ${height}
              L ${wall} ${height}
              L ${wall} 0 Z`}
          fill="#f0f0f0"
          stroke="#1e40af"
          strokeWidth="2"
        />
        
        <path
          d={`M ${OD} 0 
              L ${OD} ${height * 0.4}
              L ${OD - notchDepth * 1.5} ${height * 0.425}
              L ${OD - notchDepth * 1.5} ${height * 0.575}
              L ${OD} ${height * 0.6}
              L ${OD} ${height}
              L ${OD - wall} ${height}
              L ${OD - wall} 0 Z`}
          fill="#f0f0f0"
          stroke="#1e40af"
          strokeWidth="2"
        />
        
        {/* Section hatching */}
        <rect x="0" y="0" width={wall} height={height * 0.4} fill={`url(#notchHatch-${uniqueId})`} opacity="0.3" />
        <rect x="0" y={height * 0.6} width={wall} height={height * 0.4} fill={`url(#notchHatch-${uniqueId})`} opacity="0.3" />
        <rect x={OD - wall} y="0" width={wall} height={height * 0.4} fill={`url(#notchHatch-${uniqueId})`} opacity="0.3" />
        <rect x={OD - wall} y={height * 0.6} width={wall} height={height * 0.4} fill={`url(#notchHatch-${uniqueId})`} opacity="0.3" />
        
        {/* Inner bore */}
        <line x1={wall} y1="0" x2={wall} y2={height} stroke="#1e40af" strokeWidth="1.5" />
        <line x1={OD - wall} y1="0" x2={OD - wall} y2={height} stroke="#1e40af" strokeWidth="1.5" />
        
        {/* Notch detail callouts */}
        <g>
          {/* Left notch */}
          <rect x={0} y={height * 0.425} width={notchDepth * 1.5} height={height * 0.15} fill="#f59e0b" fillOpacity="0.3" stroke="#d97706" strokeWidth="1" />
          <text x={notchDepth * 2.5} y={height/2} fontSize="7" fill="#d97706" fontWeight="600">Notch 2.6mm</text>
          
          {/* Right notch */}
          <rect x={OD - notchDepth * 1.5} y={height * 0.425} width={notchDepth * 1.5} height={height * 0.15} fill="#f59e0b" fillOpacity="0.3" stroke="#d97706" strokeWidth="1" />
        </g>
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={height + 15} x2={OD} y2={height + 15} label="76.0±0.2" />
        <DimensionLine x1={OD + 12} y1={0} x2={OD + 12} y2={height} label="50.0±0.2" vertical />
        
        {/* Wall thickness */}
        <line x1={0} y1={-10} x2={wall} y2={-10} stroke="#f59e0b" strokeWidth="1.2" />
        <text x={wall/2} y="-15" textAnchor="middle" fontSize="8" fill="#d97706" fontWeight="600">t=13±0.1</text>
      </g>
      
      {/* NOTCH DETAIL (Enlarged view) */}
      <g transform={`translate(${cx - OD - 80}, ${cy + OD + 10})`}>
        <text x="0" y="-10" fontSize="11" fill="#1e40af" fontWeight="700">NOTCH DETAIL (4×)</text>
        
        {/* Detail view of single notch */}
        <rect x="0" y="0" width="40" height="30" fill="#f0f0f0" stroke="#1e40af" strokeWidth="1.5" />
        <rect x="0" y="10" width="10" height="10" fill="#f59e0b" fillOpacity="0.3" stroke="#d97706" strokeWidth="1.5" />
        
        {/* Notch dimensions */}
        <DimensionLine x1={0} y1={25} x2={10} y2={25} label="2.6±0.1" />
        <DimensionLine x1={12} y1={10} x2={12} y2={20} label="10±0.2" vertical />
        
        <text x="20" y="15" fontSize="7" fill="#6b7280">20% Wall Depth</text>
        <text x="20" y="23" fontSize="7" fill="#6b7280">Positions: 0°, 90°</text>
        <text x="20" y="31" fontSize="7" fill="#6b7280">180°, 270° ±2°</text>
      </g>
      
      {/* Material & Notes */}
      <g transform={`translate(${cx + 50}, ${cy + OD + 10})`}>
        <text x="0" y="0" fontSize="9" fill="#374151" fontWeight="600">MATERIAL: 7075-T6 Aluminum</text>
        <text x="0" y="15" fontSize="8" fill="#6b7280">NOTCHES: 4 × Circumferential, 20% wall depth</text>
        <text x="0" y="28" fontSize="8" fill="#6b7280">NOTCH SIZE: 2.6mm depth × 10mm length ±0.1mm</text>
        <text x="0" y="41" fontSize="8" fill="#6b7280">POSITIONS: 0°, 90°, 180°, 270° ±2°</text>
        <text x="0" y="54" fontSize="8" fill="#6b7280">SURFACE FINISH: Ra ≤ 3.2μm all surfaces</text>
      </g>
    </svg>
  );
}

// ==================== IIW BLOCK ====================
function IIWBlockDrawing({ cx, cy, scale, uniqueId }: { cx: number; cy: number; scale: number; uniqueId: string }) {
  const blockL = 150 * scale;
  const blockH = 50 * scale;
  const blockW = 50 * scale;
  const stepW = 25 * scale;
  const stepH = 12.5 * scale;
  const radius = 100 * scale;

  return (
    <svg width="100%" height="100%" viewBox={`${-cx * 0.35} ${-cy * 0.35} ${cx * 2.7} ${cy * 2.7}`} preserveAspectRatio="xMidYMid meet">
      {/* FRONT VIEW - showing characteristic IIW profile */}
      <g transform={`translate(${cx - blockL/2 - 110}, ${cy - blockH/2 - 100})`}>
        <text x={blockL/2} y="-35" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="700" stroke="white" strokeWidth="1" paintOrder="stroke">FRONT VIEW</text>
        
        {/* Main block profile with step and radius */}
        <path
          d={`M 0 ${stepH}
              L 0 ${blockH}
              L ${blockL} ${blockH}
              L ${blockL} 0
              A ${radius/8} ${radius/8} 0 0 0 ${blockL * 0.75} 0
              L ${stepW} 0
              L ${stepW} ${stepH}
              Z`}
          fill="#f0f0f0"
          stroke="#1e40af"
          strokeWidth="2"
        />
        
        {/* Center line */}
        <line x1={blockL/2} y1="-10" x2={blockL/2} y2={blockH + 15} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* Radius indicator */}
        <g>
          <path
            d={`M ${blockL * 0.75} -5
                A ${radius/8} ${radius/8} 0 0 1 ${blockL} 0`}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
          />
          <text x={blockL * 0.9} y="-8" fontSize="9" fill="#059669" fontWeight="600">R100±0.5</text>
        </g>
        
        {/* SDH positions */}
        <circle cx={blockL * 0.2} cy={blockH * 0.5} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        <text x={blockL * 0.2} y={blockH * 0.5 - 8} textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="600">Ø1.5</text>
        
        <circle cx={blockL * 0.5} cy={blockH * 0.6} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        <text x={blockL * 0.5} y={blockH * 0.6 - 8} textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="600">Ø1.5</text>
        
        <circle cx={blockL * 0.8} cy={blockH * 0.3} r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        <text x={blockL * 0.8} y={blockH * 0.3 - 8} textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="600">Ø1.5</text>
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={blockH + 20} x2={blockL} y2={blockH + 20} label="150.0±0.2" />
        <DimensionLine x1={blockL + 15} y1={0} x2={blockL + 15} y2={blockH} label="50.0±0.1" vertical />
        <DimensionLine x1={-15} y1={stepH} x2={-15} y2={blockH} label="37.5±0.1" vertical />
        
        {/* Step dimensions */}
        <line x1={0} y1={stepH - 3} x2={stepW} y2={stepH - 3} stroke="#f59e0b" strokeWidth="1.2" />
        <text x={stepW/2} y={stepH - 7} textAnchor="middle" fontSize="8" fill="#d97706" fontWeight="600">25.0±0.1</text>
      </g>
      
      {/* TOP VIEW */}
      <g transform={`translate(${cx + 80}, ${cy - blockW/2 - 80})`}>
        <text x={blockL/2} y="-20" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="700">TOP VIEW</text>
        
        {/* Block outline */}
        <rect x="0" y="0" width={blockL} height={blockW} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Center lines */}
        <line x1={blockL/2} y1="-5" x2={blockL/2} y2={blockW + 5} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        <line x1="-5" y1={blockW/2} x2={blockL + 5} y2={blockW/2} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* SDH positions from top */}
        <circle cx={blockL * 0.2} cy={blockW/2} r="1.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockL * 0.5} cy={blockW/2} r="1.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockL * 0.8} cy={blockW/2} r="1.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        
        {/* SDH spacing */}
        <DimensionLine x1={0} y1={blockW + 15} x2={blockL * 0.2} y2={blockW + 15} label="30.0±0.1" />
        <DimensionLine x1={blockL * 0.2} y1={blockW + 15} x2={blockL * 0.5} y2={blockW + 15} label="45.0±0.1" />
        <DimensionLine x1={blockL * 0.5} y1={blockW + 15} x2={blockL * 0.8} y2={blockW + 15} label="45.0±0.1" />
        
        {/* Width dimension */}
        <DimensionLine x1={blockL + 12} y1={0} x2={blockL + 12} y2={blockW} label="50.0±0.1" vertical />
      </g>
      
      {/* SECTION C-C (Through SDH) */}
      <g transform={`translate(${cx - blockL/2 - 90}, ${cy + 60})`}>
        <text x={blockW/2} y="-15" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="700">SECTION C-C</text>
        
        {/* Block cross-section */}
        <rect x="0" y="0" width={blockW} height={blockH} fill="#f0f0f0" stroke="#1e40af" strokeWidth="2" />
        
        {/* Section hatching */}
        <defs>
          <pattern id={`iiwHatch-${uniqueId}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#3b82f6" strokeWidth="0.3" opacity="0.4" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={blockW} height={blockH} fill={`url(#iiwHatch-${uniqueId})`} opacity="0.3" />
        
        {/* Center line */}
        <line x1={blockW/2} y1="-5" x2={blockW/2} y2={blockH + 5} stroke="#FFD700" strokeWidth="0.8" strokeDasharray="4,2" />
        
        {/* SDH shown in section */}
        <line x1={0} y1={blockH * 0.5} x2={blockW} y2={blockH * 0.5} stroke="#ef4444" strokeWidth="1.5" />
        <circle cx={blockW * 0.3} cy={blockH * 0.5} r="1.5" fill="#ef4444" />
        <text x={blockW * 0.3} y={blockH * 0.5 - 5} textAnchor="middle" fontSize="7" fill="#ef4444">Ø1.5mm</text>
        
        {/* Dimensions */}
        <DimensionLine x1={0} y1={blockH + 12} x2={blockW} y2={blockH + 12} label="50.0±0.1" />
        <DimensionLine x1={blockW + 10} y1={0} x2={blockW + 10} y2={blockH} label="50.0±0.1" vertical />
      </g>
      
      {/* Material & Notes */}
      <g transform={`translate(${cx + 80}, ${cy + 60})`}>
        <text x="0" y="0" fontSize="9" fill="#374151" fontWeight="600">MATERIAL: 7075-T6 Aluminum</text>
        <text x="0" y="15" fontSize="8" fill="#6b7280">TYPE: IIW Type 1 (International Institute of Welding)</text>
        <text x="0" y="28" fontSize="8" fill="#6b7280">SDH: 3 × Ø1.5mm ±0.05mm at varying depths</text>
        <text x="0" y="41" fontSize="8" fill="#6b7280">RADIUS: R100±0.5mm for curved surface calibration</text>
        <text x="0" y="54" fontSize="8" fill="#6b7280">SURFACE FINISH: Ra ≤ 3.2μm (125μin)</text>
        <text x="0" y="67" fontSize="8" fill="#6b7280">PURPOSE: Angle beam & curved surface calibration</text>
      </g>
    </svg>
  );
}

// ==================== DIMENSION LINE COMPONENT ====================
function DimensionLine({ 
  x1, y1, x2, y2, label, vertical = false 
}: { 
  x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean 
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return (
    <g className="dimension-line">
      {/* Main line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth="1.2" />
      
      {/* End markers */}
      <line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} stroke="#6b7280" strokeWidth="1.5" />
      <line x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} stroke="#6b7280" strokeWidth="1.5" />
      
      {/* Label with text halo */}
      <text 
        x={midX} 
        y={midY + (vertical ? 0 : -8)} 
        textAnchor="middle" 
        fontSize="14" 
        fill="#374151" 
        fontWeight="600"
        stroke="white"
        strokeWidth="1"
        paintOrder="stroke"
        transform={vertical ? `rotate(-90, ${midX}, ${midY})` : ''}
      >
        {label}
      </text>
    </g>
  );
}
