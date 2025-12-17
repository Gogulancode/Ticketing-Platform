import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '../../../shared/services/api/auth';
import { settingsApi } from '../../../shared/services/api/settingsApi';

interface ReportsRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export interface CategoryAdminInfo {
  isCategoryAdmin: boolean;
  categoryIds: number[];
  categoryNames: string[];
}

/**
 * Protects the Reports route - accessible to Admins, Agents, and Category Heads.
 * Category Heads will only see data for their assigned categories.
 */
const ReportsRouteGuard: React.FC<ReportsRouteGuardProps> = ({ 
  children, 
  redirectTo = '/tickets' 
}) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | 'categoryAdmin' | null>(null);
  const [categoryAdminInfo, setCategoryAdminInfo] = useState<CategoryAdminInfo>({
    isCategoryAdmin: false,
    categoryIds: [],
    categoryNames: []
  });

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
        
        // Check if Admin
        const userIsAdmin = adminRoles.some(role => 
          singleRole.includes(role.toLowerCase()) || normalizedRoles.some((r: string) => r.includes(role.toLowerCase()))
        );
        
        if (userIsAdmin) {
          setIsAuthorized(true);
          setUserRole('admin');
          setIsLoading(false);
          return;
        }
        
        // Check if Agent (includes Agent, Senior Agent, Team Lead)
        const agentRoles = ['agent', 'senior agent', 'team lead'];
        const userIsAgent = Boolean(
          currentUser.isAgent ||
          agentRoles.some(agentRole => singleRole.includes(agentRole)) ||
          normalizedRoles.some((role: string) => agentRoles.some(agentRole => role.includes(agentRole)))
        );
        
        if (userIsAgent) {
          setIsAuthorized(true);
          setUserRole('agent');
          setIsLoading(false);
          return;
        }
        
        // Check if Category Admin
        try {
          const categoryAdminStatus = await settingsApi.checkIsCategoryAdmin(currentUser.id);
          if (categoryAdminStatus.isCategoryAdmin && categoryAdminStatus.categoryIds.length > 0) {
            setIsAuthorized(true);
            setUserRole('categoryAdmin');
            
            // Get category names for display
            const categories = await settingsApi.getTicketCategories();
            const categoryNames = categories
              .filter((c: { id: number }) => categoryAdminStatus.categoryIds.includes(c.id))
              .map((c: { name: string }) => c.name);
            
            setCategoryAdminInfo({
              isCategoryAdmin: true,
              categoryIds: categoryAdminStatus.categoryIds,
              categoryNames
            });
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('⚠️ Could not check category admin status:', err);
        }
        
        // User is not authorized
        setIsAuthorized(false);
        console.warn('🚫 Unauthorized access attempt to reports');
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 2000);
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
            You don't have permission to access Reports. This section is available to Administrators, Agents, and Category Heads only.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Clone children and pass categoryAdminInfo as props
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            userRole, 
            categoryAdminInfo 
          } as React.Attributes & { userRole: string; categoryAdminInfo: CategoryAdminInfo });
        }
        return child;
      })}
    </>
  );
};

export default ReportsRouteGuard;
