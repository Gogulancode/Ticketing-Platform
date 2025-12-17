import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileEdit, 
  Search, 
  TrendingUp,
  FileQuestion,
  Users,
  Bell,
  User
} from 'lucide-react';
import { PermissionGuard, RoleGuard } from '../PermissionGuard';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  feature?: string;
  action?: string;
  roles?: string[];
  component?: React.ComponentType<{ children: React.ReactNode }>;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/training/dashboard',
    feature: 'Dashboard',
    action: 'View'
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: BookOpen,
    path: '/training/modules',
    feature: 'Modules',
    action: 'View'
  },
  {
    id: 'content-management',
    label: 'Content Management',
    icon: FileEdit,
    path: '/training/upload',
    feature: 'ContentManagement',
    action: 'View'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    path: '/training/search',
    feature: 'Search',
    action: 'View'
  },
  {
    id: 'progress',
    label: 'My Progress',
    icon: TrendingUp,
    path: '/training/progress',
    feature: 'MyProgress',
    action: 'View'
  },
  {
    id: 'assessments',
    label: 'Assessments',
    icon: FileQuestion,
    path: '/training/assessments',
    feature: 'Assessments',
    action: 'View'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
    feature: 'Notifications',
    action: 'View'
  },
  {
    id: 'profile',
    label: 'Profile Settings',
    icon: User,
    path: '/profile',
    feature: 'ProfileSettings',
    action: 'View'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    path: '/training/users',
    feature: 'UserManagement',
    action: 'View'
  }
];

interface SidebarProps {
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = false, 
  isMobile = false, 
  onClose 
}) => {
  const location = useLocation();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile && onClose) {
      onClose();
    }
  };

  const SidebarLink: React.FC<{ item: SidebarItem }> = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    const linkContent = (
      <Link
        to={item.path}
        onClick={handleLinkClick}
        className={`
          w-full flex items-center text-left rounded-lg transition-all duration-200 group
          ${isOpen ? 'px-3 py-2' : 'px-2 py-3 justify-center'}
          ${isActive 
            ? 'bg-red-50 text-gray-700 border-l-4 border-red-500' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
        title={!isOpen ? item.label : undefined}
      >
        <Icon className={`${isOpen ? 'w-4 h-4 mr-2' : 'w-5 h-5'} ${isActive ? 'text-gray-600' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`} />
        {isOpen && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );

    // If item has feature/action requirements, wrap with PermissionGuard
    if (item.feature && item.action) {
      return (
        <PermissionGuard feature={item.feature} action={item.action}>
          {linkContent}
        </PermissionGuard>
      );
    }

    // If item has role requirements, wrap with RoleGuard
    if (item.roles && item.roles.length > 0) {
      return (
        <RoleGuard roles={item.roles}>
          {linkContent}
        </RoleGuard>
      );
    }

    // Default: show to everyone
    return linkContent;
  };

  return (
    <>
      {/* Sliding Sidebar */}
      <div className={`
        fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-50 transform transition-all duration-300 ease-in-out lg:relative lg:top-0 lg:h-full lg:translate-x-0
        ${isMobile 
          ? (isOpen ? 'w-64 translate-x-0 shadow-lg' : 'w-64 -translate-x-full')
          : (isOpen ? 'w-64' : 'w-16')
        }
      `}>
        <div className={`h-full overflow-y-auto ${isOpen ? 'p-2' : 'p-2'}`}>
          
          {/* Training Navigation */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarLink key={item.id} item={item} />
            ))}
          </nav>

          {/* Quick Stats for Training - only show when expanded */}
          {isOpen && (
            <div className="mt-6 pt-3 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 px-1">Learning Stats</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs px-1">
                  <span className="text-gray-600">Modules</span>
                  <span className="font-medium text-gray-600">12</span>
                </div>
                <div className="flex justify-between text-xs px-1">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">8</span>
                </div>
                <div className="flex justify-between text-xs px-1">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium text-orange-600">2</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;