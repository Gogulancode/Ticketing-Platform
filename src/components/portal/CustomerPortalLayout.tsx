import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  HelpCircle, 
  Mail, 
  Activity,
  Ticket,
  User,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useActiveAnnouncements, useSystemStatus } from '../../api/customerPortalApi';

const CustomerPortalLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { data: announcements } = useActiveAnnouncements();
  const { data: systemStatus } = useSystemStatus();
  
  const pinnedAnnouncements = announcements?.filter(a => a.isPinned) || [];
  const hasActiveIncidents = (systemStatus?.activeIncidents?.length || 0) > 0;

  const navigationItems = [
    { name: 'Help Center', href: '/portal', icon: Home },
    { name: 'Knowledge Base', href: '/portal/knowledge-base', icon: BookOpen },
    { name: 'FAQs', href: '/portal/faqs', icon: HelpCircle },
    { name: 'My Tickets', href: '/portal/tickets', icon: Ticket },
    { name: 'Contact Us', href: '/portal/contact', icon: Mail },
    { name: 'System Status', href: '/portal/status', icon: Activity },
  ];

  const isActive = (path: string) => {
    if (path === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/portal/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pinned Announcements Banner */}
      {pinnedAnnouncements.length > 0 && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <p className="text-sm font-medium">
                  {pinnedAnnouncements[0].title}
                </p>
              </div>
              {pinnedAnnouncements.length > 1 && (
                <Link 
                  to="/portal/announcements" 
                  className="text-sm underline hover:no-underline"
                >
                  +{pinnedAnnouncements.length - 1} more
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Incident Alert Banner */}
      {hasActiveIncidents && (
        <div className="bg-amber-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <p className="text-sm font-medium">
                  We are currently experiencing some issues. 
                  <Link to="/portal/status" className="underline ml-2">
                    Check system status
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/portal" className="flex items-center gap-2 ml-2 lg:ml-0">
                <BookOpen className="h-8 w-8 text-gray-600" />
                <span className="text-xl font-bold text-gray-900">Help Center</span>
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, FAQs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <Link
                to="/portal/tickets/new"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Ticket className="h-4 w-4 mr-2" />
                Submit Ticket
              </Link>
              <Link
                to="/portal/profile"
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <User className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className={`
            lg:col-span-3 
            ${sidebarOpen ? 'fixed inset-0 z-30 bg-white lg:relative lg:bg-transparent' : 'hidden lg:block'}
          `}>
            <div className="lg:sticky lg:top-24">
              <nav className="space-y-1 p-4 lg:p-0">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${active 
                          ? 'bg-red-50 text-gray-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                      {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Status Widget */}
              <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Status
                </h3>
                <div className={`flex items-center gap-2 ${
                  systemStatus?.overallStatus === 'Operational' 
                    ? 'text-green-600' 
                    : 'text-amber-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    systemStatus?.overallStatus === 'Operational'
                      ? 'bg-green-500'
                      : 'bg-amber-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {systemStatus?.overallStatus || 'Checking...'}
                  </span>
                </div>
                <Link 
                  to="/portal/status" 
                  className="text-sm text-gray-600 hover:underline mt-2 inline-block"
                >
                  View details →
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Help Center</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/portal/knowledge-base" className="hover:text-gray-600">Knowledge Base</Link></li>
                <li><Link to="/portal/faqs" className="hover:text-gray-600">FAQs</Link></li>
                <li><Link to="/portal/contact" className="hover:text-gray-600">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/portal/tickets" className="hover:text-gray-600">My Tickets</Link></li>
                <li><Link to="/portal/tickets/new" className="hover:text-gray-600">Submit a Request</Link></li>
                <li><Link to="/portal/status" className="hover:text-gray-600">System Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Account</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/portal/profile" className="hover:text-gray-600">My Profile</Link></li>
                <li><Link to="/login" className="hover:text-gray-600">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-gray-600">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-600">About Us</a></li>
                <li><a href="#" className="hover:text-gray-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-600">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortalLayout;
