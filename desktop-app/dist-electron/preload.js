"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Store operations
  getStoreValue: (key) => electron.ipcRenderer.invoke("get-store-value", key),
  setStoreValue: (key, value) => electron.ipcRenderer.invoke("set-store-value", key, value),
  // Server configuration
  getServerUrl: () => electron.ipcRenderer.invoke("get-server-url"),
  setServerUrl: (url) => electron.ipcRenderer.invoke("set-server-url", url),
  // Notifications
  showNotification: (options) => electron.ipcRenderer.invoke("show-notification", options),
  // Badge count for taskbar
  setBadgeCount: (count) => electron.ipcRenderer.invoke("set-badge-count", count),
  // App info
  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
  getPlatform: () => electron.ipcRenderer.invoke("get-platform"),
  // Navigation events from main process
  onNavigate: (callback) => {
    const handler = (_, path) => callback(path);
    electron.ipcRenderer.on("navigate", handler);
    return () => electron.ipcRenderer.removeListener("navigate", handler);
  },
  // Action events from main process (e.g., new-ticket from tray)
  onAction: (callback) => {
    const handler = (_, action) => callback(action);
    electron.ipcRenderer.on("action", handler);
    return () => electron.ipcRenderer.removeListener("action", handler);
  },
  // Deep link handling
  onDeepLink: (callback) => {
    const handler = (_, url) => callback(url);
    electron.ipcRenderer.on("deep-link", handler);
    return () => electron.ipcRenderer.removeListener("deep-link", handler);
  }
});
