import { useState } from "react";
import { LiquidProgressGauge } from "@/components/ui/liquid-progress-gauge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function GaugeDemo() {
  const [progress, setProgress] = useState(30);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">
          Liquid Progress Gauge Demo
        </h1>
        
        {/* Main Gauge Display */}
        <div className="flex justify-center mb-8">
          <LiquidProgressGauge value={progress} />
        </div>
        
        {/* Progress Info */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-foreground">
            Current Progress: <span className="text-primary">{progress}%</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {progress === 0 && "Just getting started..."}
            {progress > 0 && progress < 25 && "Keep going, you're making progress!"}
            {progress >= 25 && progress < 50 && "Quarter way there!"}
            {progress >= 50 && progress < 75 && "Halfway complete!"}
            {progress >= 75 && progress < 100 && "Almost done!"}
            {progress === 100 && "Congratulations! All complete!"}
          </p>
        </div>
        
        {/* Progress Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Adjust Progress
            </label>
            <Slider 
              value={[progress]} 
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          {/* Quick Set Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <Button 
              onClick={() => setProgress(0)}
              variant="outline"
              size="sm"
            >
              0%
            </Button>
            <Button 
              onClick={() => setProgress(25)}
              variant="outline"
              size="sm"
            >
              25%
            </Button>
            <Button 
              onClick={() => setProgress(50)}
              variant="outline"
              size="sm"
            >
              50%
            </Button>
            <Button 
              onClick={() => setProgress(75)}
              variant="outline"
              size="sm"
            >
              75%
            </Button>
            <Button 
              onClick={() => setProgress(100)}
              variant="outline"
              size="sm"
            >
              100%
            </Button>
          </div>
          
          {/* Animation Test */}
          <Button 
            onClick={() => {
              setProgress(0);
              setTimeout(() => setProgress(100), 100);
            }}
            className="w-full"
          >
            Test Animation (0% → 100%)
          </Button>
        </div>
        
        {/* Feature Notes */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Features:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✨ Smooth liquid filling animation</li>
            <li>🌊 Realistic wave effects on liquid surface</li>
            <li>💧 Animated bubbles rising through liquid</li>
            <li>🔮 Glass test tube with transparency effects</li>
            <li>✨ Shimmer and glow animations</li>
            <li>📊 Clear percentage display</li>
          </ul>
        </div>
      </div>
    </div>
  );
}