/**
 * Block Designer Toolbar
 * Top toolbar with view mode, interaction mode, undo/redo, and export
 */

import React from 'react';
import {
  MousePointer,
  Plus,
  Undo2,
  Redo2,
  Download,
  Eye,
  Box,
  FileImage,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useBlockDesigner } from '@/contexts/BlockDesignerContext';
import { ViewMode, InteractionMode } from '@/types/blockDesigner.types';

export function BlockDesignerToolbar() {
  const {
    viewMode,
    setViewMode,
    interactionMode,
    setInteractionMode,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBlockDesigner();

  const viewModes: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: '3d', label: '3D Only', icon: <Box className="h-4 w-4" /> },
    { value: '2d', label: '2D Only', icon: <FileImage className="h-4 w-4" /> },
    { value: 'split', label: 'Split View', icon: <Eye className="h-4 w-4" /> },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* View Mode */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
          {viewModes.map((mode) => (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={viewMode === mode.value}
                  onPressedChange={() => setViewMode(mode.value)}
                  size="sm"
                  className="h-8 px-2"
                >
                  {mode.icon}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>{mode.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Interaction Mode */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={interactionMode === 'select'}
                onPressedChange={() => setInteractionMode('select')}
                size="sm"
              >
                <MousePointer className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Select Mode (S)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={interactionMode === 'place'}
                onPressedChange={() => setInteractionMode('place')}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Place Hole Mode (P)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                className="h-8 w-8"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                className="h-8 w-8"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Export as SVG</DropdownMenuItem>
            <DropdownMenuItem>Export as DXF</DropdownMenuItem>
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            <DropdownMenuItem>Export as PNG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
