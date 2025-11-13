import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { getSmartRecommendation, GEOMETRY_INSPECTION_RULES } from "@/utils/enhancedAutoFillLogic";
import { MaterialType, PartGeometry, AcceptanceClass } from "@/types/techniqueSheet";

interface SmartRecommendationsProps {
  geometry: PartGeometry | "";
  material: MaterialType | "";
  thickness: number;
  width?: number;
  length?: number;
  diameter?: number;
  acceptanceClass?: AcceptanceClass | "";
}

export const SmartRecommendations = ({
  geometry,
  material,
  thickness,
  width,
  length,
  diameter,
  acceptanceClass
}: SmartRecommendationsProps) => {
  // Don't show anything if basic data is missing
  if (!geometry || !material || !thickness || thickness < 6.35) {
    return null;
  }

  const recommendation = getSmartRecommendation({
    geometry: geometry as PartGeometry,
    material: material as MaterialType,
    thickness,
    width,
    length,
    diameter,
    acceptanceClass: acceptanceClass as AcceptanceClass
  });

  const geometryRules = GEOMETRY_INSPECTION_RULES[geometry as PartGeometry];
  const hasWarnings = recommendation.recommendations.warnings.length > 0;
  const hasConditions = recommendation.recommendations.conditions.length > 0;

  return (
    <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Smart Recommendations</h3>
        <Badge variant="secondary" className="ml-auto">
          {geometryRules.displayName}
        </Badge>
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Considerations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {recommendation.recommendations.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Scan Directions */}
      <Card className="p-4 bg-card">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-2">Required Scan Directions:</h4>
            <div className="space-y-1">
              {recommendation.recommendations.scanDirections.map((direction, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{direction}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Wave Types */}
      <Card className="p-4 bg-card">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-info mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-2">Wave Modes:</h4>
            <div className="flex gap-2 flex-wrap">
              {recommendation.recommendations.waveTypes.map((wave, idx) => (
                <Badge key={idx} variant="secondary">{wave}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Conditions */}
      {hasConditions && (
        <Card className="p-4 bg-card">
          <h4 className="font-semibold text-sm mb-2">Inspection Conditions:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {recommendation.recommendations.conditions.map((condition, idx) => (
              <li key={idx}>{condition}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Special Considerations */}
      {recommendation.recommendations.specialConsiderations.length > 0 && (
        <Card className="p-4 bg-card border-primary/20">
          <h4 className="font-semibold text-sm mb-2 text-primary">Special Considerations:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {recommendation.recommendations.specialConsiderations.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommended Frequency */}
      <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
        <div className="flex-1">
          <span className="text-sm font-medium">Recommended Frequency:</span>
          <span className="ml-2 text-lg font-bold text-accent">{recommendation.recommendations.frequency} MHz</span>
        </div>
      </div>

      {/* Diagram Reference */}
      {geometryRules.diagramReference && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          📋 Refer to: {geometryRules.diagramReference}
        </div>
      )}
    </div>
  );
};
