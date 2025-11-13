import { ExportFormat } from "@/types/exportTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileText, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (value: ExportFormat) => void;
  disabled?: boolean;
}

export function FormatSelector({ value, onChange, disabled }: FormatSelectorProps) {
  const formats = [
    {
      id: "pdf" as ExportFormat,
      name: "PDF",
      description: "Portable Document Format",
      icon: FileText,
      features: ["Print-ready", "Universal compatibility", "Fixed layout"],
    },
    {
      id: "word" as ExportFormat,
      name: "Word",
      description: "Microsoft Word Document",
      icon: FileType,
      features: ["Editable content", "Customizable", "Reusable template"],
    },
  ];

  return (
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
      <div className="grid gap-4">
        {formats.map((format) => {
          const Icon = format.icon;
          const isSelected = value === format.id;
          
          return (
            <label
              key={format.id}
              className={cn(
                "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors",
                isSelected && "border-primary bg-accent",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <RadioGroupItem
                value={format.id}
                id={format.id}
                className="sr-only"
                data-testid={`radio-format-${format.id}`}
              />
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "mt-1 flex h-10 w-10 items-center justify-center rounded-lg",
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{format.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      ({format.description})
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {format.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </RadioGroup>
  );
}