# 🔗 קישור בין Scan Details לCalibration Block

## התשובה לשאלה: **כן! הטאבים מקושרים עכשיו!** ✅

---

## הבעיה שהיתה:

### לפני:
- **Scan Details Tab** - מגדיר כיווני סריקה (A, B, C, D, E... וכו')
- **Calibration Tab** - בוחר calibration block
- ❌ **לא היה קשר** - הבחירה לא התחשבה בכיווני הסריקה

### הבעיה:
אם בחרת לסרוק **circumferentially** (כיוון D/E) על tube, המערכת לא ידעה שצריך **notched cylinder block** במקום **FBH block**!

---

## הפתרון שיושם:

### 1️⃣ **מיפוי כיווני סריקה**

```typescript
// בInspectionSetupTab.tsx - מנתח את הscan directions:
const scanDirectionInfo = {
  hasAxialScan: scanDetails.some(s => ['A', 'B'].includes(s.scanningDirection)),
  hasRadialScan: scanDetails.some(s => ['C', 'L'].includes(s.scanningDirection)),
  hasCircumferentialScan: scanDetails.some(s => ['D', 'E'].includes(s.scanningDirection)),
  hasAngleBeam: scanDetails.some(s => ['F', 'G', 'H'].includes(s.scanningDirection)),
};
```

| כיוון סריקה | מופיע בטאב Scan Details | משמעות |
|-------------|------------------------|---------|
| **A, A₁, B, B₁** | ✅ LW 0° (Primary/Adjacent) | Axial straight beam |
| **C, C₁, L** | ✅ Radial / 360° Rotational | Radial scan |
| **D, E** | ✅ SW Circumferential CW/CCW | Shear wave circumferential |
| **F, G, H, I, J, K** | ✅ SW Axial / Custom angles | Angle beam |

---

### 2️⃣ **לוגיקה מתקדמת ב-calibrationRecommenderV2**

#### דוגמה 1: Tube עם Circumferential Scan
```typescript
// אם יש סריקה circumferential (D/E):
if (hasCircumferentialScan) {
  return {
    category: 'cylinder_notched',
    reasoning: "Notched cylinder block REQUIRED. " +
               "Circumferential shear wave scan (D/E) requires notch reflectors."
  };
}
```

#### דוגמה 2: Cylinder עם Radial Scan
```typescript
// אם יש סריקה radial (C, L):
if (hasRadialScan) {
  return {
    category: 'flat_fbh',
    reasoning: "Flat FBH block for radial inspection. " +
               "FBH holes positioned for rotational scan (direction L)."
  };
}
```

---

### 3️⃣ **הטאבים מקושרים**

```
┌──────────────────┐
│ Scan Details Tab │
│  ✓ D: SW Circ CW │
│  ✓ E: SW Circ CCW│
└────────┬─────────┘
         │ scanDetails
         ▼
┌──────────────────────────────────┐
│ InspectionSetupTab (useEffect)   │
│ מנתח: hasCircumferentialScan=true│
└────────┬─────────────────────────┘
         │ generateCalibrationRecommendationV2()
         ▼
┌──────────────────────────────────┐
│ calibrationRecommenderV2.ts      │
│ Logic: Circ scan → Notched block │
└────────┬─────────────────────────┘
         │ callback
         ▼
┌──────────────────────────────────┐
│ Calibration Tab                  │
│ ✨ Auto-Selected (Scan-Aware)   │
│ Block: cylinder_notched          │
└──────────────────────────────────┘
```

---

## דוגמאות מעשיות

### 🔧 דוגמה 1: Tube + Circumferential Shear Wave

**בטאב Inspection Setup:**
```
Part Type: Tube
OD: 60mm
ID: 50mm
Wall: 5mm
```

**בטאב Scan Details - מסמנים:**
```
✅ D: SW Circumferential CW
✅ E: SW Circumferential CCW
```

**תוצאה אוטומטית בCalibration Tab:**
```
✨ Auto-Selected (Scan-Aware)
Block: Cylinder Notched Block (Figure 5)

Tooltip:
"Notched cylinder block REQUIRED for thin-wall tube. 
Circumferential shear wave scan (directions D/E) requires 
notch reflectors. Wall thickness < 25mm."
```

---

### 🔧 דוגמה 2: Cylinder + Rotational Scan

**בטאב Inspection Setup:**
```
Part Type: Cylinder (solid)
OD: 100mm
Length: 200mm
```

**בטאב Scan Details - מסמנים:**
```
✅ L: Rotational 360° (Radial)
```

**תוצאה אוטומטית בCalibration Tab:**
```
✨ Auto-Selected (Scan-Aware)
Block: Flat FBH Block (Figure 4)

Tooltip:
"Flat FBH block for radial inspection. 
Diameter > 50.8mm allows flat block usage. 
FBH holes positioned for rotational scan (direction L)."
```

---

### 🔧 דוגמה 3: Plate + Axial Scan

**בטאב Inspection Setup:**
```
Part Type: Plate
Thickness: 30mm
Width: 500mm
```

**בטאב Scan Details - מסמנים:**
```
✅ A: LW 0° (Primary Surface)
✅ B: LW 0° (Adjacent Side)
```

**תוצאה אוטומטית בCalibration Tab:**
```
✨ Auto-Selected (Scan-Aware)
Block: Flat FBH Block (Figure 4)

Tooltip:
"Flat FBH block for plate geometry. 
Each surface is treated as a flat inspection area."
```

---

## איפה רואים את הקישור?

### 1. **Banner בScan Details Tab:**
```
🔗 Linked to Calibration Block Selection

The scan directions you select here (A-L) influence which 
calibration block is recommended. For example: selecting 
circumferential shear wave (D/E) for a tube will automatically 
recommend a notched cylinder block.
```

### 2. **Badge בCalibration Tab:**
```
✨ Auto-Selected (Scan-Aware)
```
Hover מעל ← רואים:
- Part Geometry & Dimensions
- **Selected Scan Directions (A-L)** ← חדש!
- Standard Requirements

---

## מה קורה כשמשנים scan directions?

```
1. בScan Details Tab - מסמן/מבטל כיוונים
   ↓
2. useEffect בInspectionSetupTab מזהה שינוי
   ↓
3. קורא ל-generateCalibrationRecommendationV2() עם נתוני scan
   ↓
4. Logic בcalibrationRecommenderV2 מחשב מחדש
   ↓
5. Calibration Tab מתעדכן אוטומטית!
```

**זמן תגובה:** מיידי (real-time)

---

## לוגיקת החלטה מלאה

### Thin-Wall Tubular (Tube, Pipe, Ring):
```
IF wall < 25mm:
  IF hasCircumferentialScan (D/E):
    → cylinder_notched (REQUIRED)
  ELSE:
    → cylinder_notched (recommended)
ELSE:
  → cylinder_fbh
```

### Solid Rounds (Cylinder, Bar, Shaft):
```
IF hasRotationalScan (L):
  IF diameter < 50.8mm:
    → curved_fbh (with rotation pattern)
  ELSE:
    → flat_fbh (with rotation pattern)
ELSE:
  IF diameter < 50.8mm:
    → curved_fbh
  ELSE:
    → flat_fbh
```

### Flat Geometries (Plate, Box):
```
IF hasAxialScan (A, B):
  → flat_fbh
```

---

## קבצים שהשתנו:

✅ `src/utils/calibrationRecommenderV2.ts`
   - הוספת `scanDirections` ל-input interface
   - לוגיקה מתקדמת ב-`selectStraightBeamBlock()`

✅ `src/components/tabs/InspectionSetupTab.tsx`
   - קבלת `scanDetails` prop
   - ניתוח כיוונים בuseEffect
   - העברה ל-recommendation engine

✅ `src/pages/Index.tsx`
   - העברת `scanDetails` ל-InspectionSetupTab
   - Callback מתעדכן עם מידע scan directions

✅ `src/types/techniqueSheet.ts`
   - הוספת `autoRecommendedReason` ל-CalibrationData

✅ `src/components/tabs/CalibrationTab.tsx`
   - Tooltip מעודכן: "Auto-Selected (Scan-Aware)"

✅ `src/components/tabs/ScanDetailsTab.tsx`
   - Banner כחול: "🔗 Linked to Calibration Block Selection"

---

## יתרונות:

✅ **אינטליגנציה מתקדמת** - לא רק geometry, גם scan directions!  
✅ **תואם סטנדרטים** - ASTM E2375, AMS-STD-2154  
✅ **Real-time updates** - שינוי בscan → עדכון בcalibration  
✅ **שקיפות מלאה** - tooltip מסביר את הסיבה  
✅ **מונע טעויות** - לא תבחר בלוק לא מתאים לסריקה

---

**התשובה הסופית:** כן! הטאבים מקושרים! Scan Details משפיע על Calibration Block! 🎯
