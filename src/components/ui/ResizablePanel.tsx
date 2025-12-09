import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Minimize2, Maximize2, GripHorizontal } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

interface ResizablePanelProps {
  children: ReactNode;
  title?: string;
  isOpen: boolean;
  onToggle: () => void;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  className?: string;
  presets?: { label: string; size: { width: number; height: number } }[];
}

// Size presets configuration
const SIZE_PRESETS = {
  S: { width: 250, height: 280 },
  M: { width: 400, height: 450 },
  L: { width: 550, height: 550 },
};

export const Collapsible3DPanel = ({
  children,
  title = "3D Viewer",
  isOpen,
  onToggle,
  defaultSize,
  minSize = { width: 200, height: 200 },
  maxSize = { width: 600, height: 600 },
  className = "",
  presets = [
    { label: "S", size: SIZE_PRESETS.S },
    { label: "M", size: SIZE_PRESETS.M },
    { label: "L", size: SIZE_PRESETS.L },
  ]
}: ResizablePanelProps) => {
  // Get default size from settings
  const { settings } = useSettings();
  const settingsDefaultSize = SIZE_PRESETS[settings.viewer.viewer3DDefaultSize] || SIZE_PRESETS.M;
  const initialSize = defaultSize || settingsDefaultSize;
  
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(settings.viewer.viewer3DDefaultSize || "M");
  const panelRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Update size when settings change
  useEffect(() => {
    if (!defaultSize) {
      const newSize = SIZE_PRESETS[settings.viewer.viewer3DDefaultSize] || SIZE_PRESETS.M;
      setSize(newSize);
      setActivePreset(settings.viewer.viewer3DDefaultSize || "M");
    }
  }, [settings.viewer.viewer3DDefaultSize, defaultSize]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
  }, [size]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = startPos.current.x - e.clientX; // Reversed for right-side panel
    const deltaY = e.clientY - startPos.current.y;

    const newWidth = Math.max(minSize.width, Math.min(maxSize.width, startPos.current.width + deltaX));
    const newHeight = Math.max(minSize.height, Math.min(maxSize.height, startPos.current.height + deltaY));

    setSize({ width: newWidth, height: newHeight });
    setActivePreset(null); // Clear preset when manually resizing
  }, [isResizing, minSize, maxSize]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const applyPreset = (preset: typeof presets[0]) => {
    setSize(preset.size);
    setActivePreset(preset.label);
  };

  // Floating button when collapsed
  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50
                   bg-gradient-to-r from-blue-600 to-blue-700
                   hover:from-blue-500 hover:to-blue-600
                   text-white px-4 py-3 rounded-l-xl shadow-lg
                   flex items-center gap-2 transition-all duration-200
                   border border-blue-500/30"
        title="Open 3D Viewer"
      >
        <Eye className="w-5 h-5" />
        <span className="text-sm font-medium">3D</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`relative flex flex-col ${className}`}
        style={{
          width: size.width,
          height: size.height,
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-3 py-2
                        bg-gradient-to-r from-slate-800/90 to-slate-700/90
                        backdrop-blur-md rounded-t-xl border-b border-white/10">
          {/* Title */}
          <span className="text-sm font-medium text-white/80">{title}</span>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Size Presets */}
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition-all duration-200
                           ${activePreset === preset.label
                             ? 'bg-blue-600 text-white'
                             : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                           }`}
                title={`Size ${preset.label}`}
              >
                {preset.label}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Close Button */}
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-md bg-white/10 text-white/60
                         hover:bg-red-500/80 hover:text-white
                         transition-all duration-200 flex items-center justify-center"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gradient-to-b from-slate-800/80 to-slate-900/80
                        backdrop-blur-md rounded-b-xl overflow-hidden
                        border border-t-0 border-white/10">
          {children}
        </div>

        {/* Resize Handle - Bottom Left Corner */}
        <div
          onMouseDown={handleResizeStart}
          className={`absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize
                      flex items-center justify-center
                      bg-slate-700/80 rounded-tr-lg rounded-bl-xl
                      border-t border-r border-white/10
                      hover:bg-blue-600/80 transition-colors duration-200
                      ${isResizing ? 'bg-blue-600/80' : ''}`}
          title="Drag to resize"
        >
          <GripHorizontal className="w-3 h-3 text-white/60 rotate-45" />
        </div>

        {/* Size indicator while resizing */}
        {isResizing && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg
                          font-mono pointer-events-none">
            {Math.round(size.width)} × {Math.round(size.height)}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
