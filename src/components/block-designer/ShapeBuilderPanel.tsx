/**
 * Shape Builder Panel
 * Left panel for configuring block shape, dimensions, and curvature
 * Enhanced for angle beam calibration blocks (IIW, AWS, SDH)
 */

import React from 'react';
import { RotateCcw, Box, Circle, Ruler, Target, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useBlockDesigner } from '@/contexts/BlockDesignerContext';
import {
  CurvatureType,
  BlockMaterial,
  ShapePreset,
  BlockGeometryType,
  SHAPE_PRESETS,
  MATERIAL_PROPERTIES,
} from '@/types/blockDesigner.types';

export function ShapeBuilderPanel() {
  const {
    blockShape,
    blockMaterial,
    setBlockShape,
    setBlockMaterial,
    loadPreset,
    resetShape,
  } = useBlockDesigner();

  const handleDimensionChange = (key: 'length' | 'width' | 'height' | 'outerDiameter' | 'innerDiameter' | 'cylinderLength', value: number) => {
    setBlockShape({ [key]: value });
  };

  const handleGeometryTypeChange = (type: BlockGeometryType) => {
    setBlockShape({ geometryType: type });
  };

  const handleCurvatureTypeChange = (
    surface: 'topCurvature' | 'frontCurvature',
    type: CurvatureType
  ) => {
    setBlockShape({
      [surface]: {
        ...blockShape[surface],
        type,
        radius: type === 'flat' ? 0 : blockShape[surface].radius || 100,
      },
    });
  };

  const handleCurvatureRadiusChange = (
    surface: 'topCurvature' | 'frontCurvature',
    radius: number
  ) => {
    setBlockShape({
      [surface]: {
        ...blockShape[surface],
        radius,
      },
    });
  };

  // IIW blocks have rectangular base dimensions but special curved ends
  const isRectangular = blockShape.geometryType === 'rectangular' || blockShape.geometryType === 'curved_block' || blockShape.geometryType === 'iiw_block';
  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';
  const isIIWBlock = blockShape.geometryType === 'iiw_block';

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-white">Shape Builder</h2>
        <Button variant="ghost" size="icon" onClick={resetShape} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Geometry Type */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">Geometry Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={isRectangular ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGeometryTypeChange('rectangular')}
            className={`h-16 flex-col gap-1 ${isRectangular ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
          >
            <Box className="h-5 w-5" />
            <span className="text-xs">Block</span>
          </Button>
          <Button
            variant={isCylindrical ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGeometryTypeChange('cylinder')}
            className={`h-16 flex-col gap-1 ${isCylindrical ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
          >
            <Circle className="h-5 w-5" />
            <span className="text-xs">Cylinder</span>
          </Button>
        </div>
      </div>

      {/* Presets - organized by category */}
      <div className="space-y-3">
        <Label className="text-xs text-slate-400">Quick Presets</Label>

        {/* Basic Shapes */}
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Basic Shapes</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['flat_block', 'curved_block', 'cylinder', 'tube'] as ShapePreset[]).map((preset) => (
              <TooltipProvider key={preset}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                      className="text-xs h-7 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {SHAPE_PRESETS[preset].label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-600">
                    <p className="text-xs">{SHAPE_PRESETS[preset].description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Angle Beam Calibration Blocks */}
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Angle Beam Calibration</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['iiw_v1', 'iiw_v2', 'aws_dsc', 'sdh_block'] as ShapePreset[]).map((preset) => (
              <TooltipProvider key={preset}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                      className="text-xs h-7 border-cyan-600/50 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-500"
                    >
                      {SHAPE_PRESETS[preset].label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-600">
                    <p className="text-xs">{SHAPE_PRESETS[preset].description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Dimensions based on geometry type */}
      {isRectangular ? (
        <div className="space-y-4">
          <Label className="text-xs text-slate-400">Block Dimensions (mm)</Label>

          {/* Length */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Length (X)</Label>
              <Input
                type="number"
                value={blockShape.length}
                onChange={(e) => handleDimensionChange('length', Number(e.target.value))}
                className="w-20 h-7 text-xs bg-slate-700 border-slate-600 text-white"
                min={10}
                max={500}
              />
            </div>
            <Slider
              value={[blockShape.length]}
              onValueChange={([val]) => handleDimensionChange('length', val)}
              min={10}
              max={500}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>

          {/* Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Width (Y)</Label>
              <Input
                type="number"
                value={blockShape.width}
                onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                className="w-20 h-7 text-xs bg-slate-700 border-slate-600 text-white"
                min={10}
                max={300}
              />
            </div>
            <Slider
              value={[blockShape.width]}
              onValueChange={([val]) => handleDimensionChange('width', val)}
              min={10}
              max={300}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Height (Z)</Label>
              <Input
                type="number"
                value={blockShape.height}
                onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                className="w-20 h-7 text-xs bg-slate-700 border-slate-600 text-white"
                min={10}
                max={200}
              />
            </div>
            <Slider
              value={[blockShape.height]}
              onValueChange={([val]) => handleDimensionChange('height', val)}
              min={10}
              max={200}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Label className="text-xs text-slate-400">Cylinder Dimensions (mm)</Label>

          {/* Outer Diameter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Outer Diameter</Label>
              <Input
                type="number"
                value={blockShape.outerDiameter}
                onChange={(e) => handleDimensionChange('outerDiameter', Number(e.target.value))}
                className="w-20 h-7 text-xs bg-slate-700 border-slate-600 text-white"
                min={20}
                max={300}
              />
            </div>
            <Slider
              value={[blockShape.outerDiameter]}
              onValueChange={([val]) => handleDimensionChange('outerDiameter', val)}
              min={20}
              max={300}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>

          {/* Inner Diameter (for tubes) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Inner Diameter (0=solid)</Label>
              <Input
                type="number"
                value={blockShape.innerDiameter}
                onChange={(e) => handleDimensionChange('innerDiameter', Number(e.target.value))}
                className="w-20 h-7 text-xs bg-slate-700 border-slate-600 text-white"
                min={0}
                max={blockShape.outerDiameter - 10}
              />
            </div>
            <Slider
              value={[blockShape.innerDiameter]}
              onValueChange={([val]) => handleDimensionChange('innerDiameter', val)}
              min={0}
              max={Math.max(0, blockShape.outerDiameter - 10)}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>

          {/* Length */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Length</Label>
              <Input
                type="number"
                value={blockShape.cylinderLength}
                onChange={(e) => handleDimensionChange('cylinderLength', Number(e.target.value))}
                className="w-20 h-7 text-xs bg-slate-700 border-slate-600 text-white"
                min={20}
                max={500}
              />
            </div>
            <Slider
              value={[blockShape.cylinderLength]}
              onValueChange={([val]) => handleDimensionChange('cylinderLength', val)}
              min={20}
              max={500}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>
        </div>
      )}

      <Separator className="bg-slate-700" />

      {/* Surface Curvature - only for rectangular blocks */}
      {isRectangular && (
        <>
          <div className="space-y-4">
            <Label className="text-xs text-slate-400">Surface Curvature</Label>

            {/* Top Surface */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Top Surface</Label>
              <Select
                value={blockShape.topCurvature.type}
                onValueChange={(val) =>
                  handleCurvatureTypeChange('topCurvature', val as CurvatureType)
                }
              >
                <SelectTrigger className="h-8 text-xs bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="flat" className="text-slate-200">Flat</SelectItem>
                  <SelectItem value="convex" className="text-slate-200">Convex (Curved Out)</SelectItem>
                  <SelectItem value="concave" className="text-slate-200">Concave (Curved In)</SelectItem>
                </SelectContent>
              </Select>
              {blockShape.topCurvature.type !== 'flat' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Radius</Label>
                    <span className="text-xs text-slate-300">{blockShape.topCurvature.radius}mm</span>
                  </div>
                  <Slider
                    value={[blockShape.topCurvature.radius]}
                    onValueChange={([val]) => handleCurvatureRadiusChange('topCurvature', val)}
                    min={50}
                    max={500}
                    step={10}
                    className="[&_[role=slider]]:bg-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-slate-700" />
        </>
      )}

      {/* Material */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">Material</Label>
        <Select
          value={blockMaterial}
          onValueChange={(val) => setBlockMaterial(val as BlockMaterial)}
        >
          <SelectTrigger className="h-8 text-xs bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {(Object.keys(MATERIAL_PROPERTIES) as BlockMaterial[]).map((mat) => (
              <SelectItem key={mat} value={mat} className="text-slate-200">
                {MATERIAL_PROPERTIES[mat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* IIW/Angle Beam Features - only for rectangular/IIW blocks */}
      {isRectangular && (
        <>
          <Separator className="bg-slate-700" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-cyan-400 flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                Angle Beam Features
              </Label>
              {isIIWBlock && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-600/50">
                  IIW Block
                </span>
              )}
            </div>

            {/* Radius Surface */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">Radius Surface (IIW Style)</Label>
                <Switch
                  checked={blockShape.radiusSurface?.enabled ?? false}
                  onCheckedChange={(checked) => {
                    // When enabling radius surface on rectangular block, change to iiw_block type
                    // When disabling on iiw_block, change back to rectangular
                    const newGeometryType = checked ? 'iiw_block' : 'rectangular';
                    setBlockShape({
                      geometryType: newGeometryType,
                      radiusSurface: {
                        ...blockShape.radiusSurface,
                        enabled: checked,
                      },
                    });
                  }}
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>
              {blockShape.radiusSurface?.enabled && (
                <div className="space-y-2 pl-2 border-l-2 border-cyan-600/30">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Radius</Label>
                      <Input
                        type="number"
                        value={blockShape.radiusSurface.radius}
                        onChange={(e) =>
                          setBlockShape({
                            radiusSurface: {
                              ...blockShape.radiusSurface,
                              radius: Number(e.target.value),
                            },
                          })
                        }
                        className="w-20 h-6 text-xs bg-slate-700 border-slate-600 text-white"
                        min={10}
                        max={200}
                      />
                    </div>
                    <Slider
                      value={[blockShape.radiusSurface.radius]}
                      onValueChange={([val]) =>
                        setBlockShape({
                          radiusSurface: {
                            ...blockShape.radiusSurface,
                            radius: val,
                          },
                        })
                      }
                      min={10}
                      max={200}
                      step={5}
                      className="[&_[role=slider]]:bg-cyan-500"
                    />
                  </div>
                  <Select
                    value={blockShape.radiusSurface.position}
                    onValueChange={(val: 'left' | 'right' | 'both') =>
                      setBlockShape({
                        radiusSurface: {
                          ...blockShape.radiusSurface,
                          position: val,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="left" className="text-slate-200">Left End</SelectItem>
                      <SelectItem value="right" className="text-slate-200">Right End</SelectItem>
                      <SelectItem value="both" className="text-slate-200">Both Ends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Scale Marking */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Ruler className="h-3 w-3" />
                  Scale Marking
                </Label>
                <Switch
                  checked={blockShape.scaleMarking?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setBlockShape({
                      scaleMarking: {
                        ...blockShape.scaleMarking,
                        enabled: checked,
                      },
                    })
                  }
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>
              {blockShape.scaleMarking?.enabled && (
                <div className="space-y-2 pl-2 border-l-2 border-cyan-600/30">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-400">Increment (mm)</Label>
                    <Select
                      value={String(blockShape.scaleMarking.increment)}
                      onValueChange={(val) =>
                        setBlockShape({
                          scaleMarking: {
                            ...blockShape.scaleMarking,
                            increment: Number(val),
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-20 h-6 text-xs bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="5" className="text-slate-200">5mm</SelectItem>
                        <SelectItem value="10" className="text-slate-200">10mm</SelectItem>
                        <SelectItem value="25" className="text-slate-200">25mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
