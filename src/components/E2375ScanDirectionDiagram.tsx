import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type { PartGeometry } from "@/types/techniqueSheet";
import type { ScanDetail } from "@/types/scanDetails";
import { Info, ExternalLink, ZoomIn, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface E2375ScanDirectionDiagramProps {
  partType: PartGeometry;
  scanDetails?: ScanDetail[];
  highlightedDirection?: string | null;
  className?: string;
}

// E2375 Figure info for reference
const getE2375DiagramInfo = (partType: PartGeometry): {
  figure: string;
  page: number;
  title: string;
  titleHe: string;
  description: string;
} | null => {
  switch (partType) {
    case "box":
    case "plate":
      return {
        figure: "Figure 6",
        page: 11,
        title: "Plate and Flat Bar",
        titleHe: "פלייט ומוט שטוח",
        description: "Scan with a straight beam with the beam directed as shown. If W/T > 5, scan with straight beam."
      };
    case "rectangular_bar":
    case "square_bar":
    case "billet":
    case "block":
      return {
        figure: "Figure 6",
        page: 11,
        title: "Rectangular Bar, Bloom, and Billets",
        titleHe: "מוט מלבני, בלום ובילטים",
        description: "If W/T < 5, scan from two adjacent sides with the sound beam directed as shown."
      };
    case "cylinder":
    case "round_bar":
    case "shaft":
    case "disk":
      return {
        figure: "Figure 6",
        page: 11,
        title: "Round Bars and Round Forging Stock",
        titleHe: "מוטות עגולים ומלאי חישול עגול",
        description: "Examine by straight beam with sound beam directed towards the center of the bar while rotating."
      };
    case "tube":
    case "pipe":
    case "ring":
    case "ring_forging":
    case "sleeve":
      return {
        figure: "Figure 7",
        page: 12,
        title: "Ring Forgings",
        titleHe: "חישולי טבעת",
        description: "Scan with a straight beam from the circumference with the sound beam directed radially."
      };
    case "hexagon":
    case "hex_bar":
      return {
        figure: "Figure 7",
        page: 12,
        title: "Hex Bar",
        titleHe: "מוט משושה",
        description: "Scan with a straight beam from three adjacent faces."
      };
    case "disk_forging":
    case "hub":
      return {
        figure: "Figure 7",
        page: 12,
        title: "Disk Forging",
        titleHe: "חישול דיסק",
        description: "Scan with straight beams from at least one flat face, and radially from the circumference."
      };
    default:
      return null;
  }
};

// Direction data with colors and descriptions
const DIRECTION_INFO: Record<string, { color: string; name: string; nameHe: string; wave: string }> = {
  "A": { color: "#22c55e", name: "Primary Straight Beam", nameHe: "קרן ישרה ראשית", wave: "LW 0°" },
  "A₁": { color: "#16a34a", name: "Primary Dual Element", nameHe: "אלמנט כפול ראשי", wave: "LW 0° DE" },
  "B": { color: "#3b82f6", name: "Secondary Straight Beam", nameHe: "קרן ישרה משנית", wave: "LW 0°" },
  "B₁": { color: "#2563eb", name: "Secondary Dual Element", nameHe: "אלמנט כפול משני", wave: "LW 0° DE" },
  "C": { color: "#f59e0b", name: "Tertiary/Radial", nameHe: "קרן שלישית/רדיאלית", wave: "LW 0°" },
  "C₁": { color: "#d97706", name: "Tertiary Dual Element", nameHe: "אלמנט כפול שלישי", wave: "LW 0° DE" },
  "D": { color: "#ef4444", name: "Circumferential CW", nameHe: "היקפי - עם השעון", wave: "SW 45°" },
  "E": { color: "#ec4899", name: "Circumferential CCW", nameHe: "היקפי - נגד השעון", wave: "SW 45°" },
  "F": { color: "#8b5cf6", name: "Axial Shear Dir 1", nameHe: "גזירה אקסיאלית 1", wave: "SW 45°" },
  "G": { color: "#14b8a6", name: "Axial Shear Dir 2", nameHe: "גזירה אקסיאלית 2", wave: "SW 45°" },
  "H": { color: "#06b6d4", name: "From ID Surface", nameHe: "מפנים (ID)", wave: "LW 0°" },
  "I": { color: "#84cc16", name: "Through-Transmission", nameHe: "TT - שני תמרים", wave: "TT" },
  "J": { color: "#f97316", name: "Shear Wave 60°", nameHe: "גל גזירה 60°", wave: "SW 60°" },
  "K": { color: "#eab308", name: "Shear Wave 45°", nameHe: "גל גזירה 45°", wave: "SW 45°" },
  "L": { color: "#a855f7", name: "Rotational 360°", nameHe: "סריקה סיבובית", wave: "LW 0° Rot" },
};

// SVG diagrams for different part types
const RectangularDiagram: React.FC<{ scanDetails?: ScanDetail[]; highlighted?: string | null }> = ({ scanDetails, highlighted }) => {
  const enabledDirections = scanDetails?.filter(d => d.enabled).map(d => d.scanningDirection) || [];
  
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <marker id="arrowhead-A" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
        </marker>
        <marker id="arrowhead-B" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
        <marker id="arrowhead-J" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
        </marker>
        <marker id="arrowhead-K" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
        </marker>
        {/* Gradient for 3D effect */}
        <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="50%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>
      
      {/* 3D Box - Isometric view */}
      <g transform="translate(100, 80)">
        {/* Top face */}
        <polygon points="100,0 200,50 100,100 0,50" fill="#f3f4f6" stroke="#374151" strokeWidth="2" />
        {/* Front face */}
        <polygon points="0,50 100,100 100,180 0,130" fill="url(#boxGradient)" stroke="#374151" strokeWidth="2" />
        {/* Right face */}
        <polygon points="100,100 200,50 200,130 100,180" fill="#d1d5db" stroke="#374151" strokeWidth="2" />
        
        {/* Dimension labels */}
        <text x="50" y="25" className="text-xs fill-gray-500" textAnchor="middle">W</text>
        <text x="160" y="85" className="text-xs fill-gray-500" textAnchor="middle">L</text>
        <text x="-15" y="100" className="text-xs fill-gray-500" textAnchor="middle">T</text>
        
        {/* Direction A - From top (primary) */}
        {enabledDirections.includes("A") && (
          <motion.g
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.line
              x1="100" y1="-40" x2="100" y2="40"
              stroke="#22c55e" strokeWidth={highlighted === "A" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-A)"
              animate={{ y1: [-50, -30, -50], y2: [30, 50, 30] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="100" cy="-45" r="15" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />
            <text x="100" y="-40" textAnchor="middle" className="text-sm font-bold fill-green-700">A</text>
          </motion.g>
        )}
        
        {/* Direction B - From side (secondary) */}
        {enabledDirections.includes("B") && (
          <motion.g
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.line
              x1="-60" y1="90" x2="20" y2="90"
              stroke="#3b82f6" strokeWidth={highlighted === "B" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-B)"
              animate={{ x1: [-70, -50, -70], x2: [10, 30, 10] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <circle cx="-65" cy="90" r="15" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
            <text x="-65" y="95" textAnchor="middle" className="text-sm font-bold fill-blue-700">B</text>
          </motion.g>
        )}
        
        {/* Direction J - Shear wave 60° */}
        {enabledDirections.includes("J") && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.line
              x1="-40" y1="160" x2="30" y2="100"
              stroke="#f97316" strokeWidth={highlighted === "J" ? 4 : 3}
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead-J)"
              animate={{ 
                x1: [-50, -30, -50], 
                y1: [170, 150, 170],
                x2: [20, 40, 20],
                y2: [110, 90, 110]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <circle cx="-45" cy="165" r="12" fill="#f97316" fillOpacity="0.2" stroke="#f97316" strokeWidth="2" />
            <text x="-45" y="170" textAnchor="middle" className="text-xs font-bold fill-orange-700">J</text>
            <text x="-45" y="185" textAnchor="middle" className="text-[8px] fill-orange-600">60°</text>
          </motion.g>
        )}
        
        {/* Direction K - Shear wave 45° */}
        {enabledDirections.includes("K") && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.line
              x1="220" y1="160" x2="160" y2="100"
              stroke="#eab308" strokeWidth={highlighted === "K" ? 4 : 3}
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead-K)"
              animate={{ 
                x1: [230, 210, 230], 
                y1: [170, 150, 170],
                x2: [170, 150, 170],
                y2: [110, 90, 110]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
            <circle cx="225" cy="165" r="12" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="2" />
            <text x="225" y="170" textAnchor="middle" className="text-xs font-bold fill-yellow-700">K</text>
            <text x="225" y="185" textAnchor="middle" className="text-[8px] fill-yellow-600">45°</text>
          </motion.g>
        )}
      </g>
      
      {/* Title */}
      <text x="200" y="280" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
        Rectangular Bar / Plate - E2375 Fig.6
      </text>
    </svg>
  );
};

const CylindricalDiagram: React.FC<{ scanDetails?: ScanDetail[]; highlighted?: string | null }> = ({ scanDetails, highlighted }) => {
  const enabledDirections = scanDetails?.filter(d => d.enabled).map(d => d.scanningDirection) || [];
  
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <marker id="arrowhead-C" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
        </marker>
        <marker id="arrowhead-L" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
        </marker>
        <marker id="arrowhead-D" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
        <linearGradient id="cylinderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="50%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>
      
      {/* Cylinder body */}
      <g transform="translate(100, 50)">
        {/* Top ellipse */}
        <ellipse cx="100" cy="20" rx="80" ry="25" fill="#f3f4f6" stroke="#374151" strokeWidth="2" />
        {/* Body */}
        <rect x="20" y="20" width="160" height="160" fill="url(#cylinderGradient)" />
        <line x1="20" y1="20" x2="20" y2="180" stroke="#374151" strokeWidth="2" />
        <line x1="180" y1="20" x2="180" y2="180" stroke="#374151" strokeWidth="2" />
        {/* Bottom ellipse */}
        <ellipse cx="100" cy="180" rx="80" ry="25" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
        
        {/* Center line */}
        <line x1="100" y1="0" x2="100" y2="210" stroke="#374151" strokeWidth="1" strokeDasharray="5 5" />
        
        {/* Direction C - Radial from OD */}
        {enabledDirections.includes("C") && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Multiple radial arrows */}
            <motion.line
              x1="-20" y1="100" x2="50" y2="100"
              stroke="#f59e0b" strokeWidth={highlighted === "C" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-C)"
              animate={{ x1: [-30, -10, -30], x2: [40, 60, 40] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.line
              x1="220" y1="100" x2="150" y2="100"
              stroke="#f59e0b" strokeWidth={highlighted === "C" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-C)"
              animate={{ x1: [230, 210, 230], x2: [160, 140, 160] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <circle cx="-25" cy="100" r="15" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
            <text x="-25" y="105" textAnchor="middle" className="text-sm font-bold fill-amber-700">C</text>
          </motion.g>
        )}
        
        {/* Direction L - Rotational 360° */}
        {enabledDirections.includes("L") && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.path
              d="M -10 100 Q -30 60 0 30 Q 30 0 70 10"
              fill="none"
              stroke="#a855f7"
              strokeWidth={highlighted === "L" ? 4 : 3}
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead-L)"
              animate={{ 
                d: [
                  "M -10 100 Q -30 60 0 30 Q 30 0 70 10",
                  "M -10 100 Q -20 50 10 20 Q 40 -10 80 0",
                  "M -10 100 Q -30 60 0 30 Q 30 0 70 10"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="100" cy="100" r="40"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="8 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            />
            <text x="100" y="-10" textAnchor="middle" className="text-sm font-bold fill-purple-700">L</text>
            <text x="100" y="5" textAnchor="middle" className="text-[8px] fill-purple-600">360°</text>
          </motion.g>
        )}
        
        {/* Direction D - Circumferential CW */}
        {enabledDirections.includes("D") && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.path
              d="M 20 140 Q 0 160 20 180"
              fill="none"
              stroke="#ef4444"
              strokeWidth={highlighted === "D" ? 4 : 3}
              strokeDasharray="5 3"
              markerEnd="url(#arrowhead-D)"
              animate={{ 
                strokeDashoffset: [0, 16, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <text x="-10" y="160" textAnchor="middle" className="text-xs font-bold fill-red-700">D</text>
            <text x="-10" y="175" textAnchor="middle" className="text-[8px] fill-red-600">CW</text>
          </motion.g>
        )}
        
        {/* Direction E - Circumferential CCW */}
        {enabledDirections.includes("E") && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.path
              d="M 180 140 Q 200 160 180 180"
              fill="none"
              stroke="#ec4899"
              strokeWidth={highlighted === "E" ? 4 : 3}
              strokeDasharray="5 3"
              animate={{ 
                strokeDashoffset: [0, -16, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <text x="210" y="160" textAnchor="middle" className="text-xs font-bold fill-pink-700">E</text>
            <text x="210" y="175" textAnchor="middle" className="text-[8px] fill-pink-600">CCW</text>
          </motion.g>
        )}
      </g>
      
      {/* Title */}
      <text x="200" y="280" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
        Round Bar / Cylinder - E2375 Fig.6
      </text>
    </svg>
  );
};

const TubeDiagram: React.FC<{ scanDetails?: ScanDetail[]; highlighted?: string | null }> = ({ scanDetails, highlighted }) => {
  const enabledDirections = scanDetails?.filter(d => d.enabled).map(d => d.scanningDirection) || [];
  
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <marker id="arrowhead-H" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" />
        </marker>
        <marker id="arrowhead-F" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
        </marker>
        <marker id="arrowhead-G" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#14b8a6" />
        </marker>
      </defs>
      
      <g transform="translate(100, 40)">
        {/* Outer cylinder */}
        <ellipse cx="100" cy="20" rx="80" ry="25" fill="#f3f4f6" stroke="#374151" strokeWidth="2" />
        <rect x="20" y="20" width="160" height="180" fill="#e5e7eb" />
        <line x1="20" y1="20" x2="20" y2="200" stroke="#374151" strokeWidth="2" />
        <line x1="180" y1="20" x2="180" y2="200" stroke="#374151" strokeWidth="2" />
        <ellipse cx="100" cy="200" rx="80" ry="25" fill="#d1d5db" stroke="#374151" strokeWidth="2" />
        
        {/* Inner hole (ID) */}
        <ellipse cx="100" cy="20" rx="50" ry="15" fill="#fff" stroke="#374151" strokeWidth="1.5" />
        <ellipse cx="100" cy="200" rx="50" ry="15" fill="#f9fafb" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 2" />
        
        {/* ID/OD labels */}
        <text x="100" y="20" textAnchor="middle" className="text-[10px] fill-gray-500">ID</text>
        <text x="15" y="110" textAnchor="middle" className="text-[10px] fill-gray-500" transform="rotate(-90, 15, 110)">OD</text>
        
        {/* Direction C - Radial from OD */}
        {enabledDirections.includes("C") && (
          <motion.g>
            <motion.line
              x1="-20" y1="110" x2="40" y2="110"
              stroke="#f59e0b" strokeWidth={highlighted === "C" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-C)"
              animate={{ x1: [-30, -10, -30], x2: [30, 50, 30] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="-25" cy="110" r="12" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
            <text x="-25" y="115" textAnchor="middle" className="text-xs font-bold fill-amber-700">C</text>
          </motion.g>
        )}
        
        {/* Direction H - From ID */}
        {enabledDirections.includes("H") && (
          <motion.g>
            <motion.line
              x1="100" y1="60" x2="100" y2="100"
              stroke="#06b6d4" strokeWidth={highlighted === "H" ? 4 : 3}
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead-H)"
              animate={{ y1: [50, 70, 50], y2: [90, 110, 90] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="100" cy="45" r="12" fill="#06b6d4" fillOpacity="0.2" stroke="#06b6d4" strokeWidth="2" />
            <text x="100" y="50" textAnchor="middle" className="text-xs font-bold fill-cyan-700">H</text>
          </motion.g>
        )}
        
        {/* Direction F - Axial Shear Dir 1 */}
        {enabledDirections.includes("F") && (
          <motion.g>
            <motion.line
              x1="20" y1="230" x2="60" y2="170"
              stroke="#8b5cf6" strokeWidth={highlighted === "F" ? 4 : 3}
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead-F)"
              animate={{ 
                y1: [240, 220, 240],
                y2: [180, 160, 180]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <text x="10" y="240" textAnchor="middle" className="text-xs font-bold fill-purple-700">F</text>
          </motion.g>
        )}
        
        {/* Direction G - Axial Shear Dir 2 */}
        {enabledDirections.includes("G") && (
          <motion.g>
            <motion.line
              x1="180" y1="230" x2="140" y2="170"
              stroke="#14b8a6" strokeWidth={highlighted === "G" ? 4 : 3}
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead-G)"
              animate={{ 
                y1: [240, 220, 240],
                y2: [180, 160, 180]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <text x="190" y="240" textAnchor="middle" className="text-xs font-bold fill-teal-700">G</text>
          </motion.g>
        )}
        
        {/* Direction D & E - Circumferential */}
        {enabledDirections.includes("D") && (
          <motion.path
            d="M 30 150 Q 10 180 30 210"
            fill="none"
            stroke="#ef4444"
            strokeWidth={highlighted === "D" ? 4 : 3}
            strokeDasharray="5 3"
            animate={{ strokeDashoffset: [0, 16, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
        {enabledDirections.includes("E") && (
          <motion.path
            d="M 170 150 Q 190 180 170 210"
            fill="none"
            stroke="#ec4899"
            strokeWidth={highlighted === "E" ? 4 : 3}
            strokeDasharray="5 3"
            animate={{ strokeDashoffset: [0, -16, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </g>
      
      {/* Title */}
      <text x="200" y="290" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
        Tube / Ring / Pipe - E2375 Fig.7
      </text>
    </svg>
  );
};

const HexBarDiagram: React.FC<{ scanDetails?: ScanDetail[]; highlighted?: string | null }> = ({ scanDetails, highlighted }) => {
  const enabledDirections = scanDetails?.filter(d => d.enabled).map(d => d.scanningDirection) || [];
  
  // Hexagon points
  const hexPoints = "100,20 160,50 160,110 100,140 40,110 40,50";
  
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      
      <g transform="translate(100, 60)">
        {/* Hexagon shape */}
        <polygon points={hexPoints} fill="url(#hexGradient)" stroke="#374151" strokeWidth="2" />
        
        {/* Face labels */}
        <text x="130" y="35" className="text-[10px] fill-gray-500">1</text>
        <text x="165" y="80" className="text-[10px] fill-gray-500">2</text>
        <text x="130" y="130" className="text-[10px] fill-gray-500">3</text>
        
        {/* Direction A - From face 1 */}
        {enabledDirections.includes("A") && (
          <motion.g>
            <motion.line
              x1="100" y1="-20" x2="100" y2="50"
              stroke="#22c55e" strokeWidth={highlighted === "A" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-A)"
              animate={{ y1: [-30, -10, -30], y2: [40, 60, 40] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="100" cy="-25" r="12" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />
            <text x="100" y="-20" textAnchor="middle" className="text-xs font-bold fill-green-700">A</text>
          </motion.g>
        )}
        
        {/* Direction B - From face 2 */}
        {enabledDirections.includes("B") && (
          <motion.g>
            <motion.line
              x1="200" y1="80" x2="140" y2="80"
              stroke="#3b82f6" strokeWidth={highlighted === "B" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-B)"
              animate={{ x1: [210, 190, 210], x2: [150, 130, 150] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            <circle cx="205" cy="80" r="12" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
            <text x="205" y="85" textAnchor="middle" className="text-xs font-bold fill-blue-700">B</text>
          </motion.g>
        )}
        
        {/* Direction C - From face 3 */}
        {enabledDirections.includes("C") && (
          <motion.g>
            <motion.line
              x1="140" y1="180" x2="110" y2="120"
              stroke="#f59e0b" strokeWidth={highlighted === "C" ? 4 : 3}
              strokeDasharray="8 4"
              markerEnd="url(#arrowhead-C)"
              animate={{ 
                y1: [190, 170, 190],
                y2: [130, 110, 130]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />
            <circle cx="145" cy="185" r="12" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
            <text x="145" y="190" textAnchor="middle" className="text-xs font-bold fill-amber-700">C</text>
          </motion.g>
        )}
      </g>
      
      {/* Title */}
      <text x="200" y="280" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
        Hex Bar - E2375 Fig.7
      </text>
    </svg>
  );
};

// Legend component
const ScanDirectionLegend: React.FC<{ scanDetails?: ScanDetail[]; highlighted?: string | null; onHighlight?: (dir: string | null) => void }> = ({ 
  scanDetails, 
  highlighted,
  onHighlight 
}) => {
  const enabledDirections = scanDetails?.filter(d => d.enabled) || [];
  
  if (enabledDirections.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No scan directions enabled</p>
        <p className="text-xs">Enable directions from the table below</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 gap-2">
      {enabledDirections.map(detail => {
        const info = DIRECTION_INFO[detail.scanningDirection];
        if (!info) return null;
        
        const isHighlighted = highlighted === detail.scanningDirection;
        
        return (
          <motion.div
            key={detail.scanningDirection}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
              isHighlighted 
                ? 'bg-gray-100 ring-2 ring-offset-1' 
                : 'hover:bg-gray-50'
            }`}
            style={{ 
              // @ts-expect-error - ringColor is a CSS custom property
              '--tw-ring-color': isHighlighted ? info.color : undefined
            } as React.CSSProperties}
            onClick={() => onHighlight?.(isHighlighted ? null : detail.scanningDirection)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: info.color }}
            >
              {detail.scanningDirection}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{info.name}</p>
              <p className="text-[10px] text-muted-foreground">{info.wave}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export const E2375ScanDirectionDiagram: React.FC<E2375ScanDirectionDiagramProps> = ({
  partType,
  scanDetails,
  highlightedDirection: externalHighlight,
  className = ""
}) => {
  const [internalHighlight, setInternalHighlight] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  const highlightedDirection = externalHighlight ?? internalHighlight;
  const diagramInfo = getE2375DiagramInfo(partType);

  // Choose diagram based on part type
  const getDiagram = () => {
    const props = { scanDetails, highlighted: highlightedDirection };
    
    switch (partType) {
      case "box":
      case "plate":
      case "rectangular_bar":
      case "square_bar":
      case "billet":
      case "block":
        return <RectangularDiagram {...props} />;
      case "cylinder":
      case "round_bar":
      case "shaft":
      case "disk":
      case "disk_forging":
      case "hub":
        return <CylindricalDiagram {...props} />;
      case "tube":
      case "pipe":
      case "ring":
      case "ring_forging":
      case "sleeve":
      case "bushing":
        return <TubeDiagram {...props} />;
      case "hexagon":
      case "hex_bar":
        return <HexBarDiagram {...props} />;
      default:
        return <RectangularDiagram {...props} />;
    }
  };

  if (!diagramInfo) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No E2375 diagram available for: <span className="font-mono">{partType}</span>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {diagramInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ASTM E2375-16 {diagramInfo.figure} • {diagramInfo.titleHe}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(true)}
                className="gap-1"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/standards/E2375.pdf', '_blank')}
                className="gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Diagram */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-4 min-h-[350px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={partType}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {getDiagram()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Scan Directions
                </h4>
                <ScanDirectionLegend 
                  scanDetails={scanDetails} 
                  highlighted={highlightedDirection}
                  onHighlight={setInternalHighlight}
                />
              </div>
              
              {/* Description */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                <p className="text-xs text-blue-800 leading-relaxed">
                  {diagramInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{diagramInfo.title} - ASTM E2375</DialogTitle>
            <DialogDescription>{diagramInfo.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-8">
            {getDiagram()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default E2375ScanDirectionDiagram;
