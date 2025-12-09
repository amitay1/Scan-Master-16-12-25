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
 * SHAPE FAMILIES - Rafael 5036 Standard
 *
 * Only show PARENT shapes (family heads). The system auto-detects the specific
 * variant based on dimensions:
 *
 * - CYLINDER family: cylinder (solid long), disk (solid short - auto-detected)
 * - TUBE family: tube (hollow long), ring (hollow short - auto-detected), pipe, sleeve
 * - BOX family: box, plate (thin - auto-detected), bar (long narrow - auto-detected)
 * - RECTANGULAR_TUBE: hollow rectangular (unique)
 * - HEXAGON: hexagonal bars (unique)
 * - SPHERE: spherical parts (unique)
 * - CONE: conical parts (unique)
 */
const categoryGroups: CategoryGroup[] = [
  {
    category: "Shape Families",
    description: "Select base shape - system auto-detects variant from dimensions",
    icon: "🔷",
    options: [
      {
        value: "cylinder",
        label: "Cylinder (Solid Round)",
        description: "Solid circular: round bars, shafts, disks (auto-detect by height/diameter)",
        color: "#50C878"
      },
      {
        value: "tube",
        label: "Tube (Hollow Round)",
        description: "Hollow circular: tubes, pipes, rings, sleeves (auto-detect by height/wall)",
        color: "#FFB84D"
      },
      {
        value: "box",
        label: "Box (Solid Rectangular)",
        description: "Solid rectangular: boxes, plates, bars (auto-detect by proportions)",
        color: "#4A90E2"
      },
      {
        value: "rectangular_tube",
        label: "Rectangular Tube (Hollow)",
        description: "Hollow rectangular: square/rectangular tubes",
        color: "#E74C3C"
      },
      {
        value: "hexagon",
        label: "Hexagon",
        description: "Hexagonal bars and profiles",
        color: "#9B59B6"
      },
      {
        value: "sphere",
        label: "Sphere",
        description: "Spherical parts",
        color: "#3498DB"
      },
      {
        value: "cone",
        label: "Cone",
        description: "Conical parts (specify top/bottom diameters)",
        color: "#1ABC9C"
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
    const newMounted = new Set(mountedCategories);
    if (expandedCategory) {
      newMounted.add(expandedCategory);
    }
    setMountedCategories(newMounted);
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
