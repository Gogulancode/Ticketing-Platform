import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  notifications: boolean;
  sounds: boolean;
  biometricEnabled: boolean;
  
  setNotifications: (enabled: boolean) => void;
  setSounds: (enabled: boolean) => void;
  setBiometric: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: true,
      sounds: true,
      biometricEnabled: false,
      
      setNotifications: (enabled) => set({ notifications: enabled }),
      setSounds: (enabled) => set({ sounds: enabled }),
      setBiometric: (enabled) => set({ biometricEnabled: enabled }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
