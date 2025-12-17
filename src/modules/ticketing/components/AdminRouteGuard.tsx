import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '../../../shared/services/api/auth';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protects routes that should only be accessible to admins.
 * Agents and regular users are shown an access denied message and redirected.
 */
const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ 
  children, 
  redirectTo = '/tickets' 
}) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const currentUser = await getCurrentUser();
        const adminRoles = ['Admin', 'SuperAdmin', 'Administrator'];
        const singleRole = (currentUser.role || '').toString().toLowerCase();
        const roles = Array.isArray(currentUser.roles)
          ? currentUser.roles
              .map((role: unknown) => {
                if (!role) return '';
                if (typeof role === 'string') return role;
                if (typeof role === 'object' && role !== null && 'name' in role && typeof (role as { name: unknown }).name === 'string') {
                  return (role as { name: string }).name;
                }
                return String(role);
              })
              .filter(Boolean)
          : [];
        const normalizedRoles = roles.map((role: string) => role.toLowerCase());
        
        const userIsAdmin = adminRoles.some(role => 
          singleRole.includes(role.toLowerCase()) || normalizedRoles.some((r: string) => r.includes(role.toLowerCase()))
        );
        
        // Only Admins have access to protected routes (Settings, Users)
        const hasAccess = userIsAdmin;
        setIsAuthorized(hasAccess);
        
        if (!hasAccess) {
          console.warn('🚫 Unauthorized access attempt to admin route');
          // Redirect after a short delay to show the message
          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAuthorized(false);
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <ShieldAlert className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. This section is only available to administrators.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
