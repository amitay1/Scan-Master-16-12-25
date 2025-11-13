import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, Image as ImageIcon, Wand2 } from "lucide-react";
import { ScanData } from "@/types/inspectionReport";
import { useState } from "react";
import { CScanGenerator } from "@/components/CScanGenerator";
import { AScanGenerator } from "@/components/AScanGenerator";

interface ScansTabProps {
  scans: ScanData[];
  onChange: (scans: ScanData[]) => void;
}

export const ScansTab = ({ scans, onChange }: ScansTabProps) => {
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [generatingCScan, setGeneratingCScan] = useState<string | null>(null);
  const [generatingAScan, setGeneratingAScan] = useState<string | null>(null);

  const addScan = () => {
    const newScan: ScanData = {
      id: Date.now().toString(),
      scanNumber: scans.length + 1,
      scanType: "",
      direction: "",
      scanLength: "360 degree",
      indexLength: "",
      probeType: "",
      numberOfElements: "1",
    };
    onChange([...scans, newScan]);
    setExpandedScan(newScan.id);
  };

  const removeScan = (id: string) => {
    const updated = scans.filter(s => s.id !== id);
    // Renumber remaining scans
    const renumbered = updated.map((s, idx) => ({ ...s, scanNumber: idx + 1 }));
    onChange(renumbered);
  };

  const updateScan = (id: string, field: keyof ScanData, value: any) => {
    onChange(scans.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleImageUpload = (scanId: string, field: 'cScanImage' | 'aScanImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateScan(scanId, field, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCScan = (scanId: string) => {
    setGeneratingCScan(scanId);
  };

  const handleGenerateAScan = (scanId: string) => {
    setGeneratingAScan(scanId);
  };

  const onCScanGenerated = (scanId: string, imageDataUrl: string) => {
    updateScan(scanId, 'cScanImage', imageDataUrl);
    setGeneratingCScan(null);
  };

  const onAScanGenerated = (scanId: string, imageDataUrl: string) => {
    updateScan(scanId, 'aScanImage', imageDataUrl);
    setGeneratingAScan(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Scan Data (Pages 4-18)</h3>
          <p className="text-sm text-muted-foreground">
            Add up to 16 scans. Each scan will be a separate page in the report.
          </p>
        </div>
        <Button onClick={addScan} disabled={scans.length >= 16}>
          <Plus className="h-4 w-4 mr-2" />
          Add Scan
        </Button>
      </div>

      {scans.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No scans added yet. Click "Add Scan" to start.</p>
        </Card>
      )}

      <div className="space-y-4">
        {scans.map((scan) => (
          <Card key={scan.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold">Scan {scan.scanNumber}</h4>
                <p className="text-sm text-muted-foreground">{scan.scanType || "Untitled Scan"}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                >
                  {expandedScan === scan.id ? "Collapse" : "Expand"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeScan(scan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedScan === scan.id && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Scan Type</Label>
                    <Input
                      value={scan.scanType}
                      onChange={(e) => updateScan(scan.id, 'scanType', e.target.value)}
                      placeholder="e.g., A Direction- 0°"
                    />
                  </div>
                  <div>
                    <Label>Direction</Label>
                    <Input
                      value={scan.direction}
                      onChange={(e) => updateScan(scan.id, 'direction', e.target.value)}
                      placeholder="e.g., Axial forward"
                    />
                  </div>
                  <div>
                    <Label>Scan Length</Label>
                    <Input
                      value={scan.scanLength}
                      onChange={(e) => updateScan(scan.id, 'scanLength', e.target.value)}
                      placeholder="360 degree"
                    />
                  </div>
                  <div>
                    <Label>Index Length</Label>
                    <Input
                      value={scan.indexLength}
                      onChange={(e) => updateScan(scan.id, 'indexLength', e.target.value)}
                      placeholder="420 mm"
                    />
                  </div>
                  <div>
                    <Label>Probe Type</Label>
                    <Input
                      value={scan.probeType}
                      onChange={(e) => updateScan(scan.id, 'probeType', e.target.value)}
                      placeholder="PAUT / Normal / Angle"
                    />
                  </div>
                  <div>
                    <Label>Number of Elements</Label>
                    <Input
                      value={scan.numberOfElements}
                      onChange={(e) => updateScan(scan.id, 'numberOfElements', e.target.value)}
                      placeholder="1 or 128"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Gain</Label>
                    <Input
                      value={scan.gain || ""}
                      onChange={(e) => updateScan(scan.id, 'gain', e.target.value)}
                      placeholder="19.0 dB"
                    />
                  </div>
                  <div>
                    <Label>Range</Label>
                    <Input
                      value={scan.range || ""}
                      onChange={(e) => updateScan(scan.id, 'range', e.target.value)}
                      placeholder="301.916mm"
                    />
                  </div>
                  <div>
                    <Label>Velocity</Label>
                    <Input
                      value={scan.velocity || ""}
                      onChange={(e) => updateScan(scan.id, 'velocity', e.target.value)}
                      placeholder="V.2"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Frequency is managed per-probe in the Probe Details tab
                </p>

                {/* Image Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>C-Scan Image</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleGenerateCScan(scan.id)}
                        disabled={generatingCScan === scan.id}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {generatingCScan === scan.id ? "Generating..." : "Generate"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`cscan-${scan.id}`)?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        id={`cscan-${scan.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(scan.id, 'cScanImage', e)}
                      />
                      {scan.cScanImage && (
                        <span className="text-sm text-green-600">✓</span>
                      )}
                    </div>
                    {scan.cScanImage && (
                      <img 
                        src={scan.cScanImage} 
                        alt="C-Scan" 
                        className="w-full h-auto rounded border"
                      />
                    )}
                    {generatingCScan === scan.id && (
                      <CScanGenerator 
                        scanData={scan} 
                        onImageGenerated={(url) => onCScanGenerated(scan.id, url)} 
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>A-Scan Waveform</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleGenerateAScan(scan.id)}
                        disabled={generatingAScan === scan.id}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {generatingAScan === scan.id ? "Generating..." : "Generate"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`ascan-${scan.id}`)?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        id={`ascan-${scan.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(scan.id, 'aScanImage', e)}
                      />
                      {scan.aScanImage && (
                        <span className="text-sm text-green-600">✓</span>
                      )}
                    </div>
                    {scan.aScanImage && (
                      <img 
                        src={scan.aScanImage} 
                        alt="A-Scan" 
                        className="w-full h-auto rounded border"
                      />
                    )}
                    {generatingAScan === scan.id && (
                      <AScanGenerator 
                        scanData={scan} 
                        onImageGenerated={(url) => onAScanGenerated(scan.id, url)} 
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
