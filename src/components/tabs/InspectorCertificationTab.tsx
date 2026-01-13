import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InspectorCertification, SignatureRecord } from "@/types/inspectionReport";

interface InspectorCertificationTabProps {
  inspectorCertification: InspectorCertification;
  signatures: SignatureRecord[];
  onCertificationChange: (data: InspectorCertification) => void;
  onSignaturesChange: (signatures: SignatureRecord[]) => void;
}

export const InspectorCertificationTab = ({
  inspectorCertification,
  signatures,
  onCertificationChange,
  onSignaturesChange,
}: InspectorCertificationTabProps) => {
  const updateCertField = <K extends keyof InspectorCertification>(
    field: K,
    value: InspectorCertification[K]
  ) => {
    onCertificationChange({ ...inspectorCertification, [field]: value });
  };

  const addSignature = (role: SignatureRecord['role']) => {
    // Check if role already exists
    if (signatures.find(s => s.role === role)) {
      return;
    }
    const newSignature: SignatureRecord = {
      role,
      name: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
    };
    onSignaturesChange([...signatures, newSignature]);
  };

  const removeSignature = (role: SignatureRecord['role']) => {
    onSignaturesChange(signatures.filter(s => s.role !== role));
  };

  const updateSignature = (role: SignatureRecord['role'], field: keyof SignatureRecord, value: any) => {
    onSignaturesChange(
      signatures.map(s => s.role === role ? { ...s, [field]: value } : s)
    );
  };

  const handleSignatureUpload = (role: SignatureRecord['role'], e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateSignature(role, 'signature', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getSignatureByRole = (role: SignatureRecord['role']) => {
    return signatures.find(s => s.role === role);
  };

  const roleLabels: Record<SignatureRecord['role'], { title: string; description: string }> = {
    preparedBy: {
      title: 'Report Issued By / Rapporto redatto da',
      description: 'Inspector who prepared the report'
    },
    approvedBy: {
      title: 'Approved By / Approvato da',
      description: 'Level III or authorized person'
    },
    witness: {
      title: 'Customer Witness / Supervisore',
      description: 'Customer representative or third party'
    },
  };

  const certificationStandards = [
    'EN 4179',
    'NAS 410',
    'SNT-TC-1A',
    'ISO 9712',
    'COSAC',
    'PCN',
    'ASNT',
  ];

  return (
    <div className="space-y-4 p-2">
      {/* Inspector Certification */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Inspector Certification / Niveau US / UT Level
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Inspector Name / Nom</Label>
            <Input
              value={inspectorCertification.name}
              onChange={(e) => updateCertField('name', e.target.value)}
              placeholder="B. MOURENAS"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">UT Level</Label>
            <Select
              value={inspectorCertification.level}
              onValueChange={(v) => updateCertField('level', v as InspectorCertification['level'])}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I">Level I</SelectItem>
                <SelectItem value="II">Level II</SelectItem>
                <SelectItem value="III">Level III</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Certification Standard</Label>
            <Select
              value={inspectorCertification.certificationStandard}
              onValueChange={(v) => updateCertField('certificationStandard', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select standard" />
              </SelectTrigger>
              <SelectContent>
                {certificationStandards.map(std => (
                  <SelectItem key={std} value={std}>{std}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Certificate Number</Label>
            <Input
              value={inspectorCertification.certificateNumber}
              onChange={(e) => updateCertField('certificateNumber', e.target.value)}
              placeholder="UT-2024-1234"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Expiry Date</Label>
            <Input
              type="date"
              value={inspectorCertification.expiryDate}
              onChange={(e) => updateCertField('expiryDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Employer (Optional)</Label>
            <Input
              value={inspectorCertification.employer || ''}
              onChange={(e) => updateCertField('employer', e.target.value)}
              placeholder="Company name"
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Quick reference display */}
        {inspectorCertification.name && inspectorCertification.level && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <strong>{inspectorCertification.name}</strong> - {inspectorCertification.certificationStandard} UT Level {inspectorCertification.level}
            {inspectorCertification.certificateNumber && ` (${inspectorCertification.certificateNumber})`}
          </div>
        )}
      </Card>

      {/* Signatures Section */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2">
          Signatures / Firme
        </h3>

        {/* Add signature buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['preparedBy', 'approvedBy', 'witness'] as const).map((role) => (
            <Button
              key={role}
              variant={getSignatureByRole(role) ? "secondary" : "outline"}
              size="sm"
              onClick={() => addSignature(role)}
              disabled={!!getSignatureByRole(role)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {roleLabels[role].title.split('/')[0].trim()}
            </Button>
          ))}
        </div>

        {/* Signature cards */}
        <div className="space-y-4">
          {(['preparedBy', 'approvedBy', 'witness'] as const).map((role) => {
            const sig = getSignatureByRole(role);
            if (!sig) return null;

            return (
              <Card key={role} className="p-4 bg-muted/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-medium">{roleLabels[role].title}</h4>
                    <p className="text-xs text-muted-foreground">{roleLabels[role].description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSignature(role)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={sig.name}
                      onChange={(e) => updateSignature(role, 'name', e.target.value)}
                      placeholder="Full name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Title / Position</Label>
                    <Input
                      value={sig.title || ''}
                      onChange={(e) => updateSignature(role, 'title', e.target.value)}
                      placeholder="UT Level II"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={sig.date}
                      onChange={(e) => updateSignature(role, 'date', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  {role === 'witness' && (
                    <div>
                      <Label className="text-xs">Company</Label>
                      <Input
                        value={sig.company || ''}
                        onChange={(e) => updateSignature(role, 'company', e.target.value)}
                        placeholder="Customer / Third Party"
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Signature upload */}
                <div className="mt-3">
                  <Label className="text-xs">Signature Image (Optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`sig-upload-${role}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Signature
                    </Button>
                    <input
                      id={`sig-upload-${role}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSignatureUpload(role, e)}
                    />
                    {sig.signature && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateSignature(role, 'signature', undefined)}
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {sig.signature && (
                    <img
                      src={sig.signature}
                      alt="Signature"
                      className="mt-2 max-h-16 border rounded"
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {signatures.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No signatures added. Click the buttons above to add required signatures.
          </p>
        )}
      </Card>
    </div>
  );
};
