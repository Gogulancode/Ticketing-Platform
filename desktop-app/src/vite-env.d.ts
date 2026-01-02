/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getStoreValue: (key: string) => Promise<unknown>;
    setStoreValue: (key: string, value: unknown) => Promise<void>;
    getServerUrl: () => Promise<string>;
    setServerUrl: (url: string) => Promise<void>;
    showNotification: (options: { title: string; body: string }) => Promise<void>;
    setBadgeCount: (count: number) => Promise<void>;
    getAppVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    onNavigate: (callback: (path: string) => void) => () => void;
    onDeepLink: (callback: (url: string) => void) => () => void;
    onAction: (callback: (action: string) => void) => () => void;
    openExternal: (url: string) => Promise<void>;
  };
}
