from __future__ import annotations

"""JSON-driven entrypoint for the ScanMaster CAD engine.

This module allows *runtime* (per-request) generation of CAD drawings
based purely on JSON specs coming from the Node/TypeScript side.

The idea is simple:

- The frontend builds a JSON object describing the part's geometry and
  drawing (no Python code, only data).
- The backend passes this JSON to this script (via stdin or a temp
  file).
- ``job_runner`` converts JSON → SolidSpec / DrawingSpec → CadQuery
  solid → TechDraw page → PDF/SVG.

This is what gives you the "מנוע גנרי שמתאים לכל צורה" בעולם האמיתי.
"""

import json
import sys
from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, List

import cadquery as cq

from scanmaster_drawing_engine.geometry_engine import (
    GeometryEngine,
    SolidSpec,
    SketchCircle,
    Extrude,
    BaseBox,
    CutBox,
    ThroughHole,
)
from scanmaster_drawing_engine.drawing_engine import (
    DrawingSpec,
    ViewSpec,
    DimensionSpec,
    generate_drawing,
)


# ----- JSON → Python spec helpers ----------------------------------------------


def _solid_spec_from_dict(data: Dict[str, Any]) -> SolidSpec:
    ops: List[Any] = []
    for op in data.get("operations", []):
        op_type = op.get("type")
        if op_type == "SketchCircle":
            ops.append(
                SketchCircle(
                    radius=float(op["radius"]),
                    is_hole=bool(op.get("is_hole", False)),
                )
            )
        elif op_type == "Extrude":
            ops.append(Extrude(length=float(op["length"])))
        elif op_type == "BaseBox":
            ops.append(
                BaseBox(
                    width=float(op["width"]),
                    depth=float(op["depth"]),
                    height=float(op["height"]),
                    centered_xy=bool(op.get("centered_xy", True)),
                    centered_z=bool(op.get("centered_z", False)),
                )
            )
        elif op_type == "CutBox":
            ops.append(
                CutBox(
                    width=float(op["width"]),
                    depth=float(op["depth"]),
                    height=float(op["height"]),
                    center=tuple(float(v) for v in op["center"]),
                )
            )
        elif op_type == "ThroughHole":
            ops.append(
                ThroughHole(
                    radius=float(op["radius"]),
                    depth=float(op["depth"]),
                    axis=str(op.get("axis", "z")),
                    center=tuple(float(v) for v in op.get("center", [0.0, 0.0, 0.0])),
                )
            )
        else:
            raise ValueError(f"Unsupported operation type in JSON: {op_type!r}")

    return SolidSpec(id=str(data["id"]), operations=ops)


def _drawing_spec_from_dict(data: Dict[str, Any]) -> DrawingSpec:
    views: List[ViewSpec] = []
    for v in data.get("views", []):
        direction = tuple(float(c) for c in v["direction"])
        section_normal_raw = v.get("section_normal")
        section_normal = (
            tuple(float(c) for c in section_normal_raw)
            if section_normal_raw is not None
            else None
        )
        views.append(
            ViewSpec(
                id=str(v["id"]),
                direction=direction,
                is_section=bool(v.get("is_section", False)),
                section_normal=section_normal,
                scale=float(v["scale"]) if v.get("scale") is not None else None,
            )
        )

    dims: List[DimensionSpec] = []
    for d in data.get("dimensions", []):
        dims.append(
            DimensionSpec(
                view_id=str(d["view_id"]),
                kind=str(d["kind"]),
                label=str(d["label"]),
                edges=[str(e) for e in d.get("edges", [])],
            )
        )

    return DrawingSpec(
        page_title=str(data["page_title"]),
        template_path=str(data["template_path"]),
        views=views,
        dimensions=dims,
    )


# ----- Job runner --------------------------------------------------------------


def run_job(job: Dict[str, Any]) -> Dict[str, Any]:
    """Execute one CAD job described by a JSON object.

    Expected JSON structure (high-level)::

        {
          "solid": { ...SolidSpec-like... },
          "drawing": { ...DrawingSpec-like... },
          "output_pdf": "path/to/file.pdf",
          "output_svg": "optional/path/to/file.svg"  # optional
        }

    Returns a small result dict with the resolved output paths.
    """

    solid_spec = _solid_spec_from_dict(job["solid"])
    drawing_spec = _drawing_spec_from_dict(job["drawing"])

    engine = GeometryEngine()
    solid: cq.Workplane = engine.build_solid(solid_spec)

    output_pdf = Path(job["output_pdf"]).resolve()
    output_svg_raw = job.get("output_svg")
    output_svg = str(Path(output_svg_raw).resolve()) if output_svg_raw else None

    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    generate_drawing(
        solid=solid,
        spec=drawing_spec,
        output_pdf=str(output_pdf),
        output_svg=output_svg,
    )

    return {
        "output_pdf": str(output_pdf),
        "output_svg": output_svg,
        "solid": asdict(solid_spec),
        "drawing": asdict(drawing_spec),
    }


def main(argv: list[str] | None = None) -> None:
    """CLI entrypoint.

    Usage patterns::

        # Read job JSON from stdin, write result JSON to stdout
        python job_runner.py < job.json

        # Or specify an input file explicitly
        python job_runner.py job.json
    """

    argv = list(sys.argv[1:] if argv is None else argv)

    if argv:
        job_json_path = Path(argv[0])
        with job_json_path.open("r", encoding="utf8") as f:
            job_data = json.load(f)
    else:
        job_data = json.load(sys.stdin)

    result = run_job(job_data)
    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":  # pragma: no cover - manual invocation only
    main()
