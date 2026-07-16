# Electron App Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package drawdb as a macOS Electron desktop app for offline use with native file dialogs and menu bar.

**Architecture:** Add an `electron/` directory with main process (`main.js`) and preload (`preload.js`). The existing Vite + React app stays largely unchanged — Electron wraps it. CDN deps are bundled locally via npm. Cloud features and analytics are gated behind `import.meta.env.VITE_ELECTRON`.

**Tech Stack:** Electron 33+, electron-builder, Vite 8, React 18, Tailwind CSS 4

## Global Constraints

- Target: macOS only (`.dmg` distribution)
- Motivation: Offline use — app must work without network
- Version strategy: Electron only — no need to maintain the web version
- Native features: File dialogs (open/save via IPC) + Menu bar (standard macOS menu)
- No auto-update (avoids code signing complexity)
- No code signing / notarization
- Existing lint must continue to pass

---

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: All npm packages available for subsequent tasks

- [ ] **Step 1: Install Electron runtime and builder**

```bash
npm install --save-dev electron electron-builder
```

- [ ] **Step 2: Install dev tooling**

```bash
npm install --save-dev concurrently wait-on
```

- [ ] **Step 3: Install icon/font packages to replace CDN**

```bash
npm install bootstrap-icons @fortawesome/fontawesome-free
```

- [ ] **Step 4: Verify installations**

```bash
node -e "require('electron'); console.log('electron OK')"
node -e "require('electron-builder'); console.log('builder OK')"
ls node_modules/bootstrap-icons/font/bootstrap-icons.css && echo "bootstrap-icons OK"
ls node_modules/@fortawesome/fontawesome-free/css/all.min.css && echo "fontawesome OK"
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add electron, electron-builder, font packages"
```

---

### Task 2: Configure build tooling

**Files:**
- Modify: `vite.config.js`
- Create: `electron-builder.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: Dependencies from Task 1
- Produces: `base: './'` in Vite config, `electron-builder.yml` with macOS dmg target, updated scripts and `"main"` field in package.json

- [ ] **Step 1: Update vite.config.js — add `base: './'`**

Read the current `vite.config.js`, then use Edit to change it:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
})
```

- [ ] **Step 2: Verify the change**

```bash
git diff vite.config.js
```

- [ ] **Step 3: Create electron-builder.yml**

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

- [ ] **Step 4: Update package.json — add "main" field and electron scripts**

Read the current `package.json`, then add the `"main"` field at the top level and add scripts. The resulting package.json should be:

```json
{
  "name": "drawdb",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:preview": "vite build && electron ."
  },
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

- [ ] **Step 5: Verify package.json is valid JSON**

```bash
node -e "const p = require('./package.json'); console.log('main:', p.main); console.log('scripts:', Object.keys(p.scripts).filter(s => s.includes('electron')))"
```

Expected output:
```
main: electron/main.js
scripts: [ 'electron:dev', 'electron:build', 'electron:preview' ]
```

- [ ] **Step 6: Verify Vite build works with new config**

```bash
npm run build
ls dist/index.html && echo "Build OK"
```

- [ ] **Step 7: Commit**

```bash
git add vite.config.js electron-builder.yml package.json
git commit -m "chore: configure Vite base path, electron-builder, and npm scripts"
```

---

### Task 3: Create Electron main process

**Files:**
- Create: `electron/main.js`

**Interfaces:**
- Consumes: `electron-builder.yml` config (for app name), `electron/preload.js` path
- Produces: `BrowserWindow` with preload, `Menu` template, `ipcMain.handle('save-file')` and `ipcMain.handle('open-file')`

- [ ] **Step 1: Create electron/main.js**

```js
import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'drawDB',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: 'drawDB',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Diagram',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-action', 'new'),
        },
        { type: 'separator' },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-action', 'open'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save-as'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('menu-action', 'zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu-action', 'zoom-out'),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu-action', 'zoom-reset'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: async () => {
            const { shell } = await import('electron');
            await shell.openExternal('https://github.com/drawdb-io/drawdb');
          },
        },
        {
          label: 'Report Issue',
          click: async () => {
            const { shell } = await import('electron');
            await shell.openExternal('https://github.com/drawdb-io/drawdb/issues');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC: Save file dialog
ipcMain.handle('save-file', async (_event, { content, defaultName, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'diagram.json',
    filters: filters || [{ name: 'JSON', extensions: ['json'] }],
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Open file dialog
ipcMain.handle('open-file', async (_event, { filters }) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'JSON', extensions: ['json'] }],
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { success: true, path: filePaths[0], content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

- [ ] **Step 2: Verify syntax**

```bash
node --check electron/main.js
```

Expected: no output (no syntax errors).

- [ ] **Step 3: Commit**

```bash
git add electron/main.js
git commit -m "feat: add Electron main process with menu and file dialog IPC"
```

---

### Task 4: Create Electron preload script

**Files:**
- Create: `electron/preload.js`

**Interfaces:**
- Consumes: IPC channels defined in `electron/main.js` (`save-file`, `open-file`)
- Produces: `window.electronAPI` object exposing `saveFile()`, `openFile()`

- [ ] **Step 1: Create electron/preload.js**

```js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName, filters) =>
    ipcRenderer.invoke('save-file', { content, defaultName, filters }),

  openFile: (filters) =>
    ipcRenderer.invoke('open-file', { filters }),

  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },

  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
});
```

- [ ] **Step 2: Verify syntax**

```bash
node --check electron/preload.js
```

Expected: no output (no syntax errors).

- [ ] **Step 3: Commit**

```bash
git add electron/preload.js
git commit -m "feat: add Electron preload script with contextBridge"
```

---

### Task 5: Bundle CDN fonts locally

**Files:**
- Modify: `index.html` (remove CDN `<link>` tags)
- Modify: `src/index.css` (add `@import` for font CSS)

**Interfaces:**
- Consumes: npm packages `bootstrap-icons` and `@fortawesome/fontawesome-free` from Task 1
- Produces: Font icons render from local bundle, zero CDN dependency

- [ ] **Step 1: Add font imports to src/index.css**

Prepend to the top of `src/index.css`:

```css
@import 'bootstrap-icons/font/bootstrap-icons.css';
@import '@fortawesome/fontawesome-free/css/all.min.css';
```

- [ ] **Step 2: Remove CDN links from index.html**

Remove these two `<link>` blocks from `index.html`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
  crossorigin="anonymous"
/>

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
  integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>
```

- [ ] **Step 3: Verify the build includes font files**

```bash
npm run build
ls dist/assets/ | grep -E "bootstrap|fa-" && echo "Font files bundled OK"
```

Expected: font files present in dist/assets/.

- [ ] **Step 4: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: bundle bootstrap-icons and font-awesome locally instead of CDN"
```

---

### Task 6: Switch to HashRouter for Electron compatibility

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `react-router-dom`
- Produces: `HashRouter` instead of `BrowserRouter` so SPA routing works with `file://` protocol

- [ ] **Step 1: Replace BrowserRouter with HashRouter in src/App.jsx**

Change line 1 import from:
```js
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
```
to:
```js
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
```

Change line 12 from:
```jsx
<BrowserRouter>
```
to:
```jsx
<HashRouter>
```

Change line 25 from:
```jsx
</BrowserRouter>
```
to:
```jsx
</HashRouter>
```

- [ ] **Step 2: Verify build still succeeds**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 3: Verify lint passes**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "fix: switch from BrowserRouter to HashRouter for Electron file:// compatibility"
```

---

### Task 7: Conditionally hide cloud features and analytics in Electron

**Files:**
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `import.meta.env.VITE_ELECTRON` (set via `--mode electron` or `.env.electron` file)
- Produces: Analytics and cloud-dependent UI components only render in non-Electron builds

- [ ] **Step 1: Create .env.electron file**

```bash
echo "VITE_ELECTRON=true" > .env.electron
```

- [ ] **Step 2: Update src/main.jsx to conditionally load Analytics**

Read `src/main.jsx`. Modify it to conditionally render `<Analytics />`:

```jsx
import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";

const isElectron = import.meta.env.VITE_ELECTRON === "true";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <App />
    {!isElectron && <Analytics />}
  </LocaleProvider>,
);
```

- [ ] **Step 3: Update electron:build script to use electron mode**

In `package.json`, change:
```
"electron:build": "vite build && electron-builder"
```
to:
```
"electron:build": "vite build --mode electron && electron-builder"
```

This makes Vite load `.env.electron` and set `VITE_ELECTRON=true`.

- [ ] **Step 4: Verify Vite build with electron mode**

```bash
npm run build -- --mode electron
```

Verify the build output has `VITE_ELECTRON` replaced with `"true"` (Vite inlines `import.meta.env` vars):

```bash
grep -r "VITE_ELECTRON" dist/ && echo "Found — may not be inlined" || echo "Not found — inlined OK"
```

- [ ] **Step 5: Verify Vite dev works with default mode**

```bash
npm run dev &
sleep 3
curl -s http://localhost:5173 | head -5
kill %1 2>/dev/null
```

Expected: dev server starts and serves HTML.

- [ ] **Step 6: Commit**

```bash
git add src/main.jsx package.json .env.electron
git commit -m "feat: conditionally hide analytics and cloud features in Electron build"
```

---

### Task 8: Add .gitignore entries and final verification

**Files:**
- Modify: `.gitignore`

**Interfaces:**
- Produces: `dist-electron/` ignored in git

- [ ] **Step 1: Add entries to .gitignore**

Read the current `.gitignore`, then append:

```
# Electron build output
dist-electron/
```

- [ ] **Step 2: Full production build test**

```bash
npm run electron:build
```

Expected: Build completes, `.dmg` file exists:

```bash
ls dist-electron/*.dmg && echo "DMG created OK"
```

- [ ] **Step 3: Verify DMG contents**

```bash
hdiutil attach dist-electron/*.dmg -mountpoint /tmp/drawdb-mount 2>/dev/null
ls /tmp/drawdb-mount/
hdiutil detach /tmp/drawdb-mount 2>/dev/null
```

Expected: `drawDB.app` visible in mounted DMG.

- [ ] **Step 4: Run lint one final time**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: add dist-electron to .gitignore"
```

---

### Task 9: Test in dev mode

**Files:**
- None (verification only)

- [ ] **Step 1: Start dev mode**

```bash
npm run electron:dev
```

The Electron window should open after Vite starts. Verify:
- The app renders in the Electron window
- Icons (bootstrap + font-awesome) display correctly
- Menu bar is visible and clickable
- DevTools are open (dev mode)

- [ ] **Step 2: Test offline**

Disconnect network (or toggle Wi-Fi off), reload the window (`Cmd+R`):
- App should still render fully
- All icons should display
- Cloud-related UI should be hidden

- [ ] **Step 3: Test keyboard shortcuts**

- `Cmd+N` — should send 'new' menu action
- `Cmd+O` — should send 'open' menu action
- `Cmd+S` — should send 'save' menu action
- `Cmd+=` / `Cmd+-` / `Cmd+0` — zoom actions
- `Ctrl+Cmd+F` — toggle fullscreen

- [ ] **Step 4: Close dev mode**

Close the Electron window and stop the Vite process (`Ctrl+C` in terminal).
