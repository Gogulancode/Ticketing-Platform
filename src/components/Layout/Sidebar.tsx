import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Upload, 
  Search, 
  TrendingUp,
  FileQuestion,
  Settings,
  Home
} from 'lucide-react';
import { currentUser } from '../../shared/data/mockData';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/'
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/training'
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: BookOpen,
    path: '/training/modules'
  },
  {
    id: 'upload',
    label: 'Upload Content',
    icon: Upload,
    path: '/training/upload',
    adminOnly: true
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    path: '/training/search'
  },
  {
    id: 'progress',
    label: 'My Progress',
    icon: TrendingUp,
    path: '/training/progress'
  },
  {
    id: 'assessments',
    label: 'Assessments',
    icon: FileQuestion,
    path: '/training/assessments'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/training/settings',
    adminOnly: true
  }
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'QA';

  const filteredItems = sidebarItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;