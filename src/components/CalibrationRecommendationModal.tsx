import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CalibrationRecommendation } from "@/types/techniqueSheet";
import { CalibrationBlockViewer } from "./CalibrationBlockViewer";
import { CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalibrationRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: CalibrationRecommendation | null;
  onApply: () => void;
  partInfo: {
    material: string;
    partType: string;
    thickness: number;
    acceptanceClass: string;
  };
}

export const CalibrationRecommendationModal = ({
  open,
  onOpenChange,
  recommendation,
  onApply,
  partInfo
}: CalibrationRecommendationModalProps) => {
  const isMobile = useIsMobile();
  
  if (!recommendation) return null;

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const content = (
    <>
      {/* Key Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Standard Type</p>
                  <p className="text-lg font-semibold text-primary">{recommendation.standardType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">per {recommendation.referenceFigure}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Material</p>
                  <p className="text-lg font-semibold text-primary">{recommendation.material.split('(')[0].trim()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{recommendation.material.match(/\(([^)]+)\)/)?.[1]}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">FBH Sizes</p>
                  <p className="text-lg font-semibold text-primary">{recommendation.fbhSizes.join('", ')}\"</p>
                  <p className="text-xs text-muted-foreground mt-1">{recommendation.fbhSizes.length} holes</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Metal Travel</p>
                  <p className="text-lg font-semibold text-primary">
                    {recommendation.metalTravel.distances.map(d => d.toFixed(1)).join(', ')}mm
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{recommendation.metalTravel.tolerance}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Frequency</p>
                  <p className="text-lg font-semibold text-primary">{recommendation.frequency} MHz</p>
                  <p className="text-xs text-muted-foreground mt-1">Recommended</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Transducer</p>
                  <p className="text-lg font-semibold text-primary">{recommendation.transducerDiameter}</p>
                  <p className="text-xs text-muted-foreground mt-1">diameter</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Visualization */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-foreground">3D Calibration Block</h4>
            <div className="h-80">
              <CalibrationBlockViewer recommendation={recommendation} />
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Lightbulb className="h-5 w-5 text-accent mt-0.5" />
              <h4 className="text-sm font-semibold text-foreground">Why this recommendation?</h4>
            </div>
            <div className="space-y-2 ml-8">
              <p className="text-sm text-foreground">• <span className="font-medium">Material:</span> {recommendation.reasoning.material}</p>
              <p className="text-sm text-foreground">• <span className="font-medium">Block Type:</span> {recommendation.reasoning.blockType}</p>
              <p className="text-sm text-foreground">• <span className="font-medium">FBH:</span> {recommendation.reasoning.fbh}</p>
              <p className="text-sm text-foreground">• <span className="font-medium">Frequency:</span> {recommendation.reasoning.frequency}</p>
              <p className="text-sm text-foreground">• <span className="font-medium">Travel:</span> {recommendation.reasoning.travel}</p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Confidence Score</span>
              </div>
              <span className="text-lg font-bold text-primary">{recommendation.confidence}%</span>
            </div>
            <Progress value={recommendation.confidence} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {recommendation.confidence >= 90 && "Highly confident - standard material and geometry"}
              {recommendation.confidence >= 75 && recommendation.confidence < 90 && "Good confidence - minor deviations from standard"}
              {recommendation.confidence < 75 && "Moderate confidence - manual verification recommended"}
            </p>
          </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleApply} className="gradient-primary">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Apply to Form
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 text-xl">
              🎯 Recommended Calibration Model
            </DrawerTitle>
            <DrawerDescription>
              Based on: {partInfo.material}, {partInfo.partType}, {partInfo.thickness}mm, Class {partInfo.acceptanceClass}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="max-h-[70vh] px-4">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            🎯 Recommended Calibration Model
          </DialogTitle>
          <DialogDescription>
            Based on: {partInfo.material}, {partInfo.partType}, {partInfo.thickness}mm, Class {partInfo.acceptanceClass}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
