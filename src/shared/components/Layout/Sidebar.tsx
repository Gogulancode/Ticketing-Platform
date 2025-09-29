import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileEdit, 
  Search, 
  TrendingUp,
  FileQuestion,
  Settings,
  Users,
  Bell,
  User,
  Ticket,
  Plus,
  BarChart3
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
    path: '/',
    feature: 'Dashboard',
    action: 'View'
  },
  {
    id: 'ticket-dashboard',
    label: 'Ticket Dashboard',
    icon: BarChart3,
    path: '/tickets',
    feature: 'Ticketing',
    action: 'View'
  },
  {
    id: 'my-tickets',
    label: 'My Tickets',
    icon: Ticket,
    path: '/tickets/my',
    feature: 'Ticketing',
    action: 'View'
  },
  {
    id: 'new-ticket',
    label: 'New Ticket',
    icon: Plus,
    path: '/tickets/new',
    feature: 'Ticketing',
    action: 'Create'
  },
  {
    id: 'ticket-reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/tickets/reports',
    feature: 'Ticketing',
    action: 'View'
  },
  {
    id: 'ticket-settings',
    label: 'Ticket Settings',
    icon: Settings,
    path: '/tickets/settings',
    feature: 'Ticketing',
    action: 'Manage'
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: BookOpen,
    path: '/modules',
    feature: 'Modules',
    action: 'View'
  },
  {
    id: 'content-management',
    label: 'Content Management',
    icon: FileEdit,
    path: '/upload-content',
    feature: 'ContentManagement',
    action: 'View'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    path: '/search',
    feature: 'Search',
    action: 'View'
  },
  {
    id: 'progress',
    label: 'My Progress',
    icon: TrendingUp,
    path: '/progress',
    feature: 'MyProgress',
    action: 'View'
  },
  {
    id: 'assessments',
    label: 'Assessments',
    icon: FileQuestion,
    path: '/assessments',
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
    path: '/users',
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
          flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
          ${isActive 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
      >
        <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
        <span>{item.label}</span>
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
        fixed top-16 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out shadow-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'lg:hidden' : 'lg:relative lg:top-0 lg:translate-x-0 lg:shadow-none'}
      `}>
        <div className="p-4 h-full overflow-y-auto">
          {/* Ticketing Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Ticketing System
            </h3>
            <div className="space-y-1">
              {sidebarItems.slice(1, 6).map((item) => (
                <SidebarLink key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Training Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Training System
            </h3>
            <div className="space-y-1">
              {[sidebarItems[0], ...sidebarItems.slice(6, 11)].map((item) => (
                <SidebarLink key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Administration Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Administration
            </h3>
            <div className="space-y-1">
              {sidebarItems.slice(11).map((item) => (
                <SidebarLink key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Quick Stats at Bottom */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-3 py-1 text-sm">
                <span className="text-gray-600">Open Tickets</span>
                <span className="text-orange-600 font-medium">3</span>
              </div>
              <div className="flex justify-between items-center px-3 py-1 text-sm">
                <span className="text-gray-600">In Progress</span>
                <span className="text-blue-600 font-medium">1</span>
              </div>
              <div className="flex justify-between items-center px-3 py-1 text-sm">
                <span className="text-gray-600">Resolved</span>
                <span className="text-green-600 font-medium">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;