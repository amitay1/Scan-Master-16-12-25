# ScanMaster Drawing Engine (Python)

This folder contains a small, **generic** CAD / drawing engine used to
produce *real* CAD drawings (sections, hatches, dimensions) using
CadQuery and FreeCAD's TechDraw workbench.

The key idea is to **separate**:

1. A generic engine that only knows about primitives and operations
   (circles, extrusions, views, dimensions).
2. Per-part *specs* (e.g. a full ring, calibration block, curved
   segment) that are just data – they describe which primitives and
   dimensions to use.

That way, the engine stays the same while you add new JSON/specs for new
part types.

## Layout

- `scanmaster_drawing_engine/`
  - `geometry_engine.py` – builds CadQuery solids from generic
    `SolidSpec` objects.
  - `drawing_engine.py` – builds FreeCAD/TechDraw pages from a CadQuery
    solid and a `DrawingSpec` (views + dimensions).
- `examples_full_ring_fig1.py` – concrete example that builds a
  "Fig. 1"-style full ring (OD/ID/length) and generates a TechDraw
  section view with dimensions.
- `requirements.txt` – Python dependencies for this subproject
  (CadQuery).

## Prerequisites

You need a **Python environment** (3.10+ recommended) with:

- [`cadquery`](https://github.com/CadQuery/cadquery) installed
- [FreeCAD](https://www.freecadweb.org/) with the TechDraw workbench
  (normal desktop installation is fine)

FreeCAD is **not** installed via `pip`; instead, you point Python at the
FreeCAD libraries using an environment variable.

On Windows, for example:

```powershell
# Example paths – adjust for your installation
$env:FREECAD_PATH = "C:/Program Files/FreeCAD 0.21/bin"
$env:TECHDRAW_TEMPLATE_PATH = "C:/Program Files/FreeCAD 0.21/data/Mod/TechDraw/Templates/A4_LandscapeTD.svg"
```

`FREECAD_PATH` must point to the folder where `FreeCAD.pyd` lives (often
`bin` or `lib`). `TECHDRAW_TEMPLATE_PATH` must point to an SVG TechDraw
page template, e.g. `A4_LandscapeTD.svg`.

## Install Python dependencies

From this `drawing-engine` folder:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run the Fig. 1 ring example

Still from `drawing-engine`, after the virtualenv is active and the two
environment variables are set:

```powershell
python examples_full_ring_fig1.py
```

If everything is configured correctly, you should get:

- `out/full_ring_fig1.pdf` – TechDraw page with a section view,
  hatch and three basic dimensions (length, OD, ID).

You can open the generated `.FCStd` document inside FreeCAD as well if
you modify the example script to keep the document open instead of just
exporting and exiting.

## Next steps

- Add more operation types to `geometry_engine.py` (rectangles, pockets,
  chamfers, etc.).
- Add richer view/section/dimension types to `drawing_engine.py`.
- Introduce a JSON schema on the Node/TypeScript side that maps directly
  to `SolidSpec`, `ViewSpec`, and `DimensionSpec`, so that new parts can
  be defined without touching Python code.
