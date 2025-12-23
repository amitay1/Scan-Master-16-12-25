/**
 * useExportCaptures - Smart hook for managing export captures
 *
 * Automatically captures visual elements when tabs change,
 * caches results, and provides ready-to-use images for export.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  smartCapture,
  preCaptureForExport,
  clearCaptureCache,
  type CaptureOptions,
  type CaptureResult,
} from '@/utils/export/captureEngine';

export interface ExportCaptures {
  technicalDrawing?: string;
  calibrationBlockDiagram?: string;
  threeDView?: string;
  scanDirectionsView?: string;
}

export interface UseExportCapturesReturn {
  captures: ExportCaptures;
  isCapturing: boolean;
  lastCaptureTime: number | null;
  captureTechnicalDrawing: () => Promise<boolean>;
  captureCalibrationBlock: () => Promise<boolean>;
  capture3DView: () => Promise<boolean>;
  captureScanDirections: () => Promise<boolean>;
  captureAll: () => Promise<ExportCaptures>;
  clearCaptures: () => void;
  hasAllRequiredCaptures: boolean;
}

const TECHNICAL_DRAWING_SELECTORS = [
  '#technical-drawing-canvas',
  'canvas#technical-drawing-canvas',
  '[data-testid="technical-drawing"] canvas',
  '.technical-drawing-container canvas',
  '.real-time-drawing canvas',
  '.real-time-technical-drawing canvas',
];

const CALIBRATION_BLOCK_SELECTORS = [
  '#calibration-block-svg',
  'svg#calibration-block-svg',
  '[data-testid="calibration-block-diagram"]',
  'svg[data-testid="calibration-block-diagram"]',
  '.fbh-straight-beam-drawing',
  'svg.fbh-straight-beam-drawing',
  '.angle-beam-drawing',
  'svg.angle-beam-drawing',
  '.calibration-drawing svg',
  '.calibration-tab svg',
];

const THREE_D_SELECTORS = [
  '.react-three-fiber canvas',
  '[data-testid="3d-viewer"] canvas',
  '.three-d-viewer canvas',
  'canvas[data-engine="three.js"]',
];

const SCAN_DIRECTIONS_SELECTORS = [
  '#scan-directions-canvas',
  '[data-testid="scan-directions-canvas"]',
  '.inspection-plan-viewer canvas',
];

export function useExportCaptures(): UseExportCapturesReturn {
  const [captures, setCaptures] = useState<ExportCaptures>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<number | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Capture technical drawing
  const captureTechnicalDrawing = useCallback(async (): Promise<boolean> => {
    setIsCapturing(true);

    try {
      // Wait for canvas to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await smartCapture(TECHNICAL_DRAWING_SELECTORS, {
        scale: 3, // Higher scale for better quality
        quality: 1.0, // Maximum quality
        backgroundColor: 'white',
      });

      if (result.success && result.data) {
        console.log('Technical drawing captured successfully');
        setCaptures(prev => ({ ...prev, technicalDrawing: result.data }));
        setLastCaptureTime(Date.now());
        return true;
      }

      console.warn('Technical drawing capture failed:', result.error);
      return false;
    } catch (error) {
      console.error('Error capturing technical drawing:', error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Capture calibration block diagram
  const captureCalibrationBlock = useCallback(async (): Promise<boolean> => {
    setIsCapturing(true);

    try {
      // Wait longer for SVG to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await smartCapture(CALIBRATION_BLOCK_SELECTORS, {
        scale: 3, // Higher scale for better quality
        quality: 1.0, // Maximum quality
        backgroundColor: 'white',
        maxWidth: 1800,
        maxHeight: 1200,
      });

      if (result.success && result.data) {
        console.log('Calibration block diagram captured successfully');
        setCaptures(prev => ({ ...prev, calibrationBlockDiagram: result.data }));
        setLastCaptureTime(Date.now());
        return true;
      }

      console.warn('Calibration block capture failed:', result.error);
      return false;
    } catch (error) {
      console.error('Error capturing calibration block:', error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Capture 3D view
  const capture3DView = useCallback(async (): Promise<boolean> => {
    setIsCapturing(true);

    try {
      const result = await smartCapture(THREE_D_SELECTORS, {
        scale: 1.5,
        quality: 0.9,
      });

      if (result.success && result.data) {
        setCaptures(prev => ({ ...prev, threeDView: result.data }));
        setLastCaptureTime(Date.now());
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error capturing 3D view:', error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Capture scan directions drawing (from InspectionPlanViewer)
  const captureScanDirections = useCallback(async (): Promise<boolean> => {
    setIsCapturing(true);

    try {
      // Wait for canvas to fully render with all arrows
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await smartCapture(SCAN_DIRECTIONS_SELECTORS, {
        scale: 3, // Higher scale for better quality
        quality: 1.0, // Maximum quality
        backgroundColor: 'white',
      });

      if (result.success && result.data) {
        console.log('Scan directions captured successfully');
        setCaptures(prev => ({ ...prev, scanDirectionsView: result.data }));
        setLastCaptureTime(Date.now());
        return true;
      }

      console.warn('Scan directions capture failed:', result.error);
      return false;
    } catch (error) {
      console.error('Error capturing scan directions:', error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Capture all at once
  const captureAllFn = useCallback(async (): Promise<ExportCaptures> => {
    setIsCapturing(true);

    try {
      // Pre-capture with built-in function
      const preCaptures = await preCaptureForExport();

      const newCaptures: ExportCaptures = {
        technicalDrawing: preCaptures.technicalDrawing,
        calibrationBlockDiagram: preCaptures.calibrationBlock,
        threeDView: preCaptures.threeDView,
      };

      // Remove undefined values
      Object.keys(newCaptures).forEach(key => {
        if (newCaptures[key as keyof ExportCaptures] === undefined) {
          delete newCaptures[key as keyof ExportCaptures];
        }
      });

      setCaptures(newCaptures);
      setLastCaptureTime(Date.now());

      return newCaptures;
    } catch (error) {
      console.error('Error capturing all:', error);
      return {};
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Clear all captures
  const clearCaptures = useCallback(() => {
    setCaptures({});
    setLastCaptureTime(null);
    clearCaptureCache();
  }, []);

  // Check if we have required captures
  const hasAllRequiredCaptures = Boolean(captures.technicalDrawing);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, []);

  return {
    captures,
    isCapturing,
    lastCaptureTime,
    captureTechnicalDrawing,
    captureCalibrationBlock,
    capture3DView,
    captureScanDirections,
    captureAll: captureAllFn,
    clearCaptures,
    hasAllRequiredCaptures,
  };
}

/**
 * Hook for auto-capturing when a specific tab becomes active
 */
export function useAutoCaptureOnTab(
  activeTab: string,
  targetTab: string,
  captureFunction: () => Promise<boolean>,
  delay: number = 500
): void {
  const hasCapuredRef = useRef(false);

  useEffect(() => {
    if (activeTab === targetTab && !hasCapuredRef.current) {
      const timer = setTimeout(async () => {
        const success = await captureFunction();
        if (success) {
          hasCapuredRef.current = true;
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [activeTab, targetTab, captureFunction, delay]);

  // Reset when tab changes away
  useEffect(() => {
    if (activeTab !== targetTab) {
      hasCapuredRef.current = false;
    }
  }, [activeTab, targetTab]);
}

export default useExportCaptures;
