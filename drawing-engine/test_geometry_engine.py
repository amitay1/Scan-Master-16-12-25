"""Tiny smoke test for GeometryEngine.

This does **not** require FreeCAD, only CadQuery. It exists so we can
quickly verify that the generic SolidSpec/GeometryEngine pipeline works
(locally or in CI) without needing TechDraw.
"""

from scanmaster_drawing_engine.geometry_engine import (
    GeometryEngine,
    SolidSpec,
    SketchCircle,
    Extrude,
    BaseBox,
    CutBox,
    ThroughHole,
)


def main() -> None:
    engine = GeometryEngine()

    # --- Simple ring-style solid ---
    ring_spec = SolidSpec(
        id="test-ring",
        operations=[
            SketchCircle(radius=10.0, is_hole=False),
            SketchCircle(radius=5.0, is_hole=True),
            Extrude(length=20.0),
        ],
    )
    ring = engine.build_solid(ring_spec)
    ring_shape = ring.val()
    print("Ring shape type:", ring_shape.ShapeType())

    # --- Calibration block-style solid ---
    block_spec = SolidSpec(
        id="test-block",
        operations=[
            BaseBox(width=50.0, depth=20.0, height=10.0, centered_xy=False, centered_z=False),
            CutBox(width=20.0, depth=20.0, height=5.0, center=(10.0, 10.0, 7.5)),
            ThroughHole(radius=3.0, depth=10.0, axis="z", center=(30.0, 0.0, 5.0)),
        ],
    )
    block = engine.build_solid(block_spec)
    block_shape = block.val()
    print("Block shape type:", block_shape.ShapeType())


if __name__ == "__main__":
    main()
