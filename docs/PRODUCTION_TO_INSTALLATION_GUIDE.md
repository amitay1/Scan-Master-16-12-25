# 🏭 מדריך מקיף: מהכנת התוכנה עד התקנה במפעל
## Scan Master Inspection Pro - Production to Installation Guide

**תאריך:** נובמבר 2025  
**גרסה:** 1.0

---

## 📋 תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [שלב 1: סיום פיתוח והכנה](#2-שלב-1-סיום-פיתוח-והכנה)
3. [שלב 2: בדיקות QA](#3-שלב-2-בדיקות-qa)
4. [שלב 3: הכנה למכירה](#4-שלב-3-הכנה-למכירה)
5. [שלב 4: תהליך מכירה](#5-שלב-4-תהליך-מכירה)
6. [שלב 5: התקנה במפעל עם אינטרנט](#6-שלב-5-התקנה-במפעל-עם-אינטרנט)
7. [שלב 6: התקנה במפעל ללא אינטרנט (Air-Gapped)](#7-שלב-6-התקנה-במפעל-ללא-אינטרנט-air-gapped)
8. [שלב 7: הדרכה ותמיכה](#8-שלב-7-הדרכה-ותמיכה)
9. [צ'קליסטים](#9-צ'קליסטים)
10. [נספחים טכניים](#10-נספחים-טכניים)

---

## 1. סקירה כללית

### מה המערכת?
**Scan Master Inspection Pro** היא תוכנה מקצועית ליצירה, ניהול ויצוא של Technique Sheets לבדיקות אולטראסוניות (NDT), עם תמיכה ב-4 תקנים בינלאומיים:
- AMS-STD-2154E (אווירונאוטיקה)
- ASTM-A388 (פלדה כבדה)
- BS-EN-10228-3 (אירופה - Ferritic)
- BS-EN-10228-4 (אירופה - Austenitic)

### שני סוגי התקנה

| סוג מפעל | חיבור אינטרנט | סוג התקנה | רישוי |
|----------|--------------|-----------|-------|
| **מפעל רגיל** | ✅ יש אינטרנט | SaaS (ענן) או On-Premise | מנוי חודשי/שנתי |
| **מפעל מבודד** | ❌ ללא אינטרנט | Desktop App (Electron) | רישיון קבוע |

---

## 2. שלב 1: סיום פיתוח והכנה

### 2.1 משימות קריטיות לפני QA

#### תשלומים - Lemon Squeezy Integration
```typescript
// בקובץ server/routes.ts - שורה 335
// צריך לממש במקום ה-TODO:
import { LemonSqueezy } from '@lemonsqueezy/lemonsqueezy.js';

const ls = new LemonSqueezy(process.env.LEMON_SQUEEZY_API_KEY);

app.post('/api/purchase-standard', async (req, res) => {
  const { standardId, userId, planType } = req.body;
  // יצירת checkout session
  const checkout = await ls.createCheckout({
    store_id: process.env.LEMON_SQUEEZY_STORE_ID,
    variant_id: getVariantId(planType),
    custom_data: { userId, standardId }
  });
  res.json({ checkoutUrl: checkout.data.url });
});
```

#### הסרת Console.log
```bash
# סקריפט להסרת כל ה-console.log מהקוד
grep -r "console.log\|console.error\|console.warn" src/ --include="*.ts" --include="*.tsx" -l
```
והחלפה ב-logger:
```typescript
import logger from '@/server/utils/logger';
logger.info('message');  // במקום console.log
logger.error('error');   // במקום console.error
```

### 2.2 בניית קבצי Distribution

#### לענן (SaaS)
```bash
# בניית גרסת Production
npm run build

# יצירת Docker image
docker build -t scanmaster:v1.0.0 .
docker tag scanmaster:v1.0.0 your-registry/scanmaster:v1.0.0
docker push your-registry/scanmaster:v1.0.0
```

#### ל-Desktop (מפעלים מבודדים)
```bash
# Windows Installer
npm run dist:win
# Output: dist-electron/Scan Master Setup.exe

# macOS
npm run dist:mac
# Output: dist-electron/Scan Master.dmg

# Linux
npm run dist:linux
# Output: dist-electron/scan-master.AppImage
```

### 2.3 תיעוד משפטי

צריך להשלים את הקבצים ב-`/legal/`:
- ✅ EULA_TEMPLATE.md (קיים - צריך עו"ד)
- ✅ TERMS_OF_SERVICE_TEMPLATE.md (קיים - צריך עו"ד)
- ✅ PRIVACY_POLICY_TEMPLATE.md (קיים - צריך עו"ד)

**חובה לפנות לעורך דין IT לפני מכירה!**

---

## 3. שלב 2: בדיקות QA

### 3.1 בדיקות פונקציונליות

| קטגוריה | בדיקות | סטטוס |
|---------|--------|-------|
| **תקנים** | כל 4 התקנים מחשבים נכון | ⬜ |
| **צורות** | כל 27 הצורות נטענות ומציירות | ⬜ |
| **PDF Export** | כל סוגי הייצוא עובדים | ⬜ |
| **Authentication** | Login/Register/Logout | ⬜ |
| **תשלומים** | Checkout + Webhook | ⬜ |
| **Offline Mode** | Desktop עובד בלי רשת | ⬜ |

### 3.2 בדיקות אבטחה
```bash
# סריקת חולשות
npm audit

# בדיקת Dependencies
npm run lint

# בדיקת הרשאות
# וודא שכל endpoint מוגן
```

### 3.3 בדיקות ביצועים
- Load test עם 100 משתמשים
- Response time < 2 שניות
- PDF generation < 5 שניות

---

## 4. שלב 3: הכנה למכירה

### 4.1 תשתית ענן (למפעלים עם אינטרנט)

#### אפשרות A: Replit Deployments
```
1. לחץ "Deploy" → "Autoscale"
2. הגדר Environment Variables:
   - DATABASE_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - JWT_SECRET
   - LEMON_SQUEEZY_API_KEY
3. Custom Domain → scanmaster.pro
```

#### אפשרות B: AWS
```bash
# שימוש ב-serverless.yml הקיים
npm install -g serverless
serverless deploy --stage prod
```

#### אפשרות C: Google Cloud
```bash
# שימוש ב-app.yaml הקיים
gcloud app deploy app.yaml
```

#### אפשרות D: Docker On-Premise
```bash
# עבור מפעלים שרוצים לארח בעצמם
docker-compose up -d
```

### 4.2 הגדרת תוכניות מחירים

| Plan | מחיר/חודש | תכונות |
|------|-----------|--------|
| **Free** | $0 | AMS-STD-2154E בלבד, 5 sheets/חודש |
| **Standard** | $49 | תקן אחד לבחירה, Unlimited sheets |
| **Professional** | $99 | כל 4 התקנים, Priority support |
| **Enterprise** | Custom | On-premise, Training, SLA |

### 4.3 הקמת Support System
- Email: support@scanmaster.pro
- Ticketing: Zendesk / Freshdesk
- Documentation: Notion / GitBook
- Knowledge Base: Self-hosted או ReadMe.io

---

## 5. שלב 4: תהליך מכירה

### 5.1 ערוצי מכירה
1. **אתר** - scanmaster.pro עם Signup
2. **LinkedIn** - תעשיית NDT
3. **כנסים** - NDT conferences
4. **שותפים** - מפיצי ציוד NDT

### 5.2 תהליך מכירה למפעל

```
שבוע 1: Discovery Call
    ↓
שבוע 2: Demo (הדגמה אונליין)
    ↓
שבוע 3: Trial (14 ימי ניסיון)
    ↓
שבוע 4: Proposal (הצעת מחיר)
    ↓
שבוע 5: Contract Signing
    ↓
שבוע 6: Onboarding & Training
```

### 5.3 מסמכי מכירה
- [ ] Sales Deck (PPT)
- [ ] Feature Comparison Sheet
- [ ] ROI Calculator
- [ ] Customer References
- [ ] Technical Specifications

---

## 6. שלב 5: התקנה במפעל עם אינטרנט

### 6.1 ארכיטקטורה

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUD (AWS/GCP/Replit)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   CDN       │  │  API Server │  │  PostgreSQL (Neon)  │  │
│  │  (Static)   │  │  (Express)  │  │  + Supabase Auth    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │            │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
          │         HTTPS (443)                  │
          │                │                     │
          ▼                ▼                     │
┌─────────────────────────────────────────────────────────────┐
│                        FACTORY NETWORK                       │
│                                                             │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐            │
│   │ Inspector │   │ Inspector │   │  Manager  │            │
│   │  Browser  │   │  Browser  │   │  Browser  │            │
│   └───────────┘   └───────────┘   └───────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 שלבי התקנה

#### שלב 1: הקמת Account
```bash
# יצירת Organization ב-Supabase
POST /api/organizations
{
  "name": "Factory Name Ltd",
  "admin_email": "admin@factory.com",
  "plan": "professional"
}
```

#### שלב 2: הגדרת משתמשים
```bash
# הזמנת משתמשים
POST /api/invitations
{
  "org_id": "uuid",
  "emails": ["inspector1@factory.com", "inspector2@factory.com"],
  "role": "inspector"  # inspector / manager / admin
}
```

#### שלב 3: Configuration
```javascript
// הגדרות ספציפיות למפעל
{
  "factory_name": "Factory Ltd",
  "logo_url": "https://...",
  "default_standard": "ASTM-A388",
  "units": "metric",  // או imperial
  "language": "he",   // או en
  "timezone": "Asia/Jerusalem"
}
```

#### שלב 4: Training Session
- הדרכה אונליין 2-3 שעות
- מדריך PDF מודפס
- Video tutorials

### 6.3 דרישות רשת

| שירות | כתובת | Port |
|-------|-------|------|
| App | app.scanmaster.pro | 443 |
| API | api.scanmaster.pro | 443 |
| Auth | auth.supabase.co | 443 |
| Storage | storage.supabase.co | 443 |

**Firewall Rules נדרשות:**
```
ALLOW OUTBOUND TCP 443 → *.scanmaster.pro
ALLOW OUTBOUND TCP 443 → *.supabase.co
```

---

## 7. שלב 6: התקנה במפעל ללא אינטרנט (Air-Gapped)

### 7.1 ארכיטקטורה

```
┌─────────────────────────────────────────────────────────────┐
│                    FACTORY LOCAL NETWORK                    │
│                    (NO INTERNET ACCESS)                     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              LOCAL SERVER (Windows/Linux)            │   │
│   │                                                     │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│   │   │   Nginx     │  │   Express   │  │ PostgreSQL│  │   │
│   │   │   (Static)  │  │   Server    │  │  (Local)  │  │   │
│   │   └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │   │
│   │          │                │               │        │   │
│   │          └────────────────┼───────────────┘        │   │
│   │                          │                         │   │
│   └──────────────────────────┼─────────────────────────┘   │
│                              │                             │
│                        HTTP (5000)                         │
│                              │                             │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐           │
│   │ Inspector │   │ Inspector │   │  Manager  │           │
│   │  Desktop  │   │  Browser  │   │  Desktop  │           │
│   │   App     │   │  (Local)  │   │   App     │           │
│   └───────────┘   └───────────┘   └───────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 חבילת התקנה Offline

יצירת חבילת התקנה מלאה על USB/DVD:

```
ScanMaster_Enterprise_v1.0.0/
├── installers/
│   ├── ScanMaster-Setup-1.0.0-win-x64.exe
│   ├── ScanMaster-1.0.0-mac.dmg
│   └── ScanMaster-1.0.0-linux.AppImage
├── server/
│   ├── docker-compose-offline.yml
│   ├── scanmaster-app.tar (Docker image)
│   ├── postgres-15-alpine.tar (Docker image)
│   └── nginx-alpine.tar (Docker image)
├── database/
│   ├── initial-schema.sql
│   ├── standards-data.sql
│   └── calibration-blocks.sql
├── licenses/
│   ├── license-generator.exe
│   └── license-key.txt (ספציפי למפעל)
├── documentation/
│   ├── Installation-Guide-HE.pdf
│   ├── Installation-Guide-EN.pdf
│   ├── User-Manual-HE.pdf
│   ├── User-Manual-EN.pdf
│   └── Troubleshooting-Guide.pdf
└── README.txt
```

### 7.3 שלבי התקנה On-Premise

#### שלב 1: הכנת שרת מקומי

**דרישות מינימום:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- OS: Windows Server 2019+ / Ubuntu 22.04+
- Docker Desktop (Windows) / Docker Engine (Linux)

#### שלב 2: העתקת קבצים

```bash
# מה-USB לשרת
cp -r /media/usb/ScanMaster_Enterprise_v1.0.0 /opt/scanmaster
```

#### שלב 3: טעינת Docker Images

```bash
cd /opt/scanmaster/server

# טעינת images מקומית (ללא צורך באינטרנט)
docker load -i scanmaster-app.tar
docker load -i postgres-15-alpine.tar
docker load -i nginx-alpine.tar
```

#### שלב 4: הגדרת Environment

יצירת קובץ `.env`:
```env
# Database - Local PostgreSQL
DATABASE_URL=postgresql://scanmaster:SecurePassword123@postgres:5432/scanmaster

# JWT Secret - יש לייצר מחדש לכל התקנה
JWT_SECRET=your-unique-256-bit-secret-key

# Session Secret
SESSION_SECRET=another-unique-secret

# License Key (from license-key.txt)
LICENSE_KEY=XXXX-XXXX-XXXX-XXXX

# Factory Settings
FACTORY_NAME=Factory Ltd
OFFLINE_MODE=true
LOCAL_AUTH=true
```

#### שלב 5: הפעלת השרת

```bash
# docker-compose-offline.yml מותאם לעבודה מקומית
docker-compose -f docker-compose-offline.yml up -d

# בדיקת סטטוס
docker-compose -f docker-compose-offline.yml ps
docker-compose -f docker-compose-offline.yml logs -f
```

**docker-compose-offline.yml:**
```yaml
version: '3.8'

services:
  app:
    image: scanmaster-app:v1.0.0
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://scanmaster:${DB_PASSWORD}@postgres:5432/scanmaster
      JWT_SECRET: ${JWT_SECRET}
      OFFLINE_MODE: "true"
      LOCAL_AUTH: "true"
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - scanmaster-local

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scanmaster
      POSTGRES_USER: scanmaster
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./database/initial-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/standards-data.sql:/docker-entrypoint-initdb.d/02-data.sql
    restart: unless-stopped
    networks:
      - scanmaster-local

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-offline.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - scanmaster-local

networks:
  scanmaster-local:
    driver: bridge
```

#### שלב 6: התקנת Desktop Apps על תחנות עבודה

```bash
# Windows - הפעלת Installer
\\server\share\ScanMaster-Setup-1.0.0-win-x64.exe

# או הפעלה ישירה ללא התקנה (Portable)
\\server\share\ScanMaster-Portable.exe
```

הגדרת חיבור לשרת מקומי:
```javascript
// config.local.json
{
  "apiUrl": "http://192.168.1.100:5000",
  "offlineMode": true,
  "localAuth": true
}
```

### 7.4 מערכת רישוי Offline

#### יצירת License Key

```typescript
// license-generator.ts
import crypto from 'crypto';

interface LicenseData {
  factoryName: string;
  machineId: string;  // Hardware fingerprint
  expiryDate: Date;
  maxUsers: number;
  features: string[];
}

function generateLicense(data: LicenseData, secretKey: string): string {
  const payload = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
  
  const license = Buffer.from(JSON.stringify({
    data,
    signature
  })).toString('base64');
  
  return license;
}

// שימוש:
const license = generateLicense({
  factoryName: "Factory Ltd",
  machineId: "ABC123",  // מזהה מחשב
  expiryDate: new Date('2025-12-31'),
  maxUsers: 10,
  features: ['all-standards', 'pdf-export', 'cad-import']
}, process.env.LICENSE_SECRET);
```

#### אימות רישיון

```typescript
// license-validator.ts
function validateLicense(licenseKey: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(licenseKey, 'base64').toString());
    
    // בדיקת חתימה
    const expectedSignature = crypto
      .createHmac('sha256', process.env.LICENSE_SECRET)
      .update(JSON.stringify(decoded.data))
      .digest('hex');
    
    if (decoded.signature !== expectedSignature) {
      return false;  // רישיון מזויף
    }
    
    // בדיקת תוקף
    if (new Date(decoded.data.expiryDate) < new Date()) {
      return false;  // רישיון פג
    }
    
    // בדיקת מזהה מחשב
    const currentMachineId = getMachineId();
    if (decoded.data.machineId !== currentMachineId) {
      return false;  // רישיון לא למחשב זה
    }
    
    return true;
  } catch {
    return false;
  }
}
```

### 7.5 סנכרון נתונים (Offline → Online)

אם המפעל רוצה לסנכרן נתונים מדי פעם:

```typescript
// sync-manager.ts
interface SyncPackage {
  techniqueSheets: TechniqueSheet[];
  inspectionReports: Report[];
  exportedAt: Date;
  factoryId: string;
}

// ייצוא מהמערכת המקומית
function exportForSync(): SyncPackage {
  const sheets = db.query('SELECT * FROM technique_sheets WHERE synced = false');
  const reports = db.query('SELECT * FROM reports WHERE synced = false');
  
  return {
    techniqueSheets: sheets,
    inspectionReports: reports,
    exportedAt: new Date(),
    factoryId: config.factoryId
  };
}

// שמירה לקובץ
function saveToUsb(data: SyncPackage): void {
  const encrypted = encrypt(JSON.stringify(data), config.syncKey);
  fs.writeFileSync('/media/usb/sync-package.enc', encrypted);
}
```

### 7.6 עדכונים Offline

ראה סעיף 11 - "מערכת עדכונים מלאה" להסבר מפורט.

---

## 8. שלב 7: הדרכה ותמיכה

### 8.1 חומרי הדרכה

| חומר | עם אינטרנט | ללא אינטרנט |
|------|-----------|-------------|
| Video Tutorials | YouTube / Vimeo | USB / Local Server |
| Documentation | Online Docs | PDF מודפס |
| Live Training | Zoom / Teams | On-site |
| Q&A | Chat / Email | Phone / On-site |

### 8.2 תמיכה שוטפת

**מפעל עם אינטרנט:**
- Live Chat בתוך האפליקציה
- Email support
- עדכונים אוטומטיים
- Remote troubleshooting

**מפעל מבודד:**
- Phone support
- On-site visits (SLA)
- עדכונים ב-USB
- VPN זמני לתמיכה (אם מותר)

---

## 9. צ'קליסטים

### 9.1 צ'קליסט Pre-Production

- [ ] כל הבדיקות עוברות (unit + integration)
- [ ] Performance testing עבר
- [ ] Security audit עבר
- [ ] תיעוד משפטי מוכן ונבדק ע"י עו"ד
- [ ] Lemon Squeezy integration עובד
- [ ] Console.logs הוסרו
- [ ] Error tracking מוגדר (Sentry)
- [ ] Backups אוטומטיים עובדים
- [ ] SSL certificates מוגדרים
- [ ] Custom domain מוגדר

### 9.2 צ'קליסט התקנה Online

- [ ] Organization נוצר ב-Supabase
- [ ] Admin user נוצר
- [ ] משתמשים הוזמנו
- [ ] Factory settings הוגדרו
- [ ] Firewall rules נפתחו
- [ ] הדרכה ניתנה
- [ ] בדיקת PDF export
- [ ] בדיקת backup/restore

### 9.3 צ'קליסט התקנה Offline

- [ ] שרת עומד בדרישות מינימום
- [ ] Docker מותקן
- [ ] קבצים הועתקו מ-USB
- [ ] Docker images נטענו
- [ ] .env file מוגדר
- [ ] Database initialized
- [ ] License key activated
- [ ] Desktop apps הותקנו על תחנות
- [ ] רשת פנימית עובדת
- [ ] הדרכה ניתנה
- [ ] Backup procedure נבדק
- [ ] Update procedure נבדק
- [ ] Support contact מסופק

---

## 10. נספחים טכניים

### נספח א': Environment Variables Reference

```env
# === Core ===
NODE_ENV=production
PORT=5000

# === Database ===
DATABASE_URL=postgresql://user:pass@host:5432/db

# === Authentication ===
# Online mode
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Offline mode
LOCAL_AUTH=true
JWT_SECRET=xxx
SESSION_SECRET=xxx

# === Payments (Online only) ===
LEMON_SQUEEZY_API_KEY=xxx
LEMON_SQUEEZY_STORE_ID=xxx

# === Licensing (Offline only) ===
LICENSE_KEY=XXXX-XXXX-XXXX-XXXX
OFFLINE_MODE=true

# === Factory Settings ===
FACTORY_NAME=Factory Ltd
DEFAULT_STANDARD=ASTM-A388
UNITS=metric

# === Monitoring ===
SENTRY_DSN=xxx
LOG_LEVEL=info

# === Backup ===
BACKUP_DIR=/backups
BACKUP_RETENTION_DAYS=30
S3_BUCKET=xxx  # Online only
```

### נספח ב': Pricing Matrix

| Feature | Free | Standard | Professional | Enterprise |
|---------|------|----------|--------------|------------|
| **Price/month** | $0 | $49 | $99 | Custom |
| **Users** | 1 | 3 | 10 | Unlimited |
| **Standards** | AMS only | 1 choice | All 4 | All 4 |
| **Sheets/month** | 5 | Unlimited | Unlimited | Unlimited |
| **PDF Export** | ✅ | ✅ | ✅ | ✅ |
| **CAD Import** | ❌ | ✅ | ✅ | ✅ |
| **3D Viewer** | ❌ | ❌ | ✅ | ✅ |
| **On-Premise** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **SLA** | ❌ | ❌ | ❌ | ✅ |
| **Training** | Video | Video | 2hr online | On-site |

### נספח ג': Support SLA

| Level | Response Time | Resolution Time | Availability |
|-------|--------------|-----------------|--------------|
| Critical | 1 hour | 4 hours | 24/7 |
| High | 4 hours | 24 hours | Business hours |
| Medium | 24 hours | 72 hours | Business hours |
| Low | 48 hours | 1 week | Business hours |

### נספח ד': System Requirements

**Cloud (Browser):**
- Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
- Screen: 1280x720 minimum

**Desktop App:**
- Windows 10+ (64-bit)
- macOS 11+ (Big Sur)
- Ubuntu 20.04+ / Debian 11+
- RAM: 4GB minimum
- Storage: 500MB

**Local Server (Air-Gapped):**
- CPU: 4+ cores
- RAM: 8GB minimum, 16GB recommended
- Storage: 100GB SSD
- OS: Windows Server 2019+ / Ubuntu 22.04+
- Docker Desktop / Engine

---

## סיכום

| סוג מפעל | התקנה | עלות שנתית משוערת |
|----------|-------|------------------|
| **עם אינטרנט - Professional** | 1 יום מרחוק | $1,188 ($99/חודש) |
| **ללא אינטרנט - Enterprise** | 2-3 ימים On-site | $5,000-$15,000 |

**זמנים משוערים:**
- מפיתוח ל-Production: 3 שבועות
- מכירה ל-Installation (Online): 1 שבוע
- מכירה ל-Installation (Offline): 2-4 שבועות

---

**נכתב על ידי:** GitHub Copilot  
**תאריך:** נובמבר 2025  
**גרסה:** 1.0

---

⚠️ **הערה חשובה:** מדריך זה מהווה מסגרת כללית. יש להתאים לצרכים הספציפיים של כל לקוח ולפנות לאנשי מקצוע (עו"ד, מומחי אבטחה) לפני יציאה לשוק.

---

## 11. מערכת עדכונים מלאה (Software Updates)

מערכת העדכונים היא קריטית לאבטחה, תיקון באגים והוספת פיצ'רים חדשים. להלן הסבר מפורט לשני סוגי המפעלים.

### 11.1 אסטרטגיית גרסאות (Semantic Versioning)

```
MAJOR.MINOR.PATCH
  │      │     │
  │      │     └── תיקוני באגים (1.0.1 → 1.0.2)
  │      └──────── פיצ'רים חדשים (1.0.x → 1.1.0)
  └─────────────── שינויים משמעותיים (1.x.x → 2.0.0)
```

| סוג עדכון | דוגמה | תדירות | חובה? | Downtime |
|-----------|-------|--------|-------|----------|
| **Patch** | 1.0.1 → 1.0.2 | שבועי | לא | 0 |
| **Minor** | 1.0.x → 1.1.0 | חודשי | לא | < 1 דקה |
| **Major** | 1.x.x → 2.0.0 | שנתי | כן (אחרי 6 חודשים) | 5-15 דקות |
| **Security** | כל גרסה | מיידי | כן | < 1 דקה |

---

### 11.2 עדכונים למפעל עם אינטרנט (Online Updates)

#### 11.2.1 עדכון אוטומטי (SaaS)

**למפעלים שמשתמשים בגרסת הענן - העדכון אוטומטי לחלוטין!**

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATED UPDATE FLOW                     │
│                                                             │
│   Developer                                                 │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────┐     │
│   │  GitHub  │───▶│ CI/CD    │───▶│ Cloud Deployment │     │
│   │  Push    │    │ Pipeline │    │ (Replit/AWS/GCP) │     │
│   └──────────┘    └──────────┘    └────────┬─────────┘     │
│                                            │               │
│                                            ▼               │
│                                   ┌──────────────────┐     │
│                                   │  Users get new   │     │
│                                   │  version on next │     │
│                                   │  page refresh    │     │
│                                   └──────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**GitHub Actions Workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Build Docker image
      - name: Build and push Docker image
        run: |
          docker build -t scanmaster:${{ github.sha }} .
          docker tag scanmaster:${{ github.sha }} registry.example.com/scanmaster:latest
          docker push registry.example.com/scanmaster:latest
      
      # Deploy to cloud
      - name: Deploy to Production
        run: |
          # Replit / Railway / Render - usually automatic via Git integration
          # AWS ECS
          aws ecs update-service --cluster prod --service scanmaster --force-new-deployment
          # OR Google Cloud Run
          gcloud run deploy scanmaster --image=gcr.io/project/scanmaster:latest --region=us-central1

  notify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Notify users
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text":"🚀 ScanMaster v${{ github.ref_name }} deployed successfully!"}'
```

#### 11.2.2 עדכון On-Premise עם Docker (מפעל עם אינטרנט)

למפעלים שמריצים שרת מקומי אבל יש להם אינטרנט:

**אפשרות A: עדכון אוטומטי עם Watchtower**

```yaml
# docker-compose.yml - הוסף service
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_POLL_INTERVAL: 86400  # בדיקה כל 24 שעות
      WATCHTOWER_CLEANUP: "true"
      WATCHTOWER_INCLUDE_STOPPED: "true"
      WATCHTOWER_NOTIFICATIONS: "slack"
      WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL: ${SLACK_WEBHOOK}
    restart: unless-stopped
```

**אפשרות B: עדכון ידני מרחוק**

```bash
#!/bin/bash
# scripts/update-remote.sh - הרץ מהמחשב שלך

FACTORY_SERVER="ssh://admin@factory.example.com"
NEW_VERSION="v1.2.0"

echo "🔄 Updating factory server to ${NEW_VERSION}..."

ssh ${FACTORY_SERVER} << 'EOF'
  cd /opt/scanmaster
  
  # גיבוי
  ./scripts/backup.sh
  
  # משיכת גרסה חדשה
  docker pull registry.example.com/scanmaster:${NEW_VERSION}
  docker tag registry.example.com/scanmaster:${NEW_VERSION} scanmaster-app:latest
  
  # עדכון
  docker-compose down
  docker-compose up -d
  
  # בדיקה
  sleep 10
  curl -s http://localhost:5000/health
EOF

echo "✅ Update complete!"
```

**אפשרות C: עדכון דרך ממשק Admin**

הוסף endpoint בשרת:

```typescript
// server/routes/admin.ts
import { Router } from 'express';
import { exec } from 'child_process';

const router = Router();

// רק ל-Super Admin
router.post('/api/admin/check-updates', requireSuperAdmin, async (req, res) => {
  try {
    const currentVersion = process.env.APP_VERSION || '1.0.0';
    
    // בדיקת גרסה חדשה ב-API
    const response = await fetch('https://api.scanmaster.pro/versions/latest');
    const latest = await response.json();
    
    res.json({
      currentVersion,
      latestVersion: latest.version,
      updateAvailable: latest.version !== currentVersion,
      releaseNotes: latest.releaseNotes,
      publishedAt: latest.publishedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check updates' });
  }
});

router.post('/api/admin/apply-update', requireSuperAdmin, async (req, res) => {
  const { version } = req.body;
  
  // שמור סטטוס
  await db.insert(updateLogs).values({
    version,
    status: 'in_progress',
    startedAt: new Date()
  });
  
  // הפעל סקריפט עדכון ברקע
  exec('/opt/scanmaster/scripts/auto-update.sh ' + version, (error, stdout, stderr) => {
    if (error) {
      logger.error('Update failed:', error);
    }
  });
  
  res.json({ message: 'Update started', version });
});

export default router;
```

---

### 11.3 עדכונים למפעל ללא אינטרנט (Offline Updates)

#### 11.3.1 תהליך מלא - צד המפתח

```
┌─────────────────────────────────────────────────────────────┐
│                  DEVELOPER SIDE (Your Office)               │
│                                                             │
│   1. Build new version                                      │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────────────────────────────────────┐              │
│   │  npm run build                           │              │
│   │  docker build -t scanmaster:v1.2.0 .     │              │
│   │  docker save scanmaster:v1.2.0 > app.tar │              │
│   └──────────────────────────────────────────┘              │
│      │                                                      │
│      ▼                                                      │
│   2. Create update package                                  │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────────────────────────────────────┐              │
│   │  ScanMaster_Update_v1.2.0/               │              │
│   │  ├── scanmaster-app-v1.2.0.tar           │              │
│   │  ├── CHANGELOG.md                        │              │
│   │  ├── update.sh                           │              │
│   │  ├── update.ps1 (Windows)                │              │
│   │  ├── rollback.sh                         │              │
│   │  └── checksums.sha256                    │              │
│   └──────────────────────────────────────────┘              │
│      │                                                      │
│      ▼                                                      │
│   3. Deliver to factory                                     │
│      ├── USB Drive                                          │
│      ├── Secure Email (encrypted)                           │
│      └── Courier service                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**סקריפט יצירת חבילת עדכון:**

```bash
#!/bin/bash
# scripts/create-update-package.sh

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./create-update-package.sh v1.2.0"
    exit 1
fi

OUTPUT_DIR="ScanMaster_Update_${VERSION}"
mkdir -p "$OUTPUT_DIR"

echo "📦 Creating update package for ${VERSION}..."

# 1. Build and save Docker image
echo "Building Docker image..."
docker build -t scanmaster-app:${VERSION} .
docker save scanmaster-app:${VERSION} -o "${OUTPUT_DIR}/scanmaster-app-${VERSION}.tar"

# 2. Copy update scripts
cat > "${OUTPUT_DIR}/update.sh" << 'SCRIPT'
#!/bin/bash
set -e

VERSION=$(ls scanmaster-app-*.tar | sed 's/scanmaster-app-\(.*\)\.tar/\1/')
echo "🔄 ScanMaster Update to ${VERSION}"
echo "=================================="

# Verify checksum
echo "Verifying file integrity..."
sha256sum -c checksums.sha256 || { echo "❌ Checksum failed!"; exit 1; }

# Backup current version
echo "Creating backup..."
BACKUP_DIR="/opt/scanmaster/backups/pre-update-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker exec scanmaster-postgres pg_dump -U scanmaster scanmaster | gzip > "$BACKUP_DIR/database.sql.gz"

# Save current image
docker save scanmaster-app:latest -o "$BACKUP_DIR/previous-app.tar" 2>/dev/null || true

# Store current version
docker inspect scanmaster-app:latest --format='{{.Config.Labels.version}}' > "$BACKUP_DIR/version.txt" 2>/dev/null || echo "unknown" > "$BACKUP_DIR/version.txt"

echo "Backup saved to: $BACKUP_DIR"

# Stop services
echo "Stopping services..."
cd /opt/scanmaster
docker-compose -f docker-compose-offline.yml stop app

# Load new image
echo "Loading new version..."
docker load -i "$(dirname "$0")/scanmaster-app-${VERSION}.tar"
docker tag scanmaster-app:${VERSION} scanmaster-app:latest

# Start services
echo "Starting services..."
docker-compose -f docker-compose-offline.yml up -d app

# Wait for health check
echo "Waiting for application to start..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health | grep -q "ok"; then
        echo "✅ Update successful! Now running ${VERSION}"
        echo ""
        echo "To rollback if issues: ./rollback.sh $BACKUP_DIR"
        exit 0
    fi
    sleep 2
    echo "  Waiting... ($i/30)"
done

echo "❌ Health check failed! Rolling back..."
./rollback.sh "$BACKUP_DIR"
exit 1
SCRIPT
chmod +x "${OUTPUT_DIR}/update.sh"

# 3. Windows update script
cat > "${OUTPUT_DIR}/update.ps1" << 'SCRIPT'
# ScanMaster Update Script for Windows
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$VERSION = (Get-ChildItem "scanmaster-app-*.tar" | Select-Object -First 1).Name -replace 'scanmaster-app-(.*)\.tar','$1'

Write-Host "🔄 ScanMaster Update to $VERSION" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Verify checksum
Write-Host "Verifying file integrity..."
$expectedHash = (Get-Content "checksums.sha256" | Where-Object { $_ -match "scanmaster-app" }).Split(" ")[0]
$actualHash = (Get-FileHash "scanmaster-app-$VERSION.tar" -Algorithm SHA256).Hash.ToLower()
if ($expectedHash -ne $actualHash) {
    Write-Host "❌ Checksum verification failed!" -ForegroundColor Red
    exit 1
}

# Backup
Write-Host "Creating backup..."
$backupDir = "C:\scanmaster\backups\pre-update-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

docker exec scanmaster-postgres pg_dump -U scanmaster scanmaster | Out-File "$backupDir\database.sql"
docker save scanmaster-app:latest -o "$backupDir\previous-app.tar" 2>$null

# Stop services
Write-Host "Stopping services..."
Set-Location C:\scanmaster
docker-compose -f docker-compose-offline.yml stop app

# Load new image
Write-Host "Loading new version..."
docker load -i "$PSScriptRoot\scanmaster-app-$VERSION.tar"
docker tag "scanmaster-app:$VERSION" scanmaster-app:latest

# Start services
Write-Host "Starting services..."
docker-compose -f docker-compose-offline.yml up -d app

# Health check
Write-Host "Waiting for application to start..."
for ($i = 1; $i -le 30; $i++) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
        if ($health.status -eq "ok") {
            Write-Host "✅ Update successful! Now running $VERSION" -ForegroundColor Green
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 2
    Write-Host "  Waiting... ($i/30)"
}

Write-Host "❌ Health check failed! Rolling back..." -ForegroundColor Red
& "$PSScriptRoot\rollback.ps1" -BackupDir $backupDir
exit 1
SCRIPT

# 4. Rollback script
cat > "${OUTPUT_DIR}/rollback.sh" << 'SCRIPT'
#!/bin/bash
set -e

BACKUP_DIR=$1
if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
    echo "Usage: ./rollback.sh /path/to/backup"
    echo ""
    echo "Available backups:"
    ls -la /opt/scanmaster/backups/
    exit 1
fi

echo "🔙 Rolling back from: $BACKUP_DIR"

# Stop services
cd /opt/scanmaster
docker-compose -f docker-compose-offline.yml stop app

# Restore previous image
if [ -f "$BACKUP_DIR/previous-app.tar" ]; then
    echo "Restoring previous Docker image..."
    docker load -i "$BACKUP_DIR/previous-app.tar"
fi

# Restore database
if [ -f "$BACKUP_DIR/database.sql.gz" ]; then
    echo "Restoring database..."
    docker exec -i scanmaster-postgres psql -U scanmaster scanmaster < <(gunzip -c "$BACKUP_DIR/database.sql.gz")
fi

# Start services
docker-compose -f docker-compose-offline.yml up -d

echo "✅ Rollback complete"
SCRIPT
chmod +x "${OUTPUT_DIR}/rollback.sh"

# 5. Create changelog
cat > "${OUTPUT_DIR}/CHANGELOG.md" << EOF
# ScanMaster ${VERSION} - Release Notes

**Release Date:** $(date +%Y-%m-%d)

## What's New

### Features
- [ ] Add feature descriptions here

### Bug Fixes
- [ ] Add bug fixes here

### Security Updates
- [ ] Add security updates here

## Upgrade Instructions

1. Copy this folder to the factory server
2. Run: \`sudo ./update.sh\` (Linux) or \`.\update.ps1\` (Windows)
3. Verify the application is working

## Rollback Instructions

If issues occur after update:
\`\`\`bash
sudo ./rollback.sh /opt/scanmaster/backups/pre-update-XXXXXX
\`\`\`

## Known Issues
- None

## Support
Contact: support@scanmaster.pro
EOF

# 6. Create checksums
echo "Generating checksums..."
cd "$OUTPUT_DIR"
sha256sum scanmaster-app-${VERSION}.tar > checksums.sha256
sha256sum update.sh >> checksums.sha256
sha256sum rollback.sh >> checksums.sha256
cd ..

# 7. Create final package
echo "Creating final package..."
tar -czvf "${OUTPUT_DIR}.tar.gz" "$OUTPUT_DIR"

# Calculate size
SIZE=$(du -h "${OUTPUT_DIR}.tar.gz" | cut -f1)

echo ""
echo "=============================================="
echo "✅ Update package created successfully!"
echo "=============================================="
echo "Package: ${OUTPUT_DIR}.tar.gz"
echo "Size: ${SIZE}"
echo ""
echo "Contents:"
ls -la "$OUTPUT_DIR/"
echo ""
echo "Delivery options:"
echo "  1. Copy to USB drive"
echo "  2. Send via secure file transfer"
echo "  3. Use courier service"
echo "=============================================="
```

#### 11.3.2 תהליך מלא - צד המפעל

```
┌─────────────────────────────────────────────────────────────┐
│                   FACTORY SIDE (On-Site)                    │
│                                                             │
│   1. Receive update package                                 │
│      │  ├── USB Drive                                       │
│      │  └── Secure download                                 │
│      │                                                      │
│      ▼                                                      │
│   2. Verify package                                         │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────────────────────────────────────┐              │
│   │  # Verify checksums                      │              │
│   │  sha256sum -c checksums.sha256           │              │
│   │                                          │              │
│   │  # Scan for malware (if available)       │              │
│   │  clamscan -r ScanMaster_Update_v1.2.0/   │              │
│   └──────────────────────────────────────────┘              │
│      │                                                      │
│      ▼                                                      │
│   3. Schedule maintenance window                            │
│      │  └── 15-30 minutes recommended                       │
│      │                                                      │
│      ▼                                                      │
│   4. Run update                                             │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────────────────────────────────────┐              │
│   │  cd /media/usb/ScanMaster_Update_v1.2.0  │              │
│   │  sudo ./update.sh                        │              │
│   │                                          │              │
│   │  # Or on Windows:                        │              │
│   │  .\update.ps1                            │              │
│   └──────────────────────────────────────────┘              │
│      │                                                      │
│      ▼                                                      │
│   5. Post-update verification                               │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────────────────────────────────────┐              │
│   │  □ Application loads                     │              │
│   │  □ Login works                           │              │
│   │  □ Create test technique sheet           │              │
│   │  □ PDF export works                      │              │
│   │  □ Previous data accessible              │              │
│   └──────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 11.3.3 מדריך למנהל IT במפעל

```markdown
# מדריך עדכון ScanMaster - למנהל IT

## לפני העדכון

### בדיקות מקדימות
- [ ] וודא שיש גיבוי עדכני של ה-Database
- [ ] תאם חלון תחזוקה עם המשתמשים (15-30 דקות)
- [ ] וודא שיש גישה לשרת עם הרשאות Admin
- [ ] בדוק שיש מספיק מקום בדיסק (לפחות 2GB פנוי)

### אימות חבילת העדכון
```bash
# 1. בדוק שהקובץ לא פגום
sha256sum -c checksums.sha256

# 2. סרוק לווירוסים (אם יש אנטי-וירוס)
clamscan -r /media/usb/ScanMaster_Update_*
```

## ביצוע העדכון

### Linux
```bash
# 1. התחבר לשרת
ssh admin@scanmaster-server

# 2. עבור לתיקיית העדכון
cd /media/usb/ScanMaster_Update_v1.2.0

# 3. הפעל את סקריפט העדכון
sudo ./update.sh

# 4. עקוב אחרי הפלט
```

### Windows
```powershell
# 1. פתח PowerShell כ-Administrator

# 2. עבור לתיקיית העדכון
cd D:\ScanMaster_Update_v1.2.0

# 3. הפעל את סקריפט העדכון
.\update.ps1
```

## אחרי העדכון

### בדיקות תקינות
1. פתח את האפליקציה בדפדפן: http://localhost:5000
2. התחבר עם משתמש קיים
3. צור Technique Sheet חדש
4. ייצא ל-PDF
5. וודא שהנתונים הישנים נגישים

### אם משהו לא עובד

**Rollback מיידי:**
```bash
# Linux
sudo ./rollback.sh /opt/scanmaster/backups/pre-update-XXXXXX

# Windows
.\rollback.ps1 -BackupDir "C:\scanmaster\backups\pre-update-XXXXXX"
```

**יצירת קשר עם תמיכה:**
- טלפון: +1-XXX-XXX-XXXX
- Email: support@scanmaster.pro
- ציין את מספר הגרסה ותיאור הבעיה
```

---

### 11.4 Database Migrations

כאשר עדכון כולל שינויים במבנה ה-Database:

```typescript
// server/migrations/001_add_scan_directions.ts
import { db } from '../db';

export const migration = {
  version: '1.2.0',
  name: 'add_scan_directions',
  
  up: async () => {
    await db.execute(`
      ALTER TABLE technique_sheets 
      ADD COLUMN IF NOT EXISTS scan_directions JSONB DEFAULT '[]'
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_sheets_scan_directions 
      ON technique_sheets USING GIN (scan_directions)
    `);
  },
  
  down: async () => {
    await db.execute(`
      ALTER TABLE technique_sheets 
      DROP COLUMN IF EXISTS scan_directions
    `);
  }
};
```

**Migration Runner:**

```typescript
// server/migrations/runner.ts
import fs from 'fs';
import path from 'path';
import { db } from '../db';

interface MigrationRecord {
  version: string;
  name: string;
  appliedAt: Date;
}

export async function runMigrations() {
  // Create migrations table if not exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Get applied migrations
  const applied = await db.query<MigrationRecord>('SELECT * FROM schema_migrations');
  const appliedVersions = new Set(applied.map(m => m.version));
  
  // Get all migration files
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^\d{3}_.*\.ts$/))
    .sort();
  
  for (const file of files) {
    const migration = require(path.join(migrationsDir, file)).migration;
    
    if (!appliedVersions.has(migration.version)) {
      console.log(`Applying migration: ${migration.name} (${migration.version})`);
      
      await db.transaction(async (tx) => {
        await migration.up();
        await tx.execute(`
          INSERT INTO schema_migrations (version, name) 
          VALUES ($1, $2)
        `, [migration.version, migration.name]);
      });
      
      console.log(`✅ Migration applied: ${migration.name}`);
    }
  }
  
  console.log('All migrations up to date');
}
```

---

### 11.5 הודעות עדכון למשתמשים

#### In-App Notification

```typescript
// src/components/UpdateNotification.tsx
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  
  useEffect(() => {
    // Check for updates every hour
    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/version');
        const data = await res.json();
        
        if (data.updateAvailable) {
          setUpdateAvailable(true);
          setNewVersion(data.latestVersion);
        }
      } catch (e) {
        // Offline or error - ignore
      }
    };
    
    checkUpdates();
    const interval = setInterval(checkUpdates, 3600000); // 1 hour
    
    return () => clearInterval(interval);
  }, []);
  
  if (!updateAvailable) return null;
  
  return (
    <Alert className="fixed bottom-4 right-4 w-80 z-50">
      <RefreshCw className="h-4 w-4" />
      <AlertTitle>עדכון זמין!</AlertTitle>
      <AlertDescription>
        גרסה {newVersion} זמינה להורדה.
        <br />
        <Button 
          variant="link" 
          className="p-0 h-auto"
          onClick={() => window.location.reload()}
        >
          רענן עכשיו
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

#### Email Notification Template

```html
<!-- emails/update-notification.html -->
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>עדכון חדש זמין - ScanMaster</title>
</head>
<body style="font-family: Arial, sans-serif; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">🚀 ScanMaster {{version}} זמין!</h1>
    
    <p>שלום {{factoryName}},</p>
    
    <p>גרסה חדשה של ScanMaster זמינה לעדכון.</p>
    
    <h2>מה חדש בגרסה {{version}}:</h2>
    <ul>
      {{#each releaseNotes}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    
    {{#if isOffline}}
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
      <h3>📦 הוראות עדכון:</h3>
      <ol>
        <li>הורד את חבילת העדכון מהקישור המצורף</li>
        <li>העתק ל-USB והעבר לשרת המפעל</li>
        <li>הרץ: <code>sudo ./update.sh</code></li>
      </ol>
      <p>
        <a href="{{downloadUrl}}" style="color: #2563eb;">
          📥 הורד חבילת עדכון ({{packageSize}})
        </a>
      </p>
    </div>
    {{else}}
    <p>
      העדכון יתבצע אוטומטית. רענן את הדפדפן לקבלת הגרסה החדשה.
    </p>
    {{/if}}
    
    <hr>
    <p style="color: #6b7280; font-size: 12px;">
      ScanMaster Inspection Pro<br>
      support@scanmaster.pro
    </p>
  </div>
</body>
</html>
```

---

### 11.6 לוח זמנים מומלץ לעדכונים

| סוג מפעל | תדירות בדיקה | זמן עדכון מומלץ | אחראי |
|----------|--------------|-----------------|-------|
| **Online SaaS** | אוטומטי | מיידי | אוטומטי |
| **Online On-Premise** | שבועי | סוף שבוע 02:00 | IT Admin |
| **Offline** | חודשי | חלון תחזוקה | IT Admin + Support |

### 11.7 Best Practices

1. **תמיד גבה לפני עדכון** - גם אם הסקריפט עושה זאת אוטומטית
2. **בדוק ב-Staging קודם** - אם יש סביבת בדיקות
3. **עדכן בשעות שפל** - פחות משתמשים = פחות סיכון
4. **תעד הכל** - שמור לוג של כל העדכונים שבוצעו
5. **תכנן Rollback** - תמיד דע איך לחזור לגרסה קודמת
6. **הודע למשתמשים** - תקשורת ברורה לפני ואחרי

---
