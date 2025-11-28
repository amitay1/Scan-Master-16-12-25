import { useId } from 'react';
import { CalibrationBlockType } from '@/types/techniqueSheet';
import {
  BlockDimensions,
  FBHData,
  NotchData,
  calculateAutoScale,
  DEFAULT_DIMENSIONS,
  DEFAULT_FBH_DATA,
} from './drawings';
import { EnhancedFlatBlockDrawing } from './drawings/EnhancedFlatBlockDrawing';
import { EnhancedCurvedBlockDrawing } from './drawings/EnhancedCurvedBlockDrawing';
import { EnhancedCylinderFBHDrawing } from './drawings/EnhancedCylinderFBHDrawing';
import { EnhancedAngleBeamDrawing } from './drawings/EnhancedAngleBeamDrawing';
import { EnhancedCylinderNotchedDrawing } from './drawings/EnhancedCylinderNotchedDrawing';
import { EnhancedIIWBlockDrawing } from './drawings/EnhancedIIWBlockDrawing';
import { EnhancedStepWedgeDrawing } from './drawings/EnhancedStepWedgeDrawing';
import { EnhancedIOWBlockDrawing } from './drawings/EnhancedIOWBlockDrawing';

interface CalibrationBlockDrawingProps {
  blockType: CalibrationBlockType;
  width?: number;
  height?: number;
  /** Dynamic block dimensions from calibration recommender */
  dimensions?: BlockDimensions;
  /** Dynamic FBH data from calibration recommender (array for multiple FBHs) */
  fbhData?: FBHData | FBHData[];
  /** Dynamic notch data for notched blocks */
  notchData?: NotchData;
  /** Material type for display */
  material?: string;
  /** Show dimension lines (default: true) */
  showDimensions?: boolean;
}

export const CalibrationBlockDrawing = ({ 
  blockType, 
  width = 400, 
  height = 300,
  dimensions,
  fbhData,
  notchData,
  material = '7075-T6 AL',
  showDimensions = true,
}: CalibrationBlockDrawingProps) => {
  const uniqueId = useId().replace(/:/g, '-');
  
  // Use provided dimensions or defaults
  const blockDimensions = dimensions || DEFAULT_DIMENSIONS[blockType] || DEFAULT_DIMENSIONS['flat_block'];
  
  // Normalize fbhData to array
  const blockFbhDataArray: FBHData[] = fbhData 
    ? (Array.isArray(fbhData) ? fbhData : [fbhData])
    : DEFAULT_FBH_DATA;
  
  // Also keep single FBH for components that need it
  const singleFbhData: FBHData = blockFbhDataArray[0] || DEFAULT_FBH_DATA[0];
  
  // Calculate auto-scale based on dimensions
  const scale = calculateAutoScale(blockDimensions, { width: 550, height: 350 });
  
  const blockInfo: Record<CalibrationBlockType, { 
    figure: string; 
    title: string; 
    standard: string;
    partNumber: string;
    revision: string;
  }> = {
    'flat_block': {
      figure: 'FIGURE 4',
      title: 'FLAT REFERENCE BLOCK WITH FBH',
      standard: 'MIL-STD-2154A / ASTM E127',
      partNumber: 'CAL-FBH-001',
      revision: 'C'
    },
    'curved_block': {
      figure: 'FIGURE 3',
      title: 'CONVEX SURFACE REFERENCE BLOCK',
      standard: 'MIL-STD-2154A TYPE I',
      partNumber: 'CAL-CVX-001',
      revision: 'B'
    },
    'cylinder_fbh': {
      figure: 'FIGURE 6',
      title: 'HOLLOW CYLINDRICAL BLOCK WITH FBH',
      standard: 'MIL-STD-2154A / EN 10228-3',
      partNumber: 'CAL-CYL-001',
      revision: 'B'
    },
    'angle_beam': {
      figure: 'FIGURE 4A',
      title: 'ANGLE BEAM TEST BLOCK WITH SDH',
      standard: 'MIL-STD-2154A TYPE II',
      partNumber: 'CAL-ANG-001',
      revision: 'D'
    },
    'cylinder_notched': {
      figure: 'FIGURE 5',
      title: 'HOLLOW CYLINDRICAL NOTCHED BLOCK',
      standard: 'MIL-STD-2154A TYPE II',
      partNumber: 'CAL-NOT-001',
      revision: 'B'
    },
    'iiv_block': {
      figure: 'FIGURE 7',
      title: 'IIW TYPE 1 CALIBRATION BLOCK',
      standard: 'ISO 2400 / EN 12223',
      partNumber: 'CAL-IIW-001',
      revision: 'E'
    },
    'step_wedge': {
      figure: 'FIGURE 8',
      title: 'STEP WEDGE CALIBRATION BLOCK',
      standard: 'ASTM E164 / EN 10160',
      partNumber: 'CAL-STP-001',
      revision: 'C'
    },
    'iow_block': {
      figure: 'FIGURE 9',
      title: 'AREA-AMPLITUDE REFERENCE BLOCK',
      standard: 'ASTM E428 / SAE AMS-STD-2154',
      partNumber: 'CAL-IOW-001',
      revision: 'B'
    },
    'custom': {
      figure: 'CUSTOM',
      title: 'CUSTOM CALIBRATION BLOCK',
      standard: 'PER CUSTOMER SPEC',
      partNumber: 'CAL-CUS-XXX',
      revision: 'A'
    }
  };

  const info = blockInfo[blockType];

  return (
    <div className="relative w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Professional Drawing Frame */}
      <svg 
        width="100%" 
        viewBox="0 0 850 600" 
        className="block"
        style={{ minHeight: height }}
      >
        {/* Definitions */}
        <defs>
          {/* Grid pattern */}
          <pattern id={`grid-${uniqueId}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.3"/>
          </pattern>
          <pattern id={`grid-major-${uniqueId}`} width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill={`url(#grid-${uniqueId})`}/>
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
          </pattern>
          
          {/* Section hatching */}
          <pattern id={`hatch-${uniqueId}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#64748b" strokeWidth="0.4"/>
          </pattern>
          
          {/* Dimension arrow marker */}
          <marker id={`arrow-${uniqueId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,8 L8,4 z" fill="#1e293b"/>
          </marker>
          <marker id={`arrow-rev-${uniqueId}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M8,0 L8,8 L0,4 z" fill="#1e293b"/>
          </marker>
          
          {/* Center line pattern */}
          <pattern id={`centerline-${uniqueId}`} patternUnits="userSpaceOnUse" width="20" height="1">
            <line x1="0" y1="0" x2="12" y2="0" stroke="#dc2626" strokeWidth="0.5"/>
            <line x1="14" y1="0" x2="16" y2="0" stroke="#dc2626" strokeWidth="0.5"/>
          </pattern>
        </defs>
        
        {/* Drawing background with grid */}
        <rect x="0" y="0" width="850" height="600" fill="white"/>
        <rect x="20" y="20" width="810" height="480" fill={`url(#grid-major-${uniqueId})`} opacity="0.5"/>
        
        {/* Drawing border - triple line frame */}
        <rect x="15" y="15" width="820" height="570" fill="none" stroke="#1e293b" strokeWidth="3"/>
        <rect x="20" y="20" width="810" height="560" fill="none" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Main Drawing Area */}
        <g transform="translate(30, 30)">
          {renderEnhancedDrawing(blockType, uniqueId, blockDimensions, blockFbhDataArray, singleFbhData, notchData, scale.factor, showDimensions)}
        </g>
        
        {/* Title Block - Professional Engineering Standard */}
        <g transform="translate(20, 500)">
          {/* Title block frame */}
          <rect x="0" y="0" width="810" height="80" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5"/>
          
          {/* Vertical dividers */}
          <line x1="200" y1="0" x2="200" y2="80" stroke="#1e293b" strokeWidth="1"/>
          <line x1="400" y1="0" x2="400" y2="80" stroke="#1e293b" strokeWidth="1"/>
          <line x1="600" y1="0" x2="600" y2="80" stroke="#1e293b" strokeWidth="1"/>
          
          {/* Horizontal dividers */}
          <line x1="0" y1="25" x2="200" y2="25" stroke="#1e293b" strokeWidth="0.5"/>
          <line x1="0" y1="50" x2="200" y2="50" stroke="#1e293b" strokeWidth="0.5"/>
          <line x1="200" y1="40" x2="400" y2="40" stroke="#1e293b" strokeWidth="0.5"/>
          <line x1="400" y1="40" x2="600" y2="40" stroke="#1e293b" strokeWidth="0.5"/>
          <line x1="600" y1="40" x2="810" y2="40" stroke="#1e293b" strokeWidth="0.5"/>
          
          {/* Company/Logo Section */}
          <text x="100" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e40af" fontFamily="Arial, sans-serif">SCANMASTER NDT SYSTEMS</text>
          <text x="100" y="38" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">ULTRASONIC CALIBRATION STANDARDS</text>
          <text x="100" y="65" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">QUALITY SYSTEM: AS9100D / ISO 17025</text>
          
          {/* Title Section */}
          <text x="300" y="18" textAnchor="middle" fontSize="9" fontWeight="600" fill="#374151" fontFamily="Arial, sans-serif">TITLE:</text>
          <text x="300" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">{info.title}</text>
          <text x="300" y="55" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">{info.figure}</text>
          <text x="300" y="70" textAnchor="middle" fontSize="8" fill="#3b82f6" fontFamily="Arial, sans-serif">{info.standard}</text>
          
          {/* Part Number Section */}
          <text x="500" y="18" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">PART NUMBER</text>
          <text x="500" y="34" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b" fontFamily="monospace">{info.partNumber}</text>
          <text x="450" y="55" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">MATERIAL:</text>
          <text x="450" y="70" fontSize="8" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">{material}</text>
          <text x="530" y="55" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">FINISH:</text>
          <text x="530" y="70" fontSize="8" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">Ra 3.2μm</text>
          
          {/* Revision/Scale Section */}
          <text x="650" y="18" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">REV</text>
          <text x="650" y="34" fontSize="16" fontWeight="700" fill="#dc2626" fontFamily="Arial, sans-serif">{info.revision}</text>
          <text x="700" y="18" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">SCALE</text>
          <text x="700" y="34" fontSize="10" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">NTS</text>
          <text x="760" y="18" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">SHEET</text>
          <text x="760" y="34" fontSize="10" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">1 OF 1</text>
          
          <text x="650" y="55" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">UNITS: mm</text>
          <text x="720" y="55" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">ANGLES: ±0.5°</text>
          <text x="650" y="70" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">DECIMALS: X.X = ±0.1</text>
          <text x="750" y="70" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">X.XX = ±0.05</text>
        </g>
        
        {/* Drawing notes box */}
        <g transform="translate(620, 30)">
          <rect x="0" y="0" width="190" height="120" fill="#fffbeb" stroke="#1e293b" strokeWidth="1"/>
          <text x="95" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">NOTES:</text>
          <line x1="5" y1="20" x2="185" y2="20" stroke="#d97706" strokeWidth="0.5"/>
          <text x="8" y="35" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">1. BREAK ALL SHARP EDGES 0.2 MAX</text>
          <text x="8" y="48" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">2. REMOVE ALL BURRS</text>
          <text x="8" y="61" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">3. MACHINE FINISH ALL OVER (MFO)</text>
          <text x="8" y="74" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">4. FBH PER ASTM E127</text>
          <text x="8" y="87" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">5. HOLES PERPENDICULAR TO SURFACE</text>
          <text x="8" y="100" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">6. ACOUSTIC PROPERTIES VERIFIED</text>
          <text x="8" y="113" fontSize="7" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">7. SERIALIZED &amp; CERTIFIED</text>
        </g>
        
        {/* Surface finish symbols legend */}
        <g transform="translate(620, 160)">
          <rect x="0" y="0" width="190" height="60" fill="#f0fdf4" stroke="#1e293b" strokeWidth="1"/>
          <text x="95" y="14" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SURFACE FINISH</text>
          <line x1="5" y1="18" x2="185" y2="18" stroke="#16a34a" strokeWidth="0.5"/>
          {/* Surface finish symbol */}
          <path d="M15,35 L25,35 L30,28 L35,35" fill="none" stroke="#1e293b" strokeWidth="1"/>
          <text x="40" y="38" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">Ra 3.2 μm (125 μin) All Over</text>
          <text x="15" y="52" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">FBH Surface: Ra 1.6 μm (63 μin)</text>
        </g>
      </svg>
    </div>
  );
};

// Enhanced technical drawings for each block type - Now using dynamic components
function renderEnhancedDrawing(
  blockType: CalibrationBlockType, 
  uniqueId: string,
  dimensions: BlockDimensions,
  fbhDataArray: FBHData[],
  singleFbhData: FBHData,
  notchData: NotchData | undefined,
  scale: number,
  showDimensions: boolean
) {
  const commonProps = {
    uniqueId,
    dimensions,
    scale,
    showDimensions,
  };
  
  switch (blockType) {
    case 'flat_block':
      return <EnhancedFlatBlockDrawing {...commonProps} fbhData={fbhDataArray} />;
    case 'curved_block':
      return <EnhancedCurvedBlockDrawing {...commonProps} fbhData={fbhDataArray} />;
    case 'cylinder_fbh':
      return <EnhancedCylinderFBHDrawing {...commonProps} fbhData={fbhDataArray} />;
    case 'angle_beam':
      return <EnhancedAngleBeamDrawing {...commonProps} fbhData={fbhDataArray} />;
    case 'cylinder_notched':
      return <EnhancedCylinderNotchedDrawing {...commonProps} notchData={notchData} />;
    case 'iiv_block':
      return <EnhancedIIWBlockDrawing {...commonProps} />;
    case 'step_wedge':
      return <EnhancedStepWedgeDrawing {...commonProps} />;
    case 'iow_block':
      return <EnhancedIOWBlockDrawing {...commonProps} fbhData={singleFbhData} />;
    default:
      return <EnhancedCustomBlockDrawingLegacy uniqueId={uniqueId} />;
  }
}

// ==================== PROFESSIONAL DIMENSION LINE ====================
function ProDimensionLine({ 
  x1, y1, x2, y2, label, offset = 20, vertical = false, uniqueId 
}: { 
  x1: number; y1: number; x2: number; y2: number; 
  label: string; offset?: number; vertical?: boolean; uniqueId: string;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  if (vertical) {
    return (
      <g className="dimension">
        {/* Extension lines */}
        <line x1={x1 - 3} y1={y1} x2={x1 + offset + 5} y2={y1} stroke="#1e293b" strokeWidth="0.4"/>
        <line x1={x2 - 3} y1={y2} x2={x2 + offset + 5} y2={y2} stroke="#1e293b" strokeWidth="0.4"/>
        {/* Dimension line with arrows */}
        <line 
          x1={x1 + offset} y1={y1 + 3} 
          x2={x2 + offset} y2={y2 - 3} 
          stroke="#1e293b" strokeWidth="0.6"
          markerStart={`url(#arrow-rev-${uniqueId})`}
          markerEnd={`url(#arrow-${uniqueId})`}
        />
        {/* Label background */}
        <rect x={x1 + offset - 18} y={midY - 6} width="36" height="12" fill="white"/>
        {/* Label */}
        <text 
          x={x1 + offset} 
          y={midY + 3} 
          textAnchor="middle" 
          fontSize="9" 
          fontWeight="600" 
          fill="#1e293b"
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </g>
    );
  }
  
  return (
    <g className="dimension">
      {/* Extension lines */}
      <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + offset + 5} stroke="#1e293b" strokeWidth="0.4"/>
      <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + offset + 5} stroke="#1e293b" strokeWidth="0.4"/>
      {/* Dimension line with arrows */}
      <line 
        x1={x1 + 3} y1={y1 + offset} 
        x2={x2 - 3} y2={y2 + offset} 
        stroke="#1e293b" strokeWidth="0.6"
        markerStart={`url(#arrow-rev-${uniqueId})`}
        markerEnd={`url(#arrow-${uniqueId})`}
      />
      {/* Label background */}
      <rect x={midX - 20} y={y1 + offset - 6} width="40" height="12" fill="white"/>
      {/* Label */}
      <text 
        x={midX} 
        y={y1 + offset + 3} 
        textAnchor="middle" 
        fontSize="9" 
        fontWeight="600" 
        fill="#1e293b"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ==================== ENHANCED FLAT BLOCK DRAWING (LEGACY - kept for reference) ====================
function EnhancedFlatBlockDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - TOP VIEW */}
      <g transform="translate(20, 50)">
        {/* View label */}
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - TOP</text>
        
        {/* Block outline with thick lines */}
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center lines (red, long-short dash) */}
        <line x1="100" y1="-10" x2="100" y2="110" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="50" x2="210" y2="50" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* FBH holes with proper symbols */}
        {[
          { x: 50, d: 1.19, label: '3/64"' },
          { x: 100, d: 1.98, label: '5/64"' },
          { x: 150, d: 3.18, label: '8/64"' }
        ].map((hole, i) => (
          <g key={i}>
            {/* Hole circle */}
            <circle cx={hole.x} cy={50} r={hole.d * 2} fill="none" stroke="#1e293b" strokeWidth="1.5"/>
            {/* Cross-hair for hole center */}
            <line x1={hole.x - 5} y1={50} x2={hole.x + 5} y2={50} stroke="#1e293b" strokeWidth="0.4"/>
            <line x1={hole.x} y1={45} x2={hole.x} y2={55} stroke="#1e293b" strokeWidth="0.4"/>
            {/* Hole callout */}
            <line x1={hole.x + hole.d * 2} y1={50 - hole.d * 2} x2={hole.x + 25} y2={20 - i * 5} stroke="#1e293b" strokeWidth="0.4"/>
            <text x={hole.x + 27} y={22 - i * 5} fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">Ø{hole.label}</text>
          </g>
        ))}
        
        {/* Position dimensions */}
        <ProDimensionLine x1={0} y1={100} x2={50} y2={100} label="50.0" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={50} y1={100} x2={100} y2={100} label="50.0" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={100} y1={100} x2={150} y2={100} label="50.0" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={150} y1={100} x2={200} y2={100} label="50.0" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={0} y1={100} x2={200} y2={100} label="200.0 ±0.1" offset={45} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={100} label="100.0 ±0.1" offset={25} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW B - SECTION A-A */}
      <g transform="translate(280, 50)">
        {/* View label */}
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SECTION A-A</text>
        
        {/* Block cross-section with hatching */}
        <rect x="0" y="0" width="200" height="50" fill={`url(#hatch-${uniqueId})`} stroke="#1e293b" strokeWidth="2"/>
        
        {/* FBH holes in section */}
        {[
          { x: 50, depth: 12.5 },
          { x: 100, depth: 25 },
          { x: 150, depth: 37.5 }
        ].map((hole, i) => (
          <g key={i}>
            {/* Hole cavity */}
            <rect x={hole.x - 2} y={0} width="4" height={hole.depth} fill="white" stroke="#1e293b" strokeWidth="1"/>
            {/* Flat bottom */}
            <line x1={hole.x - 3} y1={hole.depth} x2={hole.x + 3} y2={hole.depth} stroke="#1e293b" strokeWidth="1.5"/>
            {/* Depth dimension */}
            <line x1={hole.x + 8} y1={0} x2={hole.x + 8} y2={hole.depth} stroke="#3b82f6" strokeWidth="0.5"/>
            <text x={hole.x + 12} y={hole.depth / 2 + 3} fontSize="7" fill="#3b82f6" fontFamily="Arial, sans-serif">{hole.depth}</text>
          </g>
        ))}
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={50} x2={200} y2={50} label="200.0 ±0.1" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={50} label="50.0 ±0.05" offset={25} vertical uniqueId={uniqueId}/>
        
        {/* Section line indicators */}
        <text x="-15" y="25" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">A</text>
        <text x="215" y="25" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">A</text>
      </g>
      
      {/* VIEW C - END VIEW */}
      <g transform="translate(280, 200)">
        <text x="50" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">END VIEW</text>
        
        <rect x="0" y="0" width="100" height="50" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <line x1="50" y1="-5" x2="50" y2="55" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-5" y1="25" x2="105" y2="25" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        <ProDimensionLine x1={0} y1={50} x2={100} y2={50} label="100.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={100} y1={0} x2={100} y2={50} label="50.0" offset={20} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* FBH SCHEDULE TABLE */}
      <g transform="translate(20, 280)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">FBH SCHEDULE:</text>
        
        {/* Table header */}
        <rect x="0" y="0" width="250" height="20" fill="#1e40af" stroke="#1e293b" strokeWidth="1"/>
        <text x="30" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" fontFamily="Arial, sans-serif">HOLE</text>
        <text x="80" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" fontFamily="Arial, sans-serif">DIA (in)</text>
        <text x="130" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" fontFamily="Arial, sans-serif">DIA (mm)</text>
        <text x="180" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" fontFamily="Arial, sans-serif">DEPTH</text>
        <text x="225" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" fontFamily="Arial, sans-serif">TOL</text>
        
        {/* Table rows */}
        {[
          { hole: 'FBH-1', dia: '3/64"', mm: '1.19', depth: '12.5', tol: '±0.025' },
          { hole: 'FBH-2', dia: '5/64"', mm: '1.98', depth: '25.0', tol: '±0.025' },
          { hole: 'FBH-3', dia: '8/64"', mm: '3.18', depth: '37.5', tol: '±0.025' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={20 + i * 18} width="250" height="18" fill={i % 2 === 0 ? '#f8fafc' : 'white'} stroke="#e5e7eb" strokeWidth="0.5"/>
            <text x="30" y={33 + i * 18} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.hole}</text>
            <text x="80" y={33 + i * 18} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">{row.dia}</text>
            <text x="130" y={33 + i * 18} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.mm}</text>
            <text x="180" y={33 + i * 18} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.depth}</text>
            <text x="225" y={33 + i * 18} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">{row.tol}</text>
          </g>
        ))}
        
        {/* Table borders */}
        <line x1="55" y1="0" x2="55" y2="74" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="105" y1="0" x2="105" y2="74" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="155" y1="0" x2="155" y2="74" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="205" y1="0" x2="205" y2="74" stroke="#1e293b" strokeWidth="0.5"/>
        <rect x="0" y="0" width="250" height="74" fill="none" stroke="#1e293b" strokeWidth="1"/>
      </g>
      
      {/* GD&T Feature Control Frame */}
      <g transform="translate(300, 300)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">GEOMETRIC TOLERANCES:</text>
        
        {/* Flatness */}
        <rect x="0" y="0" width="150" height="20" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <rect x="0" y="0" width="25" height="20" fill="#f0fdf4" stroke="#1e293b" strokeWidth="1"/>
        <text x="12.5" y="14" textAnchor="middle" fontSize="10" fill="#1e293b" fontFamily="Arial, sans-serif">⏥</text>
        <text x="87" y="14" textAnchor="middle" fontSize="9" fill="#1e293b" fontFamily="Arial, sans-serif">0.025 mm</text>
        
        {/* Perpendicularity */}
        <rect x="0" y="25" width="150" height="20" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <rect x="0" y="25" width="25" height="20" fill="#fef3c7" stroke="#1e293b" strokeWidth="1"/>
        <text x="12.5" y="39" textAnchor="middle" fontSize="10" fill="#1e293b" fontFamily="Arial, sans-serif">⟂</text>
        <text x="87" y="39" textAnchor="middle" fontSize="9" fill="#1e293b" fontFamily="Arial, sans-serif">0.05 mm | A</text>
        
        {/* Position */}
        <rect x="0" y="50" width="150" height="20" fill="white" stroke="#1e293b" strokeWidth="1"/>
        <rect x="0" y="50" width="25" height="20" fill="#fce7f3" stroke="#1e293b" strokeWidth="1"/>
        <text x="12.5" y="64" textAnchor="middle" fontSize="10" fill="#1e293b" fontFamily="Arial, sans-serif">⌖</text>
        <text x="87" y="64" textAnchor="middle" fontSize="9" fill="#1e293b" fontFamily="Arial, sans-serif">Ø0.1 mm | A | B</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED CURVED BLOCK DRAWING (LEGACY) ====================
function EnhancedCurvedBlockDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - SIDE VIEW (CONVEX PROFILE) */}
      <g transform="translate(20, 40)">
        <text x="110" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - SIDE (CONVEX PROFILE)</text>
        
        {/* Convex curved surface */}
        <path 
          d="M 0 80 A 150 150 0 0 1 220 80 L 220 120 L 0 120 Z"
          fill="#f8fafc" 
          stroke="#1e293b" 
          strokeWidth="2"
        />
        
        {/* Section hatching */}
        <path 
          d="M 0 80 A 150 150 0 0 1 220 80 L 220 120 L 0 120 Z"
          fill={`url(#hatch-${uniqueId})`} 
          opacity="0.4"
        />
        
        {/* Radius center and indicator */}
        <circle cx="110" cy="-70" r="3" fill="#16a34a" stroke="#1e293b" strokeWidth="1"/>
        <line x1="110" y1="-70" x2="110" y2="80" stroke="#16a34a" strokeWidth="0.8" strokeDasharray="5,3"/>
        <line x1="110" y1="-70" x2="30" y2="75" stroke="#16a34a" strokeWidth="0.8"/>
        <text x="55" y="0" fontSize="10" fontWeight="600" fill="#16a34a" fontFamily="Arial, sans-serif">R150 ±0.5</text>
        
        {/* Center line */}
        <line x1="110" y1="-80" x2="110" y2="130" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* FBH positions along curve */}
        {[
          { x: 55, y: 72, dia: '3/64"' },
          { x: 110, y: 80, dia: '5/64"' },
          { x: 165, y: 72, dia: '3/64"' }
        ].map((hole, i) => (
          <g key={i}>
            <circle cx={hole.x} cy={hole.y} r={i === 1 ? 4 : 3} fill="none" stroke="#dc2626" strokeWidth="1.5"/>
            <line x1={hole.x} y1={hole.y - 10} x2={hole.x} y2={hole.y + 15} stroke="#dc2626" strokeWidth="0.5" strokeDasharray="2,2"/>
            <text x={hole.x} y={hole.y - 15} textAnchor="middle" fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">Ø{hole.dia}</text>
          </g>
        ))}
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={120} x2={220} y2={120} label="220.0 ±0.1" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={220} y1={80} x2={220} y2={120} label="40.0 ±0.05" offset={30} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW B - TOP VIEW */}
      <g transform="translate(280, 50)">
        <text x="110" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW B - TOP</text>
        
        <rect x="0" y="0" width="220" height="80" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center lines */}
        <line x1="110" y1="-10" x2="110" y2="90" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="40" x2="230" y2="40" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* FBH holes */}
        {[55, 110, 165].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={40} r={i === 1 ? 4 : 3} fill="none" stroke="#1e293b" strokeWidth="1.5"/>
            <line x1={x - 5} y1={40} x2={x + 5} y2={40} stroke="#1e293b" strokeWidth="0.4"/>
            <line x1={x} y1={35} x2={x} y2={45} stroke="#1e293b" strokeWidth="0.4"/>
          </g>
        ))}
        
        {/* Position dimensions */}
        <ProDimensionLine x1={0} y1={80} x2={55} y2={80} label="55.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={55} y1={80} x2={110} y2={80} label="55.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={110} y1={80} x2={165} y2={80} label="55.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={165} y1={80} x2={220} y2={80} label="55.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={220} y1={0} x2={220} y2={80} label="80.0 ±0.1" offset={25} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW C - END VIEW */}
      <g transform="translate(280, 220)">
        <text x="40" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW C - END</text>
        
        <rect x="0" y="0" width="80" height="40" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Curved top surface indicator */}
        <path d="M 0 5 Q 40 -10 80 5" fill="none" stroke="#16a34a" strokeWidth="1" strokeDasharray="3,2"/>
        
        <line x1="40" y1="-5" x2="40" y2="45" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        <ProDimensionLine x1={0} y1={40} x2={80} y2={40} label="80.0" offset={18} uniqueId={uniqueId}/>
        <ProDimensionLine x1={80} y1={0} x2={80} y2={40} label="40.0" offset={18} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* CURVATURE SPECIFICATION TABLE */}
      <g transform="translate(20, 240)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">CURVATURE SPECIFICATION:</text>
        
        <rect x="0" y="0" width="220" height="70" fill="#f0fdf4" stroke="#1e293b" strokeWidth="1"/>
        <line x1="0" y1="18" x2="220" y2="18" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="80" y1="0" x2="80" y2="70" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="150" y1="0" x2="150" y2="70" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="40" y="12" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">PARAMETER</text>
        <text x="115" y="12" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">VALUE</text>
        <text x="185" y="12" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">TOL</text>
        
        {[
          { param: 'Radius', value: '150 mm', tol: '±0.5' },
          { param: 'Arc Length', value: '210 mm', tol: '±0.2' },
          { param: 'Surface Type', value: 'CONVEX', tol: '-' }
        ].map((row, i) => (
          <g key={i}>
            <text x="40" y={32 + i * 17} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.param}</text>
            <text x="115" y={32 + i * 17} textAnchor="middle" fontSize="8" fill="#16a34a" fontWeight="600" fontFamily="Arial, sans-serif">{row.value}</text>
            <text x="185" y={32 + i * 17} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">{row.tol}</text>
          </g>
        ))}
      </g>
      
      {/* FBH SPECIFICATION */}
      <g transform="translate(20, 330)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">FBH SPECIFICATION (PERPENDICULAR TO SURFACE):</text>
        
        <rect x="0" y="0" width="220" height="55" fill="#fef2f2" stroke="#1e293b" strokeWidth="1"/>
        <text x="110" y="18" textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">HOLES DRILLED NORMAL TO CURVED SURFACE</text>
        <text x="110" y="33" textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">FBH-1, FBH-3: Ø3/64" (1.19mm) Depth: T/2</text>
        <text x="110" y="48" textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">FBH-2 (Center): Ø5/64" (1.98mm) Depth: 3T/4</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED CYLINDER FBH DRAWING (LEGACY) ====================
function EnhancedCylinderFBHDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - END VIEW (CROSS-SECTION) */}
      <g transform="translate(30, 40)">
        <text x="75" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - END (CROSS-SECTION)</text>
        
        {/* Outer circle */}
        <circle cx="75" cy="75" r="75" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Inner circle (bore) */}
        <circle cx="75" cy="75" r="50" fill="white" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Wall hatching pattern */}
        <defs>
          <clipPath id={`wall-clip-${uniqueId}`}>
            <path d="M 0,75 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0 M 25,75 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" fillRule="evenodd"/>
          </clipPath>
        </defs>
        <rect x="0" y="0" width="150" height="150" fill={`url(#hatch-${uniqueId})`} clipPath={`url(#wall-clip-${uniqueId})`}/>
        
        {/* Center lines */}
        <line x1="75" y1="-10" x2="75" y2="160" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="75" x2="160" y2="75" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* FBH positions at 0°, 90°, 180°, 270° in wall */}
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = 62.5; // Mid-wall radius
          const x = 75 + r * Math.cos(rad);
          const y = 75 - r * Math.sin(rad);
          
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="none" stroke="#dc2626" strokeWidth="1.5"/>
              <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#dc2626" strokeWidth="0.4"/>
              <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#dc2626" strokeWidth="0.4"/>
            </g>
          );
        })}
        
        {/* Angular position labels */}
        <text x="145" y="78" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">0°</text>
        <text x="72" y="-2" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">90°</text>
        <text x="-8" y="78" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">180°</text>
        <text x="68" y="163" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">270°</text>
        
        {/* Diameter dimensions */}
        <ProDimensionLine x1={0} y1={150} x2={150} y2={150} label="Ø150.0 OD" offset={25} uniqueId={uniqueId}/>
        <line x1={25} y1={75} x2={125} y2={75} stroke="#f59e0b" strokeWidth="0.8"/>
        <text x="75" y="68" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="600" fontFamily="Arial, sans-serif">Ø100.0 ID</text>
        
        {/* Wall thickness indicator */}
        <line x1={125} y1={75} x2={150} y2={75} stroke="#3b82f6" strokeWidth="1"/>
        <text x="137" y="68" textAnchor="middle" fontSize="7" fill="#3b82f6" fontFamily="Arial, sans-serif">t=25</text>
      </g>
      
      {/* VIEW B - SECTION B-B (LONGITUDINAL) */}
      <g transform="translate(230, 50)">
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SECTION B-B</text>
        
        {/* Upper wall section */}
        <rect x="0" y="0" width="200" height="25" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <rect x="0" y="0" width="200" height="25" fill={`url(#hatch-${uniqueId})`}/>
        
        {/* Lower wall section */}
        <rect x="0" y="75" width="200" height="25" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <rect x="0" y="75" width="200" height="25" fill={`url(#hatch-${uniqueId})`}/>
        
        {/* Bore space */}
        <rect x="0" y="25" width="200" height="50" fill="white" stroke="none"/>
        <line x1="0" y1="25" x2="0" y2="75" stroke="#1e293b" strokeWidth="2"/>
        <line x1="200" y1="25" x2="200" y2="75" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center line */}
        <line x1="-10" y1="50" x2="210" y2="50" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* FBH holes in section - showing radial penetration */}
        {[50, 100, 150].map((x, i) => (
          <g key={i}>
            {/* Top wall FBH */}
            <rect x={x - 1.5} y="0" width="3" height="12.5" fill="white" stroke="#1e293b" strokeWidth="0.8"/>
            <line x1={x - 2} y1="12.5" x2={x + 2} y2="12.5" stroke="#dc2626" strokeWidth="1"/>
            
            {/* Bottom wall FBH */}
            <rect x={x - 1.5} y="87.5" width="3" height="12.5" fill="white" stroke="#1e293b" strokeWidth="0.8"/>
            <line x1={x - 2} y1="87.5" x2={x + 2} y2="87.5" stroke="#dc2626" strokeWidth="1"/>
          </g>
        ))}
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={100} x2={200} y2={100} label="200.0 ±0.2 LENGTH" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={100} label="OD 150" offset={25} vertical uniqueId={uniqueId}/>
        
        {/* FBH spacing dimensions */}
        <ProDimensionLine x1={0} y1={-10} x2={50} y2={-10} label="50.0" offset={-20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={50} y1={-10} x2={100} y2={-10} label="50.0" offset={-20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={100} y1={-10} x2={150} y2={-10} label="50.0" offset={-20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={150} y1={-10} x2={200} y2={-10} label="50.0" offset={-20} uniqueId={uniqueId}/>
      </g>
      
      {/* FBH SPECIFICATION TABLE */}
      <g transform="translate(30, 250)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">FBH SPECIFICATION:</text>
        
        <rect x="0" y="0" width="280" height="90" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <rect x="0" y="0" width="280" height="20" fill="#1e40af"/>
        <line x1="50" y1="0" x2="50" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="110" y1="0" x2="110" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="160" y1="0" x2="160" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="220" y1="0" x2="220" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="25" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">QTY</text>
        <text x="80" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DIAMETER</text>
        <text x="135" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DEPTH</text>
        <text x="190" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">POSITION</text>
        <text x="250" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">TOL</text>
        
        {[
          { qty: '4×', dia: 'Ø3/64" (1.19)', depth: 't/2', pos: '0°, 90°, 180°, 270°', tol: '±0.025' },
          { qty: '4×', dia: 'Ø5/64" (1.98)', depth: '3t/4', pos: 'At 45° offset', tol: '±0.025' },
          { qty: '4×', dia: 'Ø8/64" (3.18)', depth: '0.9t', pos: 'Per spec', tol: '±0.025' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={20 + i * 23} width="280" height="23" fill={i % 2 === 0 ? '#f8fafc' : 'white'}/>
            <text x="25" y={35 + i * 23} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.qty}</text>
            <text x="80" y={35 + i * 23} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">{row.dia}</text>
            <text x="135" y={35 + i * 23} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.depth}</text>
            <text x="190" y={35 + i * 23} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.pos}</text>
            <text x="250" y={35 + i * 23} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">{row.tol}</text>
          </g>
        ))}
      </g>
      
      {/* NOTES */}
      <g transform="translate(340, 250)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">FABRICATION NOTES:</text>
        <rect x="0" y="0" width="200" height="90" fill="#fefce8" stroke="#1e293b" strokeWidth="1"/>
        <text x="10" y="18" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">1. FBH RADIAL TO AXIS</text>
        <text x="10" y="32" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">2. DEPTH FROM OD SURFACE</text>
        <text x="10" y="46" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">3. ANGULAR TOL: ±2°</text>
        <text x="10" y="60" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">4. BORE FINISH: Ra 1.6μm</text>
        <text x="10" y="74" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">5. OD FINISH: Ra 3.2μm</text>
        <text x="10" y="88" fontSize="7" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">6. SERIALIZED &amp; CERTIFIED</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED ANGLE BEAM DRAWING (LEGACY) ====================
function EnhancedAngleBeamDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - TOP VIEW */}
      <g transform="translate(20, 40)">
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - TOP</text>
        
        <rect x="0" y="0" width="200" height="80" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center lines */}
        <line x1="100" y1="-10" x2="100" y2="90" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="40" x2="210" y2="40" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* SDH positions - 3 side-drilled holes through width */}
        {[50, 100, 150].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={40} r="3" fill="none" stroke="#dc2626" strokeWidth="1.5"/>
            {/* Hole through indication */}
            <line x1={x} y1="0" x2={x} y2="80" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="2,2"/>
          </g>
        ))}
        
        {/* Hole callouts */}
        <line x1="50" y1="40" x2="50" y2="-5" stroke="#1e293b" strokeWidth="0.4"/>
        <text x="50" y="-10" textAnchor="middle" fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">SDH-1</text>
        <line x1="100" y1="40" x2="100" y2="-5" stroke="#1e293b" strokeWidth="0.4"/>
        <text x="100" y="-10" textAnchor="middle" fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">SDH-2</text>
        <line x1="150" y1="40" x2="150" y2="-5" stroke="#1e293b" strokeWidth="0.4"/>
        <text x="150" y="-10" textAnchor="middle" fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">SDH-3</text>
        
        {/* Position dimensions */}
        <ProDimensionLine x1={0} y1={80} x2={50} y2={80} label="50.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={50} y1={80} x2={100} y2={80} label="50.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={100} y1={80} x2={150} y2={80} label="50.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={150} y1={80} x2={200} y2={80} label="50.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={0} y1={80} x2={200} y2={80} label="200.0 ±0.1" offset={40} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={80} label="80.0 ±0.1" offset={25} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW B - SECTION A-A (SDH DEPTHS) */}
      <g transform="translate(280, 40)">
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SECTION A-A</text>
        
        <rect x="0" y="0" width="200" height="50" fill={`url(#hatch-${uniqueId})`} stroke="#1e293b" strokeWidth="2"/>
        
        {/* SDH at different depths */}
        {[
          { x: 50, depth: 12.5, label: 'T/4' },
          { x: 100, depth: 25, label: 'T/2' },
          { x: 150, depth: 37.5, label: '3T/4' }
        ].map((hole, i) => (
          <g key={i}>
            {/* SDH cavity */}
            <circle cx={hole.x} cy={hole.depth} r="2.5" fill="white" stroke="#1e293b" strokeWidth="1"/>
            {/* Depth indicator */}
            <line x1={hole.x + 10} y1={0} x2={hole.x + 10} y2={hole.depth} stroke="#3b82f6" strokeWidth="0.6"/>
            <text x={hole.x + 15} y={hole.depth / 2 + 3} fontSize="7" fill="#3b82f6" fontFamily="Arial, sans-serif">{hole.label}</text>
          </g>
        ))}
        
        {/* Angle beam path indication */}
        <g opacity="0.6">
          <line x1="-30" y1="60" x2="50" y2="12.5" stroke="#16a34a" strokeWidth="1" strokeDasharray="4,2"/>
          <line x1="-30" y1="60" x2="100" y2="25" stroke="#16a34a" strokeWidth="1" strokeDasharray="4,2"/>
          <line x1="-30" y1="60" x2="150" y2="37.5" stroke="#16a34a" strokeWidth="1" strokeDasharray="4,2"/>
          <text x="-35" y="70" fontSize="8" fill="#16a34a" fontWeight="600" fontFamily="Arial, sans-serif">45°</text>
        </g>
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={50} x2={200} y2={50} label="200.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={50} label="50.0 ±0.05" offset={20} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW C - END VIEW */}
      <g transform="translate(280, 180)">
        <text x="40" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">END VIEW</text>
        
        <rect x="0" y="0" width="80" height="50" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center lines */}
        <line x1="40" y1="-5" x2="40" y2="55" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-5" y1="25" x2="85" y2="25" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* SDH entry - through hole */}
        <line x1="0" y1="25" x2="80" y2="25" stroke="#dc2626" strokeWidth="1" strokeDasharray="3,2"/>
        <circle cx="40" cy="25" r="2.5" fill="none" stroke="#dc2626" strokeWidth="1.5"/>
        
        <ProDimensionLine x1={0} y1={50} x2={80} y2={50} label="80.0" offset={18} uniqueId={uniqueId}/>
        <ProDimensionLine x1={80} y1={0} x2={80} y2={50} label="50.0" offset={18} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* SDH SPECIFICATION TABLE */}
      <g transform="translate(20, 200)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SIDE-DRILLED HOLE SCHEDULE:</text>
        
        <rect x="0" y="0" width="250" height="85" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <rect x="0" y="0" width="250" height="18" fill="#7c3aed"/>
        <line x1="40" y1="0" x2="40" y2="85" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="100" y1="0" x2="100" y2="85" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="150" y1="0" x2="150" y2="85" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="200" y1="0" x2="200" y2="85" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="20" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">HOLE</text>
        <text x="70" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DIAMETER</text>
        <text x="125" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DEPTH</text>
        <text x="175" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">X POS</text>
        <text x="225" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">ANGLE</text>
        
        {[
          { hole: 'SDH-1', dia: 'Ø1.5 mm', depth: 'T/4 (12.5)', x: '50.0', angle: '45°' },
          { hole: 'SDH-2', dia: 'Ø1.5 mm', depth: 'T/2 (25.0)', x: '100.0', angle: '60°' },
          { hole: 'SDH-3', dia: 'Ø1.5 mm', depth: '3T/4 (37.5)', x: '150.0', angle: '70°' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={18 + i * 22} width="250" height="22" fill={i % 2 === 0 ? '#f8fafc' : 'white'}/>
            <text x="20" y={32 + i * 22} textAnchor="middle" fontSize="8" fill="#7c3aed" fontWeight="600" fontFamily="Arial, sans-serif">{row.hole}</text>
            <text x="70" y={32 + i * 22} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">{row.dia}</text>
            <text x="125" y={32 + i * 22} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.depth}</text>
            <text x="175" y={32 + i * 22} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.x}</text>
            <text x="225" y={32 + i * 22} textAnchor="middle" fontSize="8" fill="#16a34a" fontWeight="600" fontFamily="Arial, sans-serif">{row.angle}</text>
          </g>
        ))}
      </g>
      
      {/* BEAM ANGLE DIAGRAM */}
      <g transform="translate(20, 310)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">ANGLE BEAM SETUP:</text>
        
        <rect x="0" y="0" width="180" height="60" fill="#ecfdf5" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Probe symbol */}
        <rect x="10" y="30" width="30" height="15" fill="#16a34a" stroke="#1e293b" strokeWidth="1"/>
        <text x="25" y="42" textAnchor="middle" fontSize="7" fill="white" fontWeight="600" fontFamily="Arial, sans-serif">PROBE</text>
        
        {/* Beam lines at different angles */}
        <line x1="40" y1="38" x2="80" y2="55" stroke="#16a34a" strokeWidth="1.5"/>
        <text x="85" y="55" fontSize="7" fill="#16a34a" fontFamily="Arial, sans-serif">45°</text>
        <line x1="40" y1="38" x2="100" y2="55" stroke="#f59e0b" strokeWidth="1.5"/>
        <text x="105" y="55" fontSize="7" fill="#f59e0b" fontFamily="Arial, sans-serif">60°</text>
        <line x1="40" y1="38" x2="120" y2="55" stroke="#dc2626" strokeWidth="1.5"/>
        <text x="125" y="55" fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">70°</text>
        
        <text x="10" y="18" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">SDH calibration for shear wave</text>
        <text x="10" y="28" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">angle beam inspection</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED CYLINDER NOTCHED DRAWING (LEGACY) ====================
function EnhancedCylinderNotchedDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - END VIEW (CROSS-SECTION WITH NOTCHES) */}
      <g transform="translate(30, 40)">
        <text x="75" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - END (NOTCH POSITIONS)</text>
        
        {/* Outer circle */}
        <circle cx="75" cy="75" r="75" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Inner circle (bore) */}
        <circle cx="75" cy="75" r="50" fill="white" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Wall hatching */}
        <defs>
          <clipPath id={`notch-wall-clip-${uniqueId}`}>
            <path d="M 0,75 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0 M 25,75 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" fillRule="evenodd"/>
          </clipPath>
        </defs>
        <rect x="0" y="0" width="150" height="150" fill={`url(#hatch-${uniqueId})`} clipPath={`url(#notch-wall-clip-${uniqueId})`}/>
        
        {/* Center lines */}
        <line x1="75" y1="-10" x2="75" y2="160" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="75" x2="160" y2="75" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* Notch positions at 0°, 90°, 180°, 270° on OD */}
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = 75;
          const x1 = 75 + r * Math.cos(rad);
          const y1 = 75 - r * Math.sin(rad);
          const x2 = 75 + (r - 8) * Math.cos(rad);
          const y2 = 75 - (r - 8) * Math.sin(rad);
          
          return (
            <g key={i}>
              {/* Notch indicator */}
              <line x1={x2} y1={y2} x2={x1} y2={y1} stroke="#f59e0b" strokeWidth="4"/>
              <text x={75 + (r + 12) * Math.cos(rad)} y={75 - (r + 12) * Math.sin(rad) + 3} textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="600" fontFamily="Arial, sans-serif">{angle}°</text>
            </g>
          );
        })}
        
        {/* Legend for notch */}
        <g transform="translate(160, 20)">
          <rect x="0" y="0" width="8" height="4" fill="#f59e0b"/>
          <text x="12" y="4" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">NOTCH (OD)</text>
        </g>
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={150} x2={150} y2={150} label="Ø150 OD" offset={20} uniqueId={uniqueId}/>
        <text x="75" y="80" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="600" fontFamily="Arial, sans-serif">Ø100 ID</text>
      </g>
      
      {/* VIEW B - SECTION B-B (LONGITUDINAL WITH NOTCH DETAIL) */}
      <g transform="translate(250, 50)">
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SECTION B-B</text>
        
        {/* Upper wall with notch */}
        <path d="M 0 0 L 0 30 L 85 30 L 85 25 L 115 25 L 115 30 L 200 30 L 200 0 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <path d="M 0 0 L 0 30 L 85 30 L 85 25 L 115 25 L 115 30 L 200 30 L 200 0 Z" fill={`url(#hatch-${uniqueId})`}/>
        
        {/* Notch highlight */}
        <rect x="85" y="25" width="30" height="5" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1"/>
        
        {/* Lower wall with notch */}
        <path d="M 0 80 L 0 110 L 200 110 L 200 80 L 115 80 L 115 85 L 85 85 L 85 80 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <path d="M 0 80 L 0 110 L 200 110 L 200 80 L 115 80 L 115 85 L 85 85 L 85 80 Z" fill={`url(#hatch-${uniqueId})`}/>
        
        {/* Notch highlight */}
        <rect x="85" y="80" width="30" height="5" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1"/>
        
        {/* Bore lines */}
        <line x1="0" y1="30" x2="0" y2="80" stroke="#1e293b" strokeWidth="2"/>
        <line x1="200" y1="30" x2="200" y2="80" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center line */}
        <line x1="-10" y1="55" x2="210" y2="55" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* Notch dimensions */}
        <ProDimensionLine x1={85} y1={-5} x2={115} y2={-5} label="30.0 ±0.2" offset={-15} uniqueId={uniqueId}/>
        
        {/* Overall dimensions */}
        <ProDimensionLine x1={0} y1={110} x2={200} y2={110} label="200.0 ±0.2" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={110} label="110" offset={25} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW C - NOTCH DETAIL (ENLARGED) */}
      <g transform="translate(30, 230)">
        <text x="60" y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">DETAIL C - NOTCH (4× SCALE)</text>
        
        <rect x="0" y="0" width="120" height="80" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Wall section */}
        <rect x="0" y="0" width="120" height="50" fill={`url(#hatch-${uniqueId})`} stroke="#1e293b" strokeWidth="2"/>
        
        {/* Notch cutout */}
        <rect x="40" y="40" width="40" height="10" fill="white" stroke="#1e293b" strokeWidth="1.5"/>
        <rect x="40" y="40" width="40" height="10" fill="#f59e0b" fillOpacity="0.2"/>
        
        {/* Notch dimensions */}
        <ProDimensionLine x1={40} y1={55} x2={80} y2={55} label="30.0 ±0.2" offset={12} uniqueId={uniqueId}/>
        <line x1="85" y1="40" x2="95" y2="40" stroke="#1e293b" strokeWidth="0.4"/>
        <line x1="85" y1="50" x2="95" y2="50" stroke="#1e293b" strokeWidth="0.4"/>
        <line x1="90" y1="40" x2="90" y2="50" stroke="#1e293b" strokeWidth="0.6"/>
        <text x="98" y="47" fontSize="8" fill="#f59e0b" fontWeight="600" fontFamily="Arial, sans-serif">5.0 ±0.1</text>
        <text x="98" y="57" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">(20% wall)</text>
        
        {/* Wall thickness annotation */}
        <ProDimensionLine x1={120} y1={0} x2={120} y2={50} label="t = 25" offset={18} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* NOTCH SPECIFICATION TABLE */}
      <g transform="translate(170, 230)">
        <text x="0" y="-10" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">NOTCH SPECIFICATION:</text>
        
        <rect x="0" y="0" width="250" height="80" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <rect x="0" y="0" width="250" height="18" fill="#f59e0b"/>
        <line x1="60" y1="0" x2="60" y2="80" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="120" y1="0" x2="120" y2="80" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="185" y1="0" x2="185" y2="80" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="30" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">POSITION</text>
        <text x="90" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">LENGTH</text>
        <text x="152" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DEPTH (%t)</text>
        <text x="217" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">LOCATION</text>
        
        {[
          { pos: '0°', len: '30.0 mm', depth: '20% (5.0)', loc: 'OD Surface' },
          { pos: '90°', len: '30.0 mm', depth: '20% (5.0)', loc: 'OD Surface' },
          { pos: '180°', len: '30.0 mm', depth: '20% (5.0)', loc: 'OD Surface' },
          { pos: '270°', len: '30.0 mm', depth: '20% (5.0)', loc: 'OD Surface' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={18 + i * 15.5} width="250" height="15.5" fill={i % 2 === 0 ? '#fffbeb' : 'white'}/>
            <text x="30" y={29 + i * 15.5} textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="600" fontFamily="Arial, sans-serif">{row.pos}</text>
            <text x="90" y={29 + i * 15.5} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.len}</text>
            <text x="152" y={29 + i * 15.5} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.depth}</text>
            <text x="217" y={29 + i * 15.5} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.loc}</text>
          </g>
        ))}
      </g>
      
      {/* PURPOSE NOTE */}
      <g transform="translate(170, 330)">
        <rect x="0" y="0" width="250" height="35" fill="#fef2f2" stroke="#1e293b" strokeWidth="1"/>
        <text x="125" y="15" textAnchor="middle" fontSize="8" fontWeight="600" fill="#dc2626" fontFamily="Arial, sans-serif">TYPE II CALIBRATION - ANGLE BEAM</text>
        <text x="125" y="28" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">Circumferential notches for crack-like defect simulation</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED IIW BLOCK DRAWING (LEGACY) ====================
function EnhancedIIWBlockDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - FRONT VIEW (CHARACTERISTIC IIW PROFILE) */}
      <g transform="translate(20, 40)">
        <text x="120" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - FRONT (IIW TYPE 1)</text>
        
        {/* IIW Block profile with step and radius */}
        <path d="M 0 20 L 0 100 L 240 100 L 240 0 A 30 30 0 0 0 210 0 L 40 0 L 40 20 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <path d="M 0 20 L 0 100 L 240 100 L 240 0 A 30 30 0 0 0 210 0 L 40 0 L 40 20 Z" fill={`url(#hatch-${uniqueId})`} opacity="0.4"/>
        
        {/* Reference radius arc highlight */}
        <path d="M 210 0 A 30 30 0 0 1 240 0" fill="none" stroke="#16a34a" strokeWidth="2"/>
        <text x="232" y="-8" fontSize="8" fill="#16a34a" fontWeight="600" fontFamily="Arial, sans-serif">R100</text>
        
        {/* Step highlight */}
        <rect x="0" y="0" width="40" height="20" fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,2"/>
        
        {/* Center line */}
        <line x1="120" y1="-10" x2="120" y2="110" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* SDH positions */}
        {[
          { x: 60, y: 50, depth: 'T/2' },
          { x: 120, y: 60, depth: '3T/5' },
          { x: 180, y: 35, depth: 'T/3' }
        ].map((hole, i) => (
          <g key={i}>
            <circle cx={hole.x} cy={hole.y} r="3" fill="none" stroke="#dc2626" strokeWidth="1.5"/>
            <line x1={hole.x + 5} y1={hole.y} x2={hole.x + 25} y2={hole.y - 10} stroke="#1e293b" strokeWidth="0.4"/>
            <text x={hole.x + 27} y={hole.y - 8} fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">Ø1.5 @ {hole.depth}</text>
          </g>
        ))}
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={100} x2={240} y2={100} label="300.0 ±0.2" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={240} y1={0} x2={240} y2={100} label="100.0 ±0.1" offset={25} vertical uniqueId={uniqueId}/>
        
        {/* Step dimensions */}
        <ProDimensionLine x1={0} y1={20} x2={40} y2={20} label="50.0" offset={-15} uniqueId={uniqueId}/>
        <line x1="-8" y1="20" x2="-8" y2="100" stroke="#3b82f6" strokeWidth="0.6"/>
        <text x="-25" y="60" fontSize="7" fill="#3b82f6" fontFamily="Arial, sans-serif" transform="rotate(-90, -25, 60)">80.0</text>
      </g>
      
      {/* VIEW B - TOP VIEW */}
      <g transform="translate(300, 50)">
        <text x="75" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW B - TOP</text>
        
        <rect x="0" y="0" width="150" height="75" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center lines */}
        <line x1="75" y1="-10" x2="75" y2="85" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="37.5" x2="160" y2="37.5" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* SDH positions (through holes) */}
        {[37.5, 75, 112.5].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={37.5} r="2.5" fill="none" stroke="#dc2626" strokeWidth="1.5"/>
            <line x1={x} y1="0" x2={x} y2="75" stroke="#dc2626" strokeWidth="0.4" strokeDasharray="2,2"/>
          </g>
        ))}
        
        <ProDimensionLine x1={150} y1={0} x2={150} y2={75} label="75.0 ±0.1" offset={20} vertical uniqueId={uniqueId}/>
        <ProDimensionLine x1={0} y1={75} x2={37.5} y2={75} label="37.5" offset={15} uniqueId={uniqueId}/>
        <ProDimensionLine x1={37.5} y1={75} x2={75} y2={75} label="37.5" offset={15} uniqueId={uniqueId}/>
      </g>
      
      {/* IIW TYPE 1 SPECIFICATIONS */}
      <g transform="translate(20, 180)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">IIW TYPE 1 BLOCK SPECIFICATIONS (ISO 2400):</text>
        
        <rect x="0" y="0" width="280" height="100" fill="#f0fdf4" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <rect x="0" y="0" width="280" height="18" fill="#16a34a"/>
        <line x1="100" y1="0" x2="100" y2="100" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="190" y1="0" x2="190" y2="100" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="50" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">FEATURE</text>
        <text x="145" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DIMENSION</text>
        <text x="235" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">PURPOSE</text>
        
        {[
          { feature: 'Reference Radius', dim: 'R100 ±0.5 mm', purpose: 'Velocity calibration' },
          { feature: 'Block Height', dim: '100.0 ±0.1 mm', purpose: 'Range calibration' },
          { feature: 'Step Height', dim: '20.0 mm', purpose: 'DAC reference' },
          { feature: 'SDH Diameter', dim: 'Ø1.5 ±0.05 mm', purpose: 'Sensitivity setting' },
          { feature: '50mm Slot', dim: '50 × 1.5 mm', purpose: 'Angle verification' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={18 + i * 16.4} width="280" height="16.4" fill={i % 2 === 0 ? '#f0fdf4' : 'white'}/>
            <text x="50" y={29 + i * 16.4} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.feature}</text>
            <text x="145" y={29 + i * 16.4} textAnchor="middle" fontSize="7" fill="#16a34a" fontWeight="600" fontFamily="Arial, sans-serif">{row.dim}</text>
            <text x="235" y={29 + i * 16.4} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">{row.purpose}</text>
          </g>
        ))}
      </g>
      
      {/* CALIBRATION USAGE */}
      <g transform="translate(320, 180)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">CALIBRATION FUNCTIONS:</text>
        
        <rect x="0" y="0" width="200" height="100" fill="#fff7ed" stroke="#1e293b" strokeWidth="1"/>
        
        {[
          { icon: '●', label: 'Angle verification (0°, 45°, 60°, 70°)', color: '#f59e0b' },
          { icon: '●', label: 'Time base calibration', color: '#3b82f6' },
          { icon: '●', label: 'Velocity measurement', color: '#16a34a' },
          { icon: '●', label: 'DAC curve construction', color: '#dc2626' },
          { icon: '●', label: 'Probe index point', color: '#7c3aed' },
          { icon: '●', label: 'Beam spread assessment', color: '#06b6d4' }
        ].map((item, i) => (
          <g key={i}>
            <text x="10" y={18 + i * 14} fontSize="8" fill={item.color} fontFamily="Arial, sans-serif">{item.icon}</text>
            <text x="22" y={18 + i * 14} fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">{item.label}</text>
          </g>
        ))}
      </g>
      
      {/* MATERIAL SPECIFICATION */}
      <g transform="translate(20, 300)">
        <rect x="0" y="0" width="500" height="25" fill="#1e40af" stroke="none"/>
        <text x="250" y="16" textAnchor="middle" fontSize="9" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">MATERIAL: CARBON STEEL (C45) OR EQUIVALENT | HARDNESS: 200-250 HB | V_L = 5920 m/s ±30 | V_S = 3250 m/s ±20</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED STEP WEDGE DRAWING (LEGACY) ====================
function EnhancedStepWedgeDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  const steps = [
    { height: 100, thickness: '50.0', color: '#1e40af' },
    { height: 75, thickness: '37.5', color: '#3b82f6' },
    { height: 50, thickness: '25.0', color: '#60a5fa' },
    { height: 25, thickness: '12.5', color: '#93c5fd' }
  ];
  
  return (
    <g>
      {/* VIEW A - FRONT VIEW (STEP PROFILE) */}
      <g transform="translate(20, 40)">
        <text x="120" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW A - FRONT (STEP PROFILE)</text>
        
        {/* Draw steps from tallest to shortest */}
        {steps.map((step, i) => (
          <g key={i}>
            <rect 
              x={i * 60} 
              y={100 - step.height} 
              width="60" 
              height={step.height} 
              fill="#f8fafc" 
              stroke={step.color} 
              strokeWidth="2"
            />
            <rect 
              x={i * 60} 
              y={100 - step.height} 
              width="60" 
              height={step.height} 
              fill={`url(#hatch-${uniqueId})`} 
              opacity="0.3"
            />
            {/* Step height label inside */}
            <text 
              x={i * 60 + 30} 
              y={100 - step.height / 2 + 4} 
              textAnchor="middle" 
              fontSize="10" 
              fill={step.color} 
              fontWeight="700"
              fontFamily="Arial, sans-serif"
            >
              T={step.thickness}
            </text>
          </g>
        ))}
        
        {/* Base line */}
        <line x1="0" y1="100" x2="240" y2="100" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Height dimensions on left */}
        <ProDimensionLine x1={-10} y1={0} x2={-10} y2={100} label="50.0" offset={-25} vertical uniqueId={uniqueId}/>
        <line x1={-5} y1={25} x2={-35} y2={25} stroke="#1e293b" strokeWidth="0.4"/>
        <text x="-40" y="28" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">37.5</text>
        <line x1={-5} y1={50} x2={-35} y2={50} stroke="#1e293b" strokeWidth="0.4"/>
        <text x="-40" y="53" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">25.0</text>
        <line x1={-5} y1={75} x2={-35} y2={75} stroke="#1e293b" strokeWidth="0.4"/>
        <text x="-40" y="78" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">12.5</text>
        
        {/* Width dimensions */}
        <ProDimensionLine x1={0} y1={100} x2={60} y2={100} label="60.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={60} y1={100} x2={120} y2={100} label="60.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={120} y1={100} x2={180} y2={100} label="60.0" offset={20} uniqueId={uniqueId}/>
        <ProDimensionLine x1={180} y1={100} x2={240} y2={100} label="60.0" offset={20} uniqueId={uniqueId}/>
        
        {/* Total length */}
        <ProDimensionLine x1={0} y1={100} x2={240} y2={100} label="240.0 ±0.2" offset={40} uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW B - TOP VIEW */}
      <g transform="translate(300, 50)">
        <text x="60" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW B - TOP</text>
        
        <rect x="0" y="0" width="120" height="80" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Step dividers */}
        {[30, 60, 90].map((x, i) => (
          <line key={i} x1={x} y1="0" x2={x} y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,2"/>
        ))}
        
        {/* Center line */}
        <line x1="-10" y1="40" x2="130" y2="40" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* Step labels */}
        {['T1', 'T2', 'T3', 'T4'].map((label, i) => (
          <text key={i} x={15 + i * 30} y="44" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="600" fontFamily="Arial, sans-serif">{label}</text>
        ))}
        
        <ProDimensionLine x1={120} y1={0} x2={120} y2={80} label="80.0 ±0.1" offset={20} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* STEP SCHEDULE */}
      <g transform="translate(20, 200)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">STEP THICKNESS SCHEDULE:</text>
        
        <rect x="0" y="0" width="240" height="90" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <rect x="0" y="0" width="240" height="18" fill="#3b82f6"/>
        <line x1="50" y1="0" x2="50" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="110" y1="0" x2="110" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="170" y1="0" x2="170" y2="90" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="25" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">STEP</text>
        <text x="80" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">THICKNESS</text>
        <text x="140" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">TOL</text>
        <text x="205" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">FBH DIA</text>
        
        {[
          { step: 'T1', thick: '50.0 mm', tol: '±0.05', fbh: '8/64"' },
          { step: 'T2', thick: '37.5 mm', tol: '±0.05', fbh: '5/64"' },
          { step: 'T3', thick: '25.0 mm', tol: '±0.05', fbh: '5/64"' },
          { step: 'T4', thick: '12.5 mm', tol: '±0.05', fbh: '3/64"' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={18 + i * 18} width="240" height="18" fill={i % 2 === 0 ? '#eff6ff' : 'white'}/>
            <text x="25" y={30 + i * 18} textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="600" fontFamily="Arial, sans-serif">{row.step}</text>
            <text x="80" y={30 + i * 18} textAnchor="middle" fontSize="8" fill="#1e293b" fontFamily="Arial, sans-serif">{row.thick}</text>
            <text x="140" y={30 + i * 18} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">{row.tol}</text>
            <text x="205" y={30 + i * 18} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">{row.fbh}</text>
          </g>
        ))}
      </g>
      
      {/* DAC CURVE PURPOSE */}
      <g transform="translate(280, 200)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">DAC CURVE CONSTRUCTION:</text>
        
        <rect x="0" y="0" width="220" height="90" fill="#fef2f2" stroke="#1e293b" strokeWidth="1"/>
        
        {/* DAC curve illustration */}
        <path d="M 20 70 Q 60 50, 100 35 Q 140 25, 180 20" fill="none" stroke="#dc2626" strokeWidth="2"/>
        
        {/* Reference points */}
        {[
          { x: 20, y: 70, label: 'T4' },
          { x: 60, y: 52, label: 'T3' },
          { x: 100, y: 38, label: 'T2' },
          { x: 150, y: 25, label: 'T1' }
        ].map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="3" fill="#dc2626"/>
            <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="7" fill="#dc2626" fontFamily="Arial, sans-serif">{pt.label}</text>
          </g>
        ))}
        
        <text x="110" y="85" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">Distance-Amplitude Correction</text>
      </g>
      
      {/* STANDARDS */}
      <g transform="translate(20, 310)">
        <rect x="0" y="0" width="480" height="22" fill="#1e40af"/>
        <text x="240" y="15" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">APPLICABLE STANDARDS: ASTM E164 | ASTM E428 | EN 10160 | MIL-STD-2154</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED IOW BLOCK DRAWING (LEGACY) ====================
function EnhancedIOWBlockDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* VIEW A - SECTION A-A (SHOWING FBH DEPTHS) */}
      <g transform="translate(20, 40)">
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">SECTION A-A (FBH DEPTHS)</text>
        
        <rect x="0" y="0" width="200" height="80" fill={`url(#hatch-${uniqueId})`} stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center line */}
        <line x1="100" y1="-10" x2="100" y2="90" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* FBH array - 5 holes at progressive depths */}
        {[
          { x: 40, depth: 10, label: 'T/8' },
          { x: 70, depth: 20, label: 'T/4' },
          { x: 100, depth: 40, label: 'T/2' },
          { x: 130, depth: 60, label: '3T/4' },
          { x: 160, depth: 72, label: '0.9T' }
        ].map((hole, i) => (
          <g key={i}>
            {/* FBH cavity */}
            <rect x={hole.x - 2} y="0" width="4" height={hole.depth} fill="white" stroke="#dc2626" strokeWidth="1"/>
            {/* Flat bottom */}
            <line x1={hole.x - 3} y1={hole.depth} x2={hole.x + 3} y2={hole.depth} stroke="#dc2626" strokeWidth="1.5"/>
            {/* Depth label */}
            <text x={hole.x} y={-5} textAnchor="middle" fontSize="7" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">{hole.label}</text>
          </g>
        ))}
        
        {/* Dimensions */}
        <ProDimensionLine x1={0} y1={80} x2={200} y2={80} label="200.0 ±0.1" offset={25} uniqueId={uniqueId}/>
        <ProDimensionLine x1={200} y1={0} x2={200} y2={80} label="80.0 (T)" offset={25} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* VIEW B - TOP VIEW (15 HOLE ARRAY) */}
      <g transform="translate(260, 40)">
        <text x="100" y="-15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">VIEW B - TOP (15× FBH ARRAY)</text>
        
        <rect x="0" y="0" width="200" height="120" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        
        {/* Center lines */}
        <line x1="100" y1="-10" x2="100" y2="130" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        <line x1="-10" y1="60" x2="210" y2="60" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="15,3,3,3"/>
        
        {/* 3 rows × 5 columns FBH array */}
        {[30, 60, 90].map((y, row) => (
          [40, 70, 100, 130, 160].map((x, col) => (
            <g key={`${row}-${col}`}>
              <circle cx={x} cy={y} r="3" fill="none" stroke="#1e293b" strokeWidth="1.5"/>
              <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#1e293b" strokeWidth="0.4"/>
              <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#1e293b" strokeWidth="0.4"/>
            </g>
          ))
        ))}
        
        {/* Row labels */}
        <text x="-12" y="33" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">R1</text>
        <text x="-12" y="63" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">R2</text>
        <text x="-12" y="93" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">R3</text>
        
        {/* Column labels */}
        <text x="40" y="115" textAnchor="middle" fontSize="6" fill="#dc2626" fontFamily="Arial, sans-serif">T/8</text>
        <text x="70" y="115" textAnchor="middle" fontSize="6" fill="#dc2626" fontFamily="Arial, sans-serif">T/4</text>
        <text x="100" y="115" textAnchor="middle" fontSize="6" fill="#dc2626" fontFamily="Arial, sans-serif">T/2</text>
        <text x="130" y="115" textAnchor="middle" fontSize="6" fill="#dc2626" fontFamily="Arial, sans-serif">3T/4</text>
        <text x="160" y="115" textAnchor="middle" fontSize="6" fill="#dc2626" fontFamily="Arial, sans-serif">0.9T</text>
        
        <ProDimensionLine x1={200} y1={0} x2={200} y2={120} label="120.0 ±0.1" offset={20} vertical uniqueId={uniqueId}/>
      </g>
      
      {/* AREA-AMPLITUDE TABLE */}
      <g transform="translate(20, 200)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">FBH AREA-AMPLITUDE SPECIFICATION (ASTM E428):</text>
        
        <rect x="0" y="0" width="300" height="95" fill="white" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Table header */}
        <rect x="0" y="0" width="300" height="18" fill="#dc2626"/>
        <line x1="60" y1="0" x2="60" y2="95" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="120" y1="0" x2="120" y2="95" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="180" y1="0" x2="180" y2="95" stroke="#1e293b" strokeWidth="0.5"/>
        <line x1="240" y1="0" x2="240" y2="95" stroke="#1e293b" strokeWidth="0.5"/>
        
        <text x="30" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">HOLE #</text>
        <text x="90" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">FBH DIA</text>
        <text x="150" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">DEPTH</text>
        <text x="210" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">METAL PATH</text>
        <text x="270" y="12" textAnchor="middle" fontSize="7" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">TOL</text>
        
        {[
          { holes: '1, 6, 11', dia: '3/64" (1.19)', depth: 'T/8', metal: '7T/8', tol: '±0.025' },
          { holes: '2, 7, 12', dia: '3/64" (1.19)', depth: 'T/4', metal: '3T/4', tol: '±0.025' },
          { holes: '3, 8, 13', dia: '3/64" (1.19)', depth: 'T/2', metal: 'T/2', tol: '±0.025' },
          { holes: '4, 9, 14', dia: '3/64" (1.19)', depth: '3T/4', metal: 'T/4', tol: '±0.025' },
          { holes: '5, 10, 15', dia: '3/64" (1.19)', depth: '0.9T', metal: '0.1T', tol: '±0.025' }
        ].map((row, i) => (
          <g key={i}>
            <rect x="0" y={18 + i * 15.4} width="300" height="15.4" fill={i % 2 === 0 ? '#fef2f2' : 'white'}/>
            <text x="30" y={28 + i * 15.4} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.holes}</text>
            <text x="90" y={28 + i * 15.4} textAnchor="middle" fontSize="7" fill="#dc2626" fontWeight="600" fontFamily="Arial, sans-serif">{row.dia}</text>
            <text x="150" y={28 + i * 15.4} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.depth}</text>
            <text x="210" y={28 + i * 15.4} textAnchor="middle" fontSize="7" fill="#1e293b" fontFamily="Arial, sans-serif">{row.metal}</text>
            <text x="270" y={28 + i * 15.4} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">{row.tol}</text>
          </g>
        ))}
      </g>
      
      {/* APPLICATION NOTES */}
      <g transform="translate(340, 200)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">APPLICATION:</text>
        
        <rect x="0" y="0" width="180" height="95" fill="#ecfdf5" stroke="#1e293b" strokeWidth="1"/>
        
        {[
          '• DAC curve construction',
          '• Depth sensitivity verification',
          '• Area-amplitude correlation',
          '• Transfer correction',
          '• Multi-thickness calibration',
          '• TCG (Time Corrected Gain)'
        ].map((item, i) => (
          <text key={i} x="10" y={18 + i * 13} fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">{item}</text>
        ))}
      </g>
      
      {/* STANDARDS */}
      <g transform="translate(20, 315)">
        <rect x="0" y="0" width="500" height="22" fill="#1e40af"/>
        <text x="250" y="15" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">MATERIAL: 7075-T6 AL | STANDARDS: ASTM E428 | ASTM E127 | SAE AMS-STD-2154 | AMS 2630</text>
      </g>
    </g>
  );
}

// ==================== ENHANCED CUSTOM BLOCK DRAWING (LEGACY) ====================
function EnhancedCustomBlockDrawingLegacy({ uniqueId }: { uniqueId: string }) {
  return (
    <g>
      {/* PLACEHOLDER DRAWING AREA */}
      <g transform="translate(100, 60)">
        <text x="200" y="-20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">CUSTOM CALIBRATION BLOCK</text>
        <text x="200" y="0" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Arial, sans-serif">User-Defined Specification Required</text>
        
        {/* Dashed outline placeholder */}
        <rect x="0" y="20" width="400" height="200" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeDasharray="10,5"/>
        
        {/* Question mark icon */}
        <text x="200" y="130" textAnchor="middle" fontSize="80" fill="#e2e8f0" fontFamily="Arial, sans-serif">?</text>
        
        {/* Grid lines */}
        {[80, 160, 240, 320].map((x, i) => (
          <line key={`v${i}`} x1={x} y1="20" x2={x} y2="220" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3"/>
        ))}
        {[70, 120, 170].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y} x2="400" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3"/>
        ))}
        
        <text x="200" y="200" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Arial, sans-serif">DRAWING AREA - SPECIFY GEOMETRY</text>
      </g>
      
      {/* REQUIREMENTS CHECKLIST */}
      <g transform="translate(20, 290)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">CUSTOM BLOCK REQUIREMENTS:</text>
        
        <rect x="0" y="0" width="250" height="110" fill="#fef3c7" stroke="#1e293b" strokeWidth="1"/>
        
        {[
          { icon: '☐', text: 'Material specification (acoustic velocity)' },
          { icon: '☐', text: 'Block geometry matching part' },
          { icon: '☐', text: 'Reflector type (FBH/SDH/Notch)' },
          { icon: '☐', text: 'Reflector size per acceptance criteria' },
          { icon: '☐', text: 'Reflector positions and depths' },
          { icon: '☐', text: 'Surface finish requirements' },
          { icon: '☐', text: 'Tolerances and GD&T' },
          { icon: '☐', text: 'Certification requirements' }
        ].map((item, i) => (
          <g key={i}>
            <text x="10" y={15 + i * 12} fontSize="8" fill="#92400e" fontFamily="Arial, sans-serif">{item.icon}</text>
            <text x="25" y={15 + i * 12} fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">{item.text}</text>
          </g>
        ))}
      </g>
      
      {/* CONTACT INFORMATION */}
      <g transform="translate(290, 290)">
        <text x="0" y="-8" fontSize="10" fontWeight="700" fill="#1e293b" fontFamily="Arial, sans-serif">DESIGN ASSISTANCE:</text>
        
        <rect x="0" y="0" width="230" height="110" fill="#dbeafe" stroke="#1e293b" strokeWidth="1"/>
        
        <text x="115" y="25" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e40af" fontFamily="Arial, sans-serif">Contact NDT Level III Engineer</text>
        <text x="115" y="45" textAnchor="middle" fontSize="8" fill="#374151" fontFamily="Arial, sans-serif">for custom block design</text>
        
        <line x1="20" y1="55" x2="210" y2="55" stroke="#3b82f6" strokeWidth="0.5"/>
        
        <text x="20" y="70" fontSize="7" fill="#374151" fontFamily="Arial, sans-serif">Required Information:</text>
        <text x="20" y="82" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">• Part drawing with dimensions</text>
        <text x="20" y="94" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">• Inspection procedure/standard</text>
        <text x="20" y="106" fontSize="7" fill="#64748b" fontFamily="Arial, sans-serif">• Acceptance criteria</text>
      </g>
    </g>
  );
}
