import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Packer } from 'docx';
import { quickFillPresets } from '../src/data/quickFillPresets.ts';
import {
  buildTechniqueSheetWordDocument,
  type TechniqueSheetWordExportData,
} from '../src/utils/export/TechniqueSheetWord.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const toDataUri = async (filePath: string): Promise<string | undefined> => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.svg'
          ? 'image/svg+xml'
          : 'image/png';
    const buffer = await fs.readFile(filePath);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return undefined;
  }
};

const main = async () => {
  const preset =
    quickFillPresets.find((candidate) => candidate.inspectionSetup.partNumber === 'LG-787-CYL-001') ??
    quickFillPresets[0];

  if (!preset) {
    throw new Error('No quick-fill preset available for Word preview generation.');
  }

  const extractedMediaDir = path.join(
    repoRoot,
    'tmp',
    'docs',
    'provided_docx_review',
    'extracted_media',
    'white_bg'
  );

  const exportData: TechniqueSheetWordExportData = {
    standard: preset.standard,
    inspectionSetup: preset.inspectionSetup,
    equipment: preset.equipment,
    calibration: preset.calibration,
    scanParameters: preset.scanParameters,
    acceptanceCriteria: {
      ...preset.acceptanceCriteria,
      includeStandardNotesInReport: true,
      standardNotes:
        preset.acceptanceCriteria.standardNotes ||
        'Landing gear cylinder inspection requires full axial and circumferential coverage with documented shear-wave follow-up on the OD and bore surfaces.',
    },
    documentation: preset.documentation,
    scanDetails: preset.scanDetails,
    scanPlan: preset.scanPlan,
    capturedDrawing: await toDataUri(path.join(extractedMediaDir, '0697603b5c2db67c13f556ec8812d2574fa814b5.png')),
    calibrationBlockDiagram: await toDataUri(path.join(extractedMediaDir, '4d8e126b88c93940115c2609f97b684ac26e9794.png')),
    scanDirectionsDrawing: await toDataUri(path.join(extractedMediaDir, '00cf98a5f6f37196ddfb7b2fd7be789194e283ec.png')),
  };

  const { document } = buildTechniqueSheetWordDocument(exportData, {
    companyName: 'Scan Master',
    companyLogo: await toDataUri(path.join(extractedMediaDir, 'b740530610c44e264f0960248ef655b7c2ed222b.png')),
    showLogoOnEveryPage: true,
  });

  const outputDir = path.join(repoRoot, 'output', 'doc');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'LG-787-CYL-001_TechniqueSheet_2026-03-21-redesigned.docx');
  const buffer = await Packer.toBuffer(document);
  await fs.writeFile(outputPath, buffer);

  console.log(outputPath);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
