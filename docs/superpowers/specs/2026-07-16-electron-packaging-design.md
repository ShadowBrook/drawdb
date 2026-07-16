# Electron App Packaging Design

**Date:** 2026-07-16
**Project:** drawdb
**Goal:** Package drawdb as a macOS Electron desktop app for offline use, with native file dialogs and menu bar.

---

## 1. Constraints

- Target: **macOS only** (`.dmg` distribution)
- Motivation: **Offline use** — the app must work without network
- Version strategy: **Electron only** — no need to maintain the web version
- Native features: **File dialogs** (open/save via IPC) + **Menu bar** (standard macOS menu)
- No auto-update (avoids code signing complexity)

## 2. Architecture

```
drawdb/
├── electron/              # NEW: Electron main process
│   ├── main.js            # Window creation, Menu, IPC handlers
│   └── preload.js         # contextBridge exposing electronAPI to renderer
├── src/                   # Existing React code — minimal changes
├── index.html             # Modified: remove CDN <link> tags
├── package.json           # Modified: add electron deps, scripts, "main" field
├── vite.config.js         # Modified: base: './' for file:// compatibility
└── electron-builder.yml   # NEW: electron-builder config
```

- **Main process** (`electron/main.js`): BrowserWindow creation, `Menu.buildFromTemplate` for macOS menu, `ipcMain.handle` for file dialogs (`dialog.showSaveDialog`, `dialog.showOpenDialog`).
- **Preload** (`electron/preload.js`): `contextBridge.exposeInMainWorld('electronAPI', { saveFile, openFile })` — only exposes file I/O methods.
- **Renderer** (existing React app): Optionally consumes `window.electronAPI` for native dialogs; `file-saver` continues to work for browser Downloads folder fallback.

## 3. CDN Offline

Two CDN resources in `index.html` must be bundled locally:

| CDN | Replacement |
|-----|-------------|
| `bootstrap-icons@1.11.1` (CDN) | `npm install bootstrap-icons` → `@import` in `src/index.css` |
| `font-awesome@6.5.2` (CDN) | `npm install @fortawesome/fontawesome-free` → `@import` in `src/index.css` |

Vite will bundle fonts into `dist/assets/`. Remove the corresponding `<link>` tags from `index.html`.

## 4. Offline Strategy

| Module | Behavior in Electron |
|--------|---------------------|
| Cloud API (`src/api/gists.js`) | Not called. UI hides cloud-save/cloud-load entries via `import.meta.env.VITE_ELECTRON`. |
| Vercel Analytics (`@vercel/analytics`) | Not loaded in Electron. Conditional render in `main.jsx`. |
| Dexie (IndexedDB) | Fully preserved — Electron's Chromium supports IndexedDB natively. |
| CDN styles (bootstrap-icons, font-awesome) | Bundled locally (see section 3). |

**Environment variable:** `VITE_ELECTRON=true` injected via Electron's `loadURL` with `?env=electron` or set at build time via `cross-env`. React code uses `import.meta.env.VITE_ELECTRON` as a feature flag.

Core offline features: diagram editing, SQL export (PDF/PNG/JSON), local file save/load — all work without network.

## 5. Native Features

### File Dialogs

IPC flow:
```
React: window.electronAPI.saveFile(data)
  → preload.js: ipcRenderer.invoke('save-file', data)
    → main.js: ipcMain.handle('save-file', ...)
      → dialog.showSaveDialog({ filters: [{ name: 'JSON', extensions: ['json'] }] })
      → fs.writeFileSync(path, data)
      → return { success, path }
```

Existing `file-saver` library is kept as-is for download-based saves; native dialogs are additive.

### Menu Bar

Standard macOS menu template in `Menu.buildFromTemplate`:

```
drawDB    → About, Quit
File      → New, Open, Save, Save As
Edit      → Undo, Redo, Cut, Copy, Paste, Select All
View      → Zoom In, Zoom Out, Toggle Fullscreen, Reload
Window    → Minimize, Close
Help      → GitHub Repository, Report Issue
```

Most actions send IPC messages to the renderer (`webContents.send('menu-action', 'new')`) which the React app handles via existing callbacks.

## 6. Build Pipeline

### Scripts added to `package.json`

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:preview": "vite build && electron ."
  }
}
```

### `vite.config.js` changes

```js
export default defineConfig({
  base: './',   // relative paths for file:// protocol
  plugins: [react()],
})
```

### New dependencies

| Package | Purpose |
|---------|---------|
| `electron` | Runtime |
| `electron-builder` | Package .dmg |
| `concurrently` | Dev: Vite + Electron in parallel |
| `wait-on` | Dev: Electron waits for Vite |
| `bootstrap-icons` | Bundle locally |
| `@fortawesome/fontawesome-free` | Bundle locally |

### `electron-builder.yml`

```yaml
appId: app.drawdb.desktop
productName: drawDB
directories:
  output: dist-electron
mac:
  target: dmg
  icon: public/favicon.ico
files:
  - dist/**/*
  - electron/**/*
```

Build output: `dist-electron/drawdb-x.x.x-arm64.dmg`

## 7. Testing

- **Dev mode:** `npm run electron:dev` — verify HMR works, React app renders correctly
- **Offline test:** Disconnect network, verify app loads, CDN fonts render, cloud features hidden
- **File dialogs:** Test save/open via native dialog
- **Menu bar:** Verify all menu items trigger expected actions
- **Build:** `npm run electron:build` produces a valid .dmg, install and verify on macOS
- **Existing tests:** `npm run lint` should still pass

## 8. Out of Scope

- Code signing / notarization (requires Apple Developer account)
- Auto-update
- Windows / Linux builds
- Migration from browser IndexedDB to Electron IndexedDB (different Chromium profiles — users start fresh)
