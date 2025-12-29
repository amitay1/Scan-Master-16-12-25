# 🔑 Scan Master Licensing System

Complete guide to the licensing and activation system for Scan Master Inspection Pro.

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Generating License Keys](#generating-license-keys)
4. [License Activation](#license-activation)
5. [Standards Locking](#standards-locking)
6. [Testing & Development](#testing--development)
7. [Production Deployment](#production-deployment)

---

## Overview

Scan Master uses a **license key-based activation system** with the following features:

- ✅ **Offline-first**: Works without internet connection
- ✅ **Per-factory licensing**: Each factory gets a unique license
- ✅ **Pay-per-standard**: Customers can purchase individual standards
- ✅ **Lifetime or time-limited**: Flexible licensing models
- ✅ **Cryptographically signed**: HMAC-based tamper protection
- ✅ **Local storage**: License stored encrypted on device

---

## System Architecture

```
┌─────────────────────────────────────┐
│  License Generator (Your Side)      │
│  scripts/license-generator.js       │
│  - Generates license keys           │
│  - Signs with secret key            │
└─────────────────────────────────────┘
         │
         │ License Key
         ↓
┌─────────────────────────────────────┐
│  Desktop App (Customer Side)        │
│  ┌───────────────────────────────┐  │
│  │ License Manager                │  │
│  │ electron/license-manager.cjs   │  │
│  │ - Validates signature          │  │
│  │ - Stores encrypted             │  │
│  │ - Checks expiry                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ License Context                │  │
│  │ src/contexts/LicenseContext    │  │
│  │ - Provides license info to UI  │  │
│  │ - Handles activation flow      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Standards Locking              │  │
│  │ src/components/StandardSelector│  │
│  │ - Locks unpurchased standards  │  │
│  │ - Shows "Contact Sales" UI     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Generating License Keys

### Setup

1. **Set License Secret** (keep this secret!):
```bash
export LICENSE_SECRET="your-super-secret-key-change-this-in-production"
```

2. **Navigate to scripts folder**:
```bash
cd Scan-Master-16-12-25-main/scripts
```

### Generate a License

#### Example 1: Basic License (AMS + ASTM)
```bash
node license-generator.js \
  --factory "Acme Corporation" \
  --standards AMS,ASTM \
  --lifetime
```

**Output:**
```
======================================================================
🔑  SCAN MASTER LICENSE GENERATED
======================================================================

Factory: Acme Corporation
Factory ID: FAC-ACMECO-M9X2K1

Standards Purchased:
  ✓ AMS-STD-2154E
  ✓ ASTM-A388

Total Price: $1000
Expiry: LIFETIME

──────────────────────────────────────────────────────────────────────

LICENSE KEY (give this to customer):

  SM-FAC-ACMECO-M9X2K1-AMSASTM-LIFETIME-A8F3D9E2C1B4

──────────────────────────────────────────────────────────────────────

Generated: 2025-12-29T14:30:00.000Z
======================================================================

✅ License saved to: licenses/license-FAC-ACMECO-M9X2K1-1735481400000.json
```

#### Example 2: All Standards, Lifetime
```bash
node license-generator.js \
  --factory "Boeing Defense" \
  --standards AMS,ASTM,BS3,BS4,MIL \
  --lifetime
```

**Price:** $2,800 (AMS: $500 + ASTM: $500 + BS3: $500 + BS4: $500 + MIL: $800)

#### Example 3: Time-Limited License
```bash
node license-generator.js \
  --factory "Trial Company" \
  --standards AMS,ASTM \
  --expiry 2026-12-31
```

**License expires:** December 31, 2026

### Verify a License Key

```bash
node license-generator.js --verify "SM-FAC-ACMECO-M9X2K1-AMSASTM-LIFETIME-A8F3D9E2C1B4"
```

**Output:**
```
======================================================================
🔍  LICENSE VERIFICATION
======================================================================

✅ License is VALID

Factory ID: FAC-ACMECO-M9X2K1
Standards: AMS-STD-2154E, ASTM-A388
Expiry: LIFETIME

======================================================================
```

### Available Standards

| Short Code | Full Code | Name | Price |
|------------|-----------|------|-------|
| `AMS` | AMS-STD-2154E | Aerospace Material Specification | $500 |
| `ASTM` | ASTM-A388 | Steel Forgings | $500 |
| `BS3` | BS-EN-10228-3 | European Steel Standards Part 3 | $500 |
| `BS4` | BS-EN-10228-4 | European Steel Standards Part 4 | $500 |
| `MIL` | MIL-STD-2154 | Military Standard | $800 |

---

## License Activation

### Customer Experience

1. **First Launch**: Customer opens desktop app
2. **Activation Screen**: Sees license activation prompt
3. **Enter Key**: Pastes license key received from you
4. **Validation**: App validates signature and expiry
5. **Success**: App unlocks and saves license locally

### Activation Flow

```typescript
// User enters license key in UI
const licenseKey = "SM-FAC-ACMECO-M9X2K1-AMSASTM-LIFETIME-A8F3D9E2C1B4";

// App validates
const result = await window.electron.license.activate(licenseKey);

if (result.success) {
  // ✅ License activated
  // Standards unlocked
  // App reloads
} else {
  // ❌ Show error message
  // Invalid key or expired
}
```

### Where License is Stored

```
Windows:  C:\Users\{username}\AppData\Roaming\Scan Master\license.dat
macOS:    ~/Library/Application Support/Scan Master/license.dat
Linux:    ~/.config/Scan Master/license.dat
```

**File format:** Encrypted JSON (AES-256-CBC)

---

## Standards Locking

### How It Works

1. **License Check**: On app load, system checks which standards are purchased
2. **UI Updates**: Standards selector shows lock icons for unpurchased standards
3. **Blocking**: User cannot select locked standards
4. **Upsell**: "Contact Sales" button shows for locked standards

### Visual Indicators

| Status | Icon | Behavior |
|--------|------|----------|
| **Purchased** | ✅ Green check | Fully usable |
| **Locked** | 🔒 Amber lock | Cannot select, shows pricing |
| **Not Activated** | ❌ | Activation screen |

### Example UI

```
┌─────────────────────────────────────┐
│ Standard Selector                   │
│                                     │
│ ✅ AMS-STD-2154E  (Included)        │
│ ✅ ASTM-A388     (Included)        │
│ 🔒 BS-EN-10228-3 (Locked - $500)   │
│ 🔒 BS-EN-10228-4 (Locked - $500)   │
│ 🔒 MIL-STD-2154  (Locked - $800)   │
│                                     │
│ [ Contact Sales to Purchase ]       │
└─────────────────────────────────────┘
```

### Code Example

```typescript
// Check if user can use a standard
const { canUseStandard } = useLicense();

if (!canUseStandard("MIL-STD-2154")) {
  toast.error("Standard Locked", {
    description: "MIL-STD-2154 is not included in your license.",
    action: {
      label: "Contact Sales",
      onClick: () => window.open('mailto:sales@scanmaster.com')
    }
  });
  return;
}

// Proceed with using the standard
```

---

## Testing & Development

### Web Mode (Development)

When running in browser (not Electron), all standards are unlocked:

```typescript
// Web mode mock license
{
  activated: true,
  valid: true,
  factoryId: 'WEB-DEV',
  purchasedStandards: ['ALL'],
  isLifetime: true
}
```

### Electron Development

To test license flow in Electron:

1. **Deactivate existing license**:
```typescript
// In dev console
await window.electron.license.deactivate()
```

2. **Generate test license**:
```bash
node scripts/license-generator.js \
  --factory "Test Company" \
  --standards AMS,ASTM \
  --lifetime
```

3. **Enter license key** in activation screen

### Testing Different Scenarios

#### Test Case 1: Expired License
```bash
node scripts/license-generator.js \
  --factory "Expired Test" \
  --standards AMS \
  --expiry 2024-01-01  # Past date
```

**Expected:** "License has expired" error

#### Test Case 2: Invalid Signature
Manually edit license key → **Expected:** "Invalid signature" error

#### Test Case 3: Partial Standards
```bash
node scripts/license-generator.js \
  --factory "Partial Test" \
  --standards AMS  # Only one standard
  --lifetime
```

**Expected:** AMS unlocked, others locked

---

## Production Deployment

### 1. Secure the License Secret

**⚠️ CRITICAL:** Change the default license secret!

```javascript
// In production, use environment variable
const LICENSE_SECRET = process.env.LICENSE_SECRET;

// Generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Set environment variable:**
```bash
# Your generation machine
export LICENSE_SECRET="f8e3a9c7b2d4e6f1a8c9d2e5f7b3c1a9d4e6f8b2c5a7d9e1f3b6c8a2d5e7f9b1"

# Embed in Electron app (obfuscated)
# electron/license-manager.cjs
const LICENSE_SECRET = process.env.LICENSE_SECRET || '...';
```

### 2. Code Obfuscation

Consider obfuscating license validation code:
- [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)
- Webpack obfuscator plugin
- Manual minification

### 3. License Database

Keep track of issued licenses:

```json
{
  "licenses": [
    {
      "licenseKey": "SM-FAC-ACMECO-...",
      "factoryId": "FAC-ACMECO-M9X2K1",
      "factoryName": "Acme Corporation",
      "contactEmail": "purchase@acme.com",
      "purchasedStandards": ["AMS-STD-2154E", "ASTM-A388"],
      "issuedDate": "2025-12-29",
      "isLifetime": true,
      "price": 1000,
      "notes": "Sold with machine #12345"
    }
  ]
}
```

### 4. Customer Support Workflow

**Customer loses license:**
1. Verify factory ID in your database
2. Re-generate same license key (deterministic)
3. Send to customer
4. Customer re-activates

**Add standard to existing license:**
1. Generate NEW license key with additional standard
2. Customer enters new key (replaces old)
3. Invoice for additional standard cost

---

## Pricing Models

### Model 1: All-Inclusive
```
Base License: $5,000
✅ All standards included
✅ Lifetime updates
✅ No upsell complexity
```

### Model 2: Pay-Per-Standard (Recommended)
```
Base License: $2,000
  ├── AMS-STD-2154E ✅
  └── ASTM-A388 ✅

Additional Standards:
  ├── BS-EN-10228-3: +$500
  ├── BS-EN-10228-4: +$500
  └── MIL-STD-2154: +$800

Total with all: $4,300
```

### Model 3: Tiered
```
🥉 Basic ($2,000)
   ├── 2 standards
   └── 1 year updates

🥈 Professional ($4,000)
   ├── 5 standards
   └── Lifetime updates

🥇 Enterprise ($8,000)
   ├── All standards
   ├── Custom standards support
   └── Priority support
```

---

## FAQ

### Q: Can license keys be shared between machines?
**A:** Yes, but discouraged. Each factory should have one installation. You can track activations server-side if needed.

### Q: What if customer loses their license key?
**A:** You can re-generate the same key (deterministic) or look it up in your license database.

### Q: How to add a standard to existing license?
**A:** Generate a NEW license key with additional standards. Customer enters new key to upgrade.

### Q: Can licenses be transferred?
**A:** Yes, customer enters license key on new machine. Consider deactivating old machine first (requires server check).

### Q: How to revoke a license?
**A:** Currently offline-first, so no remote revocation. Future: Add server-side validation check.

---

## Troubleshooting

### Issue: "Invalid license signature"
**Cause:** License key is corrupted or tampered
**Solution:** Generate fresh license key for customer

### Issue: "License has expired"
**Cause:** Time-limited license reached expiry date
**Solution:** Generate renewal license with new expiry date

### Issue: "License file corrupted"
**Cause:** Encrypted file damaged
**Solution:** Customer re-activates with license key

### Issue: Standard still locked after activation
**Cause:** License doesn't include that standard
**Solution:** Verify which standards are in license key, generate new key if needed

---

## Support

For licensing system support:
- **Technical issues**: Check logs in Electron DevTools
- **Key generation**: Review `scripts/license-generator.js`
- **Customer activation**: Check `electron/license-manager.cjs` logs

**Emergency license generation:**
```bash
node scripts/license-generator.js \
  --factory "Emergency" \
  --standards AMS,ASTM,BS3,BS4,MIL \
  --lifetime
```

---

**Built with security and flexibility in mind. Happy licensing! 🔐**
