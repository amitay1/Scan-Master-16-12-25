import { useEffect, useRef } from 'react';
import type { ScanData } from '@/types/inspectionReport';
import { CScanProcessor } from '@/utils/cScanProcessor';
import { TechnicalTableGenerator } from '@/utils/techniqueTableGenerator';

interface CScanGeneratorProps {
  scanData: ScanData;
  onImageGenerated: (imageDataUrl: string) => void;
}

export const CScanGenerator = ({ scanData, onImageGenerated }: CScanGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processor = useRef(new CScanProcessor());

  useEffect(() => {
    generateCScan();
  }, [scanData]);

  const generateCScan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high resolution
    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    // Background with border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Title bar
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('C-SCAN ULTRASONIC INSPECTION', 20, 38);

    // Main scan area
    const scanAreaX = 100;
    const scanAreaY = 100;
    const scanAreaWidth = 800;
    const scanAreaHeight = 600;

    // Parse dimensions from scan data
    const scanLength = parseInt(scanData.scanLength) || 360;
    const indexLength = parseInt(scanData.indexLength) || 360;
    const gain = parseFloat(scanData.gain || '50');
    
    // Generate simulated C-Scan data using advanced processor
    const dataRows = 100;
    const dataCols = 100;
    const rawData = processor.current.generateSimulatedData(dataRows, dataCols, 2);
    
    // Process with colormap and smoothing
    const processedCanvas = processor.current.processRawData(rawData, {
      width: scanAreaWidth,
      height: scanAreaHeight,
      smoothing: true,
      normalize: true,
      colormap: 'jet'
    });
    
    // Draw processed image to main canvas
    ctx.drawImage(processedCanvas, scanAreaX, scanAreaY, scanAreaWidth, scanAreaHeight);
    
    // Detect defects
    const defects = processor.current.detectDefects(rawData, 0.5);
    
    // Draw defect markers
    defects.forEach(defect => {
      const x = scanAreaX + (defect.center[0] / dataCols) * scanAreaWidth;
      const y = scanAreaY + (defect.center[1] / dataRows) * scanAreaHeight;
      
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
      
      // Defect label
      ctx.fillStyle = '#FF00FF';
      ctx.font = 'bold 10px Arial';
      ctx.fillText(defect.id, x + 12, y - 5);
    });

    // Border around scan area
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(scanAreaX, scanAreaY, scanAreaWidth, scanAreaHeight);

    // Grid lines with labels
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    
    const gridSpacing = 100;
    for (let i = 0; i <= scanAreaWidth; i += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(scanAreaX + i, scanAreaY);
      ctx.lineTo(scanAreaX + i, scanAreaY + scanAreaHeight);
      ctx.stroke();
      // X-axis labels
      const mmValue = Math.round((i / scanAreaWidth) * scanLength);
      ctx.fillText(mmValue + ' mm', scanAreaX + i - 15, scanAreaY + scanAreaHeight + 20);
    }
    for (let i = 0; i <= scanAreaHeight; i += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(scanAreaX, scanAreaY + i);
      ctx.lineTo(scanAreaX + scanAreaWidth, scanAreaY + i);
      ctx.stroke();
      // Y-axis labels
      const mmValue = Math.round((i / scanAreaHeight) * indexLength);
      ctx.fillText(mmValue + ' mm', scanAreaX - 50, scanAreaY + i + 5);
    }

    // Axis titles
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Scan Direction (mm)', scanAreaX + scanAreaWidth / 2 - 80, scanAreaY + scanAreaHeight + 45);
    ctx.save();
    ctx.translate(scanAreaX - 75, scanAreaY + scanAreaHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Index Direction (mm)', -80, 0);
    ctx.restore();

    // Color scale bar (vertical)
    const scaleBarWidth = 40;
    const scaleBarHeight = 400;
    const scaleBarX = width - 150;
    const scaleBarY = scanAreaY + 100;

    // Create vertical gradient
    const gradient = ctx.createLinearGradient(0, scaleBarY + scaleBarHeight, 0, scaleBarY);
    gradient.addColorStop(0, 'rgb(50, 80, 255)');
    gradient.addColorStop(0.2, 'rgb(0, 200, 255)');
    gradient.addColorStop(0.4, 'rgb(0, 255, 100)');
    gradient.addColorStop(0.6, 'rgb(255, 255, 0)');
    gradient.addColorStop(1, 'rgb(255, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(scaleBarX, scaleBarY, scaleBarWidth, scaleBarHeight);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(scaleBarX, scaleBarY, scaleBarWidth, scaleBarHeight);

    // Scale bar labels
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Amplitude', scaleBarX - 10, scaleBarY - 15);
    ctx.font = '13px Arial';
    ctx.fillText('100%', scaleBarX + scaleBarWidth + 10, scaleBarY + 5);
    ctx.fillText('80%', scaleBarX + scaleBarWidth + 10, scaleBarY + scaleBarHeight * 0.2 + 5);
    ctx.fillText('60%', scaleBarX + scaleBarWidth + 10, scaleBarY + scaleBarHeight * 0.4 + 5);
    ctx.fillText('40%', scaleBarX + scaleBarWidth + 10, scaleBarY + scaleBarHeight * 0.6 + 5);
    ctx.fillText('20%', scaleBarX + scaleBarWidth + 10, scaleBarY + scaleBarHeight * 0.8 + 5);
    ctx.fillText('0%', scaleBarX + scaleBarWidth + 10, scaleBarY + scaleBarHeight + 5);

    // Information panel
    const infoX = 100;
    const infoY = scanAreaY + scanAreaHeight + 80;
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(infoX, infoY, 800, 120);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(infoX, infoY, 800, 120);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('SCAN PARAMETERS', infoX + 15, infoY + 25);
    
    ctx.font = '13px Arial';
    ctx.fillText(`Scan Type: ${scanData.scanType}`, infoX + 15, infoY + 50);
    ctx.fillText(`Direction: ${scanData.direction}`, infoX + 15, infoY + 70);
    ctx.fillText(`Probe Type: ${scanData.probeType}`, infoX + 15, infoY + 90);
    
    ctx.fillText(`Gain: ${scanData.gain || 'N/A'} dB`, infoX + 300, infoY + 50);
    ctx.fillText(`Range: ${scanData.range || 'N/A'} mm`, infoX + 300, infoY + 70);
    ctx.fillText(`Elements: ${scanData.numberOfElements || 'N/A'}`, infoX + 300, infoY + 90);
    
    ctx.fillText(`Scan Length: ${scanLength} mm`, infoX + 550, infoY + 50);
    ctx.fillText(`Index Length: ${indexLength} mm`, infoX + 550, infoY + 70);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, infoX + 550, infoY + 90);

    // Convert to data URL and callback
    const imageDataUrl = canvas.toDataURL('image/png');
    onImageGenerated(imageDataUrl);
  };

  return (
    <div className="hidden">
      <canvas ref={canvasRef} />
    </div>
  );
};
