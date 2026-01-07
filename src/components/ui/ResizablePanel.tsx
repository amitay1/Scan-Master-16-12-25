import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, GripHorizontal, ZoomIn, ZoomOut, Move, Maximize2, Minimize2 } from 'lucide-react';
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

// Get saved position from localStorage
const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem('viewer3DPosition');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch { /* ignore parse errors */ }
  return null;
};

// Save position to localStorage
const savePosition = (position: { x: number; y: number }) => {
  try {
    localStorage.setItem('viewer3DPosition', JSON.stringify(position));
  } catch { /* ignore storage errors */ }
};

// Get saved floating mode from localStorage
const getSavedFloatingMode = () => {
  try {
    const saved = localStorage.getItem('viewer3DFloating');
    return saved === 'true';
  } catch { /* ignore storage errors */ }
  return false;
};

// Save floating mode to localStorage
const saveFloatingMode = (isFloating: boolean) => {
  try {
    localStorage.setItem('viewer3DFloating', isFloating.toString());
  } catch { /* ignore storage errors */ }
};

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
  maxSize = { width: 800, height: 800 },
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
  
  // Floating mode state - allows user to drag the panel anywhere
  const [isFloating, setIsFloating] = useState(() => getSavedFloatingMode());
  const [position, setPosition] = useState(() => {
    const saved = getSavedPosition();
    if (saved) return saved;
    // Default position - right side, vertically centered
    return { 
      x: typeof window !== 'undefined' ? window.innerWidth - 450 : 500, 
      y: typeof window !== 'undefined' ? Math.max(100, (window.innerHeight - 500) / 2) : 150 
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
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
      // Keep floating panel in viewport when window resizes
      if (isFloating) {
        setPosition(prev => ({
          x: Math.max(0, Math.min(prev.x, window.innerWidth - 100)),
          y: Math.max(0, Math.min(prev.y, window.innerHeight - 100))
        }));
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    // Also call immediately to ensure proper sizing on mount
    handleWindowResize();
    
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [minSize, maxSize, isFloating]);

  // Drag handlers for floating mode
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isFloating) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  }, [isFloating, position]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    const newX = Math.max(0, Math.min(dragStartPos.current.posX + deltaX, window.innerWidth - 100));
    const newY = Math.max(0, Math.min(dragStartPos.current.posY + deltaY, window.innerHeight - 100));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Save position when drag ends
      savePosition(position);
    }
  }, [isDragging, position]);

  // Listen for drag events
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Toggle floating mode
  const toggleFloatingMode = useCallback(() => {
    const newFloating = !isFloating;
    setIsFloating(newFloating);
    saveFloatingMode(newFloating);
    
    // Set initial position when entering floating mode
    if (newFloating) {
      const newPos = {
        x: window.innerWidth - size.width - 20,
        y: Math.max(80, (window.innerHeight - size.height) / 2)
      };
      setPosition(newPos);
      savePosition(newPos);
    }
  }, [isFloating, size]);

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

    // For floating mode, resize from bottom-right corner
    const deltaX = isFloating ? e.clientX - startPos.current.x : startPos.current.x - e.clientX;
    const deltaY = e.clientY - startPos.current.y;

    const newWidth = startPos.current.width + deltaX;
    const newHeight = startPos.current.height + deltaY;

    // Clamp to both min/max and viewport bounds
    setSize(clampSizeToViewport({ width: newWidth, height: newHeight }, minSize, maxSize));
    setActivePreset(null); // Clear preset when manually resizing
  }, [isResizing, minSize, maxSize, isFloating]);

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

  // Zoom in - increase size by 20%
  const handleZoomIn = useCallback(() => {
    const newSize = {
      width: size.width * 1.2,
      height: size.height * 1.2
    };
    setSize(clampSizeToViewport(newSize, minSize, maxSize));
    setActivePreset(null);
  }, [size, minSize, maxSize]);

  // Zoom out - decrease size by 20%
  const handleZoomOut = useCallback(() => {
    const newSize = {
      width: size.width * 0.8,
      height: size.height * 0.8
    };
    setSize(clampSizeToViewport(newSize, minSize, maxSize));
    setActivePreset(null);
  }, [size, minSize, maxSize]);

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
        className={`${isFloating ? 'fixed z-[100]' : 'relative'} flex flex-col flex-shrink-0 ${className}`}
        style={{
          width: size.width,
          height: size.height,
          minWidth: minSize.width,
          minHeight: minSize.height,
          maxWidth: isFloating ? undefined : '100%',
          maxHeight: isFloating ? undefined : 'calc(100vh - 80px)',
          userSelect: isResizing || isDragging ? 'none' : 'auto',
          ...(isFloating ? { left: position.x, top: position.y } : {})
        }}
      >
        {/* Panel Header - Draggable in floating mode */}
        <div 
          className={`flex items-center justify-between px-3 py-2
                        bg-gradient-to-r from-slate-800/90 to-slate-700/90
                        backdrop-blur-md rounded-t-xl border-b border-white/10
                        min-w-0 overflow-visible
                        ${isFloating ? 'cursor-move' : ''}`}
          onMouseDown={handleDragStart}
        >
          {/* Title and drag indicator */}
          <div className="flex items-center gap-2 flex-shrink">
            {isFloating && (
              <Move className="w-4 h-4 text-white/40" />
            )}
            <span className="text-sm font-medium text-white/80 truncate">{title}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
            {/* Float/Dock Toggle Button */}
            <button
              onClick={toggleFloatingMode}
              className={`w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center
                         ${isFloating 
                           ? 'bg-green-600/80 text-white hover:bg-green-500/80' 
                           : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                         }`}
              title={isFloating ? "עגן לצד (Dock)" : "מצב צף - גרור לכל מקום (Float)"}
            >
              {isFloating ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Zoom Out Button */}
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 rounded-md bg-white/10 text-white/60
                         hover:bg-white/20 hover:text-white
                         transition-all duration-200 flex items-center justify-center"
              title="הקטן תצוגה"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

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
                title={`גודל ${preset.label}`}
              >
                {preset.label}
              </button>
            ))}

            {/* Zoom In Button */}
            <button
              onClick={handleZoomIn}
              className="w-7 h-7 rounded-md bg-white/10 text-white/60
                         hover:bg-white/20 hover:text-white
                         transition-all duration-200 flex items-center justify-center"
              title="הגדל תצוגה"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

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
                        backdrop-blur-md rounded-b-xl
                        border border-t-0 border-white/10 relative"
             style={{ overflow: 'hidden' }}>
          <div className="absolute inset-0">
            {children}
          </div>
        </div>

        {/* Resize Handle - Bottom Right Corner for floating, Bottom Left for docked */}
        <div
          onMouseDown={handleResizeStart}
          className={`absolute bottom-0 ${isFloating ? 'right-0 cursor-se-resize rounded-tl-lg rounded-br-xl border-t border-l' : 'left-0 cursor-sw-resize rounded-tr-lg rounded-bl-xl border-t border-r'} w-6 h-6
                      flex items-center justify-center
                      bg-slate-700/80 border-white/10
                      hover:bg-blue-600/80 transition-colors duration-200
                      ${isResizing ? 'bg-blue-600/80' : ''}`}
          title="גרור לשינוי גודל"
        >
          <GripHorizontal className="w-3 h-3 text-white/60 rotate-45" />
        </div>

        {/* Size indicator while resizing or dragging */}
        {(isResizing || isDragging) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg
                          font-mono pointer-events-none z-10">
            {isResizing ? `${Math.round(size.width)} × ${Math.round(size.height)}` : `X: ${Math.round(position.x)}, Y: ${Math.round(position.y)}`}
          </div>
        )}

        {/* Floating mode indicator */}
        {isFloating && !isDragging && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white/30 shadow-lg" 
               title="מצב צף - גרור את הכותרת להזזה" />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
