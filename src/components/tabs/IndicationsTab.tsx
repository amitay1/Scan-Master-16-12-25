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
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="w-[100px]">S/N, Scan ID</TableHead>
                  <TableHead className="w-[90px]">X Distance</TableHead>
                  <TableHead className="w-[90px]">Y Distance</TableHead>
                  <TableHead className="w-[90px]">X Extension</TableHead>
                  <TableHead className="w-[90px]">Y Extension</TableHead>
                  <TableHead className="w-[90px]">Amplitude</TableHead>
                  <TableHead className="w-[90px]">Sound Path</TableHead>
                  <TableHead className="w-[100px]">Assessment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indications.map((indication) => (
                  <TableRow key={indication.id}>
                    <TableCell className="font-medium">
                      {indication.indicationNumber}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.scanId}
                        onChange={(e) => updateIndication(indication.id, 'scanId', e.target.value)}
                        placeholder="Scan 1"
                        className="h-7 text-xs w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.xDistance}
                        onChange={(e) => updateIndication(indication.id, 'xDistance', e.target.value)}
                        placeholder="mm"
                        className="h-7 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.yDistance}
                        onChange={(e) => updateIndication(indication.id, 'yDistance', e.target.value)}
                        placeholder="mm"
                        className="h-7 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.xExtension}
                        onChange={(e) => updateIndication(indication.id, 'xExtension', e.target.value)}
                        placeholder="mm"
                        className="h-7 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.yExtension}
                        onChange={(e) => updateIndication(indication.id, 'yExtension', e.target.value)}
                        placeholder="mm"
                        className="h-7 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.amplitude}
                        onChange={(e) => updateIndication(indication.id, 'amplitude', e.target.value)}
                        placeholder="dB/%"
                        className="h-7 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={indication.soundPath}
                        onChange={(e) => updateIndication(indication.id, 'soundPath', e.target.value)}
                        placeholder="mm"
                        className="h-7 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={indication.assessment}
                        onValueChange={(v) => updateIndication(indication.id, 'assessment', v)}
                      >
                        <SelectTrigger className="h-7 text-xs w-20">
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
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
        <h4 className="text-xs font-semibold mb-2">Column Descriptions:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div><strong>X/Y Distance:</strong> Distance from reference point (0,0)</div>
          <div><strong>X/Y Extension:</strong> Size of the indication</div>
          <div><strong>Amplitude:</strong> Maximum signal strength (dB or %)</div>
          <div><strong>Sound Path:</strong> Depth from surface</div>
          <div><strong>Assessment:</strong> Accept/Reject/Record only</div>
        </div>
      </Card>
    </div>
  );
};
