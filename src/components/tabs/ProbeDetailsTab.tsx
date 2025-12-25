import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { ProbeDetails } from "@/types/inspectionReport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProbeDetailsTabProps {
  probeDetails: ProbeDetails[];
  onChange: (probes: ProbeDetails[]) => void;
}

export const ProbeDetailsTab = ({ probeDetails, onChange }: ProbeDetailsTabProps) => {
  const addProbe = () => {
    onChange([
      ...probeDetails,
      {
        probeDescription: "",
        frequency: "",
        make: "",
        waveMode: "Longitudinal",
        scanningDirections: "",
        pageNumber: probeDetails.length + 4, // Start from page 4
      },
    ]);
  };

  const removeProbe = (index: number) => {
    onChange(probeDetails.filter((_, i) => i !== index));
  };

  const updateProbe = (index: number, field: keyof ProbeDetails, value: any) => {
    onChange(
      probeDetails.map((probe, i) =>
        i === index ? { ...probe, [field]: value } : probe
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Probe Details (Page 3)</h3>
          <p className="text-sm text-muted-foreground">
            List all probes used during inspection with their specifications.
          </p>
        </div>
        <Button onClick={addProbe} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Probe
        </Button>
      </div>

      {probeDetails.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No probes added yet. Click "Add Probe" to start.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Probe Details</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Wave Mode</TableHead>
                <TableHead>Scanning Directions</TableHead>
                <TableHead className="w-[100px]">Page No.</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {probeDetails.map((probe, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={probe.probeDescription}
                      onChange={(e) =>
                        updateProbe(index, "probeDescription", e.target.value)
                      }
                      placeholder="128ele, PAUT, 0°, SL NO.XXX"
                      className="min-w-[250px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={probe.frequency}
                      onChange={(e) => updateProbe(index, "frequency", e.target.value)}
                      placeholder="2.25 MHz"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={probe.make}
                      onChange={(e) => updateProbe(index, "make", e.target.value)}
                      placeholder="Imasonic"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={probe.waveMode}
                      onChange={(e) => updateProbe(index, "waveMode", e.target.value)}
                      placeholder="Longitudinal/Shear"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={probe.scanningDirections}
                      onChange={(e) =>
                        updateProbe(index, "scanningDirections", e.target.value)
                      }
                      placeholder="A Direction"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={probe.pageNumber}
                      onChange={(e) =>
                        updateProbe(index, "pageNumber", parseInt(e.target.value))
                      }
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProbe(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
