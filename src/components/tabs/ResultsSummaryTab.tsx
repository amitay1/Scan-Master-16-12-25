import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ResultsSummary, ApplicableDocument } from "@/types/inspectionReport";

interface ResultsSummaryTabProps {
  resultsSummary: ResultsSummary;
  applicableDocuments: ApplicableDocument[];
  onResultsChange: (data: ResultsSummary) => void;
  onDocumentsChange: (docs: ApplicableDocument[]) => void;
}

export const ResultsSummaryTab = ({
  resultsSummary,
  applicableDocuments,
  onResultsChange,
  onDocumentsChange,
}: ResultsSummaryTabProps) => {
  const updateResultsField = <K extends keyof ResultsSummary>(field: K, value: ResultsSummary[K]) => {
    onResultsChange({ ...resultsSummary, [field]: value });
  };

  const addDocument = () => {
    const newDoc: ApplicableDocument = {
      id: Date.now().toString(),
      documentNumber: '',
      revision: '',
      title: '',
    };
    onDocumentsChange([...applicableDocuments, newDoc]);
  };

  const removeDocument = (id: string) => {
    onDocumentsChange(applicableDocuments.filter(d => d.id !== id));
  };

  const updateDocument = (id: string, field: keyof ApplicableDocument, value: string) => {
    onDocumentsChange(
      applicableDocuments.map(d => d.id === id ? { ...d, [field]: value } : d)
    );
  };

  // Auto-calculate non-conforming parts
  const handlePartsInspectedChange = (value: number) => {
    updateResultsField('partsInspected', value);
    // Auto-update non-conforming if conforming is set
    if (resultsSummary.conformingParts > 0) {
      updateResultsField('nonConformingParts', Math.max(0, value - resultsSummary.conformingParts));
    }
  };

  const handleConformingChange = (value: number) => {
    updateResultsField('conformingParts', value);
    // Auto-calculate non-conforming
    updateResultsField('nonConformingParts', Math.max(0, resultsSummary.partsInspected - value));
  };

  return (
    <div className="space-y-4 p-2">
      {/* Results Summary / Esito della Prova */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Results Summary / Esito della Prova
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Parts Inspected / Parti Ispezionate</Label>
            <Input
              type="number"
              min={0}
              value={resultsSummary.partsInspected || ''}
              onChange={(e) => handlePartsInspectedChange(parseInt(e.target.value) || 0)}
              placeholder="15"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Conforming Parts / Parti Conformi</Label>
            <Input
              type="number"
              min={0}
              max={resultsSummary.partsInspected || undefined}
              value={resultsSummary.conformingParts || ''}
              onChange={(e) => handleConformingChange(parseInt(e.target.value) || 0)}
              placeholder="15"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Non-Conforming / Non Conformi</Label>
            <Input
              type="number"
              min={0}
              value={resultsSummary.nonConformingParts || ''}
              onChange={(e) => updateResultsField('nonConformingParts', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="h-8 text-sm bg-muted"
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-xs">Conforming Serial Numbers / CONFORME</Label>
            <Textarea
              value={resultsSummary.conformingSerials}
              onChange={(e) => updateResultsField('conformingSerials', e.target.value)}
              placeholder="17/47/4/0 --- n°2 à n°16"
              rows={2}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              List all conforming part serial numbers
            </p>
          </div>
          <div>
            <Label className="text-xs">Non-Conforming Serial Numbers / NON-CONFORME</Label>
            <Textarea
              value={resultsSummary.nonConformingSerials}
              onChange={(e) => updateResultsField('nonConformingSerials', e.target.value)}
              placeholder="Parts identified with red label"
              rows={2}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              List all non-conforming part serial numbers
            </p>
          </div>
        </div>

        {/* Visual summary */}
        {resultsSummary.partsInspected > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${(resultsSummary.conformingParts / resultsSummary.partsInspected) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-sm font-medium">
                {((resultsSummary.conformingParts / resultsSummary.partsInspected) * 100).toFixed(1)}% Pass
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Applicable Documents */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="text-sm font-semibold">
            Applicable Documents / Liste des documents applicables
          </h3>
          <Button onClick={addDocument} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>

        {applicableDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No applicable documents added. Click "Add Document" to add standards and procedures.
          </p>
        ) : (
          <div className="space-y-2">
            {applicableDocuments.map((doc) => (
              <div key={doc.id} className="flex gap-2 items-center">
                <Input
                  value={doc.documentNumber}
                  onChange={(e) => updateDocument(doc.id, 'documentNumber', e.target.value)}
                  placeholder="I-07.05.110 / AMS STD 2154"
                  className="h-8 text-sm flex-1"
                />
                <Input
                  value={doc.revision}
                  onChange={(e) => updateDocument(doc.id, 'revision', e.target.value)}
                  placeholder="rev15"
                  className="h-8 text-sm w-24"
                />
                <Input
                  value={doc.title || ''}
                  onChange={(e) => updateDocument(doc.id, 'title', e.target.value)}
                  placeholder="Title (optional)"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Example: I-07.05.110 rev15; AMS STD 2154 Classe A; FT83 rev01
        </p>
      </Card>
    </div>
  );
};
