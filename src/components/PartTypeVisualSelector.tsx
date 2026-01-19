import React, { useState, useRef, Suspense } from "react";
import { PartGeometry } from "@/types/techniqueSheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, Sparkles, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { getGeometryByType } from "@/components/3d/ShapeGeometries";
import ShapeCard from "@/components/ui/ShapeCard";
import { cn } from "@/lib/utils";

interface PartTypeVisualSelectorProps {
  value: string;
  material?: string;
  onChange: (value: PartGeometry) => void;
}

interface PartTypeOption {
  value: PartGeometry;
  label: string;
  description: string;
  color: string;
  icon: string;
  gradient: string;
}

// Flat list of all part types with icons and premium gradients
const allPartTypes: PartTypeOption[] = [
  { value: "plate", label: "Plate / Flat Bar", description: "W/T > 5: Flat rectangular products", color: "#4A90E2", icon: "📋", gradient: "from-blue-500/20 via-blue-400/10 to-transparent" },
  { value: "box", label: "Rectangular Bar / Block", description: "W/T < 5: Compact rectangular (can be hollow)", color: "#E67E22", icon: "🧱", gradient: "from-orange-500/20 via-orange-400/10 to-transparent" },
  { value: "cylinder", label: "Round Bar / Shaft", description: "Solid circular products", color: "#50C878", icon: "⚫", gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent" },
  { value: "tube", label: "Tube / Pipe", description: "L/T >= 5: Long hollow cylinder", color: "#FFB84D", icon: "⭕", gradient: "from-amber-500/20 via-amber-400/10 to-transparent" },
  { value: "ring_forging", label: "Ring Forging", description: "L/T < 5: Short hollow ring", color: "#F39C12", icon: "🔘", gradient: "from-yellow-500/20 via-yellow-400/10 to-transparent" },
  { value: "disk_forging", label: "Disk Forging", description: "Flat circular products", color: "#9B59B6", icon: "💿", gradient: "from-purple-500/20 via-purple-400/10 to-transparent" },
  { value: "hexagon", label: "Hex Bar", description: "Hexagonal bar products", color: "#8E44AD", icon: "⬡", gradient: "from-violet-500/20 via-violet-400/10 to-transparent" },
  { value: "cone", label: "Tapered Tube / Cone", description: "Hollow tapered tube (like tube with different OD at each end)", color: "#1ABC9C", icon: "🔻", gradient: "from-teal-500/20 via-teal-400/10 to-transparent" },
  { value: "sphere", label: "Sphere", description: "Spherical parts", color: "#3498DB", icon: "🔵", gradient: "from-cyan-500/20 via-cyan-400/10 to-transparent" },
  { value: "impeller", label: "Impeller", description: "Complex stepped disk with R surfaces (aero engine)", color: "#E74C3C", icon: "🌀", gradient: "from-red-500/20 via-red-400/10 to-transparent" },
  { value: "blisk", label: "Blisk (Bladed Disk)", description: "Integrated blade-disk for aero engines", color: "#2980B9", icon: "🔷", gradient: "from-blue-600/20 via-blue-500/10 to-transparent" },
];

// Mini 3D Shape Component for inline preview
function Mini3DShape({ partType, color, isHovered }: { partType: string; color: string; isHovered: boolean }) {
  const geometry = React.useMemo(() => getGeometryByType(partType), [partType]);
  const meshRef = useRef<THREE.Mesh>(null);

  React.useEffect(() => {
    let animationId: number;
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.y += isHovered ? 0.03 : 0.01;
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  return (
    <mesh ref={meshRef} geometry={geometry} scale={isHovered ? 0.85 : 0.7}>
      <meshStandardMaterial
        color={color}
        metalness={0.6}
        roughness={0.3}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

// Inline 3D preview component
function Inline3DPreview({ partType, color, isHovered }: { partType: string; color: string; isHovered: boolean }) {
  return (
    <div className="w-8 h-8 relative">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#e0e8ff" />
        <pointLight position={[0, 0, 3]} intensity={isHovered ? 0.8 : 0.3} color={color} />
        <Suspense fallback={null}>
          <Mini3DShape partType={partType} color={color} isHovered={isHovered} />
        </Suspense>
      </Canvas>
      {/* Glow effect */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-md transition-opacity duration-300",
          isHovered ? "opacity-60" : "opacity-0"
        )}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// Premium dropdown option component
function ShapeOption({ 
  option, 
  isSelected, 
  isHovered,
  onHover,
  onClick 
}: { 
  option: PartTypeOption; 
  isSelected: boolean;
  isHovered: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-200",
        "border border-transparent",
        isSelected && "bg-primary/10 border-primary/30",
        isHovered && !isSelected && "bg-muted/80",
        "group"
      )}
      onMouseEnter={onHover}
      onClick={onClick}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Background gradient on hover */}
      <div 
        className={cn(
          "absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 transition-opacity duration-300",
          option.gradient,
          isHovered && "opacity-100"
        )}
      />
      
      {/* 3D Preview */}
      <div className="relative z-10 flex-shrink-0">
        <Inline3DPreview 
          partType={option.value} 
          color={option.color} 
          isHovered={isHovered}
        />
      </div>

      {/* Text content */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm transition-colors",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {option.label}
          </span>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0"
            >
              <Check className="h-4 w-4 text-primary" />
            </motion.div>
          )}
        </div>
        <p className={cn(
          "text-xs truncate transition-colors",
          isHovered ? "text-muted-foreground" : "text-muted-foreground/70"
        )}>
          {option.description}
        </p>
      </div>

      {/* Color accent bar */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full"
        style={{ backgroundColor: option.color }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: isHovered || isSelected ? 24 : 0, 
          opacity: isHovered || isSelected ? 1 : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </motion.div>
  );
}

export const PartTypeVisualSelector: React.FC<PartTypeVisualSelectorProps> = ({
  value,
  material,
  onChange,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedType = allPartTypes.find(t => t.value === value);

  const handleSelect = (partType: PartGeometry) => {
    onChange(partType);
    setDropdownOpen(false);
    setDialogOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5" ref={dropdownRef}>
      {/* Premium custom dropdown */}
      <div className="relative flex-1">
        <motion.button
          type="button"
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-background border border-input",
            "hover:border-primary/50 hover:bg-muted/50",
            "transition-all duration-200",
            "text-left",
            dropdownOpen && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          whileTap={{ scale: 0.98 }}
        >
          {selectedType ? (
            <>
              <Inline3DPreview 
                partType={selectedType.value} 
                color={selectedType.color} 
                isHovered={dropdownOpen}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">
                  {selectedType.label}
                </span>
              </div>
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedType.color }}
              />
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Select part type...</span>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            dropdownOpen && "rotate-180"
          )} />
        </motion.button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "absolute z-50 top-full left-0 right-0 mt-1.5",
                "bg-popover border border-border rounded-xl shadow-xl",
                "max-h-[320px] overflow-y-auto",
                "backdrop-blur-xl"
              )}
            >
              {/* Header */}
              <div className="sticky top-0 bg-popover/95 backdrop-blur-sm px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Select geometry type</span>
                </div>
              </div>
              
              {/* Options */}
              <div className="p-1.5 space-y-0.5">
                {allPartTypes.map((option) => (
                  <ShapeOption
                    key={option.value}
                    option={option}
                    isSelected={value === option.value}
                    isHovered={hoveredOption === option.value}
                    onHover={() => setHoveredOption(option.value)}
                    onClick={() => handleSelect(option.value)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expand button for full visual picker dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-9 w-9 flex-shrink-0 relative overflow-hidden",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "transition-all duration-200"
                  )}
                >
                  <Maximize2 className="h-4 w-4" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Open 3D visual selector</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0">
          {/* Premium dialog header */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            <DialogHeader className="relative">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                Select Part Geometry
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the shape that best matches your part for accurate inspection planning
              </p>
            </DialogHeader>
          </div>

          {/* Cards grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {allPartTypes.map((option, index) => (
                <motion.div
                  key={option.value}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <ShapeCard
                    title={option.label}
                    description={option.description}
                    partType={option.value}
                    color={option.color}
                    material={material}
                    isSelected={value === option.value}
                    onClick={() => handleSelect(option.value)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
