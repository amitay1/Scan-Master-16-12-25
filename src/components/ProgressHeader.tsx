import { LiquidProgressGauge } from "@/components/ui/liquid-progress-gauge";

interface ProgressHeaderProps {
  completionPercent: number;
  requiredFieldsComplete: number;
  totalRequiredFields: number;
}

export const ProgressHeader = ({ 
  completionPercent, 
  requiredFieldsComplete, 
  totalRequiredFields 
}: ProgressHeaderProps) => {
  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">Overall Progress</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {requiredFieldsComplete} of {totalRequiredFields} required fields completed
          </p>
          
          {/* Additional progress details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Status:</span>
              <span className={`font-medium ${completionPercent === 100 ? 'text-green-500' : completionPercent >= 75 ? 'text-blue-500' : completionPercent >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}>
                {completionPercent === 100 ? 'Complete' : completionPercent >= 75 ? 'Almost Done' : completionPercent >= 50 ? 'In Progress' : 'Getting Started'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fields Remaining:</span>
              <span className="font-medium text-foreground">{totalRequiredFields - requiredFieldsComplete}</span>
            </div>
          </div>
        </div>
        
        {/* Liquid Progress Gauge */}
        <div className="flex flex-col items-center">
          <LiquidProgressGauge value={completionPercent} />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Progress Gauge
          </p>
        </div>
      </div>
    </div>
  );
};
