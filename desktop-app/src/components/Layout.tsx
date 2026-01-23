import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, LogOut, Bell, Plus, 
  LayoutDashboard, Ticket, ChevronLeft, Search,
  Sliders, ExternalLink, Menu, BarChart3
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore, showDesktopNotification } from '../store/settingsStore';
import AvailabilityToggle from './AvailabilityToggle';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, serverUrl } = useAuthStore();
  const { notifications: notificationsEnabled } = useSettingsStore();
  const [notifications, setNotifications] = useState<{id: string; title: string; message: string; read: boolean; createdAt?: string}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const lastNotificationIds = useRef<Set<string>>(new Set());

  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const isAdmin = user?.role === 'Admin' || userRoles.includes('Admin');
  const isAgent = user?.role === 'Agent' || userRoles.includes('Agent');
  const isCategoryAdmin = user?.role === 'CategoryAdmin' || userRoles.includes('CategoryAdmin');
  const showReports = isAdmin || isAgent || isCategoryAdmin;

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }

    const fetchNotifications = async () => {
      try {
        const { serverUrl, token } = useAuthStore.getState();
        if (!token) return;
        
        const response = await fetch(`${serverUrl}/api/notifications?unreadOnly=true&pageSize=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          setIsOnline(true); // API is reachable
          const data = await response.json();
          const newNotifications = (data.items || data || []).slice(0, 10).map((n: any) => ({
            id: String(n.id),
            title: n.title || 'New Notification',
            message: n.message || n.body || '',
            read: n.isRead || false,
            createdAt: n.createdAt
          }));
          
          const currentIds = new Set<string>(newNotifications.map((n: any) => n.id));
          const unreadNew = newNotifications.filter((n: any) => 
            !n.read && !lastNotificationIds.current.has(n.id)
          );
          
          if (unreadNew.length > 0 && notificationsEnabled) {
            const latest = unreadNew[0];
            showDesktopNotification(latest.title, latest.message);
          }
          
          lastNotificationIds.current = currentIds;
          setNotifications(newNotifications);
          
          const unreadCount = newNotifications.filter((n: any) => !n.read).length;
          if (window.electronAPI?.setBadgeCount) {
            window.electronAPI.setBadgeCount(unreadCount);
          }
        } else if (response.status === 401) {
          // Token expired or invalid - logout user
          useAuthStore.getState().logout();
          navigate('/login');
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    fetchNotifications();
    const pollNotifications = setInterval(fetchNotifications, 15000);
    return () => clearInterval(pollNotifications);
  }, [navigate, notificationsEnabled]);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/my-tickets', icon: Ticket, label: 'My Tickets' },
    { path: '/tickets/new', icon: Plus, label: 'New Ticket', accent: true },
    ...(showReports ? [{ path: '/reports', icon: BarChart3, label: 'Reports' }] : []),
  ];

  return (
    <div className="h-screen flex bg-slate-100">
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
          sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setSidebarCollapsed(true)}
      />

      {/* Sidebar - Slides in/out */}
      <aside 
        className={`fixed z-40 h-full w-56 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="ml-3 text-white font-semibold text-sm tracking-tight">Enrich Support</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                  ${active 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' 
                    : item.accent 
                      ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${item.accent && !active ? 'text-emerald-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Admin Settings - Only for full Admin, not Category Admins */}
          {isAdmin && (
            <button
              onClick={() => {
                // Open web app settings in default browser
                // Convert API URL to web app URL (remove /api suffix)
                const webAppUrl = serverUrl.replace(/\/api$/, '') + '/tickets/settings';
                if (window.electronAPI?.openExternal) {
                  window.electronAPI.openExternal(webAppUrl);
                } else {
                  window.open(webAppUrl, '_blank');
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-150"
              title={sidebarCollapsed ? 'Settings' : undefined}
            >
              <Sliders className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">Settings</span>
              <ExternalLink className="w-3 h-3 opacity-40" />
            </button>
          )}
        </nav>

        {/* Connection Status */}
        <div className="px-3 pb-3">
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isOnline ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {isOnline ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4">
          {/* Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Agent Shift/Availability Toggle */}
            <AvailabilityToggle compact />
            
            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-2" />
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-2" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{user?.firstName}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{user?.role}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 -rotate-90" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
