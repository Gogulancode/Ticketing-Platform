import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Get default server URL from environment variable (set at build time)
const DEFAULT_SERVER_URL = import.meta.env.VITE_DEFAULT_SERVER_URL || 'http://localhost:5016';

interface User {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  roles?: string[];
  department?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  serverUrl: string;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setServerUrl: (url: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      serverUrl: DEFAULT_SERVER_URL,
      isAuthenticated: false,
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      setServerUrl: (url) => set({ serverUrl: url }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
