# ScanMaster Integration Requirements

## 1. CSI File Format

### 1.1 What file format does CSI accept for setup import?
- [ ] XML
- [ ] JSON
- [ ] Binary (.csi / .prg / .stp)
- [ ] Other: ___________

### 1.2 Please provide:
- [ ] File format specification / schema
- [ ] Sample setup file (any existing file)
- [ ] Field list with data types

---

## 2. Communication Protocol

### 2.1 How does external software connect to CSI?
- [ ] File import only (manual)
- [ ] TCP/IP (IP: ___ Port: ___)
- [ ] Serial RS-232/485 (Baud: ___)
- [ ] OPC-UA
- [ ] SDK/API available

### 2.2 Is there API documentation available?
- [ ] Yes (please provide)
- [ ] No

---

## 3. Scanner Machine Specifications

### 3.1 Motion System
| Parameter | Value | Unit |
|-----------|-------|------|
| Max Scan Speed | | mm/s |
| Max Index Speed | | mm/s |
| Max Rotation Speed | | rpm |
| Max Acceleration | | mm/s² |
| X Travel | | mm |
| Y Travel | | mm |
| Z Travel | | mm |

### 3.2 Immersion Tank
| Parameter | Value | Unit |
|-----------|-------|------|
| Length | | mm |
| Width | | mm |
| Depth | | mm |

### 3.3 UT System
| Parameter | Value | Unit |
|-----------|-------|------|
| Max PRF | | Hz |
| Frequency Range | | MHz |
| Channels | | |

---

## 4. Required Setup Data

### 4.1 Which fields are required for a valid setup?

**Part Definition:**
- [ ] Part Number
- [ ] Material
- [ ] Geometry Type
- [ ] Dimensions (OD/ID/Length/Width/Thickness)
- [ ] Acoustic Velocity
- [ ] Other: ___________

**Equipment:**
- [ ] Probe Frequency
- [ ] Probe Diameter
- [ ] Probe Type (Immersion/Contact)
- [ ] Wedge Angle
- [ ] Other: ___________

**Scan Plan:**
- [ ] Scan Speed
- [ ] Index Step
- [ ] Water Path
- [ ] PRF
- [ ] Gain
- [ ] Gates (Start/Width)
- [ ] Other: ___________

**Calibration:**
- [ ] Block Type
- [ ] Block Serial Number
- [ ] FBH Sizes
- [ ] DAC/TCG Curve
- [ ] Other: ___________

---

## 5. Output Requirements

### 5.1 What outputs does our software need to generate?

- [ ] Setup file (.csi / .xml / other)
- [ ] Scan path coordinates (X,Y,Z)
- [ ] Motion program (G-code style)
- [ ] Calibration data
- [ ] Coverage map
- [ ] Other: ___________

---

## 6. Integration Level

### 6.1 Desired integration type:

**Option A: File Export**
```
Our Software → Export File → CSI Import → Scanner
```
- Simple, manual transfer
- Requires: File format spec only

**Option B: Direct Integration**
```
Our Software → TCP/API → CSI → Scanner
```
- Automatic transfer
- Requires: API/SDK documentation

**Option C: Direct Scanner Control**
```
Our Software → Protocol → Scanner Controller
```
- Full control
- Requires: Controller protocol documentation

**Preferred option:** [ ]

---

## 7. Sample Files Request

Please provide sample files for analysis:

- [ ] Empty setup template
- [ ] Completed setup example (any part)
- [ ] Exported scan data example
- [ ] API documentation (if available)

---

## Contact

**Project:** Scan-Master Integration
**Purpose:** Automatic UT inspection setup generation
**Target:** Engine disc inspection (MRO/Production)

---

*Document Version: 1.0*
*Date: ___________*
