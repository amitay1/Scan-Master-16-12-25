/**
 * Hole List Panel
 * Right panel for managing placed holes (FBH, SDH) and notches
 * Enhanced for angle beam calibration features
 */

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Circle, Minus, Target, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useBlockDesigner } from '@/contexts/BlockDesignerContext';
import { HolePropertiesDialog } from './HolePropertiesDialog';
import {
  DesignerHole,
  DesignerNotch,
  DEFAULT_HOLE,
  DEFAULT_SDH,
  DEFAULT_NOTCH,
  fbhSizeToDiameter,
} from '@/types/blockDesigner.types';

export function HoleListPanel() {
  const {
    holes,
    notches,
    selectedHoleId,
    selectedNotchId,
    selectHole,
    selectNotch,
    deleteHole,
    deleteNotch,
    addHole,
    addNotch,
    clearAllHoles,
    clearAllNotches,
    blockShape,
    setInteractionMode,
    setPlacementMode,
    placementMode,
  } = useBlockDesigner();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHole, setEditingHole] = useState<DesignerHole | null>(null);
  const [activeTab, setActiveTab] = useState<'fbh' | 'sdh' | 'notch'>('fbh');

  // Filter holes by type
  const fbhHoles = holes.filter(h => h.type === 'fbh' || !h.type);
  const sdhHoles = holes.filter(h => h.type === 'sdh');

  const handleAddFBH = () => {
    addHole({
      ...DEFAULT_HOLE,
      type: 'fbh',
      diameter: fbhSizeToDiameter(DEFAULT_HOLE.size),
      position: {
        x: blockShape.length / 2,
        y: blockShape.width / 2,
        z: blockShape.height,
      },
      surface: 'top',
    });
  };

  const handleAddSDH = () => {
    addHole({
      ...DEFAULT_SDH,
      type: 'sdh',
      position: {
        x: blockShape.length / 2,
        y: 0,
        z: blockShape.height / 2, // Middle height
      },
      surface: 'left', // SDH runs through width
    });
  };

  const handleAddNotch = () => {
    addNotch({
      ...DEFAULT_NOTCH,
      xPosition: blockShape.length / 2,
    });
  };

  const handleEditHole = (hole: DesignerHole) => {
    setEditingHole(hole);
    setDialogOpen(true);
  };

  const handleStartPlacing = (mode: 'fbh' | 'sdh' | 'notch') => {
    setPlacementMode(mode);
    setInteractionMode('place');
  };

  // Helper function to get type badge color
  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'sdh': return 'border-orange-500 text-orange-400';
      case 'through': return 'border-purple-500 text-purple-400';
      default: return 'border-cyan-500 text-cyan-400';
    }
  };

  return (
    <div className="h-full flex flex-col text-slate-200">
      {/* Header with counts */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-white">Features</h2>
          <div className="flex gap-1">
            <Badge variant="secondary" className="bg-cyan-900/50 text-cyan-300 text-[10px]">
              {fbhHoles.length} FBH
            </Badge>
            <Badge variant="secondary" className="bg-orange-900/50 text-orange-300 text-[10px]">
              {sdhHoles.length} SDH
            </Badge>
            <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 text-[10px]">
              {notches.length} Notch
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="mx-2 mt-2 bg-slate-800 border border-slate-700">
          <TabsTrigger value="fbh" className="flex-1 data-[state=active]:bg-cyan-600">
            <CircleDot className="h-3 w-3 mr-1" />
            FBH
          </TabsTrigger>
          <TabsTrigger value="sdh" className="flex-1 data-[state=active]:bg-orange-600">
            <Target className="h-3 w-3 mr-1" />
            SDH
          </TabsTrigger>
          <TabsTrigger value="notch" className="flex-1 data-[state=active]:bg-purple-600">
            <Minus className="h-3 w-3 mr-1" />
            Notch
          </TabsTrigger>
        </TabsList>

        {/* FBH Tab */}
        <TabsContent value="fbh" className="flex-1 flex flex-col mt-0">
          <div className="p-2">
            <div className="flex gap-1">
              <Button size="sm" onClick={() => handleStartPlacing('fbh')} className="flex-1 h-7 text-xs bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-3 w-3 mr-1" />
                Place FBH
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddFBH} className="h-7 border-slate-600 text-slate-200 hover:bg-slate-700">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {fbhHoles.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Circle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No FBH holes placed</p>
                </div>
              ) : (
                fbhHoles.map((hole, index) => (
                  <div
                    key={hole.id}
                    onClick={() => selectHole(hole.id)}
                    onDoubleClick={() => handleEditHole(hole)}
                    className={`p-2 rounded-md cursor-pointer flex items-center gap-2 ${
                      selectedHoleId === hole.id
                        ? 'bg-cyan-500/20 border border-cyan-500'
                        : 'hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <GripVertical className="h-3 w-3 text-slate-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-white">#{index + 1}</span>
                        <Badge variant="outline" className="text-[10px] border-cyan-500 text-cyan-400">
                          {hole.size}"
                        </Badge>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Depth: {hole.depth}mm | ({hole.position.x.toFixed(0)}, {hole.position.y.toFixed(0)})
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 hover:bg-slate-700"
                      onClick={(e) => { e.stopPropagation(); deleteHole(hole.id); }}
                    >
                      <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-400" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* SDH Tab */}
        <TabsContent value="sdh" className="flex-1 flex flex-col mt-0">
          <div className="p-2">
            <div className="flex gap-1">
              <Button size="sm" onClick={() => handleStartPlacing('sdh')} className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-700">
                <Plus className="h-3 w-3 mr-1" />
                Place SDH
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddSDH} className="h-7 border-slate-600 text-slate-200 hover:bg-slate-700">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sdhHoles.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Target className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No SDH holes placed</p>
                  <p className="text-[10px] mt-1">Side drilled holes for angle beam calibration</p>
                </div>
              ) : (
                sdhHoles.map((hole, index) => (
                  <div
                    key={hole.id}
                    onClick={() => selectHole(hole.id)}
                    onDoubleClick={() => handleEditHole(hole)}
                    className={`p-2 rounded-md cursor-pointer flex items-center gap-2 ${
                      selectedHoleId === hole.id
                        ? 'bg-orange-500/20 border border-orange-500'
                        : 'hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <GripVertical className="h-3 w-3 text-slate-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-white">SDH #{index + 1}</span>
                        <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-400">
                          ⌀{hole.diameter}mm
                        </Badge>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Depth from surface: {hole.depthFromSurface ?? hole.position.z}mm
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 hover:bg-slate-700"
                      onClick={(e) => { e.stopPropagation(); deleteHole(hole.id); }}
                    >
                      <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-400" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Notch Tab */}
        <TabsContent value="notch" className="flex-1 flex flex-col mt-0">
          <div className="p-2">
            <div className="flex gap-1">
              <Button size="sm" onClick={() => handleStartPlacing('notch')} className="flex-1 h-7 text-xs bg-purple-600 hover:bg-purple-700">
                <Plus className="h-3 w-3 mr-1" />
                Place Notch
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddNotch} className="h-7 border-slate-600 text-slate-200 hover:bg-slate-700">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {notches.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Minus className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No notches placed</p>
                  <p className="text-[10px] mt-1">Rectangular or V-notches for calibration</p>
                </div>
              ) : (
                notches.map((notch, index) => (
                  <div
                    key={notch.id}
                    onClick={() => selectNotch(notch.id)}
                    className={`p-2 rounded-md cursor-pointer flex items-center gap-2 ${
                      selectedNotchId === notch.id
                        ? 'bg-purple-500/20 border border-purple-500'
                        : 'hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <GripVertical className="h-3 w-3 text-slate-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-white">Notch #{index + 1}</span>
                        <Badge variant="outline" className="text-[10px] border-purple-500 text-purple-400">
                          {notch.type === 'v_notch' ? `V-${notch.vAngle}°` : notch.type}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {notch.width}×{notch.depth}mm | {notch.surface} | X: {notch.xPosition}mm
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 hover:bg-slate-700"
                      onClick={(e) => { e.stopPropagation(); deleteNotch(notch.id); }}
                    >
                      <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-400" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer Actions - Clear All */}
      {(holes.length > 0 || notches.length > 0) && (
        <div className="p-2 border-t border-slate-700">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All Features
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-800 border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Clear all features?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will remove all {holes.length} holes and {notches.length} notches. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => { clearAllHoles(); clearAllNotches(); }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Edit Dialog */}
      <HolePropertiesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hole={editingHole}
      />
    </div>
  );
}
