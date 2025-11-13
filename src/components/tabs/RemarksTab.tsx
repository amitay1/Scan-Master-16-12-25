import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RemarksTabProps {
  remarks: string[];
  onChange: (remarks: string[]) => void;
}

export const RemarksTab = ({ remarks, onChange }: RemarksTabProps) => {
  const addRemark = () => {
    onChange([...remarks, ""]);
  };

  const removeRemark = (index: number) => {
    onChange(remarks.filter((_, i) => i !== index));
  };

  const updateRemark = (index: number, value: string) => {
    onChange(remarks.map((r, i) => (i === index ? value : r)));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Remarks (Page 19)</h3>
          <p className="text-sm text-muted-foreground">
            Add any additional notes or observations about the inspection.
          </p>
        </div>
        <Button onClick={addRemark} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Remark
        </Button>
      </div>

      {remarks.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No remarks added yet. Click "Add Remark" to start.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {remarks.map((remark, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="mb-2 block">Remark {index + 1}</Label>
                  <Textarea
                    value={remark}
                    onChange={(e) => updateRemark(index, e.target.value)}
                    placeholder="Enter remark text..."
                    rows={3}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRemark(index)}
                  className="mt-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
