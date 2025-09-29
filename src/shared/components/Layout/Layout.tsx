import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile/tablet and auto-open sidebar on desktop
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-open sidebar on desktop, closed on mobile
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
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

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-sm leading-snug">
      <TopNavbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay for mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        
        <Sidebar 
          isOpen={isSidebarOpen} 
          isMobile={isMobile}
          onClose={closeSidebar}
        />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
          !isMobile && isSidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}>
          <div className="p-sm space-y-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;