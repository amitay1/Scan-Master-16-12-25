# 🚀 Licensing System - Quick Start Guide

**5-minute guide to start using the licensing system**

---

## Step 1: Generate Your First License (2 minutes)

```bash
# Navigate to project
cd Scan-Master-16-12-25-main

# Generate a license for a customer
node scripts/license-generator.js \
  --factory "Acme Corporation" \
  --standards AMS,ASTM \
  --lifetime
```

**You'll get:**
```
LICENSE KEY: SM-FAC-ACMECO-M9X2K1-AMSASTM-LIFETIME-A8F3D9E2C1B4
```

✅ **Copy this key** - give it to your customer!

---

## Step 2: Customer Activates (1 minute)

Your customer:
1. Opens Scan Master desktop app
2. Sees activation screen
3. Pastes the license key
4. Clicks "Activate"
5. ✅ Done! App unlocks

---

## Step 3: Test It Yourself (2 minutes)

### In Electron (Desktop App):

```bash
# Build and run Electron
npm run build
npm run electron
```

1. App opens → Activation screen appears
2. Paste license key
3. App reloads → Unlocked!

### Check what's unlocked:

```typescript
// In React DevTools or console
const { license } = useLicense();
console.log(license.purchasedStandards);
// ["AMS-STD-2154E", "ASTM-A388"]
```

---

## Common Commands

### Generate lifetime license (all standards)
```bash
node scripts/license-generator.js \
  --factory "Boeing Defense" \
  --standards AMS,ASTM,BS3,BS4,MIL \
  --lifetime
```

### Generate 1-year trial
```bash
node scripts/license-generator.js \
  --factory "Trial Company" \
  --standards AMS \
  --expiry 2026-12-29
```

### Verify a license key
```bash
node scripts/license-generator.js \
  --verify "SM-FAC-ACMECO-M9X2K1-AMSASTM-LIFETIME-A8F3D9E2C1B4"
```

---

## Standards & Pricing

| Code | Name | Price |
|------|------|-------|
| `AMS` | Aerospace Material Spec | $500 |
| `ASTM` | Steel Forgings | $500 |
| `BS3` | European Ferritic | $500 |
| `BS4` | European Austenitic | $500 |
| `MIL` | Military Standard | $800 |

**Example bundles:**
- Basic (AMS + ASTM): $1,000
- Full (All 5 standards): $2,800

---

## What Happens When Standard is Locked?

User sees:
```
┌─────────────────────────────────┐
│ 🔒 Standard Not Purchased       │
│                                 │
│ MIL-STD-2154 is not included    │
│ in your license.                │
│                                 │
│ 💵 Starting from $800           │
│                                 │
│ [Contact Sales to Purchase]     │
└─────────────────────────────────┘
```

Clicking button opens email to: `sales@scanmaster.com`

---

## Production Checklist

Before deploying:

- [ ] Change `LICENSE_SECRET` (use strong random key)
- [ ] Test license activation in Electron
- [ ] Test locked standards UI
- [ ] Test license expiry (with past date)
- [ ] Keep license database (JSON file with all issued keys)
- [ ] Test license deactivation/reactivation

---

## Troubleshooting

**"Invalid license key"**
→ Re-generate key, make sure customer copies full key

**Standard still locked after activation**
→ Check which standards are in license: `node scripts/license-generator.js --verify KEY`

**Lost license key**
→ Look up in `licenses/` folder or re-generate with same factory name

---

## Next Steps

1. ✅ Read full docs: [LICENSING_SYSTEM.md](LICENSING_SYSTEM.md)
2. ⚙️ Customize pricing in `electron/license-manager.cjs`
3. 🔐 Set strong `LICENSE_SECRET` for production
4. 📧 Update sales email in code (search for `sales@scanmaster.com`)
5. 🎨 Customize activation screen UI

---

**You're ready to license Scan Master! 🎉**

Need help? Check [LICENSING_SYSTEM.md](LICENSING_SYSTEM.md) for detailed docs.
