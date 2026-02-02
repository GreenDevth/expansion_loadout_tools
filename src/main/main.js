const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  const preloadPath = path.resolve(__dirname, 'preload.js');
  console.log('[Main] Preload Path:', preloadPath);
  console.log('[Main] Preload Exists:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "DayZ Expansion Loadout Manager v4.0 (Portable)",
    backgroundColor: '#0f172a',
    show: false, // Don't show until ready
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // Recommended when using contextBridge in dev
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'db_cache.json');

app.whenReady().then(() => {
  createWindow();

  // --- IPC Handlers for Native File interaction ---
  ipcMain.handle('select-file', async () => {
    const parent = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
    const result = await dialog.showOpenDialog(parent, {
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (result.canceled) return null;
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { path: result.filePaths[0], content: JSON.parse(content) };
    } catch (e) {
      console.error('[Main] JSON Parse Error:', e);
      return null;
    }
  });

  ipcMain.handle('save-file-as', async (event, content) => {
    const parent = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
    const result = await dialog.showSaveDialog(parent, {
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      defaultPath: 'ExpansionLoadout.json'
    });
    if (result.canceled) return null;
    fs.writeFileSync(result.filePath, JSON.stringify(content, null, 4));
    return result.filePath;
  });

  ipcMain.handle('save-file', async (event, { filePath, content }) => {
    if (!filePath) return null;
    fs.writeFileSync(filePath, JSON.stringify(content, null, 4));
    return true;
  });

  ipcMain.handle('load-database', async () => {
    const rootPath = process.cwd();
    let dbPath = path.join(rootPath, 'database');

    // Robust path check
    if (!fs.existsSync(dbPath)) {
      console.warn(`[Main] Database path not found at CWD: ${dbPath}. Trying fallback...`);
      dbPath = path.resolve(__dirname, '../../database');
    }

    console.log('[Main] 📂 Final Sync Path:', dbPath);

    const results = {
      typesItems: [],
      spawnableRules: {},
      stats: { typesFiles: 0, spawnableFiles: 0, typesItems: 0, spawnableRules: 0 }
    };

    // 1. Scan Types
    const typesDir = path.join(dbPath, 'types');
    if (fs.existsSync(typesDir)) {
      const files = fs.readdirSync(typesDir).filter(f => f.endsWith('.xml'));
      console.log(`[Main] Found ${files.length} XMLs in types folder`);
      results.stats.typesFiles = files.length;

      files.forEach(f => {
        try {
          const fullPath = path.join(typesDir, f);
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.matchAll(/<type\s+name=["']([^"']+)["'][^>]*>/gi);
          let fileCount = 0;
          for (const match of matches) {
            if (match[1]) {
              results.typesItems.push(match[1]);
              fileCount++;
            }
          }
          console.log(`[Main] ✅ Processed ${f}: ${fileCount} items found`);
        } catch (e) { console.error(`[Main] ❌ Error parsing ${f}:`, e); }
      });
      // Unique and Sort
      results.typesItems = [...new Set(results.typesItems)].sort();
      results.stats.typesItems = results.typesItems.length;
    } else {
      console.error(`[Main] ❌ Types directory not found: ${typesDir}`);
    }

    // 2. Scan Spawnable
    const spawnableDir = path.join(dbPath, 'spawnable');
    if (fs.existsSync(spawnableDir)) {
      const files = fs.readdirSync(spawnableDir).filter(f => f.endsWith('.xml'));
      results.stats.spawnableFiles = files.length;
      files.forEach(f => {
        try {
          const content = fs.readFileSync(path.join(spawnableDir, f), 'utf-8');
          const typeBlocks = content.matchAll(/<type\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/type>/gi);
          for (const block of typeBlocks) {
            const typeName = block[1];
            const inner = block[2];
            const itemMatches = inner.matchAll(/<item\s+name=["']([^"']+)["']/gi);
            const atts = [];
            for (const item of itemMatches) {
              if (item[1]) atts.push(item[1]);
            }
            if (typeName && atts.length > 0) {
              results.spawnableRules[typeName] = atts;
            }
          }
        } catch (e) { console.error(`[Main] ❌ Error parsing ${f}:`, e); }
      });
      results.stats.spawnableRules = Object.keys(results.spawnableRules).length;
    }

    // 3. Save Cache
    try {
      const dataDir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(results, null, 2));
      console.log('[Main] ✨ Database Cache Saved! Total Unique Items:', results.stats.typesItems);
    } catch (e) { console.error('[Main] ❌ Failed to save cache:', e); }

    return results;
  });

  ipcMain.handle('get-cached-database', async () => {
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const data = fs.readFileSync(CACHE_FILE, 'utf-8');
        return JSON.parse(data);
      } catch (e) {
        console.error('[Main] Cache File Error:', e);
        return null;
      }
    }
    return null;
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
