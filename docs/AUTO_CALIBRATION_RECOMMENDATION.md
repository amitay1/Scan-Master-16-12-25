# 🎯 מנגנון המלצות אוטומטי לבלוקי כיול (Auto Calibration Block Recommendation)

## תיאור

המערכת כעת מזהה **אוטומטית** את calibration block המתאים בהתאם לפרמטרים של החלק שנבחר.

---

## איך זה עובד?

### 1️⃣ **בחירת Part Type + Dimensions**
כאשר אתה ממלא ב-**Inspection Setup Tab**:
- Material (חומר)
- Part Type (גיאומטריה: tube, cylinder, plate, box...)
- Thickness (עובי)
- Diameter / Length / Width (מידות)
- Acceptance Class
- Standard

### 2️⃣ **המערכת מחשבת אוטומטית**
המערכת קוראת ל-`generateCalibrationRecommendationV2` עם הפרמטרים שלך:

```typescript
const recommendation = generateCalibrationRecommendationV2({
  material: "aluminum",
  partType: "tube",
  thickness: 10,
  outerDiameter: 50,
  innerDiameter: 40,
  acceptanceClass: "A",
  standard: "AMS-STD-2154E",
  beamType: "straight"
});
```

### 3️⃣ **המערכת בוחרת בלוק אוטומטית**
לפי **logic מתקדם** מתוך `calibrationRecommenderV2.ts`:

#### Tube (דוגמה):
```
Input: tube, OD=50mm, ID=40mm, wall=5mm
→ המערכת בודקת: wall < 25mm? → YES
→ המלצה: "cylinder_notched" (Notched cylinder for thin-wall)
```

#### Plate (דוגמה):
```
Input: plate, thickness=30mm
→ המערכת מזהה: FLAT_PLATE geometry group
→ המלצה: "flat_fbh" (Flat FBH block - Figure 4)
```

#### Cylinder (דוגמה):
```
Input: cylinder, OD=100mm (solid - no ID)
→ המערכת מזהה: SOLID_ROUNDS geometry group
→ המלצה: "flat_fbh" (Diameter > 50.8mm allows flat block)
```

### 4️⃣ **עדכון ויזואלי**
ב-**Calibration Tab** תראה:
- Badge ירוק: **✨ Auto-Selected**
- Hover על הבדג' → tooltip עם הסבר מדוע נבחר הבלוק

---

## דוגמאות מעשיות

### דוגמה 1: Tube קוטר קטן
```yaml
Part Type: tube
OD: 30mm
ID: 24mm
Wall Thickness: 3mm
Standard: AMS-STD-2154E

→ Automatic Selection:
   Block: "cylinder_notched" (Figure 5)
   Reason: "Notched cylinder block for thin-wall tube. 
           Wall thickness < 25mm requires notch reflectors."
```

### דוגמה 2: Ring Forging גדול
```yaml
Part Type: ring_forging
OD: 200mm
ID: 150mm
Height: 80mm
Standard: ASTM-A388

→ Automatic Selection:
   Block: "cylinder_fbh" (Figure 6)
   Reason: "Cylinder FBH block for thick-wall tubular.
           Ring forgings typically have thick walls."
```

### דוגמה 3: Flat Plate
```yaml
Part Type: plate
Length: 500mm
Width: 300mm
Thickness: 25mm
Standard: AMS-STD-2154E

→ Automatic Selection:
   Block: "flat_fbh" (Figure 4)
   Reason: "Flat FBH block for plate geometry. 
           Each surface is treated as a flat inspection area."
```

---

## קוד פנימי

### המנגנון נמצא ב:
📂 `src/utils/calibrationRecommenderV2.ts`
- **Function**: `selectStraightBeamBlock()`
- **Logic**: 
  - מיפוי geometry groups (FLAT_PLATE, SOLID_ROUNDS, THIN_WALL_TUBULAR...)
  - בדיקת L/T ratio (Length/Thickness)
  - בדיקת W/T ratio (Wall/Thickness)
  - בדיקת diameter thresholds

### האינטגרציה:
📂 `src/components/tabs/InspectionSetupTab.tsx`
- **useEffect hook** שמאזין לשינויים ב:
  - `material`
  - `partType`
  - `partThickness`
  - `diameter`, `innerDiameter`
  - `acceptanceClass`
  - `standardType`

📂 `src/pages/Index.tsx`
- **Callback**: `onCalibrationRecommendation` - מעדכן את calibration tab אוטומטית

---

## יתרונות

✅ **חוסך זמן** - לא צריך לבחור ידנית את הבלוק
✅ **עוקב אחרי הסטנדרט** - logic מבוסס על AMS-STD-2154, ASTM A388, BS EN 10228
✅ **שקוף** - רואים למה נבחר הבלוק (tooltip)
✅ **גמיש** - עדיין אפשר לשנות ידנית אם צריך

---

## שאלות נפוצות

**Q: האם זה עובד עם כל ה-part types?**
A: כן! המערכת תומכת ב-27+ geometries (box, cylinder, tube, ring, plate, forging...)

**Q: מה קורה אם אני משנה את הגיאומטריה אחרי שכבר בחרתי בלוק ידנית?**
A: המערכת תמליץ מחדש, אבל לא תדרוס את הבחירה שלך. תראה הודעה בקונסול.

**Q: איך אני רואה את הסיבה לבחירה?**
A: Hover עם העכבר מעל ה-badge "✨ Auto-Selected" בטאב Calibration.

**Q: האם זה עובד גם ל-angle beam?**
A: כן! יש גם `selectAngleBeamBlock()` עבור IIW blocks, DSC blocks וכו'.

---

## Technical Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ User fills Inspection Setup                        │
│ (Material, Part Type, Dimensions...)               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ useEffect in InspectionSetupTab.tsx                │
│ Detects changes in: material, partType,           │
│ thickness, diameter, acceptanceClass, standard     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ generateCalibrationRecommendationV2()              │
│ (from calibrationRecommenderV2.ts)                 │
│                                                     │
│ Steps:                                             │
│ 1. Map partType → geometry group                  │
│ 2. Check thickness, diameter ratios               │
│ 3. Apply standard-specific rules                  │
│ 4. Select block category                          │
│ 5. Calculate FBH sizes, metal travel              │
│ 6. Generate visualization data                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ Callback: onCalibrationRecommendation()           │
│ Updates CalibrationData with:                      │
│ - standardType (e.g. "cylinder_fbh")              │
│ - autoRecommendedReason (explanation string)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ CalibrationTab.tsx                                 │
│ Shows "✨ Auto-Selected" badge                     │
│ Tooltip displays reasoning                         │
└─────────────────────────────────────────────────────┘
```

---

## קוד דוגמה להרחבה

אם רוצים להוסיף geometry חדש, עדכנו ב-`calibrationRecommenderV2.ts`:

```typescript
function selectStraightBeamBlock(input, geometryGroup) {
  // ... existing logic ...
  
  // NEW: Custom geometry for turbine blades
  if (geometryGroup === 'TURBINE_BLADES') {
    return {
      category: 'curved_fbh',
      reasoning: `Curved FBH block for ${input.partType}. ` +
                 `Complex airfoil requires matched curvature calibration.`,
      alternatives: ['custom']
    };
  }
  
  // ... rest of code ...
}
```

---

**Created:** January 2026  
**Version:** 1.0  
**Author:** ScanMaster AI Development Team
