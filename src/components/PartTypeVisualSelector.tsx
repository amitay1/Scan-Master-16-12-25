import React, { useState, useEffect } from "react";
import { PartGeometry } from "@/types/techniqueSheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ShapeCard from "@/components/ui/ShapeCard";
import { ChevronRight } from "lucide-react";

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
}

interface CategoryGroup {
  category: string;
  description: string;
  icon: string;
  options: PartTypeOption[];
}

/**
 * ASTM E2375 Product Form Categories
 *
 * Categories match ASTM E2375-16 Figure nomenclature for wrought product inspection.
 * The system auto-detects specific variant based on dimensions per standard criteria.
 *
 * Classification Rules (from ASTM E2375):
 * - PLATE: W/T > 5 (width-to-thickness ratio)
 * - RECTANGULAR BAR/BILLET: W/T < 5
 * - RING (Tube family): L/T < 5 (length-to-wall-thickness ratio)
 * - TUBE: L/T >= 5
 * - DISK: H/D < 0.5 (height-to-diameter ratio)
 * - CYLINDER/ROUND BAR: H/D >= 0.5
 *
 * Note: "Ring Forgings" from E2375 is called "Tube" in this system (hollow circular family)
 */
const categoryGroups: CategoryGroup[] = [
  {
    category: "Plate and Flat Bar",
    description: "Flat rectangular products - W/T > 5 per ASTM E2375 Fig. 6",
    icon: "📋",
    options: [
      {
        value: "plate",
        label: "Plate / Flat Bar",
        description: "W/T > 5: Scan with straight beam from top. If W or T > 228.6mm, scan from opposite sides",
        color: "#4A90E2"
      }
    ]
  },
  {
    category: "Rectangular Bar, Bloom, and Billets",
    description: "Compact rectangular products - W/T < 5 per ASTM E2375 Fig. 6 (can be hollow)",
    icon: "🧱",
    options: [
      {
        value: "box",
        label: "Rectangular Bar / Billet / Block",
        description: "W/T < 5: Scan from two adjacent sides. Toggle 'Hollow' for tubes. If T or W > 228.6mm, scan from opposite sides",
        color: "#E67E22"
      }
    ]
  },
  {
    category: "Round Bar / Cylinder",
    description: "Solid circular products per ASTM E2375 Fig. 7",
    icon: "⚫",
    options: [
      {
        value: "cylinder",
        label: "Round Bar / Shaft / Forging Stock",
        description: "Solid round: Scan radially while rotating. For forgings, consider grain structure per Appendix A",
        color: "#50C878"
      }
    ]
  },
  {
    category: "Tube (Ring Forgings)",
    description: "Hollow circular products per ASTM E2375 Fig. 7 - L/T ratio determines Ring vs Tube",
    icon: "⭕",
    options: [
      {
        value: "tube",
        label: "Tube / Pipe",
        description: "L/T >= 5: Long hollow cylinder. Scan from circumference + axial shear wave",
        color: "#FFB84D"
      },
      {
        value: "ring_forging",
        label: "Ring Forging",
        description: "L/T < 5: Short hollow. Radial scan if T < 20% OD, axial if L/T < 5, + shear wave",
        color: "#F39C12"
      }
    ]
  },
  {
    category: "Disk Forging",
    description: "Flat circular products per ASTM E2375 Fig. 8",
    icon: "💿",
    options: [
      {
        value: "disk_forging",
        label: "Disk Forging",
        description: "Flat face + radial scan: From at least one flat face, radially from circumference when practical",
        color: "#9B59B6"
      }
    ]
  },
  {
    category: "Hex Bar",
    description: "Hexagonal bar products per ASTM E2375 Fig. 9",
    icon: "⬡",
    options: [
      {
        value: "hexagon",
        label: "Hex Bar",
        description: "Scan from three adjacent faces. If attenuation high, scan from opposite sides",
        color: "#8E44AD"
      }
    ]
  },
  {
    category: "Special Geometries",
    description: "Non-standard shapes not covered by ASTM E2375",
    icon: "🔶",
    options: [
      {
        value: "cone",
        label: "Cone",
        description: "Conical parts (specify top/bottom diameters and height)",
        color: "#1ABC9C"
      },
      {
        value: "sphere",
        label: "Sphere",
        description: "Spherical parts",
        color: "#3498DB"
      }
    ]
  }
];

export const PartTypeVisualSelector: React.FC<PartTypeVisualSelectorProps> = ({
  value,
  material,
  onChange,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string>("");
  const [mountedCategories, setMountedCategories] = useState<Set<string>>(new Set());

  // Track when categories are expanded to force re-render of 3D models
  useEffect(() => {
    if (expandedCategory) {
      setMountedCategories(prev => {
        const newMounted = new Set(prev);
        newMounted.add(expandedCategory);
        return newMounted;
      });
    }
  }, [expandedCategory]);

  const handleShapeSelect = (shape: PartGeometry) => {
    onChange(shape);
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Select Part Type
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose the product form that matches your inspection part according to standards
        </p>
      </div>

      <Accordion
        type="single"
        value={expandedCategory}
        onValueChange={setExpandedCategory}
        collapsible
        className="w-full space-y-4"
      >
        {categoryGroups.map((group) => {
          const isExpanded = expandedCategory === group.category;
          const renderKey = `${group.category}-${isExpanded ? 'open' : 'closed'}-${mountedCategories.has(group.category) ? 'mounted' : 'initial'}`;
          
          return (
            <AccordionItem
              key={group.category}
              value={group.category}
              className="border rounded-lg bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline group">
                <div className="flex items-center gap-4 text-left flex-1">
                  <span className="text-3xl">{group.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {group.category}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                    {group.options.map((option) => (
                      <ShapeCard
                        key={`${renderKey}-${option.value}`}
                        title={option.label}
                        description={option.description}
                        partType={option.value}
                        color={option.color}
                        material={material}
                        isSelected={value === option.value}
                        onClick={() => handleShapeSelect(option.value)}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
