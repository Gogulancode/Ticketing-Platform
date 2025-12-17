import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Settings, LogOut, Wifi, WifiOff, Ticket, Bell, Plus, List, Maximize2, Minimize2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore, showDesktopNotification } from '../store/settingsStore';
// Chat disabled - SignalR not needed
// import { signalRService } from '../services/signalRService';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isConnected } = useChatStore();
  const { notifications: notificationsEnabled } = useSettingsStore();
  const [notifications, setNotifications] = useState<{id: string; title: string; message: string; read: boolean}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const lastNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Chat disabled - SignalR not needed
    // signalRService.connect();

    // Handle navigation from main process (tray menu)
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }

    // Fetch notifications immediately
    const fetchNotifications = async () => {
      try {
        const { serverUrl, token } = useAuthStore.getState();
        if (!token) return;
        
        const response = await fetch(`${serverUrl}/api/notifications?unreadOnly=true&pageSize=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const newNotifications = (data.items || data || []).slice(0, 10).map((n: any) => ({
            id: String(n.id),
            title: n.title || 'New Notification',
            message: n.message || n.body || '',
            read: n.isRead || false
          }));
          
          // Check for truly new notifications (not seen before)
          const currentIds = new Set<string>(newNotifications.map((n: any) => n.id));
          const unreadNew = newNotifications.filter((n: any) => 
            !n.read && !lastNotificationIds.current.has(n.id)
          );
          
          // Show desktop notification for new unread items
          if (unreadNew.length > 0 && notificationsEnabled) {
            const latest = unreadNew[0];
            showDesktopNotification(latest.title, latest.message);
          }
          
          // Update last seen IDs
          lastNotificationIds.current = currentIds;
          setNotifications(newNotifications);
          
          // Update taskbar badge count
          const unreadCount = newNotifications.filter((n: any) => !n.read).length;
          if (window.electronAPI?.setBadgeCount) {
            window.electronAPI.setBadgeCount(unreadCount);
          }
        }
      } catch (error) {
        // Silently fail for notifications
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 15 seconds for better responsiveness
    const pollNotifications = setInterval(fetchNotifications, 15000);

    return () => {
      // Chat disabled - SignalR not needed
      // signalRService.disconnect();
      clearInterval(pollNotifications);
    };
  }, [navigate, notificationsEnabled]);

  const handleLogout = async () => {
    // Chat disabled - SignalR not needed
    // await signalRService.disconnect();
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Compact mode for tray-like view
  if (!isExpanded) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Nova Tickets</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Nova</h1>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard') || (isActive('/tickets') && !location.pathname.includes('/my-tickets') && !location.pathname.includes('/tickets/'))
                  ? 'bg-red-50 text-red-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => navigate('/my-tickets')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/my-tickets') 
                  ? 'bg-red-50 text-red-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              My Tickets
            </button>
            <button
              onClick={() => navigate('/tickets/new')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/tickets/new'
                  ? 'bg-red-50 text-red-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50' : ''}`}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-red-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </div>
          
          {/* Minimize */}
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          
          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
