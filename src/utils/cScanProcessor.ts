/**
 * C-Scan Image Processor
 * מערכת מתקדמת לעיבוד תמונות C-Scan עם זיהוי פגמים אוטומטי
 */

import chroma from 'chroma-js';

export interface ProcessingOptions {
  width: number;
  height: number;
  threshold?: number | null;
  smoothing?: boolean;
  normalize?: boolean;
  colormap?: 'jet' | 'viridis' | 'grayscale' | 'thermal';
}

export interface Defect {
  id: string;
  center: [number, number];
  area: number;
  maxAmplitude: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export class CScanProcessor {
  private colorMaps: Record<string, chroma.Scale>;

  constructor() {
    this.colorMaps = {
      jet: this.createJetColormap(),
      viridis: this.createViridisColormap(),
      grayscale: this.createGrayscaleColormap(),
      thermal: this.createThermalColormap()
    };
  }

  /**
   * יצירת מפת צבעים Jet (כחול -> ציאן -> צהוב -> אדום)
   */
  private createJetColormap(): chroma.Scale {
    return chroma.scale([
      '#000083', '#0000FF', '#00FFFF',
      '#FFFF00', '#FF0000', '#830000'
    ]).mode('lab');
  }

  /**
   * יצירת מפת צבעים Viridis
   */
  private createViridisColormap(): chroma.Scale {
    return chroma.scale([
      '#440154', '#414487', '#2a788e',
      '#22a884', '#7ad151', '#fde725'
    ]).mode('lab');
  }

  /**
   * יצירת מפת צבעים Grayscale
   */
  private createGrayscaleColormap(): chroma.Scale {
    return chroma.scale(['#000000', '#FFFFFF']).mode('lab');
  }

  /**
   * יצירת מפת צבעים Thermal (שחור -> סגול -> אדום -> צהוב -> לבן)
   */
  private createThermalColormap(): chroma.Scale {
    return chroma.scale([
      '#000000', '#4B0082', '#FF0000',
      '#FFFF00', '#FFFFFF'
    ]).mode('lab');
  }

  /**
   * עיבוד נתונים גולמיים לתמונה מעובדת
   */
  processRawData(rawData: number[][], options: ProcessingOptions): HTMLCanvasElement {
    const {
      width,
      height,
      threshold = null,
      smoothing = false,
      normalize = true,
      colormap = 'jet'
    } = options;

    let processedData = rawData.map(row => [...row]);

    // נרמול נתונים
    if (normalize) {
      processedData = this.normalizeData(processedData);
    }

    // החלקה
    if (smoothing) {
      processedData = this.applyGaussianSmoothing(processedData);
    }

    // סף
    if (threshold !== null) {
      processedData = processedData.map(row =>
        row.map(val => val > threshold ? 1 : 0)
      );
    }

    // המרה לתמונה
    return this.dataToImage(processedData, width, height, colormap);
  }

  /**
   * נרמול נתונים לטווח 0-1
   */
  private normalizeData(data: number[][]): number[][] {
    const flatData = data.flat();
    const min = Math.min(...flatData);
    const max = Math.max(...flatData);
    const range = max - min;

    if (range === 0) return data;

    return data.map(row =>
      row.map(val => (val - min) / range)
    );
  }

  /**
   * המרת נתונים לתמונה עם מפת צבעים
   */
  private dataToImage(
    data: number[][],
    width: number,
    height: number,
    colormapName: string
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const imageData = ctx.createImageData(width, height);
    const scale = this.colorMaps[colormapName];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dataY = Math.floor((y / height) * data.length);
        const dataX = Math.floor((x / width) * (data[0]?.length || 0));
        const value = data[dataY]?.[dataX] || 0;
        const color = scale(value).rgb();
        const index = (y * width + x) * 4;

        imageData.data[index] = color[0];
        imageData.data[index + 1] = color[1];
        imageData.data[index + 2] = color[2];
        imageData.data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * החלקת Gaussian על הנתונים
   */
  private applyGaussianSmoothing(data: number[][]): number[][] {
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;

    const smoothed: number[][] = [];
    for (let y = 0; y < data.length; y++) {
      smoothed[y] = [];
      for (let x = 0; x < (data[0]?.length || 0); x++) {
        if (y === 0 || y === data.length - 1 || x === 0 || x === (data[0]?.length || 0) - 1) {
          smoothed[y][x] = data[y][x];
          continue;
        }

        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += (data[y + ky]?.[x + kx] || 0) * kernel[ky + 1][kx + 1];
          }
        }
        smoothed[y][x] = sum / kernelSum;
      }
    }

    return smoothed;
  }

  /**
   * זיהוי אוטומטי של פגמים בנתונים
   */
  detectDefects(data: number[][], threshold: number): Defect[] {
    const defects: Defect[] = [];
    const visited = Array(data.length).fill(null).map(() =>
      Array(data[0]?.length || 0).fill(false)
    );

    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < (data[0]?.length || 0); x++) {
        if ((data[y]?.[x] || 0) > threshold && !visited[y][x]) {
          const defect = this.floodFill(data, x, y, threshold, visited);
          if (defect.pixels.length > 5) { // מינימום גודל פגם
            defects.push({
              id: `DEF-${String(defects.length + 1).padStart(3, '0')}`,
              center: defect.center,
              area: defect.pixels.length,
              maxAmplitude: defect.maxValue,
              bounds: defect.bounds
            });
          }
        }
      }
    }

    return defects;
  }

  /**
   * אלגוריתם Flood Fill לזיהוי אזור פגום
   */
  private floodFill(
    data: number[][],
    startX: number,
    startY: number,
    threshold: number,
    visited: boolean[][]
  ): {
    pixels: [number, number][];
    center: [number, number];
    maxValue: number;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
  } {
    const pixels: [number, number][] = [];
    const stack: [number, number][] = [[startX, startY]];
    let maxValue = 0;
    let sumX = 0, sumY = 0;
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      
      const [cx, cy] = current;

      if (
        cx < 0 || cx >= (data[0]?.length || 0) ||
        cy < 0 || cy >= data.length ||
        visited[cy][cx] || (data[cy]?.[cx] || 0) <= threshold
      ) {
        continue;
      }

      visited[cy][cx] = true;
      pixels.push([cx, cy]);
      maxValue = Math.max(maxValue, data[cy]?.[cx] || 0);
      sumX += cx;
      sumY += cy;
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);

      // בדוק שכנים (4-connectivity)
      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }

    return {
      pixels,
      center: [sumX / pixels.length, sumY / pixels.length],
      maxValue,
      bounds: { minX, maxX, minY, maxY }
    };
  }

  /**
   * יצירת נתוני C-Scan סימולטיביים
   */
  generateSimulatedData(
    rows: number,
    cols: number,
    defectCount: number = 2
  ): number[][] {
    const data: number[][] = [];

    // רעש רקע
    for (let y = 0; y < rows; y++) {
      data[y] = [];
      for (let x = 0; x < cols; x++) {
        data[y][x] = Math.random() * 0.2; // רעש נמוך
      }
    }

    // הוספת פגמים
    for (let i = 0; i < defectCount; i++) {
      const centerX = Math.floor(Math.random() * cols);
      const centerY = Math.floor(Math.random() * rows);
      const radius = 5 + Math.floor(Math.random() * 10);
      const amplitude = 0.6 + Math.random() * 0.4;

      for (let y = Math.max(0, centerY - radius); y < Math.min(rows, centerY + radius); y++) {
        for (let x = Math.max(0, centerX - radius); x < Math.min(cols, centerX + radius); x++) {
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (distance < radius) {
            data[y][x] = amplitude * (1 - distance / radius);
          }
        }
      }
    }

    return data;
  }
}
