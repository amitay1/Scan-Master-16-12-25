import React, { useMemo } from "react";
import { PartGeometry } from "@/types/techniqueSheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Circle,
  Cylinder,
  Hexagon,
  Triangle,
  Square,
  Disc,
  CircleDot,
  type LucideIcon
} from "lucide-react";

interface CurrentShapeHeaderProps {
  partType: PartGeometry | "";
  className?: string;
}

interface ShapeInfo {
  label: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Exact mapping of each part type to its UNIQUE display name
 * Each shape has ONE specific name - no groups or families
 */
const shapeInfoMap: Record<string, ShapeInfo> = {
  // Plates
  plate: { label: "Plate", icon: Square, color: "#4A90E2" },
  sheet: { label: "Sheet", icon: Square, color: "#4A90E2" },
  slab: { label: "Slab", icon: Square, color: "#4A90E2" },
  flat_bar: { label: "Flat Bar", icon: Square, color: "#4A90E2" },

  // Rectangular shapes
  box: { label: "Box", icon: Box, color: "#E67E22" },
  rectangular_bar: { label: "Rectangular Bar", icon: Box, color: "#E67E22" },
  square_bar: { label: "Square Bar", icon: Box, color: "#E67E22" },
  billet: { label: "Billet", icon: Box, color: "#E67E22" },
  block: { label: "Block", icon: Box, color: "#E67E22" },
  rectangular_tube: { label: "Rectangular Tube", icon: Box, color: "#E67E22" },
  square_tube: { label: "Square Tube", icon: Box, color: "#E67E22" },

  // Cylinders / Round bars
  cylinder: { label: "Cylinder", icon: Cylinder, color: "#50C878" },
  round_bar: { label: "Round Bar", icon: Cylinder, color: "#50C878" },
  shaft: { label: "Shaft", icon: Cylinder, color: "#50C878" },
  bar: { label: "Bar", icon: Cylinder, color: "#50C878" },

  // Tubes / Pipes / Rings
  tube: { label: "Tube", icon: CircleDot, color: "#FFB84D" },
  pipe: { label: "Pipe", icon: CircleDot, color: "#FFB84D" },
  ring: { label: "Ring", icon: CircleDot, color: "#F39C12" },
  ring_forging: { label: "Ring Forging", icon: CircleDot, color: "#F39C12" },
  sleeve: { label: "Sleeve", icon: CircleDot, color: "#FFB84D" },
  bushing: { label: "Bushing", icon: CircleDot, color: "#FFB84D" },

  // Disks
  disk: { label: "Disk", icon: Disc, color: "#9B59B6" },
  disk_forging: { label: "Disk Forging", icon: Disc, color: "#9B59B6" },
  hub: { label: "Hub", icon: Disc, color: "#9B59B6" },

  // Hex
  hexagon: { label: "Hexagon", icon: Hexagon, color: "#8E44AD" },
  hex_bar: { label: "Hex Bar", icon: Hexagon, color: "#8E44AD" },

  // Special shapes
  cone: { label: "Cone", icon: Triangle, color: "#1ABC9C" },
  sphere: { label: "Sphere", icon: Circle, color: "#3498DB" },
  pyramid: { label: "Pyramid", icon: Triangle, color: "#1ABC9C" },
  ellipse: { label: "Ellipse", icon: Circle, color: "#3498DB" },
  irregular: { label: "Irregular", icon: Box, color: "#7F8C8D" },

  // Structural profiles
  l_profile: { label: "L-Profile", icon: Box, color: "#34495E" },
  t_profile: { label: "T-Profile", icon: Box, color: "#34495E" },
  i_profile: { label: "I-Profile", icon: Box, color: "#34495E" },
  u_profile: { label: "U-Profile", icon: Box, color: "#34495E" },
  z_profile: { label: "Z-Profile", icon: Box, color: "#34495E" },
  z_section: { label: "Z-Section", icon: Box, color: "#34495E" },
  custom_profile: { label: "Custom Profile", icon: Box, color: "#34495E" },

  // Extrusion variants
  extrusion_l: { label: "L-Extrusion", icon: Box, color: "#34495E" },
  extrusion_t: { label: "T-Extrusion", icon: Box, color: "#34495E" },
  extrusion_i: { label: "I-Extrusion", icon: Box, color: "#34495E" },
  extrusion_u: { label: "U-Extrusion", icon: Box, color: "#34495E" },
  extrusion_channel: { label: "Channel Extrusion", icon: Box, color: "#34495E" },
  extrusion_angle: { label: "Angle Extrusion", icon: Box, color: "#34495E" },

  // Forgings
  forging: { label: "Forging", icon: Box, color: "#E74C3C" },
  round_forging_stock: { label: "Round Forging Stock", icon: Cylinder, color: "#E74C3C" },
  rectangular_forging_stock: { label: "Rectangular Forging Stock", icon: Box, color: "#E74C3C" },
  near_net_forging: { label: "Near-Net Forging", icon: Box, color: "#E74C3C" },

  // Custom
  custom: { label: "Custom", icon: Box, color: "#7F8C8D" },
  machined_component: { label: "Machined Component", icon: Box, color: "#7F8C8D" },
};

const defaultShapeInfo: ShapeInfo = {
  label: "No Shape Selected",
  icon: Box,
  color: "#94A3B8",
};

export const CurrentShapeHeader: React.FC<CurrentShapeHeaderProps> = ({
  partType,
  className = "",
}) => {
  const shapeInfo = useMemo(() => {
    // Debug: log the exact partType value received
    console.log('[CurrentShapeHeader] partType received:', partType, '| mapped info:', shapeInfoMap[partType]);

    if (!partType) return defaultShapeInfo;
    return shapeInfoMap[partType] || {
      ...defaultShapeInfo,
      label: partType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    };
  }, [partType]);

  const IconComponent = shapeInfo.icon;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={partType || "empty"}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="relative"
        >
          {/* Main Header Container */}
          <div
            className="relative rounded-xl border-2 bg-gradient-to-r from-card via-card/95 to-card/90 shadow-lg overflow-hidden"
            style={{
              borderColor: partType ? shapeInfo.color : '#94A3B8',
            }}
          >
            {/* Animated Background Glow */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${shapeInfo.color}40, transparent 60%)`,
              }}
            />

            {/* Decorative Line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ backgroundColor: shapeInfo.color }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-4 px-5 py-3">
              {/* Icon Container */}
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="flex-shrink-0"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: `${shapeInfo.color}15`,
                    border: `2px solid ${shapeInfo.color}30`,
                  }}
                >
                  <IconComponent
                    className="w-6 h-6"
                    style={{ color: shapeInfo.color }}
                    strokeWidth={2.5}
                  />
                </div>
              </motion.div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    Part Type
                  </p>
                  <h2
                    className="text-lg font-bold truncate"
                    style={{ color: partType ? shapeInfo.color : '#94A3B8' }}
                  >
                    {shapeInfo.label}
                  </h2>
                </motion.div>
              </div>
            </div>

            {/* Bottom Progress Indicator */}
            {partType && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
                className="h-0.5 origin-left"
                style={{ backgroundColor: shapeInfo.color }}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CurrentShapeHeader;
