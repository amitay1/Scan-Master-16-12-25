import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  InspectionReportData,
  SurfaceCondition,
  TestType,
} from "@/types/inspectionReport";

interface CoverPageTabProps {
  data: InspectionReportData;
  onChange: (data: InspectionReportData) => void;
}

export const CoverPageTab = ({ data, onChange }: CoverPageTabProps) => {
  const updateField = <K extends keyof InspectionReportData>(field: K, value: InspectionReportData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const toggleSurfaceCondition = (condition: SurfaceCondition) => {
    const current = data.surfaceConditions || [];
    if (current.includes(condition)) {
      updateField('surfaceConditions', current.filter(c => c !== condition));
    } else {
      updateField('surfaceConditions', [...current, condition]);
    }
  };

  const toggleTestType = (testType: TestType) => {
    const current = data.testTypes || [];
    if (current.includes(testType)) {
      updateField('testTypes', current.filter(t => t !== testType));
    } else {
      updateField('testTypes', [...current, testType]);
    }
  };

  const surfaceConditionLabels: Record<SurfaceCondition, string> = {
    worked: 'Worked / Lavorato',
    raw: 'Raw / Grezzo',
    finished: 'Finished / Finito',
    welded: 'Welded / Saldato',
    other: 'Other / Altro',
  };

  const testTypeLabels: Record<TestType, string> = {
    RT: 'RT (X-Ray)',
    MT: 'MT (Magnetic)',
    UT: 'UT (Ultrasonic)',
    PT: 'PT (Penetrant)',
    OT: 'OT (Other)',
  };

  return (
    <div className="space-y-4 p-2">
      {/* Document Information */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Document Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Report N° / Document No.</Label>
            <Input
              value={data.documentNo}
              onChange={(e) => updateField('documentNo', e.target.value)}
              placeholder="QAQC/UT/AUT/E-324/1"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Revision</Label>
            <Input
              value={data.currentRevision}
              onChange={(e) => updateField('currentRevision', e.target.value)}
              placeholder="0"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Revision Date</Label>
            <Input
              type="date"
              value={data.revisionDate}
              onChange={(e) => updateField('revisionDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Issue Date</Label>
            <Input
              type="date"
              value={data.issueDate || ''}
              onChange={(e) => updateField('issueDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Batch N° / Lotto</Label>
            <Input
              value={data.batchNumber || ''}
              onChange={(e) => updateField('batchNumber', e.target.value)}
              placeholder="Bytest batch number"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Job N° / OC-Commessa</Label>
            <Input
              value={data.jobNumber || ''}
              onChange={(e) => updateField('jobNumber', e.target.value)}
              placeholder="OC-Job n°"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Customer Information */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Customer Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Customer Name / Cliente</Label>
            <Input
              value={data.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="FORGITAL FMDL"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Customer Address / Indirizzo</Label>
            <Input
              value={data.customerAddress || ''}
              onChange={(e) => updateField('customerAddress', e.target.value)}
              placeholder="Via Example 123, City"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Customer Order / PO Number</Label>
            <Input
              value={data.poNumber}
              onChange={(e) => updateField('poNumber', e.target.value)}
              placeholder="CND 300/2017 r.0"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Internal Order N°</Label>
            <Input
              value={data.metalscanOrderNumber || ''}
              onChange={(e) => updateField('metalscanOrderNumber', e.target.value)}
              placeholder="171026"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part Information */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Part / Component Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="col-span-2 md:col-span-3">
            <Label className="text-xs">Item Description / Désignation pièce</Label>
            <Input
              value={data.itemDescription}
              onChange={(e) => updateField('itemDescription', e.target.value)}
              placeholder="Tube forgé / REAR SECTION FORGING"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Part Number (P/N)</Label>
            <Input
              value={data.partNumber || ''}
              onChange={(e) => updateField('partNumber', e.target.value)}
              placeholder="LFC-19009-001"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Lot Number (LOTTO)</Label>
            <Input
              value={data.lotNumber || ''}
              onChange={(e) => updateField('lotNumber', e.target.value)}
              placeholder="17/47/4/0"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Drawing N° / N° de plan</Label>
            <Input
              value={data.drawingNumber || ''}
              onChange={(e) => updateField('drawingNumber', e.target.value)}
              placeholder="LFC-19009-001-200000 rev B"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Technical Sheet / Fiche Technique</Label>
            <Input
              value={data.technicalSheetRef || ''}
              onChange={(e) => updateField('technicalSheetRef', e.target.value)}
              placeholder="83 rev01"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Work Order Number</Label>
            <Input
              value={data.workOrderNumber}
              onChange={(e) => updateField('workOrderNumber', e.target.value)}
              placeholder="WO/24-25/E-324"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Material Information */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Material Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="col-span-2 md:col-span-3">
            <Label className="text-xs">Material Grade / Matière</Label>
            <Input
              value={data.materialGrade}
              onChange={(e) => updateField('materialGrade', e.target.value)}
              placeholder="Aluminium 7175 / CLASS 316L AS PER AMS-QQ-S-763"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Cast/Melt Number / Numéro de coulée</Label>
            <Input
              value={data.castNumber || ''}
              onChange={(e) => updateField('castNumber', e.target.value)}
              placeholder="Heat number"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Heat Treatment Condition</Label>
            <Input
              value={data.heatTreatmentCondition || ''}
              onChange={(e) => updateField('heatTreatmentCondition', e.target.value)}
              placeholder="T6 / Solution treated"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Surface Roughness (Ra)</Label>
            <Input
              value={data.surfaceRoughness || ''}
              onChange={(e) => updateField('surfaceRoughness', e.target.value)}
              placeholder="< 3.2µm"
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Surface Conditions */}
        <div className="mt-3">
          <Label className="text-xs mb-2 block">Surface Conditions / Stato Superficiale</Label>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(surfaceConditionLabels) as SurfaceCondition[]).map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={`surface-${condition}`}
                  checked={(data.surfaceConditions || []).includes(condition)}
                  onCheckedChange={() => toggleSurfaceCondition(condition)}
                />
                <label htmlFor={`surface-${condition}`} className="text-xs cursor-pointer">
                  {surfaceConditionLabels[condition]}
                </label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quantity & Serial Numbers */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Quantity & Serial Numbers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Quantity / Quantité</Label>
            <Input
              value={data.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
              placeholder="15"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">PO Serial Number</Label>
            <Input
              value={data.poSerialNumber}
              onChange={(e) => updateField('poSerialNumber', e.target.value)}
              placeholder="2"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Serial/Batch N° / N° de série</Label>
            <Input
              value={data.sampleSerialNo}
              onChange={(e) => updateField('sampleSerialNo', e.target.value)}
              placeholder="17/47/4/0"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Individual Numbers / Numéros individuels</Label>
            <Input
              value={data.individualNumbers || ''}
              onChange={(e) => updateField('individualNumbers', e.target.value)}
              placeholder="N°2 à 16"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Sample PO Sl No.</Label>
            <Input
              value={data.samplePoSlNo}
              onChange={(e) => updateField('samplePoSlNo', e.target.value)}
              placeholder="2"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Sample Quantity</Label>
            <Input
              value={data.sampleQuantity}
              onChange={(e) => updateField('sampleQuantity', e.target.value)}
              placeholder="01 No"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Thickness</Label>
            <Input
              value={data.thickness}
              onChange={(e) => updateField('thickness', e.target.value)}
              placeholder="75mm, 80mm, 220mm"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Test Type Selection */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Test Type / Tipo di Prova</h3>
        <div className="flex flex-wrap gap-6">
          {(Object.keys(testTypeLabels) as TestType[]).map((testType) => (
            <div key={testType} className="flex items-center space-x-2">
              <Checkbox
                id={`test-${testType}`}
                checked={(data.testTypes || []).includes(testType)}
                onCheckedChange={() => toggleTestType(testType)}
              />
              <label htmlFor={`test-${testType}`} className="text-sm cursor-pointer font-medium">
                {testTypeLabels[testType]}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Testing Details */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Testing Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Type of Scan</Label>
            <Input
              value={data.typeOfScan}
              onChange={(e) => updateField('typeOfScan', e.target.value)}
              placeholder="Ring scan / Immersion"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Testing Equipment</Label>
            <Input
              value={data.testingEquipment}
              onChange={(e) => updateField('testingEquipment', e.target.value)}
              placeholder="Eddyfi- Panther2"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">TCG Applied</Label>
            <Select value={data.tcgApplied} onValueChange={(v) => updateField('tcgApplied', v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Test Standard</Label>
            <Input
              value={data.testStandard}
              onChange={(e) => updateField('testStandard', e.target.value)}
              placeholder="AMS STD 2154 Classe A / ASTM A745"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Test Extension / Scope</Label>
            <Input
              value={data.testExtension || ''}
              onChange={(e) => updateField('testExtension', e.target.value)}
              placeholder="100%"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Observations & Results */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Observations & Results</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Observations</Label>
            <Textarea
              value={data.observations}
              onChange={(e) => updateField('observations', e.target.value)}
              placeholder="No Recordable indication observed in scanning.&#10;No back wall Loss greater than 50% observed during the scanning."
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Results / Esito</Label>
              <Select value={data.results} onValueChange={(v) => updateField('results', v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accepted">Accepted / CONFORME</SelectItem>
                  <SelectItem value="Rejected">Rejected / NON-CONFORME</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Approved By (Legacy)</Label>
              <Input
                value={data.approvedBy}
                onChange={(e) => updateField('approvedBy', e.target.value)}
                placeholder="Approver Name"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
