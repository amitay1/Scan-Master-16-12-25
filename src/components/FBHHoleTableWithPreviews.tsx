/**
 * FBH Hole Table with Real-Time Large Previews
 * Combines the FBH table with LARGE dynamic calibration block visualizations
 * Each row in the table gets its own full-size preview that updates in real-time
 */

import { FBHHoleTable } from './FBHHoleTable';
import { FBHBlockPreview } from './FBHBlockPreview';
import type { FBHHoleRowData } from '@/data/fbhStandardsData';

interface FBHHoleTableWithPreviewsProps {
  holes: FBHHoleRowData[];
  onChange: (holes: FBHHoleRowData[]) => void;
  maxHoles?: number;
  minHoles?: number;
  showPartNumber?: boolean;
  showDeltaType?: boolean;
  showSoundPath?: boolean;
  standard?: string;
  /** Preview size - LARGE by default (350x450) */
  previewWidth?: number;
  previewHeight?: number;
}

export function FBHHoleTableWithPreviews({
  holes,
  onChange,
  maxHoles = 5,
  minHoles = 1,
  showPartNumber = true,
  showDeltaType = true,
  showSoundPath = false,
  standard = "All",
  previewWidth = 350,
  previewHeight = 450,
}: FBHHoleTableWithPreviewsProps) {
  return (
    <div className="space-y-6">
      {/* Calibration Block Previews - LARGE Dynamic based on rows */}
      <div
        id="calibration-blocks-container"
        data-testid="calibration-blocks-container"
        className="border-2 rounded-xl p-6 bg-gradient-to-b from-slate-50 to-slate-100 shadow-sm calibration-blocks-preview"
      >
        <h5 className="text-lg font-bold mb-4 text-center text-slate-700">
          Calibration Block Previews (Real-Time Updates)
        </h5>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Each preview updates automatically when you change values in the table below
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {holes.map((hole) => (
            <FBHBlockPreview
              key={hole.id}
              holeId={hole.id}
              diameterMm={hole.diameterMm}
              blockHeightE={hole.blockHeightE}
              metalTravelH={hole.metalTravelH}
              width={previewWidth}
              height={previewHeight}
            />
          ))}
        </div>
        {holes.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-lg">
            No holes defined. Add a row to see the preview.
          </div>
        )}
      </div>

      {/* FBH Table */}
      <FBHHoleTable
        holes={holes}
        onChange={onChange}
        maxHoles={maxHoles}
        minHoles={minHoles}
        showPartNumber={showPartNumber}
        showDeltaType={showDeltaType}
        showSoundPath={showSoundPath}
        standard={standard}
      />
    </div>
  );
}

export default FBHHoleTableWithPreviews;
