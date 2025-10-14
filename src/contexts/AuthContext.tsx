import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

  const fetchUserPermissions = async (): Promise<UserPermissions | null> => {
    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔒 No token found - user not authenticated');
        return null;
      }

      // Get the current user from the auth endpoint with JWT token
      const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        console.error('❌ Failed to get current user, clearing invalid token');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
      
      const userData = await userResponse.json();
      console.log('✅ Authenticated user loaded:', userData.email);
      
      // For now, create a mock permission set for the authenticated user
      return {
        userId: userData.id,
        userName: userData.userName || `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        platformRoles: userData.roles || ['Admin'],
        erpRoles: [],
        permissions: [
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
        ]
      };
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return null;
    }
  };

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
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Use replace instead of href to avoid adding to browser history
    // This will now work properly with the URL rewrite rules
    window.location.replace('/login');
  };

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (token && storedUser) {
      try {
        // Restore user from localStorage
        setUser(JSON.parse(storedUser));
        setLoading(false);
        console.log('✅ User session restored from localStorage');
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      // No valid session - user needs to login
      console.log('🔒 No valid session found - please login');
      setLoading(false);
    }
  }, []);

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
