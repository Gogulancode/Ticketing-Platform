import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import SlaTab from '../../../components/Settings/SlaTab';
import { getCurrentUser } from '../../../shared/services/api/auth';
import { settingsApi } from '../../../api/settingsApi';

/**
 * Standalone SLA Settings Page for Category Heads
 * This page allows Category Heads to manage SLA policies for their categories
 */
const SlaSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Check if user is admin - admins can access settings directly
        const adminRoles = ['Admin', 'SuperAdmin', 'Administrator'];
        const singleRole = (currentUser.role || '').toString().toLowerCase();
        const roles = Array.isArray(currentUser.roles)
          ? currentUser.roles.map((role: unknown) => {
              if (!role) return '';
              if (typeof role === 'string') return role;
              if (typeof role === 'object' && role !== null && 'name' in role) {
                return (role as { name: string }).name;
              }
              return String(role);
            }).filter(Boolean)
          : [];
        const normalizedRoles = roles.map((role: string) => role.toLowerCase());
        
        const isAdmin = adminRoles.some(role => 
          singleRole.includes(role.toLowerCase()) || 
          normalizedRoles.some((r: string) => r.includes(role.toLowerCase()))
        );
        
        if (isAdmin) {
          // Admins are always authorized, redirect to full settings
          navigate('/tickets/settings');
          return;
        }
        
        // Check if user is a Category Head with SLA management permission
        if (currentUser.id) {
          const categoryAdmins = await settingsApi.getCategoryAdmins();
          const userCategoryAdmin = categoryAdmins.find(
            ca => ca.userId === currentUser.id && ca.isActive && ca.canManageSLA
          );
          
          if (userCategoryAdmin) {
            setIsAuthorized(true);
            // Get category names from category admin data
            const userCats = categoryAdmins
              .filter(ca => ca.userId === currentUser.id && ca.isActive)
              .map(ca => ca.categoryName)
              .filter(Boolean);
            setCategoryNames(userCats);
          } else {
            // Not authorized - redirect to dashboard
            navigate('/tickets');
          }
        } else {
          navigate('/tickets');
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        navigate('/tickets');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Head Banner */}
      <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-800">
            Category Head SLA Management
            {categoryNames.length > 0 && ` - ${categoryNames.join(', ')}`}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SLA Policies</h1>
              <p className="text-sm text-gray-500">
                Manage Service Level Agreement policies for your categories
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Tab Content */}
      <div className="p-6">
        <SlaTab />
      </div>
    </div>
  );
};

export default SlaSettingsPage;
