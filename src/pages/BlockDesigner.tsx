/**
 * Block Designer Page
 * Full-screen page for designing custom calibration blocks with interactive hole placement
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockDesignerProvider } from '@/contexts/BlockDesignerContext';
import { BlockDesignerToolbar } from '@/components/block-designer/BlockDesignerToolbar';
import { ShapeBuilderPanel } from '@/components/block-designer/ShapeBuilderPanel';
import { Interactive3DCanvas } from '@/components/block-designer/Interactive3DCanvas';
import { HoleListPanel } from '@/components/block-designer/HoleListPanel';
import { Designer2DDrawing } from '@/components/block-designer/Designer2DDrawing';

function BlockDesignerContent() {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-14 border-b border-slate-700 bg-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-blue-400" />
            <h1 className="text-lg font-semibold text-white">Block Designer</h1>
          </div>
        </div>
        <BlockDesignerToolbar />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Shape Builder */}
        <aside className="w-64 border-r border-slate-700 bg-slate-800 overflow-y-auto shrink-0">
          <ShapeBuilderPanel />
        </aside>

        {/* Center - 3D and 2D Views */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          {/* 3D View */}
          <div className="flex-1 min-h-0">
            <Interactive3DCanvas />
          </div>

          {/* 2D Drawing */}
          <div className="h-72 border-t border-slate-700 shrink-0">
            <Designer2DDrawing />
          </div>
        </main>

        {/* Right Panel - Hole List */}
        <aside className="w-64 border-l border-slate-700 bg-slate-800 overflow-y-auto shrink-0">
          <HoleListPanel />
        </aside>
      </div>
    </div>
  );
}

export default function BlockDesigner() {
  return (
    <BlockDesignerProvider>
      <BlockDesignerContent />
    </BlockDesignerProvider>
  );
}
