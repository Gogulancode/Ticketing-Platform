import React, { useState } from 'react';
import { Bell, Settings, ChevronDown, User, LogOut, Menu, Ticket } from 'lucide-react';
import { currentUser } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import NivoLogo from '@/components/NivoLogo';

interface TopNavbarProps {
  onToggleSidebar?: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove auth token from localStorage (adjust key if needed)
    localStorage.removeItem('token');
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    // Close dropdown
    setShowProfileDropdown(false);
    // Force redirect to login page with page reload
    window.location.href = '/login';
  };

  const notifications = [
    { id: 1, message: 'New training module available', time: '5 min ago' },
    { id: 3, message: 'System maintenance scheduled', time: '2 hours ago' }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3">
          {/* Nivo Logo and Branding */}
          <NivoLogo size="sm" showText />
          {/* Demo Mode Indicator */}
          <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-md">
            🎯 Demo Mode
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Ticketing Portal Switch */}
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center text-primary-600 hover:text-primary-800 text-sm font-medium px-4 py-2 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
        >
          <Ticket className="w-4 h-4 mr-2" />
          Switch to Ticketing
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="h-5 w-5" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <User className="h-4 w-4 mr-3" />
                  Profile Settings
                </button>
                <button
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;