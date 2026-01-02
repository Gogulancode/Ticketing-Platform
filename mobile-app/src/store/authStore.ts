import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../config/environment';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  roles?: string[];
  isAdmin: boolean;
  isAgent: boolean;
  isCategoryAdmin: boolean;
  department?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  serverUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  setServerUrl: (url: string) => void;
  loadStoredAuth: () => Promise<void>;
}

// Use environment-based API URL as default
// This is set dynamically based on EAS build profile (development/staging/production)
const DEFAULT_SERVER_URL = apiUrl;

console.log('AuthStore initialized with serverUrl:', DEFAULT_SERVER_URL);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  serverUrl: DEFAULT_SERVER_URL,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const serverUrl = get().serverUrl;
      console.log('Attempting login to:', `${serverUrl}/api/auth/login`);
      
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Login error response:', errorText);
        set({ isLoading: false });
        // Return error message for display
        throw new Error(response.status === 401 ? 'Invalid username or password' : errorText || 'Login failed');
      }

      const data = await response.json();
      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('data.user:', data.user);
      console.log('data.User:', data.User);
      console.log('data.token:', data.token);
      console.log('data.Token:', data.Token);
      console.log('============================');
      
      // API returns { token, user: { id, email, roles, ... }, expires }
      // Also handle PascalCase: { Token, User: {...}, Expires }
      const userData = data.user || data.User || data;
      const userRoles = userData.roles || userData.Roles || [];
      const primaryRole = userRoles[0] || userData.role || 'User';
      
      const user: User = {
        id: userData.id || userData.Id || data.userId,
        email: userData.email || userData.Email || '',
        username: userData.userName || userData.UserName || username,
        firstName: userData.firstName || userData.FirstName || username,
        lastName: userData.lastName || userData.LastName || '',
        role: primaryRole,
        roles: userRoles,
        isAdmin: userRoles.includes('Admin'),
        isAgent: userRoles.includes('Agent') || userRoles.includes('Admin'),
        // Check both roles array and direct isCategoryAdmin boolean from backend
        isCategoryAdmin: userRoles.includes('CategoryAdmin') || userData.isCategoryAdmin || userData.IsCategoryAdmin || false,
        department: userData.department || userData.Department || userData.departmentName || '',
      };
      
      console.log('Parsed user:', JSON.stringify(user, null, 2));
      
      // Store auth data - handle both camelCase and PascalCase from API
      const authToken = data.token || data.Token;
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token: authToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setServerUrl: async (url: string) => {
    await AsyncStorage.setItem('serverUrl', url);
    set({ serverUrl: url });
  },

  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const serverUrl = await AsyncStorage.getItem('serverUrl');
      
      if (serverUrl) {
        set({ serverUrl });
      }
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  },
}));

// Simple hook - always returns true since we're not using persist
export const useHydration = () => true;
