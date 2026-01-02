import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Ticket, 
  Plus, 
  Settings, 
  BarChart3,
  BookOpen,
  User,
  Users,
  Bell,
  Menu,
  LogOut,
  Clock,
  ShieldCheck,
  UserCog,
  Monitor,
  Download
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentUser } from '../../../shared/services/api/auth';
import { settingsApi } from '../../../api/settingsApi';
import { API_CONFIG } from '../../../config/api';

const TicketingLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isCategoryHead, setIsCategoryHead] = useState(false);
  const [canManageSLA, setCanManageSLA] = useState(false);
  const [canManageAgents, setCanManageAgents] = useState(false);
  const { logout: authLogout } = useAuth();

  // Check user role on mount
  useEffect(() => {
    const loadUserRole = async () => {
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
        
        // Use exact matching to prevent "categoryadmin" from matching "admin"
        const userIsAdmin = adminRoles.some(adminRole => 
          singleRole === adminRole.toLowerCase() || normalizedRoles.some((r: string) => r === adminRole.toLowerCase())
        );
        setIsAdmin(userIsAdmin);

        // Check if Agent (includes Agent, Senior Agent, Team Lead) - use exact matching
        const agentRoles = ['agent', 'senior agent', 'team lead'];
        const userIsAgent = Boolean(
          currentUser.isAgent ||
          agentRoles.some(agentRole => singleRole === agentRole) ||
          normalizedRoles.some((role: string) => agentRoles.some(agentRole => role === agentRole))
        );
        setIsAgent(userIsAgent);
        
        // Check if user is a Category Head (Category Admin)
        if (currentUser.id && !userIsAdmin) {
          try {
            const categoryAdmins = await settingsApi.getCategoryAdmins();
            const userCategoryAdmin = categoryAdmins.find(
              ca => ca.userId === currentUser.id && ca.isActive
            );
            if (userCategoryAdmin) {
              setIsCategoryHead(true);
              setCanManageSLA(userCategoryAdmin.canManageSLA ?? false);
              setCanManageAgents(userCategoryAdmin.canManageAgents ?? false);
              console.log('👤 TicketingLayout - User is Category Head with SLA permission:', userCategoryAdmin.canManageSLA, ', Agents permission:', userCategoryAdmin.canManageAgents);
            }
          } catch (err) {
            console.warn('⚠️ Could not fetch category admin info:', err);
          }
        }
        
        console.log(`👤 TicketingLayout - User role: Admin=${userIsAdmin}, Agent=${userIsAgent}`);
      } catch {
        console.warn('⚠️ Could not fetch user info for role check');
        setIsAdmin(false);
        setIsAgent(false);
      }
    };
    loadUserRole();
  }, []);

  const handleLogout = () => {
    // Use auth context to clear state
    authLogout();
    
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    
    // Clear session storage as well
    sessionStorage.clear();
    
    // Force a complete page reload to the login page
    window.location.replace('/login');
  };

  // Check if we're on mobile/tablet - sidebar closed by default
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Sidebar closed by default on both mobile and desktop
      // User can expand it using the hamburger menu
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile) {
      closeSidebar();
    }
  };

  // Define all navigation items with role requirements
  // adminOnly: only admins can see (Settings, Users)
  // agentOrAdmin: agents and admins can see (Reports)
  // agentAdminOrCategoryHead: agents, admins, and category heads can see
  // categoryHeadSLA: category heads with SLA permission
  // categoryHeadAgents: category heads with agent management permission
  const allNavigationItems = [
    { icon: Home, label: 'Dashboard', path: '/tickets', exact: true, requiresRole: 'all' },
    { icon: Ticket, label: 'My Tickets', path: '/tickets/my', requiresRole: 'all' },
    { icon: Plus, label: 'New Ticket', path: '/tickets/new', requiresRole: 'all' },
    { icon: Download, label: 'Download Apps', path: '/tickets/downloads', requiresRole: 'all' },
    { icon: BarChart3, label: 'Reports', path: '/tickets/reports', requiresRole: 'agentAdminOrCategoryHead' },
    { icon: UserCog, label: 'Manage Agents', path: '/tickets/settings/agents', requiresRole: 'categoryHeadAgents' },
    { icon: Clock, label: 'SLA Settings', path: '/tickets/settings/sla', requiresRole: 'categoryHeadSLA' },
    { icon: Users, label: 'User Management', path: '/tickets/users', requiresRole: 'adminOnly' },
    { icon: Settings, label: 'Settings', path: '/tickets/settings', requiresRole: 'adminOnly' },
  ];

  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter(item => {
    if (item.requiresRole === 'all') return true;
    if (item.requiresRole === 'adminOnly') return isAdmin;
    if (item.requiresRole === 'agentOrAdmin') return isAdmin || isAgent;
    if (item.requiresRole === 'agentAdminOrCategoryHead') return isAdmin || isAgent || isCategoryHead;
    if (item.requiresRole === 'categoryHeadSLA') return isCategoryHead && canManageSLA && !isAdmin;
    if (item.requiresRole === 'categoryHeadAgents') return isCategoryHead && canManageAgents && !isAdmin;
    return true;
  });

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              {/* Ticketing Module Icon */}
              <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900">Ticketing System</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Nivo</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">Professional Help Desk</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
            {/* Desktop App Download Button */}
            <a
              href={`${API_CONFIG.BASE_URL}/downloads/desktop/windows`}
              download="NivoChat-Setup-1.0.0.exe"
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 animate-pulse hover:animate-none"
              title="Download Desktop App for Windows"
            >
              <Monitor className="w-4 h-4" />
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Desktop App</span>
            </a>
            <button 
              onClick={() => navigate('/tickets/notifications')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/tickets/profile')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Overlay for mobile - only show when sidebar is open on mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSidebar}
          />
        )}

        {/* Sliding Sidebar Navigation */}
        <div 
          className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-50 transform transition-all duration-300 ease-in-out lg:relative lg:top-0 lg:h-full lg:translate-x-0 ${
            isMobile 
              ? (isSidebarOpen ? 'w-64 translate-x-0 shadow-lg' : 'w-64 -translate-x-full')
              : (isSidebarOpen ? 'w-64' : 'w-16')
          }`}
        >
          <div className={`h-full overflow-y-auto ${isSidebarOpen ? 'p-2' : 'p-2'}`}>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      handleLinkClick();
                    }}
                    className={`w-full flex items-center text-left rounded-lg transition-all duration-200 group ${
                      isSidebarOpen ? 'px-3 py-2' : 'px-2 py-3 justify-center'
                    } ${
                      active
                        ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className={`${isSidebarOpen ? 'w-4 h-4 mr-2' : 'w-5 h-5'} ${active ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`} />
                    {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto transition-all duration-300">
          <div className="px-1 py-2">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketingLayout;
