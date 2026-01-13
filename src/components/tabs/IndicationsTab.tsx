import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { IndicationRecord } from "@/types/inspectionReport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IndicationsTabProps {
  indications: IndicationRecord[];
  onChange: (indications: IndicationRecord[]) => void;
}

export const IndicationsTab = ({ indications, onChange }: IndicationsTabProps) => {
  const addIndication = () => {
    const newIndication: IndicationRecord = {
      id: Date.now().toString(),
      scanId: '',
      indicationNumber: indications.length + 1,
      xDistance: '',
      yDistance: '',
      xExtension: '',
      yExtension: '',
      amplitude: '',
      soundPath: '',
      assessment: 'record',
    };
    onChange([...indications, newIndication]);
  };

  const removeIndication = (id: string) => {
    const updated = indications.filter(i => i.id !== id);
    // Renumber remaining indications
    const renumbered = updated.map((ind, idx) => ({ ...ind, indicationNumber: idx + 1 }));
    onChange(renumbered);
  };

  const updateIndication = (id: string, field: keyof IndicationRecord, value: any) => {
    onChange(indications.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-4 p-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold">Indications Detected / Indicazioni Rilevate</h3>
          <p className="text-xs text-muted-foreground">
            Record all indications found during inspection with their location, size, and assessment.
          </p>
        </div>
        <Button onClick={addIndication} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Indication
        </Button>
      </div>

      {indications.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No indications recorded. Click "Add Indication" to record findings.</p>
          <p className="text-xs mt-2">If no indications were found, leave this section empty.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="w-[80px]">Scan ID</TableHead>
                  <TableHead className="w-[70px]">X Dist</TableHead>
                  <TableHead className="w-[70px]">Y Dist</TableHead>
                  <TableHead className="w-[70px]">X Ext</TableHead>
                  <TableHead className="w-[70px]">Y Ext</TableHead>
                  <TableHead className="w-[70px]">Amp.</TableHead>
                  <TableHead className="w-[70px]">Depth</TableHead>
                  <TableHead className="w-[80px]">FBH Equiv</TableHead>
                  <TableHead className="w-[70px]">vs Ref</TableHead>
                  <TableHead className="w-[80px]">Zone</TableHead>
                  <TableHead className="w-[80px]">Result</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indications.map((indication) => (
                  <TableRow key={indication.id}>
                    <TableCell className="font-medium text-xs">
                      {indication.indicationNumber}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.scanId}
                        onChange={(e) => updateIndication(indication.id, 'scanId', e.target.value)}
                        placeholder="ID"
                        className="h-6 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.xDistance}
                        onChange={(e) => updateIndication(indication.id, 'xDistance', e.target.value)}
                        placeholder="mm"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.yDistance}
                        onChange={(e) => updateIndication(indication.id, 'yDistance', e.target.value)}
                        placeholder="mm"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.xExtension}
                        onChange={(e) => updateIndication(indication.id, 'xExtension', e.target.value)}
                        placeholder="mm"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.yExtension}
                        onChange={(e) => updateIndication(indication.id, 'yExtension', e.target.value)}
                        placeholder="mm"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.amplitude}
                        onChange={(e) => updateIndication(indication.id, 'amplitude', e.target.value)}
                        placeholder="%"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.soundPath}
                        onChange={(e) => updateIndication(indication.id, 'soundPath', e.target.value)}
                        placeholder="mm"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={indication.fbhEquivalentSize || ''}
                        onValueChange={(v) => updateIndication(indication.id, 'fbhEquivalentSize', v)}
                      >
                        <SelectTrigger className="h-6 text-xs w-16">
                          <SelectValue placeholder="FBH" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="< 1/64">{'<'} 1/64"</SelectItem>
                          <SelectItem value="1/64">1/64"</SelectItem>
                          <SelectItem value="2/64">2/64"</SelectItem>
                          <SelectItem value="3/64">3/64"</SelectItem>
                          <SelectItem value="4/64">4/64"</SelectItem>
                          <SelectItem value="5/64">5/64"</SelectItem>
                          <SelectItem value="> 5/64">{'>'} 5/64"</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.amplitudeVsReference || ''}
                        onChange={(e) => updateIndication(indication.id, 'amplitudeVsReference', e.target.value)}
                        placeholder="dB"
                        className="h-6 text-xs w-14"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.depthZone || ''}
                        onChange={(e) => updateIndication(indication.id, 'depthZone', e.target.value)}
                        placeholder="Zone"
                        className="h-6 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={indication.assessment}
                        onValueChange={(v) => updateIndication(indication.id, 'assessment', v)}
                      >
                        <SelectTrigger className="h-6 text-xs w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accept">Accept</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                          <SelectItem value="record">Record</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndication(indication.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Column legend */}
      <Card className="p-3 bg-muted/50">
        <h4 className="text-xs font-semibold mb-2">Column Descriptions (AMS-STD-2154):</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div><strong>X/Y Dist:</strong> Distance from reference (0,0)</div>
          <div><strong>X/Y Ext:</strong> Size of the indication</div>
          <div><strong>Amp:</strong> Signal strength (% FSH)</div>
          <div><strong>Depth:</strong> Sound path from surface</div>
          <div><strong>FBH Equiv:</strong> Equivalent FBH size (1/64" - 8/64")</div>
          <div><strong>vs Ref:</strong> dB relative to reference FBH</div>
          <div><strong>Zone:</strong> Depth zone (Near/Mid/Far)</div>
          <div><strong>Result:</strong> Accept/Reject/Record</div>
        </div>
      </Card>
    </div>
  );
};
