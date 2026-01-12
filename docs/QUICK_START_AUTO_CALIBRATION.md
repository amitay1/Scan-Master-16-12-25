# 🚀 Quick Start: Auto Calibration Block Selection

## מה קורה כשאני בוחר part type?

המערכת **אוטומטית** בוחרת את calibration block המתאים!

---

## דוגמאות מהירות

### ✈️ Tube / Pipe
```
אם בחרת: Tube
וציינת: OD=50mm, ID=40mm, Wall=5mm
→ המערכת תבחר: "Cylinder Notched Block" (Figure 5)
→ סיבה: דופן דקה (<25mm) → דורשת notch reflectors
```

### 🔩 Cylinder (Solid)
```
אם בחרת: Cylinder
וציינת: OD=100mm (ללא ID)
→ המערכת תבחר: "Flat FBH Block" (Figure 4)
→ סיבה: קוטר >50mm → מתאים לבלוק שטוח
```

### 📦 Plate / Box
```
אם בחרת: Plate
וציינת: Thickness=30mm
→ המערכת תבחר: "Flat FBH Block" (Figure 4)
→ סיבה: גאומטריית פלטה → בלוק שטוח סטנדרטי
```

### 💍 Ring Forging
```
אם בחרת: Ring Forging
וציינת: OD=200mm, ID=150mm, Wall=25mm
→ המערכת תבחר: "Cylinder FBH Block" (Figure 6)
→ סיבה: דופן עבה (≥25mm) → דורש FBH calibration
```

---

## איפה רואים את ההמלצה?

1. **Inspection Setup Tab** - מלא את פרטי החלק
2. עבור ל-**Calibration Tab**
3. תראה badge ירוק: **✨ Auto-Selected**
4. Hover מעל הבדג' → קרא את ההסבר

---

## איך זה עוזר לי?

✅ **חוסך 5-10 דקות בכל דו"ח**  
✅ **מונע טעויות** - הבחירה תואמת סטנדרט  
✅ **שקיפות מלאה** - רואים את הסיבה  
✅ **גמישות** - עדיין אפשר לשנות ידנית

---

## מפת קיצורים מהירה

| Part Type | Wall/Thickness | → Recommended Block |
|-----------|----------------|---------------------|
| Tube | <25mm | Cylinder Notched (Fig 5) |
| Tube | ≥25mm | Cylinder FBH (Fig 6) |
| Cylinder | OD<50mm | Curved FBH |
| Cylinder | OD≥50mm | Flat FBH (Fig 4) |
| Plate | Any | Flat FBH (Fig 4) |
| Box | Any | Flat FBH (Fig 4) |
| Ring | <25mm wall | Cylinder Notched (Fig 5) |
| Ring | ≥25mm wall | Cylinder FBH (Fig 6) |
| Disk | Any | Flat FBH (Fig 4) |

---

## תרחיש שימוש מלא

```
1. פותח technique sheet חדש
2. Standard: AMS-STD-2154E
3. Inspection Setup Tab:
   - Material: Aluminum
   - Part Type: Tube
   - OD: 60mm
   - ID: 50mm
   - Thickness: 5mm
   - Acceptance Class: A
   
4. עובר ל-Calibration Tab
   → רואה: "✨ Auto-Selected: Cylinder Notched Block"
   → Hover: "Wall thickness < 25mm requires notch reflectors"
   
5. המשך למלא FBH holes, metal travel וכו'
6. Export PDF → הבלוק הנכון כבר בדו"ח! ✅
```

---

## אם משהו לא מתאים?

**אפשרות 1:** שנה ידנית את הבלוק ב-Calibration Catalog  
**אפשרות 2:** עדכן את הפרמטרים (OD, ID, thickness) והמערכת תמליץ מחדש

---

📘 **מסמך מפורט:** `docs/AUTO_CALIBRATION_RECOMMENDATION.md`
