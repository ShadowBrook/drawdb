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

// Menu label translations — falls back to English for unsupported languages
const labels = {
  en: {
    file: 'File', edit: 'Edit', view: 'View', settings: 'Settings', window: 'Window', help: 'Help',
    new: 'New', open: 'Open...', save: 'Save', saveAs: 'Save As...', rename: 'Rename',
    import: 'Import', importFile: 'From JSON File...', importSql: 'From SQL...',
    exportAs: 'Export As', exportPng: 'PNG', exportJpeg: 'JPEG', exportSvg: 'SVG', exportPdf: 'PDF',
    exportJson: 'JSON', exportSql: 'SQL', exportDbml: 'DBML', exportMermaid: 'Mermaid', exportMarkdown: 'Markdown',
    print: 'Print',
    undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy', paste: 'Paste', delete: 'Delete',
    selectAll: 'Select All', duplicate: 'Duplicate',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', zoomReset: 'Reset Zoom', fitWindow: 'Fit Window',
    toggleFullscreen: 'Toggle Fullscreen',
    showGrid: 'Show Grid', snapToGrid: 'Snap to Grid',
    showCardinality: 'Show Cardinality', showLabels: 'Show Relationship Labels',
    showDatatypes: 'Show Data Types', showFieldSummary: 'Show Field Summary',
    showComments: 'Show Comments',
    theme: 'Theme', themeLight: 'Light', themeDark: 'Dark',
    dbmlEditor: 'DBML Editor',
    autosave: 'Autosave', tableWidth: 'Table Width...', customTypes: 'Configure Custom Types...',
    language: 'Language...', exportSaved: 'Export Saved Data...', clearCache: 'Clear Cache',
    flushStorage: 'Flush Storage...', showTimeline: 'Show Timeline',
    documentation: 'Documentation', keyboardShortcuts: 'Keyboard Shortcuts',
    discord: 'Ask on Discord', reportBug: 'Report Bug',
    minimize: 'Minimize', zoom: 'Zoom', bringAll: 'Bring All to Front', close: 'Close',
    about: 'About drawDB', quit: 'Quit drawDB', hide: 'Hide drawDB', hideOthers: 'Hide Others', unhide: 'Unhide',
  },
  zh: {
    file: '文件', edit: '编辑', view: '视图', settings: '设置', window: '窗口', help: '帮助',
    new: '新建', open: '打开...', save: '保存', saveAs: '另存为...', rename: '重命名',
    import: '导入', importFile: '从 JSON 文件...', importSql: '从 SQL...',
    exportAs: '导出为', exportPng: 'PNG', exportJpeg: 'JPEG', exportSvg: 'SVG', exportPdf: 'PDF',
    exportJson: 'JSON', exportSql: 'SQL', exportDbml: 'DBML', exportMermaid: 'Mermaid', exportMarkdown: 'Markdown',
    print: '打印',
    undo: '撤销', redo: '重做', cut: '剪切', copy: '复制', paste: '粘贴', delete: '删除',
    selectAll: '全选', duplicate: '复制',
    zoomIn: '放大', zoomOut: '缩小', zoomReset: '重置缩放', fitWindow: '适应窗口',
    toggleFullscreen: '切换全屏',
    showGrid: '显示网格', snapToGrid: '对齐网格',
    showCardinality: '显示基数', showLabels: '显示关系标签',
    showDatatypes: '显示数据类型', showFieldSummary: '显示字段摘要',
    showComments: '显示注释',
    theme: '主题', themeLight: '浅色', themeDark: '深色',
    dbmlEditor: 'DBML 编辑器',
    autosave: '自动保存', tableWidth: '表格宽度...', customTypes: '配置自定义类型...',
    language: '语言...', exportSaved: '导出已保存数据...', clearCache: '清除缓存',
    flushStorage: '清空存储...', showTimeline: '显示时间线',
    documentation: '文档', keyboardShortcuts: '键盘快捷键',
    discord: '在 Discord 提问', reportBug: '报告问题',
    minimize: '最小化', zoom: '缩放', bringAll: '全部置前', close: '关闭',
    about: '关于 drawDB', quit: '退出 drawDB', hide: '隐藏 drawDB', hideOthers: '隐藏其他', unhide: '全部显示',
  },
  de: {
    file: 'Datei', edit: 'Bearbeiten', view: 'Ansicht', settings: 'Einstellungen', window: 'Fenster', help: 'Hilfe',
    new: 'Neu', open: 'Öffnen...', save: 'Speichern', saveAs: 'Speichern unter...', rename: 'Umbenennen',
    import: 'Importieren', importFile: 'Aus JSON-Datei...', importSql: 'Aus SQL...',
    exportAs: 'Exportieren als', exportPng: 'PNG', exportJpeg: 'JPEG', exportSvg: 'SVG', exportPdf: 'PDF',
    exportJson: 'JSON', exportSql: 'SQL', exportDbml: 'DBML', exportMermaid: 'Mermaid', exportMarkdown: 'Markdown',
    print: 'Drucken',
    undo: 'Rückgängig', redo: 'Wiederholen', cut: 'Ausschneiden', copy: 'Kopieren', paste: 'Einfügen', delete: 'Löschen',
    selectAll: 'Alles auswählen', duplicate: 'Duplizieren',
    zoomIn: 'Vergrößern', zoomOut: 'Verkleinern', zoomReset: 'Zoom zurücksetzen', fitWindow: 'Einpassen',
    toggleFullscreen: 'Vollbild umschalten',
    showGrid: 'Raster anzeigen', snapToGrid: 'Am Raster ausrichten',
    showCardinality: 'Kardinalität anzeigen', showLabels: 'Beziehungsnamen anzeigen',
    showDatatypes: 'Datentypen anzeigen', showFieldSummary: 'Feldübersicht anzeigen',
    showComments: 'Kommentare anzeigen',
    theme: 'Design', themeLight: 'Hell', themeDark: 'Dunkel',
    dbmlEditor: 'DBML-Editor',
    autosave: 'Automatisch speichern', tableWidth: 'Tabellenbreite...', customTypes: 'Benutzerdefinierte Typen...',
    language: 'Sprache...', exportSaved: 'Gespeicherte Daten exportieren...', clearCache: 'Cache leeren',
    flushStorage: 'Speicher leeren...', showTimeline: 'Zeitleiste anzeigen',
    documentation: 'Dokumentation', keyboardShortcuts: 'Tastenkürzel',
    discord: 'Auf Discord fragen', reportBug: 'Fehler melden',
    minimize: 'Minimieren', zoom: 'Zoomen', bringAll: 'Alle nach vorne', close: 'Schließen',
    about: 'Über drawDB', quit: 'drawDB beenden', hide: 'drawDB ausblenden', hideOthers: 'Andere ausblenden', unhide: 'Alle einblenden',
  },
};

function t(key) {
  return labels.current?.[key] || labels.en[key] || key;
}

labels.current = labels.en;

function buildMenu(lang) {
  labels.current = labels[lang] || labels.en;
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [{
          label: 'drawDB',
          submenu: [
            { label: t('about'), role: 'about' },
            { type: 'separator' },
            { label: t('hide'), role: 'hide' },
            { label: t('hideOthers'), role: 'hideOthers' },
            { label: t('unhide'), role: 'unhide' },
            { type: 'separator' },
            { label: t('quit'), role: 'quit' },
          ],
        }]
      : []),
    {
      label: t('file'),
      submenu: [
        { label: t('new'), accelerator: 'CmdOrCtrl+N', click: send('new') },
        { type: 'separator' },
        { label: t('open'), accelerator: 'CmdOrCtrl+O', click: send('open') },
        { label: t('save'), accelerator: 'CmdOrCtrl+S', click: send('save') },
        { label: t('saveAs'), accelerator: 'CmdOrCtrl+Shift+S', click: send('save-as') },
        { label: t('rename'), click: send('rename') },
        { type: 'separator' },
        { label: t('import'), submenu: [
          { label: t('importFile'), click: send('import-file') },
          { label: t('importSql'), accelerator: 'CmdOrCtrl+I', click: send('import-sql') },
        ]},
        { label: t('exportAs'), submenu: [
          { label: t('exportPng'), click: send('export-png') },
          { label: t('exportJpeg'), click: send('export-jpeg') },
          { label: t('exportSvg'), click: send('export-svg') },
          { label: t('exportPdf'), click: send('export-pdf') },
          { type: 'separator' },
          { label: t('exportJson'), click: send('export-json') },
          { label: t('exportSql'), click: send('export-sql') },
          { label: t('exportDbml'), click: send('export-dbml') },
          { label: t('exportMermaid'), click: send('export-mermaid') },
          { label: t('exportMarkdown'), click: send('export-markdown') },
        ]},
        { type: 'separator' },
        { label: t('print'), accelerator: 'CmdOrCtrl+P', click: send('print') },
      ],
    },
    {
      label: t('edit'),
      submenu: [
        { label: t('undo'), accelerator: 'CmdOrCtrl+Z', click: send('undo') },
        { label: t('redo'), accelerator: 'CmdOrCtrl+Y', click: send('redo') },
        { type: 'separator' },
        { label: t('cut'), accelerator: 'CmdOrCtrl+X', click: send('cut') },
        { label: t('copy'), accelerator: 'CmdOrCtrl+C', click: send('copy') },
        { label: t('paste'), accelerator: 'CmdOrCtrl+V', click: send('paste') },
        { label: t('delete'), accelerator: 'Delete', click: send('delete') },
        { type: 'separator' },
        { label: t('selectAll'), accelerator: 'CmdOrCtrl+A', click: send('select-all') },
        { label: t('duplicate'), accelerator: 'CmdOrCtrl+D', click: send('duplicate') },
      ],
    },
    {
      label: t('view'),
      submenu: [
        { label: t('zoomIn'), accelerator: 'CmdOrCtrl+=', click: send('zoom-in') },
        { label: t('zoomOut'), accelerator: 'CmdOrCtrl+-', click: send('zoom-out') },
        { label: t('zoomReset'), accelerator: 'CmdOrCtrl+0', click: send('zoom-reset') },
        { label: t('fitWindow'), accelerator: 'CmdOrCtrl+Alt+W', click: send('fit-window') },
        { type: 'separator' },
        { label: t('toggleFullscreen'), accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11', click: send('toggle-fullscreen') },
        { type: 'separator' },
        { label: t('showGrid'), accelerator: 'CmdOrCtrl+Shift+G', type: 'checkbox', click: send('toggle-grid') },
        { label: t('snapToGrid'), type: 'checkbox', click: send('toggle-snap') },
        { type: 'separator' },
        { label: t('showCardinality'), type: 'checkbox', click: send('toggle-cardinality') },
        { label: t('showLabels'), type: 'checkbox', click: send('toggle-labels') },
        { label: t('showDatatypes'), type: 'checkbox', click: send('toggle-datatypes') },
        { label: t('showFieldSummary'), accelerator: 'CmdOrCtrl+Shift+F', type: 'checkbox', click: send('toggle-field-summary') },
        { label: t('showComments'), type: 'checkbox', click: send('toggle-comments') },
        { type: 'separator' },
        { label: t('theme'), submenu: [
          { label: t('themeLight'), type: 'radio', click: send('theme-light') },
          { label: t('themeDark'), type: 'radio', click: send('theme-dark') },
        ]},
        { type: 'separator' },
        { label: t('dbmlEditor'), accelerator: 'Alt+E', click: send('toggle-dbml-editor') },
      ],
    },
    {
      label: t('settings'),
      submenu: [
        { label: t('autosave'), type: 'checkbox', click: send('toggle-autosave') },
        { label: t('tableWidth'), click: send('table-width') },
        { label: t('customTypes'), click: send('custom-types') },
        { label: t('language'), click: send('language') },
        { type: 'separator' },
        { label: t('exportSaved'), click: send('export-saved-data') },
        { label: t('clearCache'), click: send('clear-cache') },
        { label: t('flushStorage'), click: send('flush-storage') },
        { type: 'separator' },
        { label: t('showTimeline'), click: send('show-timeline') },
      ],
    },
    ...(isMac
      ? [{ label: t('window'), submenu: [{ label: t('minimize'), role: 'minimize' }, { label: t('zoom'), role: 'zoom' }, { type: 'separator' }, { label: t('bringAll'), role: 'front' }] }]
      : [{ label: t('window'), submenu: [{ label: t('minimize'), role: 'minimize' }, { label: t('close'), role: 'close' }] }]),
    {
      label: t('help'),
      submenu: [
        { label: t('documentation'), click: send('help-docs') },
        { label: t('keyboardShortcuts'), click: send('help-shortcuts') },
        { type: 'separator' },
        { label: t('discord'), click: send('help-discord') },
        { label: t('reportBug'), click: send('help-bug-report') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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

// IPC: Save file dialog
ipcMain.handle('save-file', async (_event, { content, defaultName, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'diagram.json',
    filters: filters || [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { success: false, canceled: true };
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
  if (canceled || filePaths.length === 0) return { success: false, canceled: true };
  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { success: true, path: filePaths[0], content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Update menu language
ipcMain.on('set-language', (_event, lang) => {
  buildMenu(lang);
});

app.whenReady().then(() => {
  buildMenu('en');
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
