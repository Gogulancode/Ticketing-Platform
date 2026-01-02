import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } from 'electron';
import { join } from 'path';
import Store from 'electron-store';

// Single instance lock - prevent multiple windows
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

// Initialize electron store for persistent data
const store = new Store({
  defaults: {
    serverUrl: 'http://localhost:5016',
    windowBounds: { width: 1200, height: 800 },
    theme: 'system'
  }
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Handle second instance - focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// Get the correct path for resources in packaged app
const getResourcePath = (...paths: string[]) => {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'app', ...paths);
  }
  return join(__dirname, '..', ...paths);
};

function createWindow() {
  const bounds = store.get('windowBounds') as { width: number; height: number };

  // Remove the application menu bar (File, Edit, View, etc.)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    icon: getResourcePath('public', 'nivo-logo.png'),
    show: false,
    titleBarStyle: 'default',
    frame: true,
    autoHideMenuBar: true
  });

  // Save window bounds on resize
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const { width, height } = mainWindow.getBounds();
      store.set('windowBounds', { width, height });
    }
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Stop taskbar flashing when window gains focus
  mainWindow.on('focus', () => {
    if (process.platform === 'win32') {
      mainWindow?.flashFrame(false);
    }
  });

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' || store.get('minimizeToTray', true)) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(getResourcePath('dist', 'index.html'));
  }
}

function createTray() {
  const iconPath = getResourcePath('public', 'nivo-logo.png');
  let icon = nativeImage.createFromPath(iconPath);
  
  // Resize for tray - Windows needs 16x16
  if (!icon.isEmpty()) {
    icon = icon.resize({ width: 16, height: 16 });
  }
  
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Nova Ticketing',
      click: () => {
        mainWindow?.show();
      }
    },
    { type: 'separator' },
    {
      label: '🏠 Dashboard',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/tickets');
      }
    },
    {
      label: '📋 My Tickets',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/my-tickets');
      }
    },
    {
      label: '➕ Create Ticket',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/tickets/new');
      }
    },
    { type: 'separator' },
    {
      label: '⚙️ Settings',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Nova Ticketing');
  tray.setContextMenu(contextMenu);

  // Double click opens my-tickets directly
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.webContents.send('navigate', '/my-tickets');
  });

  // Single click shows the app
  tray.on('click', () => {
    mainWindow?.show();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-store-value', (_, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (_, key: string, value: unknown) => {
  store.set(key, value);
});

ipcMain.handle('get-server-url', () => {
  return store.get('serverUrl');
});

ipcMain.handle('set-server-url', (_, url: string) => {
  store.set('serverUrl', url);
});

ipcMain.handle('show-notification', (_, options: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: join(__dirname, '../public/icon.svg')
    });
    notification.show();
    
    notification.on('click', () => {
      mainWindow?.show();
    });
  }
});

// Track previous badge count to detect new notifications
let previousBadgeCount = 0;

// Update taskbar badge/overlay for notification count
ipcMain.handle('set-badge-count', (_, count: number) => {
  if (!mainWindow) return;
  
  if (process.platform === 'darwin') {
    // macOS: Use dock badge
    app.dock?.setBadge(count > 0 ? String(count) : '');
  } else if (process.platform === 'win32') {
    // Windows: Use overlay icon on taskbar
    if (count > 0) {
      // Create a badge overlay icon dynamically
      const badgeIcon = createBadgeIcon(count);
      mainWindow.setOverlayIcon(badgeIcon, `${count} unread notifications`);
    } else {
      // Remove overlay icon
      mainWindow.setOverlayIcon(null, '');
    }
  }
  
  // Update tray tooltip to show notification count
  if (tray) {
    tray.setToolTip(count > 0 ? `Nova Ticketing (${count} unread)` : 'Nova Ticketing');
  }
  
  // Flash taskbar ONLY when count increases (new notifications arrived)
  // Don't flash continuously on every poll
  if (process.platform === 'win32' && count > previousBadgeCount && !mainWindow.isFocused()) {
    mainWindow.flashFrame(true);
  }
  
  previousBadgeCount = count;
});

// Create a badge icon with the notification count for Windows taskbar overlay
function createBadgeIcon(count: number): Electron.NativeImage {
  // Create a 16x16 badge using a data URL
  const size = 16;
  const displayCount = count > 99 ? '99+' : String(count);
  
  // Create SVG badge - WhatsApp style green circle with white text
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#25D366"/>
      <text x="${size/2}" y="${size/2 + 1}" 
            font-family="Arial, sans-serif" 
            font-size="${count > 9 ? 8 : 10}" 
            font-weight="bold"
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="middle">${displayCount}</text>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${base64}`;
  
  return nativeImage.createFromDataURL(dataUrl);
}

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('open-external', async (_, url: string) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

// Handle deep links (for future OAuth integration)
app.on('open-url', (event, url) => {
  event.preventDefault();
  mainWindow?.webContents.send('deep-link', url);
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (!['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
      event.preventDefault();
    }
  });

  // Handle window.open() calls - prevent blank windows from opening
  contents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    // Allow external URLs to open in default browser
    if (!['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
      require('electron').shell.openExternal(url);
    }
    // Deny opening new Electron windows - let the main window handle navigation
    return { action: 'deny' };
  });
});
