import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  TestLocationTiming,
  EnvironmentalConditions,
  CouplantDetails,
  ForgingDetails,
  SensitivitySettings,
  TransferCorrection,
  BweMonitoring,
  ScanCoverage,
  ZoningRequirements,
  ForgingType,
} from "@/types/inspectionReport";

interface AerospaceForgingTabProps {
  testLocationTiming: TestLocationTiming;
  environmentalConditions: EnvironmentalConditions;
  couplantDetails: CouplantDetails;
  forgingDetails: ForgingDetails;
  sensitivitySettings: SensitivitySettings;
  transferCorrection: TransferCorrection;
  bweMonitoring: BweMonitoring;
  scanCoverage: ScanCoverage;
  zoningRequirements: ZoningRequirements;
  onTestLocationChange: (data: TestLocationTiming) => void;
  onEnvironmentalChange: (data: EnvironmentalConditions) => void;
  onCouplantChange: (data: CouplantDetails) => void;
  onForgingChange: (data: ForgingDetails) => void;
  onSensitivityChange: (data: SensitivitySettings) => void;
  onTransferChange: (data: TransferCorrection) => void;
  onBweChange: (data: BweMonitoring) => void;
  onScanCoverageChange: (data: ScanCoverage) => void;
  onZoningChange: (data: ZoningRequirements) => void;
}

export const AerospaceForgingTab = ({
  testLocationTiming,
  environmentalConditions,
  couplantDetails,
  forgingDetails,
  sensitivitySettings,
  transferCorrection,
  bweMonitoring,
  scanCoverage,
  zoningRequirements,
  onTestLocationChange,
  onEnvironmentalChange,
  onCouplantChange,
  onForgingChange,
  onSensitivityChange,
  onTransferChange,
  onBweChange,
  onScanCoverageChange,
  onZoningChange,
}: AerospaceForgingTabProps) => {

  const forgingTypes: { value: ForgingType; label: string }[] = [
    { value: 'ring', label: 'Ring / Annular' },
    { value: 'disc', label: 'Disc / Pancake' },
    { value: 'bar', label: 'Bar / Rod' },
    { value: 'billet', label: 'Billet' },
    { value: 'shaft', label: 'Shaft' },
    { value: 'block', label: 'Block / Slab' },
    { value: 'custom', label: 'Custom Shape' },
  ];

  const fbhSizes = ['1/64"', '2/64"', '3/64"', '4/64"', '5/64"', '6/64"', '7/64"', '8/64"'];

  return (
    <div className="space-y-4 p-2">
      {/* Section Header */}
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Aerospace Forging UT Parameters (AMS-STD-2154 / ASTM E2375)
        </h2>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Required fields for aerospace wrought metal inspection documentation
        </p>
      </div>

      {/* Test Location & Timing */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Test Location & Timing</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Inspection Location</Label>
            <Select
              value={testLocationTiming.inspectionLocation}
              onValueChange={(v) => onTestLocationChange({ ...testLocationTiming, inspectionLocation: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plant">Plant / Factory</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="customer">Customer Site</SelectItem>
                <SelectItem value="lab">Laboratory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Facility Name</Label>
            <Input
              value={testLocationTiming.facilityName}
              onChange={(e) => onTestLocationChange({ ...testLocationTiming, facilityName: e.target.value })}
              placeholder="Facility name"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Test Date</Label>
            <Input
              type="date"
              value={testLocationTiming.testDate}
              onChange={(e) => onTestLocationChange({ ...testLocationTiming, testDate: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Start Time</Label>
            <Input
              type="time"
              value={testLocationTiming.testStartTime}
              onChange={(e) => onTestLocationChange({ ...testLocationTiming, testStartTime: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">End Time</Label>
            <Input
              type="time"
              value={testLocationTiming.testEndTime}
              onChange={(e) => onTestLocationChange({ ...testLocationTiming, testEndTime: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Duration</Label>
            <Input
              value={testLocationTiming.inspectionDuration}
              onChange={(e) => onTestLocationChange({ ...testLocationTiming, inspectionDuration: e.target.value })}
              placeholder="e.g., 2h 30m"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Environmental Conditions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Environmental Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Ambient Temperature</Label>
            <Input
              value={environmentalConditions.ambientTemperature}
              onChange={(e) => onEnvironmentalChange({ ...environmentalConditions, ambientTemperature: e.target.value })}
              placeholder="22°C"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Part Temperature</Label>
            <Input
              value={environmentalConditions.partTemperature}
              onChange={(e) => onEnvironmentalChange({ ...environmentalConditions, partTemperature: e.target.value })}
              placeholder="20°C"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Humidity (%)</Label>
            <Input
              value={environmentalConditions.humidity}
              onChange={(e) => onEnvironmentalChange({ ...environmentalConditions, humidity: e.target.value })}
              placeholder="45%"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Lighting (lux)</Label>
            <Input
              value={environmentalConditions.lightingConditions}
              onChange={(e) => onEnvironmentalChange({ ...environmentalConditions, lightingConditions: e.target.value })}
              placeholder="500 lux"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Couplant Details */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Couplant Details (AMS-STD-2154)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Couplant Type</Label>
            <Select
              value={couplantDetails.couplantType}
              onValueChange={(v) => onCouplantChange({ ...couplantDetails, couplantType: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="glycerin">Glycerin</SelectItem>
                <SelectItem value="gel">Ultrasonic Gel</SelectItem>
                <SelectItem value="oil">Oil</SelectItem>
                <SelectItem value="propylene-glycol">Propylene Glycol</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Manufacturer</Label>
            <Input
              value={couplantDetails.couplantManufacturer}
              onChange={(e) => onCouplantChange({ ...couplantDetails, couplantManufacturer: e.target.value })}
              placeholder="Manufacturer name"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Batch Number</Label>
            <Input
              value={couplantDetails.couplantBatchNumber || ''}
              onChange={(e) => onCouplantChange({ ...couplantDetails, couplantBatchNumber: e.target.value })}
              placeholder="Batch #"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Sulfur Content (Nickel Alloys)</Label>
            <Input
              value={couplantDetails.sulfurContent}
              onChange={(e) => onCouplantChange({ ...couplantDetails, sulfurContent: e.target.value })}
              placeholder="< 250 ppm"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Halide Content (Stainless)</Label>
            <Input
              value={couplantDetails.halideContent}
              onChange={(e) => onCouplantChange({ ...couplantDetails, halideContent: e.target.value })}
              placeholder="< 250 ppm"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Forging Details */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Forging Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Forging Type</Label>
            <Select
              value={forgingDetails.forgingType}
              onValueChange={(v) => onForgingChange({ ...forgingDetails, forgingType: v as ForgingType })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {forgingTypes.map(ft => (
                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Grain Flow Direction</Label>
            <Select
              value={forgingDetails.grainFlowDirection}
              onValueChange={(v) => onForgingChange({ ...forgingDetails, grainFlowDirection: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="axial">Axial</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="circumferential">Circumferential</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Forging Ratio</Label>
            <Input
              value={forgingDetails.forgingRatio}
              onChange={(e) => onForgingChange({ ...forgingDetails, forgingRatio: e.target.value })}
              placeholder="4:1"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Min. Thickness After Machining</Label>
            <Input
              value={forgingDetails.minimumThicknessAfterMachining}
              onChange={(e) => onForgingChange({ ...forgingDetails, minimumThicknessAfterMachining: e.target.value })}
              placeholder="mm"
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Multi-direction inspection checkboxes */}
        <div className="mt-3 pt-3 border-t">
          <Label className="text-xs mb-2 block">Inspection Directions (Required for Forgings)</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="axial"
                checked={forgingDetails.axialInspection}
                onCheckedChange={(v) => onForgingChange({ ...forgingDetails, axialInspection: !!v })}
              />
              <label htmlFor="axial" className="text-xs cursor-pointer">Axial</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="radial"
                checked={forgingDetails.radialInspection}
                onCheckedChange={(v) => onForgingChange({ ...forgingDetails, radialInspection: !!v })}
              />
              <label htmlFor="radial" className="text-xs cursor-pointer">Radial</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="circumferential"
                checked={forgingDetails.circumferentialInspection}
                onCheckedChange={(v) => onForgingChange({ ...forgingDetails, circumferentialInspection: !!v })}
              />
              <label htmlFor="circumferential" className="text-xs cursor-pointer">Circumferential</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="angleBeam"
                checked={forgingDetails.angleBeamApplied}
                onCheckedChange={(v) => onForgingChange({ ...forgingDetails, angleBeamApplied: !!v })}
              />
              <label htmlFor="angleBeam" className="text-xs cursor-pointer">Angle Beam</label>
            </div>
            {forgingDetails.angleBeamApplied && (
              <Input
                value={forgingDetails.angleBeamAngle || ''}
                onChange={(e) => onForgingChange({ ...forgingDetails, angleBeamAngle: e.target.value })}
                placeholder="Angle (e.g., 45°)"
                className="h-7 text-xs w-28"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Sensitivity Settings */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Sensitivity & Reference (AMS-STD-2154)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Reference FBH Size</Label>
            <Select
              value={sensitivitySettings.referenceFbhSize}
              onValueChange={(v) => onSensitivityChange({ ...sensitivitySettings, referenceFbhSize: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select FBH" />
              </SelectTrigger>
              <SelectContent>
                {fbhSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">FBH Depth (mm)</Label>
            <Input
              value={sensitivitySettings.referenceFbhDepth}
              onChange={(e) => onSensitivityChange({ ...sensitivitySettings, referenceFbhDepth: e.target.value })}
              placeholder="25"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Reference Level (dB)</Label>
            <Input
              value={sensitivitySettings.referenceLevel}
              onChange={(e) => onSensitivityChange({ ...sensitivitySettings, referenceLevel: e.target.value })}
              placeholder="dB @ 80% FSH"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Scanning Sensitivity</Label>
            <Select
              value={sensitivitySettings.scanningSensitivity}
              onValueChange={(v) => onSensitivityChange({ ...sensitivitySettings, scanningSensitivity: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+6 dB">+6 dB</SelectItem>
                <SelectItem value="+8 dB">+8 dB</SelectItem>
                <SelectItem value="+10 dB">+10 dB</SelectItem>
                <SelectItem value="+12 dB">+12 dB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Recording Level (% FSH)</Label>
            <Select
              value={sensitivitySettings.recordingLevel}
              onValueChange={(v) => onSensitivityChange({ ...sensitivitySettings, recordingLevel: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10%">10%</SelectItem>
                <SelectItem value="20%">20%</SelectItem>
                <SelectItem value="25%">25%</SelectItem>
                <SelectItem value="50%">50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rejection Level (% FSH)</Label>
            <Select
              value={sensitivitySettings.rejectionLevel}
              onValueChange={(v) => onSensitivityChange({ ...sensitivitySettings, rejectionLevel: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="80%">80%</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dacApplied"
              checked={sensitivitySettings.dacApplied}
              onCheckedChange={(v) => onSensitivityChange({ ...sensitivitySettings, dacApplied: !!v })}
            />
            <label htmlFor="dacApplied" className="text-xs cursor-pointer">DAC Applied</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tcgApplied"
              checked={sensitivitySettings.tcgApplied}
              onCheckedChange={(v) => onSensitivityChange({ ...sensitivitySettings, tcgApplied: !!v })}
            />
            <label htmlFor="tcgApplied" className="text-xs cursor-pointer">TCG Applied</label>
          </div>
        </div>
      </Card>

      {/* Transfer Correction */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Transfer Correction (Critical for Forgings)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Cal Block BWE (% FSH)</Label>
            <Input
              value={transferCorrection.calibrationBlockBwe}
              onChange={(e) => onTransferChange({ ...transferCorrection, calibrationBlockBwe: e.target.value })}
              placeholder="80%"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Part BWE at Same Thickness</Label>
            <Input
              value={transferCorrection.partBweAtSameThickness}
              onChange={(e) => onTransferChange({ ...transferCorrection, partBweAtSameThickness: e.target.value })}
              placeholder="% FSH"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Transfer Correction (dB)</Label>
            <Input
              value={transferCorrection.transferCorrectionValue}
              onChange={(e) => onTransferChange({ ...transferCorrection, transferCorrectionValue: e.target.value })}
              placeholder="dB difference"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              id="correctionApplied"
              checked={transferCorrection.correctionApplied}
              onCheckedChange={(v) => onTransferChange({ ...transferCorrection, correctionApplied: !!v })}
            />
            <label htmlFor="correctionApplied" className="text-xs cursor-pointer ml-2">Correction Applied</label>
          </div>
        </div>
      </Card>

      {/* BWE Monitoring */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Back Wall Echo Monitoring (ASTM A388)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center">
            <Checkbox
              id="bweActive"
              checked={bweMonitoring.bweMonitoringActive}
              onCheckedChange={(v) => onBweChange({ ...bweMonitoring, bweMonitoringActive: !!v })}
            />
            <label htmlFor="bweActive" className="text-xs cursor-pointer ml-2">BWE Monitoring Active</label>
          </div>
          <div>
            <Label className="text-xs">Attenuation Threshold</Label>
            <Input
              value={bweMonitoring.bweAttenuationThreshold}
              onChange={(e) => onBweChange({ ...bweMonitoring, bweAttenuationThreshold: e.target.value })}
              placeholder="50%"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">BWE Loss Recorded</Label>
            <Input
              value={bweMonitoring.bweLossRecorded}
              onChange={(e) => onBweChange({ ...bweMonitoring, bweLossRecorded: e.target.value })}
              placeholder="% loss"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Gate Start</Label>
            <Input
              value={bweMonitoring.bweGateStart}
              onChange={(e) => onBweChange({ ...bweMonitoring, bweGateStart: e.target.value })}
              placeholder="mm / µs"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Gate End</Label>
            <Input
              value={bweMonitoring.bweGateEnd}
              onChange={(e) => onBweChange({ ...bweMonitoring, bweGateEnd: e.target.value })}
              placeholder="mm / µs"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Scan Coverage */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Scan Index & Coverage (ASME V / ASTM E2375)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Scan Index (mm)</Label>
            <Input
              value={scanCoverage.scanIndex}
              onChange={(e) => onScanCoverageChange({ ...scanCoverage, scanIndex: e.target.value })}
              placeholder="mm"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Overlap (%)</Label>
            <Select
              value={scanCoverage.overlapPercentage}
              onValueChange={(v) => onScanCoverageChange({ ...scanCoverage, overlapPercentage: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10%">10% (Minimum)</SelectItem>
                <SelectItem value="15%">15%</SelectItem>
                <SelectItem value="20%">20%</SelectItem>
                <SelectItem value="25%">25%</SelectItem>
                <SelectItem value="50%">50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Beam Spot Size (mm)</Label>
            <Input
              value={scanCoverage.beamSpotSize}
              onChange={(e) => onScanCoverageChange({ ...scanCoverage, beamSpotSize: e.target.value })}
              placeholder="mm"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Coverage (%)</Label>
            <Input
              value={scanCoverage.coveragePercentage}
              onChange={(e) => onScanCoverageChange({ ...scanCoverage, coveragePercentage: e.target.value })}
              placeholder="100%"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              id="consecutivePass"
              checked={scanCoverage.consecutivePassDetection}
              onCheckedChange={(v) => onScanCoverageChange({ ...scanCoverage, consecutivePassDetection: !!v })}
            />
            <label htmlFor="consecutivePass" className="text-xs cursor-pointer ml-2">3 Consecutive Pass Detection</label>
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Excluded Zones (with reason)</Label>
          <Textarea
            value={scanCoverage.excludedZones || ''}
            onChange={(e) => onScanCoverageChange({ ...scanCoverage, excludedZones: e.target.value })}
            placeholder="Areas not scanned and reason..."
            rows={2}
            className="text-sm"
          />
        </div>
      </Card>

      {/* Zoning Requirements */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Zoning Requirements (Parts {'>'} 18" / 457mm)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center">
            <Checkbox
              id="zoningRequired"
              checked={zoningRequirements.zoningRequired}
              onCheckedChange={(v) => onZoningChange({ ...zoningRequirements, zoningRequired: !!v })}
            />
            <label htmlFor="zoningRequired" className="text-xs cursor-pointer ml-2">Zoning Required</label>
          </div>
          <div>
            <Label className="text-xs">Number of Zones</Label>
            <Select
              value={zoningRequirements.numberOfZones.toString()}
              onValueChange={(v) => onZoningChange({ ...zoningRequirements, numberOfZones: parseInt(v) })}
              disabled={!zoningRequirements.zoningRequired}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Dead Zone (mm)</Label>
            <Input
              value={zoningRequirements.deadZone}
              onChange={(e) => onZoningChange({ ...zoningRequirements, deadZone: e.target.value })}
              placeholder="Near surface"
              className="h-8 text-sm"
              disabled={!zoningRequirements.zoningRequired}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
