"""ScanMaster generic CAD drawing engine package.

This package provides a thin abstraction layer on top of CadQuery and
FreeCAD/TechDraw to generate true CAD drawings (sections, hatches,
views, dimensions) from high-level specs.

It is intentionally generic: it does not know what a "ring" or a
"segment" is – only primitives (circles, extrusions, etc.) and drawing
concepts (views, sections, dimensions).
"""

__all__ = [
    "geometry_engine",
    "drawing_engine",
]
