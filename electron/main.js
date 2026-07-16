import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow;

function send(action) {
  return (_menuItem, browserWindow) => {
    const win = browserWindow || BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send('menu-action', action);
    }
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'drawDB',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: 'drawDB',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),

    // File
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: send('new') },
        { type: 'separator' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: send('open') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: send('save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: send('save-as') },
        { label: 'Rename', click: send('rename') },
        { type: 'separator' },
        {
          label: 'Import',
          submenu: [
            { label: 'From JSON File...', click: send('import-file') },
            { label: 'From SQL...', accelerator: 'CmdOrCtrl+I', click: send('import-sql') },
          ],
        },
        {
          label: 'Export As',
          submenu: [
            { label: 'PNG', click: send('export-png') },
            { label: 'JPEG', click: send('export-jpeg') },
            { label: 'SVG', click: send('export-svg') },
            { label: 'PDF', click: send('export-pdf') },
            { type: 'separator' },
            { label: 'JSON', click: send('export-json') },
            { label: 'SQL', click: send('export-sql') },
            { label: 'DBML', click: send('export-dbml') },
            { label: 'Mermaid', click: send('export-mermaid') },
            { label: 'Markdown', click: send('export-markdown') },
          ],
        },
        { type: 'separator' },
        { label: 'Print', accelerator: 'CmdOrCtrl+P', click: send('print') },
      ],
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: send('undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: send('redo') },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: send('cut') },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: send('copy') },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: send('paste') },
        { label: 'Delete', accelerator: 'Delete', click: send('delete') },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: send('select-all') },
        { label: 'Duplicate', accelerator: 'CmdOrCtrl+D', click: send('duplicate') },
      ],
    },

    // View
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: send('zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: send('zoom-out') },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: send('zoom-reset') },
        { label: 'Fit Window', accelerator: 'CmdOrCtrl+Alt+W', click: send('fit-window') },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11', click: send('toggle-fullscreen') },
        { type: 'separator' },
        { label: 'Show Grid', accelerator: 'CmdOrCtrl+Shift+G', type: 'checkbox', checked: true, click: send('toggle-grid') },
        { label: 'Snap to Grid', type: 'checkbox', click: send('toggle-snap') },
        { type: 'separator' },
        { label: 'Show Cardinality', type: 'checkbox', checked: true, click: send('toggle-cardinality') },
        { label: 'Show Relationship Labels', type: 'checkbox', checked: true, click: send('toggle-labels') },
        { label: 'Show Data Types', type: 'checkbox', checked: true, click: send('toggle-datatypes') },
        { label: 'Show Field Summary', accelerator: 'CmdOrCtrl+Shift+F', type: 'checkbox', click: send('toggle-field-summary') },
        { label: 'Show Comments', type: 'checkbox', click: send('toggle-comments') },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            { label: 'Light', type: 'radio', click: send('theme-light') },
            { label: 'Dark', type: 'radio', click: send('theme-dark') },
          ],
        },
        { type: 'separator' },
        { label: 'DBML Editor', accelerator: 'Alt+E', click: send('toggle-dbml-editor') },
      ],
    },

    // Settings
    {
      label: 'Settings',
      submenu: [
        { label: 'Autosave', type: 'checkbox', checked: true, click: send('toggle-autosave') },
        { label: 'Table Width...', click: send('table-width') },
        { label: 'Configure Custom Types...', click: send('custom-types') },
        { label: 'Language...', click: send('language') },
        { type: 'separator' },
        { label: 'Export Saved Data...', click: send('export-saved-data') },
        { label: 'Clear Cache', click: send('clear-cache') },
        { label: 'Flush Storage...', click: send('flush-storage') },
        { type: 'separator' },
        { label: 'Show Timeline', click: send('show-timeline') },
      ],
    },

    // Window
    ...(isMac
      ? [
          {
            label: 'Window',
            submenu: [
              { role: 'minimize' },
              { role: 'zoom' },
              { type: 'separator' },
              { role: 'front' },
            ],
          },
        ]
      : [
          {
            label: 'Window',
            submenu: [
              { role: 'minimize' },
              { role: 'close' },
            ],
          },
        ]),

    // Help
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: send('help-docs'),
        },
        {
          label: 'Keyboard Shortcuts',
          click: send('help-shortcuts'),
        },
        { type: 'separator' },
        {
          label: 'Ask on Discord',
          click: send('help-discord'),
        },
        {
          label: 'Report Bug',
          click: send('help-bug-report'),
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
