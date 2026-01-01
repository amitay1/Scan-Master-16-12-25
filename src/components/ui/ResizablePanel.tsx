import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, GripHorizontal } from 'lucide-react';
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

// Check if running in Electron (desktop app)
const isElectron = () => {
  return !!(window as any).electron || 
         (typeof navigator === 'object' && 
          typeof navigator.userAgent === 'string' && 
          navigator.userAgent.indexOf('Electron') >= 0);
};

// Helper function to clamp panel size within viewport bounds
const clampSizeToViewport = (
  size: { width: number; height: number },
  minSize: { width: number; height: number },
  maxSize: { width: number; height: number }
) => {
  // More aggressive padding for Electron desktop app
  const isDesktopApp = isElectron();
  const horizontalPadding = isDesktopApp ? 60 : 80; // Reduced padding for better desktop alignment
  const verticalPadding = isDesktopApp ? 140 : 120;  // Reduced to improve vertical positioning

  const maxViewportWidth = Math.max(minSize.width, window.innerWidth - horizontalPadding);
  const maxViewportHeight = Math.max(minSize.height, window.innerHeight - verticalPadding);

  return {
    width: Math.max(minSize.width, Math.min(maxSize.width, maxViewportWidth, size.width)),
    height: Math.max(minSize.height, Math.min(maxSize.height, maxViewportHeight, size.height))
  };
};

// Size presets configuration - optimized for desktop app
const getPresetSizes = () => {
  const isDesktopApp = isElectron();
  if (isDesktopApp) {
    return {
      S: { width: 320, height: 360 },
      M: { width: 420, height: 480 },
      L: { width: 520, height: 600 },
    };
  }
  return {
    S: { width: 250, height: 280 },
    M: { width: 400, height: 450 },
    L: { width: 550, height: 550 },
  };
};

// Static reference for initial load
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
  presets: customPresets
}: ResizablePanelProps) => {
  // Get dynamic presets based on environment (desktop vs web)
  const dynamicPresets = getPresetSizes();
  const presets = customPresets || [
    { label: "S", size: dynamicPresets.S },
    { label: "M", size: dynamicPresets.M },
    { label: "L", size: dynamicPresets.L },
  ];
  
  // Get default size from settings
  const { settings } = useSettings();
  const settingsDefaultSize = dynamicPresets[settings.viewer.viewer3DDefaultSize as keyof typeof dynamicPresets] || dynamicPresets.M;
  const initialSize = defaultSize || settingsDefaultSize;
  
  const [size, setSize] = useState(() => clampSizeToViewport(initialSize, minSize, maxSize));
  const [isResizing, setIsResizing] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(settings.viewer.viewer3DDefaultSize || "M");
  const panelRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Update size when settings change or component mounts
  useEffect(() => {
    if (!defaultSize) {
      const currentPresets = getPresetSizes();
      const newSize = currentPresets[settings.viewer.viewer3DDefaultSize as keyof typeof currentPresets] || currentPresets.M;
      setSize(clampSizeToViewport(newSize, minSize, maxSize));
      setActivePreset(settings.viewer.viewer3DDefaultSize || "M");
    }
  }, [settings.viewer.viewer3DDefaultSize, defaultSize, minSize, maxSize]);

  // Handle window resize to keep panel within bounds
  useEffect(() => {
    const handleWindowResize = () => {
      setSize(prevSize => clampSizeToViewport(prevSize, minSize, maxSize));
    };
    
    window.addEventListener('resize', handleWindowResize);
    // Also call immediately to ensure proper sizing on mount
    handleWindowResize();
    
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [minSize, maxSize]);

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

    const newWidth = startPos.current.width + deltaX;
    const newHeight = startPos.current.height + deltaY;

    // Clamp to both min/max and viewport bounds
    setSize(clampSizeToViewport({ width: newWidth, height: newHeight }, minSize, maxSize));
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
    // Clamp preset size to viewport bounds
    setSize(clampSizeToViewport(preset.size, minSize, maxSize));
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
        className={`relative flex flex-col flex-shrink-0 z-30 ${className}`}
        style={{
          width: size.width,
          height: size.height,
          minWidth: minSize.width,
          minHeight: minSize.height,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 80px)',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-3 py-2
                        bg-gradient-to-r from-slate-800/90 to-slate-700/90
                        backdrop-blur-md rounded-t-xl border-b border-white/10
                        min-w-0 overflow-visible">
          {/* Title */}
          <span className="text-sm font-medium text-white/80 truncate flex-shrink">{title}</span>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
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
