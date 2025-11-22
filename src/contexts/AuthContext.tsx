import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { API_CONFIG } from '../config/api';

export interface Permission {
  id: number;
  permissionName: string;
  feature: string;
  action: string;
  description?: string;
  isActive: boolean;
}

export interface PlatformRole {
  id: number;
  roleName: string;
  description?: string;
  isActive: boolean;
  permissions: Permission[];
}

export interface UserPermissions {
  userId: string;
  userName: string;
  email: string;
  platformRoles: string[];
  erpRoles: string[];
  permissions: Permission[];
}

interface AuthContextType {
  user: UserPermissions | null;
  hasPermission: (feature: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const TOKEN_EXPIRY_KEY = 'tokenExpiresAt';
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 minutes before expiry

const BASE_PERMISSIONS: Permission[] = [
  { id: 1, permissionName: 'ViewModules', feature: 'Modules', action: 'View', isActive: true },
  { id: 2, permissionName: 'CreateModules', feature: 'Modules', action: 'Create', isActive: true },
  { id: 3, permissionName: 'EditModules', feature: 'Modules', action: 'Edit', isActive: true },
  { id: 4, permissionName: 'DeleteModules', feature: 'Modules', action: 'Delete', isActive: true },
  { id: 5, permissionName: 'ViewAssessments', feature: 'Assessments', action: 'View', isActive: true },
  { id: 6, permissionName: 'CreateAssessments', feature: 'Assessments', action: 'Create', isActive: true },
  { id: 7, permissionName: 'ViewProgress', feature: 'Progress', action: 'View', isActive: true },
  { id: 8, permissionName: 'ViewDashboard', feature: 'Dashboard', action: 'View', isActive: true },
  { id: 9, permissionName: 'ManageSettings', feature: 'Settings', action: 'Manage', isActive: true },
  { id: 10, permissionName: 'ManageUsers', feature: 'Users', action: 'Manage', isActive: true },
  { id: 11, permissionName: 'UploadContent', feature: 'Content', action: 'Upload', isActive: true },
  { id: 12, permissionName: 'ImportData', feature: 'Import', action: 'Manage', isActive: true },
  { id: 13, permissionName: 'Search', feature: 'Search', action: 'View', isActive: true }
];

const cloneDefaultPermissions = (): Permission[] =>
  BASE_PERMISSIONS.map(permission => ({ ...permission }));

const mapUserDtoToPermissions = (userData: any): UserPermissions => {
  const fallbackName = `${userData?.firstName ?? ''} ${userData?.lastName ?? ''}`.trim();

  return {
    userId: userData?.id,
    userName: userData?.userName || fallbackName || userData?.email,
    email: userData?.email,
    platformRoles: userData?.roles || ['Admin'],
    erpRoles: [],
    permissions: cloneDefaultPermissions()
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(() => localStorage.getItem(TOKEN_EXPIRY_KEY));
  const refreshTimeoutRef = useRef<number | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearRefreshTimer();
    setUser(null);
    setTokenExpiresAt(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    window.location.replace('/login');
  }, [clearRefreshTimer]);


  const fetchUserPermissions = useCallback(async (): Promise<UserPermissions | null> => {
    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔒 No token found - user not authenticated');
        return null;
      }

      // Fetch current user info from the API
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch user:', response.status);
        return null;
      }

      const userData = await response.json();
      console.log('✅ User fetched from API:', userData.email);
      
      return mapUserDtoToPermissions(userData);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return null;
    }
  }, []);

  const refreshAuthToken = useCallback(async () => {
    const existingToken = localStorage.getItem('token');
    if (!existingToken) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${existingToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.expires) {
        const expiresIso = new Date(data.expires).toISOString();
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiresIso);
        setTokenExpiresAt(expiresIso);
      }

      if (data.user) {
        const refreshedUser = mapUserDtoToPermissions(data.user);
        setUser(refreshedUser);
        localStorage.setItem('currentUser', JSON.stringify(refreshedUser));
      } else {
        const userPermissions = await fetchUserPermissions();
        if (userPermissions) {
          setUser(userPermissions);
          localStorage.setItem('currentUser', JSON.stringify(userPermissions));
        }
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  }, [fetchUserPermissions, logout]);

  const hasPermission = (feature: string, action: string): boolean => {
    if (!user) return false;
    
    // Admin and SuperAdmin have all permissions
    if (isAdmin() || isSuperAdmin()) return true;
    
    // Check specific permission
    return user.permissions.some(
      p => p.feature === feature && p.action === action && p.isActive
    );
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.platformRoles.includes(roleName) || user.erpRoles.includes(roleName);
  };

  const isAdmin = (): boolean => {
    return hasRole('Admin');
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('SuperAdmin') || hasRole('Superadmin');
  };

  const login = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user permissions using the JWT token already stored in localStorage
      const userPermissions = await fetchUserPermissions();
      setUser(userPermissions);
      
      // Store in localStorage for persistence
      if (userPermissions) {
        localStorage.setItem('currentUser', JSON.stringify(userPermissions));
      }

      const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (storedExpiry) {
        setTokenExpiresAt(storedExpiry);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUserPermissions]);

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (token && storedUser) {
      try {
        // Restore user from localStorage
        setUser(JSON.parse(storedUser));
        if (storedExpiry) {
          setTokenExpiresAt(storedExpiry);
        }
        setLoading(false);
        console.log('✅ User session restored from localStorage');
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        setTokenExpiresAt(null);
        setLoading(false);
      }
    } else {
      // No valid session - user needs to login
      console.log('🔒 No valid session found - please login');
      setTokenExpiresAt(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tokenExpiresAt) {
      clearRefreshTimer();
      return;
    }

    const expiresTime = new Date(tokenExpiresAt).getTime();
    if (Number.isNaN(expiresTime)) {
      return;
    }

    const refreshDelay = expiresTime - Date.now() - TOKEN_REFRESH_BUFFER_MS;
    if (refreshDelay <= 0) {
      refreshAuthToken();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      refreshAuthToken();
    }, refreshDelay);

    refreshTimeoutRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);
      refreshTimeoutRef.current = null;
    };
  }, [tokenExpiresAt, refreshAuthToken, clearRefreshTimer]);

  const value: AuthContextType = {
    user,
    hasPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
