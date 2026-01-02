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
    try {
      // Create a pleasant two-tone notification sound (like Teams/Slack)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First note (higher pitch)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 880; // A5 note
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.15);
      
      // Second note (lower, pleasant resolution)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 659.25; // E5 note - creates a pleasant interval
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.12);
      gain2.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
      osc2.start(audioContext.currentTime + 0.12);
      osc2.stop(audioContext.currentTime + 0.35);
    } catch (e) {
      console.log('Could not play notification sound:', e);
    }
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
