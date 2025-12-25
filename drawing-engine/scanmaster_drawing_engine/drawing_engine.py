from __future__ import annotations

"""Generic drawing engine built on FreeCAD/TechDraw.

This module intentionally abstracts away from any specific part
("ring", "segment", etc.) and instead works with high-level drawing
concepts: views, sections, and dimensions.

It expects a CadQuery solid (typically produced by
:mod:`scanmaster_drawing_engine.geometry_engine`) and a
:class:`DrawingSpec` describing how the drawing page should look, and it
uses FreeCAD's TechDraw workbench to generate a proper CAD drawing as a
PDF (and optionally SVG).

Important
---------
This code assumes that FreeCAD and TechDraw are available in your
Python environment. Because FreeCAD is usually distributed as an
application, you must point ``FREECAD_PATH`` to its ``bin`` or ``lib``
folder so that ``import FreeCAD`` and ``import TechDraw`` succeed.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import cadquery as cq


# ----- Specs --------------------------------------------------------------------


@dataclass
class ViewSpec:
    """Specification of a single view on the drawing page.

    Parameters
    ----------
    id:
        Identifier for this view (used as the FreeCAD object name).
    direction:
        Projection direction as a 3-tuple (x, y, z).
    is_section:
        If ``True``, the view will be marked as a section view and
        TECHDRAW will cut the part with a section plane normal to
        ``section_normal``.
    section_normal:
        Normal vector of the section plane. Only meaningful when
        ``is_section`` is ``True``.
    scale:
        Optional view scale factor. If ``None``, TechDraw will use its
        default.
    """

    id: str
    direction: Tuple[float, float, float]
    is_section: bool = False
    section_normal: Optional[Tuple[float, float, float]] = None
    scale: Optional[float] = None


@dataclass
class DimensionSpec:
    """Specification of one dimension tied to a view.

    This is intentionally abstract and only covers a tiny subset of what
    TechDraw can do. You can always extend this later once you see the
    basic pipeline working.

    Parameters
    ----------
    view_id:
        ID of the view this dimension belongs to.
    kind:
        Dimension kind, such as ``"linear"`` or ``"diameter"``.
    label:
        Human-readable label / format string for the dimension.
    edges:
        Names of edges within the given view that this dimension should
        reference, e.g. ``["Edge1", "Edge2"]``. These names are the
        ones shown in FreeCAD's selection view for TechDraw.
    """

    view_id: str
    kind: str
    label: str
    edges: List[str]


@dataclass
class DrawingSpec:
    """High-level specification of an entire drawing page."""

    page_title: str
    template_path: str
    views: List[ViewSpec]
    dimensions: List[DimensionSpec]


# ----- FreeCAD / TechDraw glue --------------------------------------------------


def _ensure_freecad_on_path() -> None:
    """Ensure the FreeCAD libraries are importable.

    This uses the ``FREECAD_PATH`` environment variable, which should
    point to either the ``bin`` or ``lib`` folder of your FreeCAD
    installation.
    """

    import os
    import sys

    freecad_path = os.environ.get("FREECAD_PATH")
    if not freecad_path:
        raise RuntimeError(
            "FREECAD_PATH environment variable must point to the FreeCAD 'bin' "
            "or 'lib' directory so that 'import FreeCAD' works."
        )

    if freecad_path not in sys.path:
        sys.path.append(freecad_path)


def generate_drawing(
    solid: cq.Workplane,
    spec: DrawingSpec,
    output_pdf: str,
    output_svg: Optional[str] = None,
) -> None:
    """Generate a CAD drawing from a CadQuery solid and a spec.

    Parameters
    ----------
    solid:
        CadQuery workplane whose current object is the solid body.
    spec:
        High-level drawing specification (views + dimensions).
    output_pdf:
        Target path for the generated PDF.
    output_svg:
        Optional path for an additional SVG export of the same page.
    """

    _ensure_freecad_on_path()

    # Import FreeCAD lazily after the path was set up.
    import FreeCAD as App  # type: ignore[import]
    import TechDraw  # type: ignore[import]

    doc = App.newDocument(spec.page_title)

    # Add the part solid to the document.
    part_obj = doc.addObject("Part::Feature", "Body")
    part_obj.Shape = solid.val().toFreecad()
    doc.recompute()

    # Create a TechDraw page with an SVG template (e.g. A4 landscape).
    page = doc.addObject("TechDraw::DrawPage", "Page")
    template = doc.addObject("TechDraw::DrawSVGTemplate", "Template")
    template.Template = spec.template_path
    page.Template = template

    # First pass: create all views and remember them by ID.
    view_objects: dict[str, object] = {}

    for vspec in spec.views:
        view = doc.addObject("TechDraw::DrawViewPart", vspec.id)
        view.Source = [part_obj]
        view.Direction = vspec.direction

        if vspec.scale is not None:
            view.Scale = vspec.scale

        if vspec.is_section:
            view.Section = True
            if vspec.section_normal is not None:
                view.SectionNormal = vspec.section_normal

        page.addView(view)
        view_objects[vspec.id] = view

    doc.recompute()

    # Second pass: add dimensions.
    for dspec in spec.dimensions:
        view_obj = view_objects.get(dspec.view_id)
        if view_obj is None:
            raise KeyError(
                f"DimensionSpec refers to unknown view_id '{dspec.view_id}'"
            )

        dim = doc.addObject("TechDraw::DrawViewDimension", f"Dim_{dspec.view_id}")

        # Basic mapping from our abstract 'kind' to TechDraw's 'Type'.
        kind_lower = dspec.kind.lower()
        if kind_lower in {"linear", "distance"}:
            dim.Type = "Distance"
        elif kind_lower in {"diameter", "radial", "radius"}:
            dim.Type = "Diameter"
        else:
            # Fallback – TechDraw will still try to interpret it.
            dim.Type = dspec.kind

        # Attach the dimension to specific edges on the view.
        dim.References2D = [(view_obj, edge_name) for edge_name in dspec.edges]

        dim.FormatSpec = dspec.label
        page.addView(dim)

    doc.recompute()

    # Export:
    out_pdf_path = Path(output_pdf)
    out_pdf_path.parent.mkdir(parents=True, exist_ok=True)
    page.exportPageAsPdf(str(out_pdf_path))

    if output_svg is not None:
        out_svg_path = Path(output_svg)
        out_svg_path.parent.mkdir(parents=True, exist_ok=True)
        page.exportPageAsSvg(str(out_svg_path))
