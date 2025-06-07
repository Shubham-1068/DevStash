const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

if (require('electron-squirrel-startup')) {
  app.quit();
}

if (process.platform === 'win32') {
  const handleSquirrelEvent = () => {
    if (process.argv.length === 1) {
      return false;
    }

    const ChildProcess = require('child_process');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = (command, args) => {
      let spawnedProcess;
      try {
        spawnedProcess = ChildProcess.spawnSync(command, args, { detached: true });
      } catch (error) {
        console.warn('Error spawning process:', error);
      }
      return spawnedProcess;
    };

    const spawnUpdate = (args) => {
      return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        spawnUpdate(['--createShortcut', exeName]);
        return true;
      case '--squirrel-uninstall':
        spawnUpdate(['--removeShortcut', exeName]);
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
    return false;
  };

  if (handleSquirrelEvent()) {
    app.quit();
  }
}

const userDataPath = app.getPath('userData');
const customCachePath = path.join(userDataPath, 'Cache');
const customGPUCachePath = path.join(userDataPath, 'GPUCache');

app.commandLine.appendSwitch('disk-cache-dir', customCachePath);
app.commandLine.appendSwitch('gpu-cache-dir', customGPUCachePath);

if (!fs.existsSync(customCachePath)) {
  fs.mkdirSync(customCachePath, { recursive: true });
}
if (!fs.existsSync(customGPUCachePath)) {
  fs.mkdirSync(customGPUCachePath, { recursive: true });
}

const snippetsFile = path.join(userDataPath, 'snippets.json');

if (!fs.existsSync(snippetsFile)) {
  fs.writeFileSync(snippetsFile, JSON.stringify([]));
}

let win;

function createWindow() {
  try {
    console.log(path.join(__dirname, 'icon.png'));

    win = new BrowserWindow({
      width: 900,
      height: 700,
      icon: path.join(__dirname, './assets/icons/icon.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        enableRemoteModule: false,
        partition: 'persist:devstash',
      }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    win.removeMenu();
    win.on('closed', () => {
      win = null;
    });
    return true;
  } catch (error) {
    console.error('Error creating window:', error);
    return false;
  }
}

ipcMain.handle('get-snippets', async () => {
  try {
    const data = fs.readFileSync(snippetsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('save-snippet', async (event, snippet) => {
  try {
    const snippets = JSON.parse(fs.readFileSync(snippetsFile, 'utf8'));
    snippets.push({
      id: Date.now(),
      ...snippet,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(snippetsFile, JSON.stringify(snippets, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('delete-snippet', async (event, id) => {
  try {
    let snippets = JSON.parse(fs.readFileSync(snippetsFile, 'utf8'));
    snippets = snippets.filter(snippet => snippet.id !== id);
    fs.writeFileSync(snippetsFile, JSON.stringify(snippets, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    if (createWindow()) {
      console.log('Window created successfully');
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  }).catch(error => {
    console.error('Application initialization error:', error);
    app.quit();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
