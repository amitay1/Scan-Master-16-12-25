import { useEffect, useRef } from 'react';
import { ScanData } from '@/types/inspectionReport';

interface AScanGeneratorProps {
  scanData: ScanData;
  onImageGenerated: (imageDataUrl: string) => void;
}

export const AScanGenerator = ({ scanData, onImageGenerated }: AScanGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateAScan();
  }, [scanData]);

  const generateAScan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high resolution
    const width = 1200;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Title bar
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('A-SCAN ULTRASONIC WAVEFORM', 20, 38);

    // Define waveform area
    const waveformX = 150;
    const waveformY = 120;
    const waveformWidth = 900;
    const waveformHeight = 500;

    // Parse scan parameters - use defaults if not available
    const frequency = 2.25; // Default frequency
    const gain = parseFloat(scanData.gain || '50');
    const range = parseFloat(scanData.range || '100');
    const velocity = parseFloat(scanData.velocity || '5900');

    // Background for waveform area
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(waveformX, waveformY, waveformWidth, waveformHeight);

    // Draw detailed grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (time divisions)
    const verticalDivisions = 10;
    for (let i = 0; i <= verticalDivisions; i++) {
      const x = waveformX + (i * waveformWidth / verticalDivisions);
      ctx.beginPath();
      ctx.moveTo(x, waveformY);
      ctx.lineTo(x, waveformY + waveformHeight);
      ctx.stroke();
      
      // Time labels
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      const timeValue = (i * range / verticalDivisions).toFixed(1);
      ctx.fillText(timeValue, x - 10, waveformY + waveformHeight + 20);
    }

    // Horizontal grid lines (amplitude divisions)
    const horizontalDivisions = 10;
    for (let i = 0; i <= horizontalDivisions; i++) {
      const y = waveformY + (i * waveformHeight / horizontalDivisions);
      ctx.beginPath();
      ctx.moveTo(waveformX, y);
      ctx.lineTo(waveformX + waveformWidth, y);
      ctx.stroke();
      
      // Amplitude labels
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      const ampValue = Math.round(100 - (i * 100 / horizontalDivisions));
      ctx.fillText(ampValue + '%', waveformX - 40, y + 5);
    }

    // Axis labels
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Time (μs) / Depth (mm)', waveformX + waveformWidth / 2 - 100, waveformY + waveformHeight + 45);
    
    ctx.save();
    ctx.translate(waveformX - 80, waveformY + waveformHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude (%)', -60, 0);
    ctx.restore();

    // Generate realistic A-Scan waveform
    const samples = 1000;
    const waveformData: number[] = [];
    
    // Baseline noise
    for (let i = 0; i < samples; i++) {
      waveformData[i] = (Math.random() - 0.5) * 0.02;
    }

    // Front wall echo (initial pulse)
    const frontWallPos = Math.floor(samples * 0.08);
    const frontWallWidth = 15;
    for (let i = -frontWallWidth; i < frontWallWidth; i++) {
      const pos = frontWallPos + i;
      if (pos >= 0 && pos < samples) {
        const envelope = Math.exp(-(i * i) / (frontWallWidth * frontWallWidth / 4));
        waveformData[pos] += envelope * Math.sin(i * frequency * 0.8) * 0.85;
      }
    }

    // Defect echo (if applicable - mid-range)
    const hasDefect = Math.random() > 0.3;
    let defectPosStored = 0;
    if (hasDefect) {
      const defectPos = Math.floor(samples * (0.3 + Math.random() * 0.3));
      defectPosStored = defectPos;
      const defectWidth = 20;
      const defectAmplitude = 0.4 + Math.random() * 0.3;
      for (let i = -defectWidth; i < defectWidth; i++) {
        const pos = defectPos + i;
        if (pos >= 0 && pos < samples) {
          const envelope = Math.exp(-(i * i) / (defectWidth * defectWidth / 4));
          waveformData[pos] += envelope * Math.sin(i * frequency * 0.9) * defectAmplitude;
        }
      }
    }

    // Back wall echo
    const backWallPos = Math.floor(samples * 0.85);
    const backWallWidth = 18;
    for (let i = -backWallWidth; i < backWallWidth; i++) {
      const pos = backWallPos + i;
      if (pos >= 0 && pos < samples) {
        const envelope = Math.exp(-(i * i) / (backWallWidth * backWallWidth / 4));
        waveformData[pos] += envelope * Math.sin(i * frequency) * 0.65;
      }
    }

    // Apply gain
    const gainFactor = Math.pow(10, (gain - 50) / 20);
    for (let i = 0; i < samples; i++) {
      waveformData[i] *= gainFactor;
      waveformData[i] = Math.max(-1, Math.min(1, waveformData[i]));
    }

    // Draw waveform
    ctx.strokeStyle = '#00aa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < samples; i++) {
      const x = waveformX + (i / samples) * waveformWidth;
      const y = waveformY + waveformHeight / 2 - (waveformData[i] * waveformHeight / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Fill under positive peaks
    ctx.fillStyle = 'rgba(0, 170, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(waveformX, waveformY + waveformHeight / 2);
    for (let i = 0; i < samples; i++) {
      const x = waveformX + (i / samples) * waveformWidth;
      const y = waveformY + waveformHeight / 2 - (waveformData[i] * waveformHeight / 2);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(waveformX + waveformWidth, waveformY + waveformHeight / 2);
    ctx.closePath();
    ctx.fill();

    // Mark significant echoes
    const markEcho = (position: number, label: string, color: string) => {
      const x = waveformX + (position / samples) * waveformWidth;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, waveformY);
      ctx.lineTo(x, waveformY + waveformHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(label, x + 5, waveformY + 20);
    };

    markEcho(frontWallPos, 'Front Wall', '#ff0000');
    if (hasDefect) {
      markEcho(defectPosStored, 'Indication', '#ff9900');
    }
    markEcho(backWallPos, 'Back Wall', '#0000ff');

    // Border around waveform
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(waveformX, waveformY, waveformWidth, waveformHeight);

    // Information panel
    const infoX = 150;
    const infoY = waveformY + waveformHeight + 70;
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(infoX, infoY, 900, 100);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(infoX, infoY, 900, 100);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('SCAN PARAMETERS', infoX + 15, infoY + 25);
    
    ctx.font = '13px Arial';
    ctx.fillText(`Scan Type: ${scanData.scanType}`, infoX + 15, infoY + 50);
    ctx.fillText(`Probe: ${scanData.probeType}`, infoX + 15, infoY + 70);
    
    ctx.fillText(`Frequency: ${frequency} MHz`, infoX + 320, infoY + 50);
    ctx.fillText(`Gain: ${gain} dB`, infoX + 320, infoY + 70);
    
    ctx.fillText(`Range: ${range} mm`, infoX + 570, infoY + 50);
    ctx.fillText(`Velocity: ${velocity} m/s`, infoX + 570, infoY + 70);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, infoX + 750, infoY + 50);

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