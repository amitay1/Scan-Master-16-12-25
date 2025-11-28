import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalibrationStandardRow } from "@/data/calibrationStandards";

interface CalibrationStandardsTableProps {
  standards: CalibrationStandardRow[];
  /** Row selected by the user */
  selectedId?: string;
  /** Row recommended by the AI */
  recommendedId?: string;
  onSelect: (row: CalibrationStandardRow) => void;
  /** Row being hovered for 3D highlight */
  onHover?: (defectId: string | null) => void;
}

export const CalibrationStandardsTable = ({
  standards,
  selectedId,
  recommendedId,
  onSelect,
  onHover,
}: CalibrationStandardsTableProps) => {
  if (!standards || standards.length === 0) return null;

  return (
    <div className="mt-6 border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b bg-muted/40">
        <div>
          <h3 className="text-sm font-semibold leading-tight">
            Campioni utilizzati per taratura
          </h3>
          <p className="text-xs text-muted-foreground -mt-0.5">
            Standards used for calibration (FBH Ø1.19 mm)
          </p>
        </div>
        {recommendedId && (
          <Badge className="text-xs bg-primary/90">
            Recommended depth highlighted below
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                Identificazione difetto
                <div className="text-[10px] text-muted-foreground font-normal">
                  Defect identification
                </div>
              </th>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                Tipologia
                <div className="text-[10px] text-muted-foreground font-normal">
                  Type
                </div>
              </th>
              <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                Profondità
                <div className="text-[10px] text-muted-foreground font-normal">
                  Depth (mm)
                </div>
              </th>
              <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                Diametro foro
                <div className="text-[10px] text-muted-foreground font-normal">
                  Hole diameter (mm)
                </div>
              </th>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {standards.map((row) => {
              const isSelected = row.defectId === selectedId;
              const isRecommended = row.defectId === recommendedId;

              return (
                <tr
                  key={row.defectId}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-primary/5",
                    !isSelected && isRecommended && "bg-accent/10",
                    !isSelected && !isRecommended && "hover:bg-muted/40",
                  )}
                  onClick={() => onSelect(row)}
                  onMouseEnter={() => onHover?.(row.defectId)}
                  onMouseLeave={() => onHover?.(null)}
                >
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary">{row.defectId}</span>
                      {isRecommended && (
                        <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/90 text-primary-foreground">
                          AI
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle text-[11px] font-semibold text-blue-700">
                    {row.type}
                  </td>
                  <td className="px-3 py-2 align-middle text-right tabular-nums">
                    {row.depthMm.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-middle text-right tabular-nums">
                    {row.holeDiameterMm.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-middle text-[11px] text-muted-foreground">
                    {row.note ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t bg-muted/40 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>
          All FBH samples in this table use Ø1.19&nbsp;mm (≈ 3/64") flat-bottom holes.
        </span>
        <span>
          Click a row to apply its depth as the calibration metal travel in the technique sheet.
        </span>
      </div>
    </div>
  );
};
