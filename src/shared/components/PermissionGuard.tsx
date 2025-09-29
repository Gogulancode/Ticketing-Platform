import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  feature: string;
  action: string;
  fallback?: ReactNode;
  roles?: string[];
}

export const PermissionGuard = ({ 
  children, 
  feature, 
  action, 
  fallback = null,
  roles = []
}: PermissionGuardProps) => {
  const { hasPermission, hasRole, isAdmin, isSuperAdmin } = useAuth();

  // Admin and SuperAdmin bypass all checks
  if (isAdmin() || isSuperAdmin()) {
    return <>{children}</>;
  }

  // Check for specific roles if provided
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (hasRequiredRole) {
      return <>{children}</>;
    }
  }

  // Check for specific permission
  if (hasPermission(feature, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
}

export const RoleGuard = ({ children, roles, fallback = null }: RoleGuardProps) => {
  const { hasRole, isAdmin, isSuperAdmin } = useAuth();

  // Admin and SuperAdmin bypass all checks
  if (isAdmin() || isSuperAdmin()) {
    return <>{children}</>;
  }

  // Check if user has any of the required roles
  const hasRequiredRole = roles.some(role => hasRole(role));
  
  if (hasRequiredRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Feature-specific permission components
export const ContentManagementGuard = ({ children, action = "View", fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) => (
  <PermissionGuard feature="ContentManagement" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const AssessmentGuard = ({ children, action = "View", fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) => (
  <PermissionGuard feature="Assessments" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UserManagementGuard = ({ children, action = "View", fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) => (
  <PermissionGuard feature="UserManagement" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const SettingsGuard = ({ children, action = "View", fallback = null }: {
  children: ReactNode;
  action?: string;
  fallback?: ReactNode;
}) => (
  <PermissionGuard feature="Settings" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);
