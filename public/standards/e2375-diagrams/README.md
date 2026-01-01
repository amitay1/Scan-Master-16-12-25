# E2375 Diagram Images Setup

## Overview
This folder contains cropped images from ASTM E2375-16 standard PDF for each part geometry type.

## Required Images

Please crop the following images from `/standards/E2375.pdf` and save them here:

### From Figure 6 (Page 11):

| Filename | Description | Used For Part Types |
|----------|-------------|---------------------|
| `plate-flat-bar.png` | Plate and Flat Bar diagram | box, plate, sheet, slab, flat_bar |
| `rectangular-bar.png` | Rectangular Bar, Bloom, Billets | rectangular_bar, square_bar, billet, block, profiles |
| `round-bar.png` | Round Bars and Round Forging Stock | cylinder, round_bar, shaft |

### From Figure 7 (Page 12):

| Filename | Description | Used For Part Types |
|----------|-------------|---------------------|
| `tube-pipe.png` | Tube and Pipe | tube, pipe, sleeve, bushing |
| `ring-forging.png` | Ring Forgings | ring, ring_forging |
| `disk-forging.png` | Disk Forging | disk, disk_forging, hub, cone |
| `hex-bar.png` | Hex Bar | hexagon, hex_bar |

## How to Create the Images

1. Open `/standards/E2375.pdf` in your PDF viewer
2. Navigate to Page 11 (Figure 6) or Page 12 (Figure 7)
3. Use screenshot tool (Snipping Tool on Windows, Cmd+Shift+4 on Mac)
4. Crop just the specific diagram for each shape
5. Save as PNG with the exact filename listed above
6. Place in this folder: `public/standards/e2375-diagrams/`

## Image Guidelines

- **Format**: PNG (preferred) or JPG
- **Resolution**: 300+ DPI recommended
- **Crop**: Just the diagram and relevant labels, not the entire page
- **Background**: White background preferred
- **Size**: ~800-1200px width recommended

## Example Mapping

When user selects `plate` in Setup tab → shows `plate-flat-bar.png`
When user selects `cylinder` in Setup tab → shows `round-bar.png`
When user selects `tube` in Setup tab → shows `tube-pipe.png`
etc.
