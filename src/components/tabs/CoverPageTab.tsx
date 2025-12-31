import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CoverPageData {
  documentNo: string;
  currentRevision: string;
  revisionDate: string;
  customerName: string;
  poNumber: string;
  itemDescription: string;
  materialGrade: string;
  workOrderNumber: string;
  poSerialNumber: string;
  quantity: string;
  samplePoSlNo: string;
  sampleSerialNo: string;
  sampleQuantity: string;
  thickness: string;
  typeOfScan: string;
  testingEquipment: string;
  tcgApplied: string;
  testStandard: string;
  observations: string;
  results: string;
  approvedBy: string;
}

interface CoverPageTabProps {
  data: CoverPageData;
  onChange: (data: CoverPageData) => void;
}

export const CoverPageTab = ({ data, onChange }: CoverPageTabProps) => {
  const updateField = (field: keyof CoverPageData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-2 p-2">
      <div>
        <h3 className="text-xs font-semibold mb-1">Document Information (Page 1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div>
            <Label>Document No.</Label>
            <Input
              value={data.documentNo}
              onChange={(e) => updateField('documentNo', e.target.value)}
              placeholder="QAQC/UT/AUT/E-324/1"
            />
          </div>
          <div>
            <Label>Current Revision</Label>
            <Input
              value={data.currentRevision}
              onChange={(e) => updateField('currentRevision', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Revision Date</Label>
            <Input
              type="date"
              value={data.revisionDate}
              onChange={(e) => updateField('revisionDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Customer & Part Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Customer Name</Label>
            <Input
              value={data.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="Israel Aerospace Industries (IAI)"
            />
          </div>
          <div>
            <Label>PO Number</Label>
            <Input
              value={data.poNumber}
              onChange={(e) => updateField('poNumber', e.target.value)}
              placeholder="H000131338"
            />
          </div>
          <div className="col-span-2">
            <Label>Item Description</Label>
            <Input
              value={data.itemDescription}
              onChange={(e) => updateField('itemDescription', e.target.value)}
              placeholder="REAR SECTION FORGING"
            />
          </div>
          <div className="col-span-2">
            <Label>Material Grade</Label>
            <Input
              value={data.materialGrade}
              onChange={(e) => updateField('materialGrade', e.target.value)}
              placeholder="CLASS 316L AS PER AMS-QQ-S-763, CONDITION A"
            />
          </div>
          <div>
            <Label>Work Order Number</Label>
            <Input
              value={data.workOrderNumber}
              onChange={(e) => updateField('workOrderNumber', e.target.value)}
              placeholder="WO/24-25/E-324 AS"
            />
          </div>
          <div>
            <Label>PO Serial Number</Label>
            <Input
              value={data.poSerialNumber}
              onChange={(e) => updateField('poSerialNumber', e.target.value)}
              placeholder="2"
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              value={data.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
              placeholder="01 no"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Sample Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>PO Sl No.</Label>
            <Input
              value={data.samplePoSlNo}
              onChange={(e) => updateField('samplePoSlNo', e.target.value)}
              placeholder="2"
            />
          </div>
          <div>
            <Label>Serial No</Label>
            <Input
              value={data.sampleSerialNo}
              onChange={(e) => updateField('sampleSerialNo', e.target.value)}
              placeholder="01"
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              value={data.sampleQuantity}
              onChange={(e) => updateField('sampleQuantity', e.target.value)}
              placeholder="01 No"
            />
          </div>
          <div className="col-span-3">
            <Label>Thickness</Label>
            <Input
              value={data.thickness}
              onChange={(e) => updateField('thickness', e.target.value)}
              placeholder="75mm, 80mm, 220mm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Testing Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type of Scan</Label>
            <Input
              value={data.typeOfScan}
              onChange={(e) => updateField('typeOfScan', e.target.value)}
              placeholder="Ring scan"
            />
          </div>
          <div>
            <Label>Testing Equipment</Label>
            <Input
              value={data.testingEquipment}
              onChange={(e) => updateField('testingEquipment', e.target.value)}
              placeholder="Eddyfi- Panther2"
            />
          </div>
          <div className="col-span-2">
            <Label>TCG Applied</Label>
            <Select value={data.tcgApplied} onValueChange={(v) => updateField('tcgApplied', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Test Standard</Label>
            <Input
              value={data.testStandard}
              onChange={(e) => updateField('testStandard', e.target.value)}
              placeholder="AS PER ASTM A745"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Observations & Results</h3>
        <div className="space-y-4">
          <div>
            <Label>Observations</Label>
            <Textarea
              value={data.observations}
              onChange={(e) => updateField('observations', e.target.value)}
              placeholder="No Recordable indication observed in scanning.&#10;No back wall Loss greater than 50% observed during the scanning."
              rows={3}
            />
          </div>
          <div>
            <Label>Results</Label>
            <Select value={data.results} onValueChange={(v) => updateField('results', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Approval</h3>
        <div className="space-y-4">
          <div>
            <Label>Approved By</Label>
            <Input
              value={data.approvedBy}
              onChange={(e) => updateField('approvedBy', e.target.value)}
              placeholder="Approver Name & Title"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Note: Inspector details are managed in the Documentation tab
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
