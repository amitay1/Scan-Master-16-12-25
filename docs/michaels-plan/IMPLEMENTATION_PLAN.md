# Automatic Setup Generation Software - Implementation Plan

## What is CSI? (Background)

**CSI = Control Software Interface** - ScanMaster's software that runs on the automated scanning system.

**Data Flow:**
```
Scan-Master (Our Software)    →    CSI Software    →    UT Scanner Machine
        ↓                              ↓                       ↓
Creates Setup + Techsheet      Executes the scan        Physical inspection
                               with parameters
```

**CSI Input Requirements:**
1. Part Definition - geometry, dimensions, material
2. Scan Plan - patches, directions, paths
3. UT Settings - frequency, gain, gates, PRF
4. Calibration Data - block type, DAC/TCG curves
5. Equipment Config - probe, wedge, cable

**Expected Export Format:** XML (most common in industry), to be confirmed with ScanMaster team.

---

## Executive Summary

This plan outlines the implementation of automatic UT inspection setup generation capabilities for Scan-Master, aligned with the requirements document for engine disc inspection (MRO/Production).

**Goal:** Reduce setup engineering time from days to hours by automating:
- OEM-specific rule application (GE/RR/PW)
- Automatic patch generation from geometry
- Complete techsheet generation
- CSI software export format

---

## Phase 1A: Foundation (Target: Mid 2026 Pilot)

### 1. OEM Rule Engine Framework

**New File:** `src/utils/oemRuleEngine.ts`

**Purpose:** Centralized rule engine that applies vendor-specific requirements.

```typescript
interface OEMRuleSet {
  vendorId: 'GE' | 'RR' | 'PW' | 'GENERIC';
  version: string;

  // Coverage rules
  coverageRequirements: {
    minCoverage: number;          // 95% for GE, 90% standard
    overlapRequirement: number;   // % overlap between passes
    criticalZoneMultiplier: number;
  };

  // Equipment constraints
  approvedTransducers: TransducerSpec[];
  approvedBlocks: CalibrationBlockSpec[];
  frequencyLimits: { min: number; max: number };

  // Calibration rules
  calibrationInterval: number;    // hours
  temperatureCheckRequired: boolean;
  dacCurveRequired: boolean;

  // Documentation
  templateId: string;
  requiredSections: string[];
  approvalLevels: number;
}
```

**Integration Point:**
- Extend `CalibrationRecommendationInput` (line 78 in calibrationRecommenderV2.ts)
- Add `oemVendor?: 'GE' | 'RR' | 'PW'` field
- Route to vendor-specific logic before standard defaults

**Files to Modify:**
- `src/utils/calibrationRecommenderV2.ts` - Add OEM rule lookup
- `src/types/techniqueSheet.ts` - Add OEM types
- `src/components/tabs/InspectionSetupTab.tsx` - Add OEM selector UI

---

### 2. PW (Pratt & Whitney) Rules Implementation

**New Folder:** `src/rules/pw/`

**Files:**
```
src/rules/pw/
├── index.ts              # Exports all PW rules
├── pwCoverageRules.ts    # Coverage requirements
├── pwBlockCatalog.ts     # Approved blocks list
├── pwTransducers.ts      # Approved probes
├── pwTemplates.ts        # Techsheet templates
└── pwValidation.ts       # PW-specific validation
```

**Key Rules to Implement:**
1. Rotor inspection coverage: 100% with 25% overlap
2. Bore inspection: Multi-angle requirement
3. Web inspection: Focused probe requirement
4. FBH sizing per PW P&W 127 spec

---

### 3. Automatic Patch Generator

**New File:** `src/utils/patchGenerator.ts`

**Purpose:** Given part geometry and coverage requirements, auto-generate optimal patches.

```typescript
interface PatchGeneratorInput {
  partGeometry: PartGeometry;
  dimensions: PartDimensions;
  coverageTarget: number;         // % (default 100)
  overlapRequired: number;        // % (from OEM rules)
  probeFootprint: {
    width: number;
    length: number;
  };
  excludedZones?: ExcludedZone[];  // Features, holes, edges
}

interface PatchPlan {
  patches: Patch[];
  totalCoverage: number;
  estimatedScanTime: number;
  warnings: string[];
}

interface Patch {
  id: string;
  geometry: PatchGeometry;       // Rectangle or arc segment
  scanStrategy: 'raster' | 'spiral' | 'circumferential';
  direction: ScanDirection;
  overlap: { previous: number; next: number };
  edgeHandling: 'extend' | 'stop' | 'reduced_speed';
}
```

**Algorithm Outline:**
1. Analyze part geometry → identify inspectable surfaces
2. Calculate beam footprint at each depth (using coverageCalculator.ts physics)
3. Divide surfaces into patches based on:
   - Max patch size (from OEM rules or default 150mm)
   - Surface curvature limits
   - Edge exclusion zones
4. Calculate scan paths per patch (raster default)
5. Validate total coverage meets target
6. Optimize for minimum scan time

**Leverage Existing:**
- `coverageCalculator.ts` lines 269-386 for beam physics
- `coverageCalculator.ts` lines 391-481 for optimization logic

---

### 4. CSI Export Format

**New File:** `src/utils/exporters/csiExporter.ts`

**Purpose:** Export setup data in ScanMaster CSI software format.

```typescript
class CSIExporter extends BaseExporter {
  export(): Promise<ExportResult> {
    // Generate CSI XML structure
    const xml = this.buildCSIXML();
    return this.saveAsFile(xml, '.csi');
  }

  private buildCSIXML(): string {
    // CSI format structure (to be defined with ScanMaster team)
  }
}
```

**CSI Format Structure (Preliminary):**
```xml
<CSISetup version="1.0">
  <Part>
    <PartNumber/>
    <Material velocity="" impedance=""/>
    <Geometry type="" dimensions=""/>
  </Part>
  <Equipment>
    <Transducer frequency="" diameter=""/>
    <Pulser/>
    <Receiver/>
  </Equipment>
  <Calibration>
    <Block type="" serialNumber=""/>
    <FBHTable/>
    <DACCurve/>
  </Calibration>
  <ScanPlan>
    <Patches/>
    <Directions/>
    <Parameters/>
  </ScanPlan>
</CSISetup>
```

**Files to Modify:**
- `src/utils/exporters/exportManager.ts` - Add CSI format routing
- `src/types/exportTypes.ts` - Add 'csi' to ExportFormat union
- `src/components/export/UnifiedExportDialog.tsx` - Add CSI option

---

### 5. DAC Curve Calculator

**New File:** `src/utils/dacCalculator.ts`

**Purpose:** Generate Distance-Amplitude Correction curves.

```typescript
interface DACInput {
  material: MaterialType;
  velocity: number;
  frequency: number;
  fbhSizes: number[];           // Reference hole sizes in inches
  depths: number[];             // Metal travel distances
  initialGain: number;          // dB
}

interface DACOutput {
  curvePoints: { depth: number; amplitude: number; gain: number }[];
  transferCorrection: number;   // dB adjustment for part vs block
  attenuation: number;          // dB/mm for material
  equation: string;             // For documentation
}

function calculateDACCurve(input: DACInput): DACOutput {
  // 1. Calculate reference amplitudes at each depth
  // 2. Apply distance-squared law: 20 * log10(d2/d1)
  // 3. Add material attenuation: α * Δd
  // 4. Generate smooth curve through points
}
```

**Physics Foundation:**
- Distance-squared law for amplitude decay
- Material attenuation coefficients (need data for Ti, Steel, Al, etc.)
- Near-field/far-field transition (already in coverageCalculator.ts lines 26-33)

---

## Phase 1B: Completion (Target: End 2026 Beta)

### 6. GE Rules Implementation

**New Folder:** `src/rules/ge/`

**Key GE-specific requirements:**
- GE P23TF22 spec compliance
- 95% coverage minimum
- Specific FBH table (different from AMS)
- Approved vendor list for transducers
- TCG requirement for certain part types

---

### 7. RR (Rolls-Royce) Rules Implementation

**New Folder:** `src/rules/rr/`

**Key RR-specific requirements:**
- RRP 59000 series compliance
- Phased array preferred for complex geometries
- Specific calibration block requirements
- Documentation in specific format

---

### 8. TCG (Time-Corrected Gain) Calculator

**New File:** `src/utils/tcgCalculator.ts`

```typescript
interface TCGInput {
  dacCurve: DACOutput;
  targetAmplitude: number;      // Usually 80% FSH
  gateRange: { start: number; end: number };
}

interface TCGOutput {
  gainPoints: { time: number; gain: number }[];
  totalCorrection: number;
  equation: string;
}
```

**Purpose:** Convert DAC curve to time-based gain correction for real-time inspection.

---

### 9. Scan Path Optimizer

**New File:** `src/utils/scanPathOptimizer.ts`

**Purpose:** Optimize scan sequence for minimum time while maintaining coverage.

```typescript
function optimizeScanPath(patches: Patch[]): OptimizedPath {
  // 1. TSP-style optimization for patch sequence
  // 2. Minimize probe repositioning
  // 3. Account for part rotation (circumferential scans)
  // 4. Consider safety limits (water path, collision)
}
```

---

## UI Integration Plan

### New Components

1. **OEM Selector** (in InspectionSetupTab)
   - Dropdown: Generic / GE / RR / PW
   - Auto-loads vendor rule set
   - Shows vendor-specific warnings

2. **Patch Plan Visualizer** (new section in ScanDetailsTab)
   - 2D grid overlay on geometry diagram
   - Color-coded patches with coverage %
   - Editable patch boundaries

3. **DAC Curve Display** (in CalibrationTab)
   - Graph component showing DAC/TCG curve
   - Exportable as image for techsheet

4. **CSI Export Option** (in UnifiedExportDialog)
   - New format button
   - Preview of CSI XML structure

---

## File Changes Summary

### New Files
| File | Purpose | Priority |
|------|---------|----------|
| `src/utils/oemRuleEngine.ts` | Central OEM rule dispatcher | P0 |
| `src/rules/pw/index.ts` | PW rule set | P0 |
| `src/utils/patchGenerator.ts` | Auto patch creation | P0 |
| `src/utils/exporters/csiExporter.ts` | CSI format export | P1 |
| `src/utils/dacCalculator.ts` | DAC curve generation | P1 |
| `src/rules/ge/index.ts` | GE rule set | P2 |
| `src/rules/rr/index.ts` | RR rule set | P2 |
| `src/utils/tcgCalculator.ts` | TCG calculation | P2 |
| `src/utils/scanPathOptimizer.ts` | Path optimization | P3 |

### Modified Files
| File | Changes | Priority |
|------|---------|----------|
| `src/types/techniqueSheet.ts` | Add OEM types, Patch types | P0 |
| `src/utils/calibrationRecommenderV2.ts` | Add OEM rule lookup | P0 |
| `src/components/tabs/InspectionSetupTab.tsx` | Add OEM selector | P0 |
| `src/utils/exporters/exportManager.ts` | Add CSI routing | P1 |
| `src/types/exportTypes.ts` | Add CSI format | P1 |
| `src/components/export/UnifiedExportDialog.tsx` | Add CSI option | P1 |
| `src/components/tabs/CalibrationTab.tsx` | Add DAC curve display | P1 |
| `src/components/tabs/ScanDetailsTab.tsx` | Add patch visualizer | P2 |

---

## Verification Plan

### Unit Tests
1. OEM rule engine returns correct rules for each vendor
2. Patch generator produces 100% coverage for simple geometries
3. DAC calculator matches manual calculations
4. CSI export validates against schema

### Integration Tests
1. End-to-end: Part input → OEM selection → Auto patches → Export
2. Calibration recommendation still works with OEM override
3. Export generates valid CSI file importable by CSI software

### Manual Testing
1. Create setup for PW engine disc (pilot part)
2. Verify techsheet matches manual PW setup
3. Import CSI file into ScanMaster CSI software
4. Validate scan coverage meets 100% requirement

---

## Current Status & Dependencies

### What We Have Now
- Full codebase with calibration, coverage, export systems
- Generic standards (AMS, ASTM, BS, MIL)
- Good physics foundation for patch planning

### What's Coming Soon (Dependencies)
| Item | Status | Needed For |
|------|--------|------------|
| PW Standards (P&W 127 etc.) | Coming soon | OEM rule engine |
| CSI Format Specification | TBD - need ScanMaster team input | CSI export |
| Pilot Part Numbers | Coming later | Validation testing |
| GE/RR Standards | Phase 2 | Full OEM support |

### Recommendation: Start with Infrastructure
Since OEM specs and CSI format are not yet available, we can start building:
1. **OEM Rule Engine framework** (generic, extensible)
2. **Patch Generator algorithm** (works with any spec)
3. **DAC/TCG calculators** (physics-based, standard-agnostic)

When PW specs arrive, we plug them into the framework.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CSI format not documented | Build generic XML exporter, adapt when spec arrives |
| OEM rules not yet available | Build extensible rule engine, populate later |
| Patch algorithm complexity | Start simple (rectangular grid), iterate |
| Performance with large parts | Use memoization, consider Web Workers |

---

## Success Criteria

1. **Time Reduction:** Setup generation < 1 hour (vs days)
2. **Coverage Validation:** 100% coverage with automatic patch planning
3. **OEM Compliance:** Pass PW pilot validation
4. **Traceability:** Part Rev → Spec Rev → Plan → Export linkage
5. **Export:** CSI file successfully imports into ScanMaster CSI software
