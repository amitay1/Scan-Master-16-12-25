"""Example: Fig. 1-style full ring drawing.

This script demonstrates the full pipeline for one simple part:

* Build a ring solid in CadQuery using the generic GeometryEngine
* Feed it into the generic DrawingEngine
* Generate a TechDraw page with a section view and a few dimensions

It is intentionally kept as a *concrete* example on top of the generic
APIs defined in :mod:`scanmaster_drawing_engine.geometry_engine` and
:mod:`scanmaster_drawing_engine.drawing_engine`.

To run it you must have:

* CadQuery installed in your Python environment
* FreeCAD + TechDraw installed on your machine
* The environment variable ``FREECAD_PATH`` pointing to the FreeCAD
  ``bin`` or ``lib`` directory so that ``import FreeCAD`` works
* The environment variable ``TECHDRAW_TEMPLATE_PATH`` pointing to an
  SVG template file (for example FreeCAD's
  ``A4_LandscapeTD.svg``)

Example on Windows (PowerShell)::

    $env:FREECAD_PATH = "C:/Program Files/FreeCAD 0.21/bin"
    $env:TECHDRAW_TEMPLATE_PATH = "C:/Program Files/FreeCAD 0.21/data/Mod/TechDraw/Templates/A4_LandscapeTD.svg"
    python examples_full_ring_fig1.py

The script will write ``out/full_ring_fig1.pdf`` (and optionally an SVG
if you enable it).
"""

from __future__ import annotations

import os
from pathlib import Path

from scanmaster_drawing_engine.geometry_engine import (
    GeometryEngine,
    SolidSpec,
    SketchCircle,
    Extrude,
)
from scanmaster_drawing_engine.drawing_engine import (
    DrawingSpec,
    ViewSpec,
    DimensionSpec,
    generate_drawing,
)


# ----- Part geometry (roughly matching your Fig. 1) -----------------------------

LENGTH = 736.0
LENGTH_TOL = 1.0
OD = 639.9
OD_TOL = 0.1
ID = 478.0
ID_TOL = 0.1

PART_ID = "PART-001"


def full_ring_solid_spec() -> SolidSpec:
    """Return a SolidSpec for a simple full ring.

    The spec is intentionally generic: it just says "two circles and an
    extrude" – no special knowledge about "ring" exists inside the
    engine itself.
    """

    return SolidSpec(
        id=PART_ID,
        operations=[
            SketchCircle(radius=OD / 2.0, is_hole=False),
            SketchCircle(radius=ID / 2.0, is_hole=True),
            Extrude(length=LENGTH),
        ],
    )


# ----- Drawing spec -------------------------------------------------------------


def full_ring_drawing_spec(template_path: str) -> DrawingSpec:
    """Build a basic DrawingSpec for the full ring.

    We define one section view through the axis (analogous to Fig. 1) and
    three dimensions (length, OD, ID). Edge names are *heuristic* and
    might need fine-tuning once you inspect the generated drawing in
    FreeCAD, but the pipeline is fully wired.
    """

    main_view = ViewSpec(
        id="SECTION_AA",
        # Look from +Y so that we see the XZ section.
        direction=(0.0, 1.0, 0.0),
        is_section=True,
        section_normal=(0.0, 1.0, 0.0),
        scale=0.25,
    )

    dimensions = [
        # Overall length along Z (section view edge index may require
        # adjustment in FreeCAD; these are reasonable defaults).
        DimensionSpec(
            view_id="SECTION_AA",
            kind="linear",
            label=f"{LENGTH:.1f} ± {LENGTH_TOL:.1f} mm",
            edges=["Edge1"],
        ),
        # Outer diameter.
        DimensionSpec(
            view_id="SECTION_AA",
            kind="diameter",
            label=f"Ø {OD:.1f} ± {OD_TOL:.1f} mm",
            edges=["Edge2"],
        ),
        # Inner diameter.
        DimensionSpec(
            view_id="SECTION_AA",
            kind="diameter",
            label=f"Ø {ID:.1f} ± {ID_TOL:.1f} mm",
            edges=["Edge3"],
        ),
    ]

    return DrawingSpec(
        page_title=f"DRW_{PART_ID}",
        template_path=template_path,
        views=[main_view],
        dimensions=dimensions,
    )


# ----- Main script --------------------------------------------------------------


def main() -> None:
    template_path = os.environ.get("TECHDRAW_TEMPLATE_PATH")
    if not template_path:
        raise RuntimeError(
            "TECHDRAW_TEMPLATE_PATH environment variable must point to a TechDraw "
            "SVG template, e.g. FreeCAD's A4_LandscapeTD.svg"
        )

    solid_spec = full_ring_solid_spec()
    engine = GeometryEngine()
    solid = engine.build_solid(solid_spec)

    drawing_spec = full_ring_drawing_spec(template_path)

    out_dir = Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = out_dir / "full_ring_fig1.pdf"
    # If you also want SVG, set svg_path below.
    svg_path = None  # or out_dir / "full_ring_fig1.svg"

    generate_drawing(
        solid=solid,
        spec=drawing_spec,
        output_pdf=str(pdf_path),
        output_svg=str(svg_path) if svg_path is not None else None,
    )

    print(f"PDF drawing written to: {pdf_path}")


if __name__ == "__main__":
    main()
