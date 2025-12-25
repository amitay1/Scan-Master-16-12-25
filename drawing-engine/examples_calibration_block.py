"""Example: more complex calibration block with multiple views.

This script demonstrates using the generic GeometryEngine and
DrawingEngine to build a slightly more complex part than a pure ring:

- A rectangular calibration block (BaseBox)
- A step cut from one side (CutBox)
- Two through-holes along the Z axis (ThroughHole)
- A drawing with a front view, top view and an isometric view,
  including a few basic dimensions.

The exact dimensions are illustrative; the point is to show how to
express a more complex shape using *specs* only, without modifying the
engine.
"""

from __future__ import annotations

import os
from pathlib import Path

from scanmaster_drawing_engine.geometry_engine import (
    GeometryEngine,
    SolidSpec,
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


# ----- Part parameters ----------------------------------------------------------

BLOCK_LENGTH = 200.0  # along X
BLOCK_WIDTH = 80.0    # along Y
BLOCK_HEIGHT = 40.0   # along Z

STEP_LENGTH = 80.0
STEP_HEIGHT = 20.0

HOLE_RADIUS = 8.0
HOLE_OFFSET_X = 60.0
HOLE_OFFSET_Y = 0.0
HOLE_SPACING_X = 80.0

PART_ID = "CAL-BLOCK-001"


# ----- Solid spec ---------------------------------------------------------------


def calibration_block_solid_spec() -> SolidSpec:
    """Return a SolidSpec describing a stepped calibration block.

    1. BaseBox – the full rectangular block.
    2. CutBox – removes a step from the top front corner.
    3. Two ThroughHole operations – simple through-holes along Z.
    """

    base = BaseBox(
        width=BLOCK_LENGTH,
        depth=BLOCK_WIDTH,
        height=BLOCK_HEIGHT,
        centered_xy=False,
        centered_z=False,
    )

    # Step cut: remove a box from the top of the front half of the block.
    step_cut = CutBox(
        width=STEP_LENGTH,
        depth=BLOCK_WIDTH,
        height=STEP_HEIGHT,
        center=(STEP_LENGTH / 2.0, BLOCK_WIDTH / 2.0, BLOCK_HEIGHT - STEP_HEIGHT / 2.0),
    )

    hole1 = ThroughHole(
        radius=HOLE_RADIUS,
        depth=BLOCK_HEIGHT,
        axis="z",
        center=(HOLE_OFFSET_X, HOLE_OFFSET_Y, BLOCK_HEIGHT / 2.0),
    )
    hole2 = ThroughHole(
        radius=HOLE_RADIUS,
        depth=BLOCK_HEIGHT,
        axis="z",
        center=(HOLE_OFFSET_X + HOLE_SPACING_X, HOLE_OFFSET_Y, BLOCK_HEIGHT / 2.0),
    )

    return SolidSpec(
        id=PART_ID,
        operations=[base, step_cut, hole1, hole2],
    )


# ----- Drawing spec -------------------------------------------------------------


def calibration_block_drawing_spec(template_path: str) -> DrawingSpec:
    """Construct a DrawingSpec with several views and dimensions.

    We keep this intentionally simple; in FreeCAD you can refine edge
    names for dimensions once you inspect the result.
    """

    front_view = ViewSpec(
        id="FRONT",
        direction=(0.0, -1.0, 0.0),
        is_section=False,
        scale=0.5,
    )

    top_view = ViewSpec(
        id="TOP",
        direction=(0.0, 0.0, 1.0),
        is_section=False,
        scale=0.5,
    )

    iso_view = ViewSpec(
        id="ISO",
        direction=(1.0, -1.0, 1.0),
        is_section=False,
        scale=0.4,
    )

    dimensions = [
        DimensionSpec(
            view_id="FRONT",
            kind="linear",
            label=f"{BLOCK_LENGTH:.1f} mm",
            edges=["Edge1"],
        ),
        DimensionSpec(
            view_id="FRONT",
            kind="linear",
            label=f"{BLOCK_HEIGHT:.1f} mm",
            edges=["Edge2"],
        ),
        DimensionSpec(
            view_id="TOP",
            kind="linear",
            label=f"{BLOCK_WIDTH:.1f} mm",
            edges=["Edge1"],
        ),
        DimensionSpec(
            view_id="TOP",
            kind="linear",
            label=f"{HOLE_SPACING_X:.1f} mm",
            edges=["Edge2"],
        ),
        DimensionSpec(
            view_id="TOP",
            kind="diameter",
            label=f"Ø {2 * HOLE_RADIUS:.1f} mm",
            edges=["Edge3"],
        ),
    ]

    return DrawingSpec(
        page_title=f"DRW_{PART_ID}",
        template_path=template_path,
        views=[front_view, top_view, iso_view],
        dimensions=dimensions,
    )


# ----- Main ---------------------------------------------------------------------


def main() -> None:
    template_path = os.environ.get("TECHDRAW_TEMPLATE_PATH")
    if not template_path:
        raise RuntimeError(
            "TECHDRAW_TEMPLATE_PATH environment variable must point to a TechDraw "
            "SVG template, e.g. FreeCAD's A4_LandscapeTD.svg"
        )

    solid_spec = calibration_block_solid_spec()
    engine = GeometryEngine()
    solid = engine.build_solid(solid_spec)

    drawing_spec = calibration_block_drawing_spec(template_path)

    out_dir = Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = out_dir / "calibration_block.pdf"

    generate_drawing(
        solid=solid,
        spec=drawing_spec,
        output_pdf=str(pdf_path),
        output_svg=None,
    )

    print(f"PDF drawing written to: {pdf_path}")


if __name__ == "__main__":
    main()
