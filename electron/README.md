# Electron Desktop App for Scan Master

## 🚀 Quick Start

### Development Mode
To run the app in development mode:

```bash
# Option 1: If server is already running
npm run electron:dev

# Option 2: Electron will start the server automatically
npm run electron:dev
```

The Electron app will check if the server is running and start it if needed.

### Production Build
To create installers for distribution:

```bash
# Windows installer (.exe)
npm run dist:win

# macOS installer (.dmg)
npm run dist:mac

# Linux installer (.AppImage)
npm run dist:linux
```

## 📁 Project Structure

```
electron/
├── main.js          # Main Electron process
├── preload.js       # Preload script for security
└── README.md        # This file

dist-electron/      # Built installers (after running dist commands)
├── Scan Master Setup.exe
├── Scan Master.dmg
└── Scan Master.AppImage
```

## 🎯 Features Added

1. **Native Desktop App** - Your web app now runs as a desktop application
2. **Application Menu** - File, Edit, View, Window, Help menus
3. **Keyboard Shortcuts** - Ctrl+N for new sheet, Ctrl+P for PDF export
4. **System Integration** - Native file dialogs, system notifications
5. **Offline Capability** - Works without internet (with local database)

## 🔧 Configuration

The app configuration is in `electron-builder.json`:
- App ID: `com.scanmaster.inspectionpro`
- Product Name: `Scan Master Inspection Pro`
- Output Directory: `dist-electron/`

## 🏗️ Building Icons

Before building for production, add your app icons in the `build/` directory:
- Windows: `icon.ico` (256x256)
- macOS: `icon.icns` (512x512)
- Linux: `icon.png` (512x512)

## 🔐 Security Features

- **Context Isolation**: Enabled to prevent XSS attacks
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Safe bridge between main and renderer
- **Content Security Policy**: Restricts external resources

## 📋 Next Steps for Offline Mode

To make the app fully offline-capable:

1. **Add SQLite Database**
   ```bash
   npm install better-sqlite3
   ```

2. **Create Local Storage Adapter**
   ```javascript
   // electron/database.js
   const Database = require('better-sqlite3');
   const db = new Database('scanmaster.db');
   ```

3. **Implement Sync Manager**
   ```javascript
   // electron/sync.js
   class SyncManager {
     syncToCloud() { /* ... */ }
     syncFromCloud() { /* ... */ }
   }
   ```

## 🎨 Customization

### Change Window Size
Edit `electron/main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1400,  // Change width
  height: 900,  // Change height
  // ...
});
```

### Add Custom Menu Items
Edit the menu template in `electron/main.js`

### Enable Auto-Updates
1. Set up a release server
2. Configure `publish` in `electron-builder.json`
3. Add auto-updater code to `main.js`

## 🐛 Troubleshooting

### App doesn't start
- Make sure the web server is running first (`npm run dev`)
- Check console for errors: `npm run electron:dev`

### Build fails
- Ensure all dependencies are installed: `npm install`
- Check that Node.js version is compatible (>= 14.x)

### Icons not showing
- Add icon files to `build/` directory before building

## 📦 Distribution

After building, the installers will be in `dist-electron/`:
- **Windows**: NSIS installer with auto-update support
- **macOS**: DMG with drag-to-Applications
- **Linux**: AppImage (portable) and DEB package

## 🔗 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Security Best Practices](https://www.electronjs.org/docs/tutorial/security)