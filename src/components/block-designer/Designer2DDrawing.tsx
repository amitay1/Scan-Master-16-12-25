/**
 * Designer 2D Drawing
 * Technical 2D drawing view that syncs with the 3D model
 * Includes isometric view for professional calibration block drawings
 */

import React, { useRef, useState, useEffect } from 'react';
import { useBlockDesigner } from '@/contexts/BlockDesignerContext';
import { IsometricDrawing } from './IsometricDrawing';

export function Designer2DDrawing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });

  const {
    blockShape,
    blockMaterial,
    holes,
    selectedHoleId,
    selectHole,
  } = useBlockDesigner();

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(400, rect.width),
          height: Math.max(200, rect.height),
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <IsometricDrawing
        blockShape={blockShape}
        holes={holes}
        material={blockMaterial}
        selectedHoleId={selectedHoleId}
        onHoleClick={selectHole}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}
