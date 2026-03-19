import { useEffect, useState } from "react";
import { RingSegmentBlockDrawing } from "@/components/drawings/RingSegmentBlockDrawing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PartDimensionsOverride } from "@/types/ringSegmentBlock.types";
import { useSearchParams } from "react-router-dom";

type PresetId = "tuv_large" | "en_medium" | "astm_compact";

interface PresetDefinition {
  id: PresetId;
  label: string;
  templateId: string;
  standardFamily: "EN" | "ASTM" | "TUV";
  description: string;
  reference: string;
  partDimensions: PartDimensionsOverride;
}

const PRESETS: PresetDefinition[] = [
  {
    id: "tuv_large",
    label: "TUV Large",
    templateId: "TUV_STYLE_REF_BLOCK",
    standardFamily: "TUV",
    description: "Closest internal benchmark to Technical card TUV, page 17, Fig. 4.",
    reference: "OD 671.02 / ID 476.2 / W 125 / 120 deg",
    partDimensions: {
      outerDiameterMm: 671.02,
      innerDiameterMm: 476.2,
      axialWidthMm: 125,
      segmentAngleDeg: 120,
    },
  },
  {
    id: "en_medium",
    label: "EN Medium",
    templateId: "EN_10228_DAC_REF_BLOCK",
    standardFamily: "EN",
    description: "Medium ring segment for EN style validation without TUV-only lug geometry.",
    reference: "OD 420 / ID 260 / W 125 / 120 deg",
    partDimensions: {
      outerDiameterMm: 420,
      innerDiameterMm: 260,
      axialWidthMm: 125,
      segmentAngleDeg: 120,
    },
  },
  {
    id: "astm_compact",
    label: "ASTM Compact",
    templateId: "ASTM_E428_FBH_BLOCK",
    standardFamily: "ASTM",
    description: "Compact FBH validation for smaller curved parts and non-TUV proportions.",
    reference: "OD 300 / ID 200 / W 100 / 90 deg",
    partDimensions: {
      outerDiameterMm: 300,
      innerDiameterMm: 200,
      axialWidthMm: 100,
      segmentAngleDeg: 90,
    },
  },
];

export default function RingSegmentReferenceTest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const presetFromQuery = searchParams.get("preset") as PresetId | null;
  const [selectedPresetId, setSelectedPresetId] = useState<PresetId>(
    PRESETS.some((preset) => preset.id === presetFromQuery) ? presetFromQuery! : "tuv_large"
  );

  useEffect(() => {
    if (presetFromQuery && PRESETS.some((preset) => preset.id === presetFromQuery)) {
      setSelectedPresetId(presetFromQuery);
    }
  }, [presetFromQuery]);

  const selectedPreset = PRESETS.find((preset) => preset.id === selectedPresetId) || PRESETS[0];
  const drawingKey = `${selectedPreset.templateId}-${selectedPreset.reference}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-6">
      <div className="max-w-[1680px] mx-auto space-y-4">
        <Card className="border-slate-300 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle>Ring Segment Reference Test</CardTitle>
            <CardDescription>
              Internal QA page for the angle beam ring segment renderer. Use this page to compare the
              dynamic output against the TUV Fig. 4 quality target and the EN/ASTM variants.
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant={preset.id === selectedPresetId ? "default" : "outline"}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setSearchParams({ preset: preset.id });
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-800">Template:</span> {selectedPreset.templateId}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Reference:</span> {selectedPreset.reference}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Intent:</span> {selectedPreset.description}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-300 shadow-sm">
          <CardContent className="p-4">
            <RingSegmentBlockDrawing
              key={drawingKey}
              initialTemplateId={selectedPreset.templateId}
              preferredStandardFamily={selectedPreset.standardFamily}
              partDimensions={selectedPreset.partDimensions}
              width={1500}
              height={1060}
              showControls={false}
              showTable={false}
              showWarnings={true}
              showExport={false}
              title=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
