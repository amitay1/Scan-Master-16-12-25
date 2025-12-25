from __future__ import annotations

"""Generic geometry engine built on CadQuery.

This module defines small, declarative specs for solids and a
``GeometryEngine`` that turns them into CadQuery workplanes/solids.

The engine is intentionally generic and does *not* know about
application-level parts such as rings, blocks, calibration segments,
etc. Those should be expressed purely as ``SolidSpec`` instances built
in higher-level code (or from JSON coming from your TypeScript side).
"""

from dataclasses import dataclass
from typing import List, Literal, Union, Optional

import cadquery as cq


# ----- sketch / operation specs -------------------------------------------------


@dataclass
class SketchCircle:
    """A circle in the XY sketch plane.

    Parameters
    ----------
    radius:
        Circle radius in model units (typically millimetres).
    is_hole:
        If ``True``, this circle will be used to cut material out of the
        main solid (e.g. the inner diameter of a ring).
    """

    radius: float
    is_hole: bool = False


@dataclass
class Extrude:
    """Extrusion along the +Z axis from the current sketch profile."""

    length: float


@dataclass
class BaseBox:
    """Axis-aligned box primitive used as a base solid.

    The box is created on the XY plane and extends along +Z. By default
    the box is centred around the origin in X/Y and starts at Z=0.
    """

    width: float
    depth: float
    height: float
    centered_xy: bool = True
    centered_z: bool = False


@dataclass
class CutBox:
    """Axis-aligned box that is *subtracted* (cut) from the current solid."""

    width: float
    depth: float
    height: float
    center: tuple[float, float, float]


@dataclass
class ThroughHole:
    """Cylindrical through-hole cut into the current solid.

    The cylinder's axis is given by ``axis`` (one of "x", "y", "z") and
    the cylinder is centred at ``center``.
    """

    radius: float
    depth: float
    axis: Literal["x", "y", "z"] = "z"
    center: tuple[float, float, float] = (0.0, 0.0, 0.0)


Operation = Union[SketchCircle, Extrude, BaseBox, CutBox, ThroughHole]


@dataclass
class SolidSpec:
    """Generic description of how to build one solid body.

    The semantics are deliberately simple for the first iteration:

        * Start on the XY workplane at the origin.
        * Either:
            * Apply zero or more sketch operations (currently only circles)
                followed by exactly one ``Extrude`` operation to obtain a 3D
                solid, **or**
            * Use a single :class:`BaseBox` operation to define the base
                solid directly.
        * Optionally apply one or more 3D modifier operations such as
            :class:`CutBox` or :class:`ThroughHole` to remove material.

    More operation types (rectangles, pockets, chamfers, etc.) can be
    added later without changing the overall structure.
    """

    id: str
    operations: List[Operation]


class GeometryEngine:
    """Builds CadQuery solids from :class:`SolidSpec` objects.

    The engine knows how to interpret a minimal set of operations. It is
    intentionally stateless and functional – you can create a new
    instance per build, or keep one global instance.
    """

    def build_solid(self, spec: SolidSpec) -> cq.Workplane:
        """Build a CadQuery workplane representing the given solid.

        Parameters
        ----------
        spec:
            High-level description of the solid.

        Returns
        -------
        cq.Workplane
            A CadQuery workplane whose current object is the resulting
            solid. You can pass this directly to FreeCAD using
            ``solid.val().toFreecad()``.
        """

        if not spec.operations:
            raise ValueError(f"SolidSpec '{spec.id}' contains no operations")

        # First pass: collect operations into high-level buckets so that
        # we can support both "sketch + extrude" and "BaseBox" styles,
        # along with 3D modifiers.
        sketch_circles: List[SketchCircle] = []
        extrude_op: Optional[Extrude] = None
        base_box: Optional[BaseBox] = None
        cut_boxes: List[CutBox] = []
        through_holes: List[ThroughHole] = []

        for op in spec.operations:
            if isinstance(op, SketchCircle):
                if op.radius <= 0:
                    raise ValueError("SketchCircle.radius must be positive")
                sketch_circles.append(op)
            elif isinstance(op, Extrude):
                if extrude_op is not None:
                    raise ValueError(
                        f"SolidSpec '{spec.id}' contains multiple Extrude operations; "
                        "only one is supported in this version."
                    )
                if op.length <= 0:
                    raise ValueError("Extrude.length must be positive")
                extrude_op = op
            elif isinstance(op, BaseBox):
                if base_box is not None:
                    raise ValueError(
                        f"SolidSpec '{spec.id}' defines multiple BaseBox operations; "
                        "only one base primitive is supported."
                    )
                if op.width <= 0 or op.depth <= 0 or op.height <= 0:
                    raise ValueError("BaseBox dimensions must be positive")
                base_box = op
            elif isinstance(op, CutBox):
                if op.width <= 0 or op.depth <= 0 or op.height <= 0:
                    raise ValueError("CutBox dimensions must be positive")
                cut_boxes.append(op)
            elif isinstance(op, ThroughHole):
                if op.radius <= 0 or op.depth <= 0:
                    raise ValueError("ThroughHole.radius/depth must be positive")
                if op.axis not in ("x", "y", "z"):
                    raise ValueError("ThroughHole.axis must be one of 'x', 'y', 'z'")
                through_holes.append(op)
            else:  # pragma: no cover - future-proofing
                raise TypeError(f"Unsupported operation type: {type(op)!r}")

        if base_box and (sketch_circles or extrude_op):
            raise ValueError(
                f"SolidSpec '{spec.id}' mixes BaseBox with sketch/extrude operations; "
                "choose one style for the base solid."
            )

        if base_box is None and extrude_op is None:
            raise ValueError(
                f"SolidSpec '{spec.id}' must define either a BaseBox or an Extrude "
                "operation with supporting sketch geometry."
            )

        # Build the base solid.
        if base_box is not None:
            bb = base_box
            solid = (
                cq.Workplane("XY")
                .box(
                    bb.width,
                    bb.depth,
                    bb.height,
                    centered=(bb.centered_xy, bb.centered_xy, bb.centered_z),
                )
            )
        else:
            # Base sketch for the main material (non-hole circles).
            wp = cq.Workplane("XY")

            # First, draw all non-hole circles into a single sketch profile.
            for sc in sketch_circles:
                if not sc.is_hole:
                    wp = wp.circle(sc.radius)

            # If there were no non-hole circles, we still want something to
            # extrude; otherwise CadQuery would error. This is a guard
            # against malformed specs.
            if wp.objects is None or len(wp.objects) == 0:
                raise ValueError(
                    f"SolidSpec '{spec.id}' defines no positive geometry to extrude"
                )

            solid = wp.extrude(extrude_op.length)  # type: ignore[arg-type]

            # Then, cut hole circles as separate extruded tools.
            for sc in sketch_circles:
                if sc.is_hole:
                    hole_wp = cq.Workplane("XY").circle(sc.radius)
                    hole = hole_wp.extrude(extrude_op.length)  # type: ignore[arg-type]
                    solid = solid.cut(hole)

        # Apply 3D modifier operations.
        for cb in cut_boxes:
            cx, cy, cz = cb.center
            tool = (
                cq.Workplane("XY")
                .center(cx, cy)
                .box(cb.width, cb.depth, cb.height, centered=(True, True, True))
            )
            tool = tool.translate((0, 0, cz))
            solid = solid.cut(tool)

        for hole in through_holes:
            cx, cy, cz = hole.center
            if hole.axis == "z":
                tool = (
                    cq.Workplane("XY")
                    .center(cx, cy)
                    .circle(hole.radius)
                    .extrude(hole.depth * 2, both=True)
                )
            elif hole.axis == "x":
                tool = (
                    cq.Workplane("YZ")
                    .center(cz, cy)
                    .circle(hole.radius)
                    .extrude(hole.depth * 2, both=True)
                )
            else:  # "y"
                tool = (
                    cq.Workplane("XZ")
                    .center(cx, cz)
                    .circle(hole.radius)
                    .extrude(hole.depth * 2, both=True)
                )

            solid = solid.cut(tool)

        return solid
