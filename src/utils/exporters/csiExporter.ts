// @ts-nocheck
/**
 * CSI (Control Software Interface) Exporter
 *
 * Exports inspection setup data in a format compatible with
 * ScanMaster's CSI software for automated UT scanning systems.
 *
 * CSI Format: XML-based configuration file containing:
 * - Part definition (geometry, dimensions, material)
 * - Equipment configuration (transducer, pulser, receiver)
 * - Calibration settings (block, DAC/TCG)
 * - Scan plan (patches, directions, parameters)
 *
 * NOTE: This is a skeleton implementation. The actual XML schema
 * should be confirmed with the ScanMaster CSI software team.
 */

import { BaseExporter } from './baseExporter';
import type { ExportData, ExportOptions, ExportResult } from '@/types/exportTypes';
import type {
  PatchPlan,
  DACCurve,
  TCGCurve,
  OEMVendor,
  OEMRuleSet,
  ScannerKinematics,
  PatchValidationResult,
} from '@/types/techniqueSheet';

// ============================================================================
// CSI Export Types
// ============================================================================

export interface CSIExportData extends ExportData {
  patchPlan?: PatchPlan;
  dacCurve?: DACCurve;
  tcgCurve?: TCGCurve;
  oemVendor?: OEMVendor;
  oemRules?: OEMRuleSet;
  scannerKinematics?: ScannerKinematics;
  patchValidation?: PatchValidationResult[];
  fallbackRules?: {
    alternatives: Array<{
      blockType: string;
      priority: number;
      requiresApproval: boolean;
      reason: string;
      limitations?: string[];
    }>;
    fallbackChain: string;
  };
}

export interface CSIExportOptions extends ExportOptions {
  csiVersion?: string;
  includeComments?: boolean;
  compressOutput?: boolean;
}

// ============================================================================
// CSI XML Generator
// ============================================================================

class CSIXMLBuilder {
  private lines: string[] = [];
  private indentLevel = 0;
  private includeComments: boolean;

  constructor(includeComments = true) {
    this.includeComments = includeComments;
  }

  /**
   * Add XML declaration
   */
  declaration(version = '1.0', encoding = 'UTF-8'): this {
    this.lines.push(`<?xml version="${version}" encoding="${encoding}"?>`);
    return this;
  }

  /**
   * Add comment
   */
  comment(text: string): this {
    if (this.includeComments) {
      this.lines.push(`${this.indent()}<!-- ${text} -->`);
    }
    return this;
  }

  /**
   * Open an element
   */
  openElement(name: string, attributes?: Record<string, string | number | boolean>): this {
    let line = `${this.indent()}<${name}`;
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          line += ` ${key}="${this.escapeXML(String(value))}"`;
        }
      }
    }
    line += '>';
    this.lines.push(line);
    this.indentLevel++;
    return this;
  }

  /**
   * Close an element
   */
  closeElement(name: string): this {
    this.indentLevel--;
    this.lines.push(`${this.indent()}</${name}>`);
    return this;
  }

  /**
   * Add a self-closing element
   */
  element(name: string, attributes?: Record<string, string | number | boolean>): this {
    let line = `${this.indent()}<${name}`;
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          line += ` ${key}="${this.escapeXML(String(value))}"`;
        }
      }
    }
    line += '/>';
    this.lines.push(line);
    return this;
  }

  /**
   * Add an element with text content
   */
  textElement(name: string, content: string | number | boolean, attributes?: Record<string, string | number | boolean>): this {
    let line = `${this.indent()}<${name}`;
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          line += ` ${key}="${this.escapeXML(String(value))}"`;
        }
      }
    }
    line += `>${this.escapeXML(String(content))}</${name}>`;
    this.lines.push(line);
    return this;
  }

  /**
   * Add CDATA section
   */
  cdata(content: string): this {
    this.lines.push(`${this.indent()}<![CDATA[${content}]]>`);
    return this;
  }

  /**
   * Build final XML string
   */
  build(): string {
    return this.lines.join('\n');
  }

  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// ============================================================================
// CSI Exporter Class
// ============================================================================

export class CSIExporter extends BaseExporter {
  private csiData: CSIExportData;
  private csiOptions: CSIExportOptions;

  constructor(data: CSIExportData, options: CSIExportOptions) {
    super(data, options);
    this.csiData = data;
    this.csiOptions = options;
  }

  /**
   * Export to CSI format
   */
  async export(): Promise<ExportResult> {
    try {
      const xml = this.buildCSIXML();
      const blob = new Blob([xml], { type: 'application/xml' });

      const filename = this.generateFilename();

      // Trigger download
      this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSI export failed',
      };
    }
  }

  /**
   * Build the CSI XML document
   */
  private buildCSIXML(): string {
    const xml = new CSIXMLBuilder(this.csiOptions.includeComments ?? true);
    const version = this.csiOptions.csiVersion || '1.0';

    xml.declaration();
    xml.comment('ScanMaster CSI Setup File');
    xml.comment(`Generated by Scan-Master on ${new Date().toISOString()}`);
    xml.comment('Format version: ' + version);

    xml.openElement('CSISetup', {
      version,
      generator: 'Scan-Master',
      generatedDate: new Date().toISOString(),
    });

    // Part Section
    this.buildPartSection(xml);

    // Material Section
    this.buildMaterialSection(xml);

    // Equipment Section
    this.buildEquipmentSection(xml);

    // Calibration Section
    this.buildCalibrationSection(xml);

    // Scan Plan Section
    this.buildScanPlanSection(xml);

    // Acceptance Criteria Section
    this.buildAcceptanceSection(xml);

    // Documentation Section
    this.buildDocumentationSection(xml);

    // OEM Rules Section (NEW)
    this.buildOEMSection(xml);

    // Scanner Kinematics Section (NEW)
    this.buildKinematicsSection(xml);

    // Validation Results Section (NEW)
    this.buildValidationSection(xml);

    xml.closeElement('CSISetup');

    return xml.build();
  }

  /**
   * Build Part section
   */
  private buildPartSection(xml: CSIXMLBuilder): void {
    const { inspectionSetup } = this.csiData;

    xml.comment('Part Definition');
    xml.openElement('Part');

    xml.textElement('PartNumber', inspectionSetup.partNumber || '');
    xml.textElement('PartName', inspectionSetup.partName || '');
    xml.textElement('GeometryType', inspectionSetup.partType || '');

    xml.openElement('Dimensions', { unit: 'mm' });
    xml.textElement('Thickness', inspectionSetup.partThickness || 0);
    xml.textElement('Length', inspectionSetup.partLength || 0);
    xml.textElement('Width', inspectionSetup.partWidth || 0);

    if (inspectionSetup.diameter) {
      xml.textElement('OuterDiameter', inspectionSetup.diameter);
    }
    if (inspectionSetup.innerDiameter) {
      xml.textElement('InnerDiameter', inspectionSetup.innerDiameter);
    }
    if (inspectionSetup.wallThickness) {
      xml.textElement('WallThickness', inspectionSetup.wallThickness);
    }

    xml.closeElement('Dimensions');

    if (inspectionSetup.drawingNumber) {
      xml.textElement('DrawingNumber', inspectionSetup.drawingNumber);
    }

    xml.closeElement('Part');
  }

  /**
   * Build Material section
   */
  private buildMaterialSection(xml: CSIXMLBuilder): void {
    const { inspectionSetup } = this.csiData;

    xml.comment('Material Properties');
    xml.openElement('Material');

    xml.textElement('Type', inspectionSetup.material || '');
    xml.textElement('Specification', inspectionSetup.materialSpec || '');

    if (inspectionSetup.acousticVelocity) {
      xml.textElement('Velocity', inspectionSetup.acousticVelocity, { unit: 'm/s' });
    }
    if (inspectionSetup.materialDensity) {
      xml.textElement('Density', inspectionSetup.materialDensity, { unit: 'kg/m3' });
    }
    if (inspectionSetup.heatTreatment) {
      xml.textElement('HeatTreatment', inspectionSetup.heatTreatment);
    }

    xml.closeElement('Material');
  }

  /**
   * Build Equipment section
   */
  private buildEquipmentSection(xml: CSIXMLBuilder): void {
    const { equipment } = this.csiData;

    xml.comment('Equipment Configuration');
    xml.openElement('Equipment');

    // Instrument
    xml.openElement('Instrument');
    xml.textElement('Manufacturer', equipment.manufacturer || '');
    xml.textElement('Model', equipment.model || '');
    xml.textElement('SerialNumber', equipment.serialNumber || '');
    if (equipment.softwareVersion) {
      xml.textElement('SoftwareVersion', equipment.softwareVersion);
    }
    xml.closeElement('Instrument');

    // Transducer
    xml.openElement('Transducer');
    xml.textElement('Type', equipment.transducerType || '');
    xml.textElement('Frequency', equipment.frequency || '', { unit: 'MHz' });
    xml.textElement('Diameter', equipment.transducerDiameter || 0, { unit: 'mm' });
    if (equipment.probeModel) {
      xml.textElement('Model', equipment.probeModel);
    }

    // Phased Array specific
    if (equipment.numberOfElements) {
      xml.textElement('NumberOfElements', equipment.numberOfElements);
    }
    if (equipment.elementPitch) {
      xml.textElement('ElementPitch', equipment.elementPitch, { unit: 'mm' });
    }
    xml.closeElement('Transducer');

    // Wedge
    if (equipment.wedgeModel || equipment.wedgeType) {
      xml.openElement('Wedge');
      if (equipment.wedgeModel) {
        xml.textElement('Model', equipment.wedgeModel);
      }
      if (equipment.wedgeType) {
        xml.textElement('Type', equipment.wedgeType);
      }
      xml.closeElement('Wedge');
    }

    // Couplant
    xml.textElement('Couplant', equipment.couplant || '');

    // Linearity
    xml.openElement('Linearity');
    xml.textElement('Vertical', equipment.verticalLinearity || 0, { unit: '%' });
    xml.textElement('Horizontal', equipment.horizontalLinearity || 0, { unit: '%' });
    xml.closeElement('Linearity');

    // Resolution
    xml.openElement('Resolution');
    xml.textElement('EntrySurface', equipment.entrySurfaceResolution || 0, { unit: 'mm' });
    xml.textElement('BackSurface', equipment.backSurfaceResolution || 0, { unit: 'mm' });
    xml.closeElement('Resolution');

    xml.closeElement('Equipment');
  }

  /**
   * Build Calibration section
   */
  private buildCalibrationSection(xml: CSIXMLBuilder): void {
    const { calibration, dacCurve, tcgCurve } = this.csiData;

    xml.comment('Calibration Settings');
    xml.openElement('Calibration');

    // Block
    xml.openElement('Block');
    xml.textElement('Type', calibration.standardType || '');
    xml.textElement('Material', calibration.referenceMaterial || '');
    xml.textElement('SerialNumber', calibration.blockSerialNumber || '');
    xml.textElement('Dimensions', calibration.blockDimensions || '');
    xml.textElement('LastCalibrationDate', calibration.lastCalibrationDate || '');
    xml.textElement('MetalTravel', calibration.metalTravelDistance || 0, { unit: 'mm' });
    xml.closeElement('Block');

    // FBH Table
    if (calibration.fbhHoles && calibration.fbhHoles.length > 0) {
      // Filter out null/undefined holes
      const validHoles = calibration.fbhHoles.filter(
        (hole): hole is NonNullable<typeof hole> => hole != null
      );

      if (validHoles.length > 0) {
        xml.openElement('FBHTable');
        for (const hole of validHoles) {
          xml.element('Hole', {
            id: hole.id || '',
            diameter: hole.diameterInch || 0,
            diameterMm: hole.diameterMm || 0,
            metalTravel: hole.metalTravelH || 0,
            blockHeight: hole.blockHeightE || 0,
          });
        }
        xml.closeElement('FBHTable');
      }
    }

    // DAC Curve
    if (dacCurve) {
      xml.comment('Distance-Amplitude Correction Curve');
      xml.openElement('DACCurve', { id: dacCurve.id || '' });
      xml.textElement('Name', dacCurve.name || '');
      xml.textElement('Frequency', dacCurve.frequency || 0, { unit: 'MHz' });
      xml.textElement('Attenuation', dacCurve.attenuation || 0, { unit: 'dB/mm' });
      xml.textElement('RecordingLevel', dacCurve.recordingLevel || 0, { unit: '%DAC' });
      xml.textElement('RejectionLevel', dacCurve.rejectionLevel || 0, { unit: '%DAC' });

      if (dacCurve.points && dacCurve.points.length > 0) {
        const validPoints = dacCurve.points.filter(
          (point): point is NonNullable<typeof point> => point != null
        );
        if (validPoints.length > 0) {
          xml.openElement('Points');
          for (const point of validPoints) {
            xml.element('Point', {
              depth: point.depth || 0,
              amplitude: point.amplitude || 0,
              gain: point.gain || 0,
              fbhSize: point.fbhSize || '',
            });
          }
          xml.closeElement('Points');
        }
      }

      xml.closeElement('DACCurve');
    }

    // TCG Curve
    if (tcgCurve) {
      xml.comment('Time-Corrected Gain Curve');
      xml.openElement('TCGCurve', { id: tcgCurve.id || '' });
      xml.textElement('TargetAmplitude', tcgCurve.targetAmplitude || 0, { unit: '%FSH' });
      xml.textElement('GateStart', tcgCurve.gateStart || 0, { unit: 'us' });
      xml.textElement('GateEnd', tcgCurve.gateEnd || 0, { unit: 'us' });
      xml.textElement('TotalCorrection', tcgCurve.totalCorrection || 0, { unit: 'dB' });

      if (tcgCurve.points && tcgCurve.points.length > 0) {
        const validPoints = tcgCurve.points.filter(
          (point): point is NonNullable<typeof point> => point != null
        );
        if (validPoints.length > 0) {
          xml.openElement('Points');
          for (const point of validPoints) {
            xml.element('Point', {
              time: point.time || 0,
              gain: point.gain || 0,
            });
          }
          xml.closeElement('Points');
        }
      }

      xml.closeElement('TCGCurve');
    }

    xml.closeElement('Calibration');
  }

  /**
   * Build Scan Plan section
   */
  private buildScanPlanSection(xml: CSIXMLBuilder): void {
    const { scanParameters, patchPlan } = this.csiData;

    xml.comment('Scan Plan and Parameters');
    xml.openElement('ScanPlan');

    // Global Parameters
    xml.openElement('Parameters');
    xml.textElement('Method', scanParameters.scanMethod || '');
    xml.textElement('Type', scanParameters.scanType || '');
    xml.textElement('Speed', scanParameters.scanSpeed || 0, { unit: 'mm/s' });
    xml.textElement('Index', scanParameters.scanIndex || 0, { unit: 'mm' });
    xml.textElement('Coverage', scanParameters.coverage || 0, { unit: '%' });
    xml.textElement('Pattern', scanParameters.scanPattern || '');

    if (scanParameters.waterPath) {
      xml.textElement('WaterPath', scanParameters.waterPath, { unit: 'mm' });
    }

    xml.textElement('PRF', scanParameters.pulseRepetitionRate || 0, { unit: 'Hz' });
    xml.textElement('Gain', scanParameters.gainSettings || '');
    xml.textElement('GateSettings', scanParameters.alarmGateSettings || '');

    // Phased Array settings
    if (scanParameters.phasedArray) {
      xml.openElement('PhasedArray');
      if (scanParameters.phasedArray.refractedAngleStart !== undefined) {
        xml.textElement('AngleStart', scanParameters.phasedArray.refractedAngleStart, { unit: 'deg' });
      }
      if (scanParameters.phasedArray.refractedAngleEnd !== undefined) {
        xml.textElement('AngleEnd', scanParameters.phasedArray.refractedAngleEnd, { unit: 'deg' });
      }
      if (scanParameters.phasedArray.aperture) {
        xml.textElement('Aperture', scanParameters.phasedArray.aperture);
      }
      xml.closeElement('PhasedArray');
    }

    xml.closeElement('Parameters');

    // Patches
    if (patchPlan && patchPlan.patches && patchPlan.patches.length > 0) {
      // Filter out null/undefined patches
      const validPatches = patchPlan.patches.filter(
        (patch): patch is NonNullable<typeof patch> => patch != null && patch.geometry != null
      );

      if (validPatches.length > 0) {
        xml.comment('Generated Patch Plan');
        xml.openElement('Patches', {
          count: patchPlan.totalPatches || validPatches.length,
          totalCoverage: patchPlan.totalCoverage || 0,
          estimatedTime: patchPlan.estimatedTotalTime || 0,
        });

        for (const patch of validPatches) {
          xml.openElement('Patch', {
            id: patch.id || '',
            name: patch.name || '',
            sequence: patch.sequence || 0,
          });

          xml.textElement('Strategy', patch.scanStrategy || '');
          xml.textElement('Direction', patch.direction || '');
          xml.textElement('WaveMode', patch.waveMode || '');
          xml.textElement('Speed', patch.scanSpeed || 0, { unit: 'mm/s' });
          xml.textElement('Index', patch.scanIndex || 0, { unit: 'mm' });
          xml.textElement('Coverage', patch.coverage || 0, { unit: '%' });
          xml.textElement('Passes', patch.passes || 0);
          xml.textElement('EstimatedTime', patch.estimatedTime || 0, { unit: 's' });

          // Geometry
          xml.openElement('Geometry', { shape: patch.geometry.shape || 'unknown' });
          if (patch.geometry.x !== undefined) xml.textElement('X', patch.geometry.x);
          if (patch.geometry.y !== undefined) xml.textElement('Y', patch.geometry.y);
          if (patch.geometry.width !== undefined) xml.textElement('Width', patch.geometry.width);
          if (patch.geometry.height !== undefined) xml.textElement('Height', patch.geometry.height);
          if (patch.geometry.startAngle !== undefined) xml.textElement('StartAngle', patch.geometry.startAngle);
          if (patch.geometry.endAngle !== undefined) xml.textElement('EndAngle', patch.geometry.endAngle);
          if (patch.geometry.innerRadius !== undefined) xml.textElement('InnerRadius', patch.geometry.innerRadius);
          if (patch.geometry.outerRadius !== undefined) xml.textElement('OuterRadius', patch.geometry.outerRadius);
          xml.closeElement('Geometry');

          xml.closeElement('Patch');
        }

        xml.closeElement('Patches');
      }
    }

    xml.closeElement('ScanPlan');
  }

  /**
   * Build Acceptance Criteria section
   */
  private buildAcceptanceSection(xml: CSIXMLBuilder): void {
    const { acceptanceCriteria } = this.csiData;

    xml.comment('Acceptance Criteria');
    xml.openElement('AcceptanceCriteria');

    xml.textElement('Class', acceptanceCriteria.acceptanceClass || '');
    xml.textElement('SingleDiscontinuity', acceptanceCriteria.singleDiscontinuity || '');
    xml.textElement('MultipleDiscontinuities', acceptanceCriteria.multipleDiscontinuities || '');
    xml.textElement('LinearDiscontinuity', acceptanceCriteria.linearDiscontinuity || '');
    xml.textElement('BackReflectionLoss', acceptanceCriteria.backReflectionLoss || 0, { unit: 'dB' });
    xml.textElement('NoiseLevel', acceptanceCriteria.noiseLevel || '');

    if (acceptanceCriteria.specialRequirements) {
      xml.openElement('SpecialRequirements');
      xml.cdata(acceptanceCriteria.specialRequirements);
      xml.closeElement('SpecialRequirements');
    }

    xml.closeElement('AcceptanceCriteria');
  }

  /**
   * Build Documentation section
   */
  private buildDocumentationSection(xml: CSIXMLBuilder): void {
    const { documentation, standard } = this.csiData;

    xml.comment('Documentation and Approvals');
    xml.openElement('Documentation');

    xml.textElement('Standard', standard || '');

    xml.openElement('Inspector');
    xml.textElement('Name', documentation.inspectorName || '');
    xml.textElement('Certification', documentation.inspectorCertification || '');
    xml.textElement('Level', documentation.inspectorLevel || '');
    xml.textElement('Organization', documentation.certifyingOrganization || '');
    xml.closeElement('Inspector');

    xml.textElement('InspectionDate', documentation.inspectionDate || '');
    xml.textElement('ProcedureNumber', documentation.procedureNumber || '');
    xml.textElement('DrawingReference', documentation.drawingReference || '');
    xml.textElement('Revision', documentation.revision || '');

    if (documentation.customerName) {
      xml.textElement('Customer', documentation.customerName);
    }
    if (documentation.purchaseOrder) {
      xml.textElement('PurchaseOrder', documentation.purchaseOrder);
    }

    if (documentation.additionalNotes) {
      xml.openElement('Notes');
      xml.cdata(documentation.additionalNotes);
      xml.closeElement('Notes');
    }

    xml.closeElement('Documentation');
  }

  /**
   * Build OEM Rules section (NEW)
   */
  private buildOEMSection(xml: CSIXMLBuilder): void {
    const { oemVendor, oemRules, fallbackRules } = this.csiData;

    if (!oemVendor && !oemRules) return;

    xml.comment('OEM-Specific Configuration');
    xml.openElement('OEMConfiguration');

    xml.textElement('Vendor', oemVendor || 'GENERIC');

    if (oemRules) {
      xml.textElement('SpecReference', oemRules.specReference);
      xml.textElement('Version', oemRules.version);
      xml.textElement('EffectiveDate', oemRules.effectiveDate);

      // Coverage requirements
      xml.openElement('CoverageRequirements');
      xml.textElement('MinCoverage', oemRules.coverageRequirements.minCoverage, { unit: '%' });
      xml.textElement('OverlapRequired', oemRules.coverageRequirements.overlapRequirement, { unit: '%' });
      xml.textElement('EdgeExclusion', oemRules.coverageRequirements.edgeExclusion, { unit: 'mm' });
      xml.textElement('CriticalZoneMultiplier', oemRules.coverageRequirements.criticalZoneMultiplier);
      xml.closeElement('CoverageRequirements');

      // Calibration rules
      xml.openElement('CalibrationRules');
      xml.textElement('Interval', oemRules.calibrationRules.interval, { unit: 'hours' });
      xml.textElement('TemperatureCheckRequired', oemRules.calibrationRules.temperatureCheckRequired);
      xml.textElement('DACRequired', oemRules.calibrationRules.dacCurveRequired);
      xml.textElement('TCGRequired', oemRules.calibrationRules.tcgRequired);
      xml.textElement('MaxTransferCorrection', oemRules.calibrationRules.transferCorrectionMax, { unit: 'dB' });
      xml.closeElement('CalibrationRules');

      // Warnings
      if (oemRules.warnings.length > 0) {
        xml.openElement('Warnings');
        for (const warning of oemRules.warnings) {
          xml.textElement('Warning', warning);
        }
        xml.closeElement('Warnings');
      }
    }

    // Fallback rules for calibration blocks
    if (fallbackRules && fallbackRules.alternatives) {
      xml.comment('Calibration Block Fallback Options');
      xml.openElement('FallbackRules');
      xml.textElement('FallbackChain', fallbackRules.fallbackChain || '');

      // Filter out null/undefined alternatives
      const validAlternatives = fallbackRules.alternatives.filter(
        (alt): alt is NonNullable<typeof alt> => alt != null
      );

      for (const alt of validAlternatives) {
        xml.openElement('Alternative', {
          priority: alt.priority || 0,
          requiresApproval: alt.requiresApproval || false,
        });
        xml.textElement('BlockType', alt.blockType || '');
        xml.textElement('Reason', alt.reason || '');
        if (alt.limitations && alt.limitations.length > 0) {
          const validLimitations = alt.limitations.filter(
            (lim): lim is string => lim != null && typeof lim === 'string'
          );
          if (validLimitations.length > 0) {
            xml.openElement('Limitations');
            for (const lim of validLimitations) {
              xml.textElement('Limitation', lim);
            }
            xml.closeElement('Limitations');
          }
        }
        xml.closeElement('Alternative');
      }

      xml.closeElement('FallbackRules');
    }

    xml.closeElement('OEMConfiguration');
  }

  /**
   * Build Scanner Kinematics section (NEW)
   */
  private buildKinematicsSection(xml: CSIXMLBuilder): void {
    const { scannerKinematics } = this.csiData;

    if (!scannerKinematics) return;

    xml.comment('Scanner Machine Constraints');
    xml.openElement('ScannerKinematics');

    xml.textElement('MaxScanSpeed', scannerKinematics.maxScanSpeed, { unit: 'mm/s' });
    xml.textElement('MaxIndexSpeed', scannerKinematics.maxIndexSpeed, { unit: 'mm/s' });
    if (scannerKinematics.maxRotationSpeed) {
      xml.textElement('MaxRotationSpeed', scannerKinematics.maxRotationSpeed, { unit: 'rpm' });
    }

    xml.textElement('MaxAcceleration', scannerKinematics.maxAcceleration, { unit: 'mm/s2' });
    xml.textElement('MaxDeceleration', scannerKinematics.maxDeceleration, { unit: 'mm/s2' });

    xml.openElement('TravelLimits', { unit: 'mm' });
    xml.textElement('X', scannerKinematics.maxTravel.x);
    xml.textElement('Y', scannerKinematics.maxTravel.y);
    xml.textElement('Z', scannerKinematics.maxTravel.z);
    xml.closeElement('TravelLimits');

    if (scannerKinematics.minRadius) {
      xml.textElement('MinRadius', scannerKinematics.minRadius, { unit: 'mm' });
    }
    if (scannerKinematics.maxIncidenceAngle) {
      xml.textElement('MaxIncidenceAngle', scannerKinematics.maxIncidenceAngle, { unit: 'deg' });
    }

    if (scannerKinematics.tankDimensions) {
      xml.openElement('TankDimensions', { unit: 'mm' });
      xml.textElement('Length', scannerKinematics.tankDimensions.length);
      xml.textElement('Width', scannerKinematics.tankDimensions.width);
      xml.textElement('Depth', scannerKinematics.tankDimensions.depth);
      xml.closeElement('TankDimensions');
    }

    xml.closeElement('ScannerKinematics');
  }

  /**
   * Build Validation Results section (NEW)
   */
  private buildValidationSection(xml: CSIXMLBuilder): void {
    const { patchValidation } = this.csiData;

    if (!patchValidation || patchValidation.length === 0) return;

    const allValid = patchValidation.every(v => v.isValid);
    const errorCount = patchValidation.filter(v => !v.isValid).length;
    const warningCount = patchValidation.filter(v => v.warnings.length > 0).length;

    xml.comment('Pre-flight Validation Results');
    xml.openElement('ValidationResults', {
      status: allValid ? 'PASS' : 'FAIL',
      errorCount,
      warningCount,
    });

    for (const result of patchValidation) {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        xml.openElement('PatchValidation', {
          patchId: result.patchId,
          valid: result.isValid,
        });

        xml.textElement('DwellTimeOk', result.dwellTimeOk);
        xml.textElement('IncidenceAngleOk', result.incidenceAngleOk);
        xml.textElement('CoverageOk', result.coverageOk);
        xml.textElement('SpeedOk', result.speedOk);

        if (result.errors.length > 0) {
          xml.openElement('Errors');
          for (const err of result.errors) {
            xml.textElement('Error', err);
          }
          xml.closeElement('Errors');
        }

        if (result.warnings.length > 0) {
          xml.openElement('Warnings');
          for (const warn of result.warnings) {
            xml.textElement('Warning', warn);
          }
          xml.closeElement('Warnings');
        }

        xml.closeElement('PatchValidation');
      }
    }

    xml.closeElement('ValidationResults');
  }

  /**
   * Generate filename for CSI export
   */
  private generateFilename(): string {
    const { inspectionSetup } = this.csiData;
    const partNumber = inspectionSetup.partNumber || 'setup';
    const date = new Date().toISOString().split('T')[0];
    return `${partNumber}_${date}.csi`;
  }

  /**
   * Trigger download of blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Export to CSI format (convenience function)
 */
export async function exportToCSI(
  data: CSIExportData,
  options?: Partial<CSIExportOptions>
): Promise<ExportResult> {
  const fullOptions: CSIExportOptions = {
    format: 'csi',
    template: 'standard',
    csiVersion: '1.0',
    includeComments: true,
    compressOutput: false,
    ...options,
  };

  const exporter = new CSIExporter(data, fullOptions);
  return exporter.export();
}

/**
 * Generate CSI XML string without downloading
 */
export function generateCSIXML(data: CSIExportData): string {
  const exporter = new CSIExporter(data, {
    format: 'csi',
    template: 'standard',
    csiVersion: '1.0',
    includeComments: true,
  });

  // Access private method for testing/preview
  return (exporter as unknown as { buildCSIXML: () => string }).buildCSIXML();
}
