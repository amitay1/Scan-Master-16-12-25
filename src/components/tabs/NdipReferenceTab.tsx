import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StandardType } from "@/types/techniqueSheet";

interface NdipReferenceTabProps {
  standard: StandardType;
}

const getStandardLabel = (standard: StandardType) =>
  standard === "NDIP-1226" ? "NDIP-1226 Rev F" : "NDIP-1227 Rev D";

export const NdipReferenceTab = ({ standard }: NdipReferenceTabProps) => {
  return (
    <div className="space-y-4 p-3 md:p-4">
      <Card className="border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">NDIP Calibration Reference</h3>
            <p className="text-xs text-muted-foreground">
              Summary of the calibration workflow carried into the dedicated NDIP tabs.
            </p>
          </div>
          <Badge variant="outline">{getStandardLabel(standard)}</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-blue-500/30 bg-blue-500/5 p-4">
          <h4 className="text-sm font-semibold">Page 7: Calibration Setup</h4>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Set water path to 8 inches before and after transducer angulation.</li>
            <li>Use an incident angle in the 18-21 degree range; the nominal setup is about 18.6 degrees.</li>
            <li>Normalize A and B axes to maximize the 45-degree back surface response.</li>
            <li>Maximize FBH targets L through S and omit holes J and K.</li>
          </ul>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
          <h4 className="text-sm font-semibold">Page 8: DAC / Corrections</h4>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Establish DAC so every active No. 1 FBH reaches 80% FSH.</li>
            <li>Add Pratt-specific curvature correction to each DAC point.</li>
            <li>Add the calibration-standard gain offsets from the calibration card.</li>
            <li>Post-calibration must verify every used DAC point against the initial calibration.</li>
          </ul>
        </Card>

        <Card className="border-violet-500/30 bg-violet-500/5 p-4">
          <h4 className="text-sm font-semibold">Page 9: Post-Calibration</h4>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Acceptable post-calibration variance is within +/-1 dB.</li>
            <li>Out-of-tolerance post-calibration requires re-scan according to the NDIP rules.</li>
            <li>Calibration and post-calibration records must be reported to Pratt & Whitney via MFT.</li>
            <li>Post-calibration is required before shift change, part number change, transducer change, or after an unexpected interruption.</li>
            <li>Calibration blocks require yearly recertification at Pratt & Whitney NDE.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
