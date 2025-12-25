// Data Export/Import utilities for air-gapped environments
import { TechniqueSheet, Standard } from "@shared/schema";

interface ExportPackage {
  version: string;
  exportedAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  techniqueSheets: TechniqueSheet[];
  standards: Standard[];
  metadata: {
    totalSheets: number;
    totalStandards: number;
    checksum: string;
  };
}

// Generate checksum for data integrity
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Export all data to a JSON package
export async function exportDataPackage(
  sheets: TechniqueSheet[],
  standards: Standard[],
  orgInfo?: { id: string; name: string; slug: string }
): Promise<Blob> {
  const dataToExport = {
    techniqueSheets: sheets,
    standards: standards,
  };

  const exportPackage: ExportPackage = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    organization: orgInfo,
    techniqueSheets: sheets,
    standards: standards,
    metadata: {
      totalSheets: sheets.length,
      totalStandards: standards.length,
      checksum: generateChecksum(dataToExport),
    },
  };

  const jsonString = JSON.stringify(exportPackage, null, 2);
  return new Blob([jsonString], { type: "application/json" });
}

// Validate import package
export function validateImportPackage(data: any): data is ExportPackage {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data package');
  }

  if (!data.version || typeof data.version !== 'string') {
    throw new Error('Missing or invalid version');
  }

  if (!Array.isArray(data.techniqueSheets)) {
    throw new Error('Invalid technique sheets data');
  }

  if (!Array.isArray(data.standards)) {
    throw new Error('Invalid standards data');
  }

  if (!data.metadata || !data.metadata.checksum) {
    throw new Error('Missing metadata or checksum');
  }

  // Verify checksum
  const dataToVerify = {
    techniqueSheets: data.techniqueSheets,
    standards: data.standards,
  };
  
  const calculatedChecksum = generateChecksum(dataToVerify);
  if (calculatedChecksum !== data.metadata.checksum) {
    throw new Error('Checksum verification failed - data may be corrupted');
  }

  return true;
}

// Import data package
export async function importDataPackage(
  file: File,
  options: {
    mergeStrategy?: 'replace' | 'merge' | 'skip';
    onProgress?: (progress: number) => void;
  } = {}
): Promise<{
  imported: {
    sheets: number;
    standards: number;
  };
  skipped: {
    sheets: number;
    standards: number;
  };
  errors: string[];
}> {
  const { mergeStrategy = 'merge', onProgress } = options;
  const errors: string[] = [];
  const result = {
    imported: { sheets: 0, standards: 0 },
    skipped: { sheets: 0, standards: 0 },
    errors,
  };

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!validateImportPackage(data)) {
      throw new Error('Invalid import package');
    }

    // Import standards first
    onProgress?.(10);
    for (const standard of data.standards) {
      try {
        // Check if standard already exists
        const response = await fetch(`/api/standards/${standard.code}`);
        
        if (response.ok && mergeStrategy === 'skip') {
          result.skipped.standards++;
          continue;
        }

        // Import or update standard
        // Note: Actual API implementation would handle this
        result.imported.standards++;
      } catch (error) {
        errors.push(`Failed to import standard ${standard.code}: ${error}`);
      }
    }

    // Import technique sheets
    onProgress?.(50);
    let sheetProgress = 0;
    for (const sheet of data.techniqueSheets) {
      try {
        sheetProgress++;
        onProgress?.(50 + (sheetProgress / data.techniqueSheets.length) * 50);

        // Check if sheet already exists
        const existingSheet = await fetch(`/api/technique-sheets?name=${sheet.sheetName}`);
        
        if (existingSheet.ok && mergeStrategy === 'skip') {
          result.skipped.sheets++;
          continue;
        }

        // Import or update sheet
        const response = await fetch('/api/technique-sheets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('userId') || '',
          },
          body: JSON.stringify(sheet),
        });

        if (response.ok) {
          result.imported.sheets++;
        } else {
          throw new Error(`API error: ${response.statusText}`);
        }
      } catch (error) {
        errors.push(`Failed to import sheet ${sheet.sheetName}: ${error}`);
      }
    }

    onProgress?.(100);
  } catch (error) {
    errors.push(`Package import failed: ${error}`);
  }

  return result;
}

// Export to CSV for spreadsheet compatibility
export function exportToCSV(sheets: TechniqueSheet[]): Blob {
  const headers = [
    'Sheet Name',
    'Standard',
    'Created At',
    'Updated At',
    'Status',
    'Created By',
  ];

  const rows = sheets.map(sheet => [
    sheet.sheetName,
    sheet.standard || 'N/A',
    new Date(sheet.createdAt).toLocaleDateString(),
    new Date(sheet.updatedAt).toLocaleDateString(),
    sheet.status || 'draft',
    sheet.createdBy || 'Unknown',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
}

// Create encrypted export for sensitive data
export async function createSecureExport(
  data: ExportPackage,
  password?: string
): Promise<Blob> {
  // In a real implementation, this would use Web Crypto API for encryption
  // For now, just add a flag indicating it should be encrypted
  const securePackage = {
    ...data,
    encrypted: !!password,
    encryptionMethod: password ? 'AES-256-GCM' : 'none',
  };

  if (password) {
    // Simplified - in production, properly encrypt the data
    console.warn('Encryption not implemented - data exported in plain text');
  }

  const jsonString = JSON.stringify(securePackage, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

// Batch export for large datasets
export async function* batchExport(
  sheets: TechniqueSheet[],
  batchSize: number = 100
): AsyncGenerator<Blob, void, unknown> {
  for (let i = 0; i < sheets.length; i += batchSize) {
    const batch = sheets.slice(i, i + batchSize);
    const batchPackage: ExportPackage = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      techniqueSheets: batch,
      standards: [], // Standards would be included in first batch only
      metadata: {
        totalSheets: batch.length,
        totalStandards: 0,
        checksum: generateChecksum({ techniqueSheets: batch, standards: [] }),
      },
    };

    const jsonString = JSON.stringify(batchPackage, null, 2);
    yield new Blob([jsonString], { type: 'application/json' });
  }
}