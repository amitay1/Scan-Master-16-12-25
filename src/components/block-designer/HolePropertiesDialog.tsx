/**
 * Hole Properties Dialog
 * Dialog for editing hole properties (size, depth, position)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBlockDesigner } from '@/contexts/BlockDesignerContext';
import {
  DesignerHole,
  FBH_SIZES,
  FBHSize,
  fbhSizeToDiameter,
  HoleSurface,
} from '@/types/blockDesigner.types';

interface HolePropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hole: DesignerHole | null;
}

export function HolePropertiesDialog({ open, onOpenChange, hole }: HolePropertiesDialogProps) {
  const { updateHole, blockShape } = useBlockDesigner();

  const [size, setSize] = useState<FBHSize | string>('5/64');
  const [depth, setDepth] = useState(25);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [surface, setSurface] = useState<HoleSurface>('top');

  // Initialize form when hole changes
  useEffect(() => {
    if (hole) {
      setSize(hole.size);
      setDepth(hole.depth);
      setPosX(hole.position.x);
      setPosY(hole.position.y);
      setSurface(hole.surface);
    }
  }, [hole]);

  const handleSave = () => {
    if (!hole) return;

    updateHole(hole.id, {
      size,
      diameter: fbhSizeToDiameter(size),
      depth,
      position: {
        x: posX,
        y: posY,
        z: surface === 'top' ? blockShape.height : surface === 'bottom' ? 0 : hole.position.z,
      },
      surface,
    });

    onOpenChange(false);
  };

  const getMaxDepth = () => {
    switch (surface) {
      case 'top':
      case 'bottom':
        return blockShape.height;
      case 'front':
      case 'back':
        return blockShape.width;
      case 'left':
      case 'right':
        return blockShape.length;
      default:
        return 100;
    }
  };

  const getMaxX = () => {
    switch (surface) {
      case 'top':
      case 'bottom':
      case 'front':
      case 'back':
        return blockShape.length;
      case 'left':
      case 'right':
        return blockShape.width;
      default:
        return 100;
    }
  };

  const getMaxY = () => {
    switch (surface) {
      case 'top':
      case 'bottom':
        return blockShape.width;
      case 'front':
      case 'back':
      case 'left':
      case 'right':
        return blockShape.height;
      default:
        return 100;
    }
  };

  if (!hole) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Hole Properties</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* FBH Size */}
          <div className="space-y-2">
            <Label>FBH Size</Label>
            <Select value={size} onValueChange={(val) => setSize(val as FBHSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FBH_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}" ({fbhSizeToDiameter(s).toFixed(2)}mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Depth */}
          <div className="space-y-2">
            <Label>Depth (mm)</Label>
            <Input
              type="number"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              min={1}
              max={getMaxDepth()}
            />
            <p className="text-xs text-muted-foreground">
              Max depth for {surface} surface: {getMaxDepth()}mm
            </p>
          </div>

          {/* Surface */}
          <div className="space-y-2">
            <Label>Surface</Label>
            <Select value={surface} onValueChange={(val) => setSurface(val as HoleSurface)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="front">Front</SelectItem>
                <SelectItem value="back">Back</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position X (mm)</Label>
              <Input
                type="number"
                value={posX.toFixed(1)}
                onChange={(e) => setPosX(Number(e.target.value))}
                min={0}
                max={getMaxX()}
              />
            </div>
            <div className="space-y-2">
              <Label>Position Y (mm)</Label>
              <Input
                type="number"
                value={posY.toFixed(1)}
                onChange={(e) => setPosY(Number(e.target.value))}
                min={0}
                max={getMaxY()}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
