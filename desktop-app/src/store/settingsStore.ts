import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  notifications: boolean;
  sounds: boolean;
  setNotifications: (enabled: boolean) => void;
  setSounds: (enabled: boolean) => void;
}

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: true,
      sounds: true,
      
      setNotifications: async (enabled) => {
        if (enabled) {
          await requestNotificationPermission();
        }
        set({ notifications: enabled });
      },
      
      setSounds: (enabled) => {
        set({ sounds: enabled });
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);

// Utility function to play notification sound
export const playNotificationSound = () => {
  const state = useSettingsStore.getState();
  if (state.sounds) {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  }
};

// Utility function to show desktop notification (Electron)
export const showDesktopNotification = (title: string, body: string) => {
  const state = useSettingsStore.getState();
  if (state.notifications) {
    // Use Electron API if available
    if (window.electronAPI) {
      window.electronAPI.showNotification({ title, body });
      // Also play sound if enabled
      if (state.sounds) {
        playNotificationSound();
      }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // Fallback to web notification
      new Notification(title, { body });
      if (state.sounds) {
        playNotificationSound();
      }
    }
  }
};
