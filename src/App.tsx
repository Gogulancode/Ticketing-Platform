import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Shared components
import { LandingPage, Profile, Notifications } from '@/shared';

// Auth pages
import Login from './pages/Login';

// Ticketing module components
import { 
  TicketingLayout,
  TicketDashboard,
  MyTicketsPage,
  TicketDetailPage,
  NewTicketPage,
  TicketEditPage,
  TicketReportsPage,
  TicketSettingsPage,
  TicketAnalyticsPage,
  UserManagementPage,
  SlaSettingsPage,
  AgentSettingsPage
} from '@/modules/ticketing';
import TicketPublicIdRedirect from './modules/ticketing/views/TicketPublicIdRedirect';

// Customer Portal components
import {
  CustomerPortalLayout,
  PortalHomePage,
  KnowledgeBaseCategoriesPage,
  KnowledgeBaseCategoryPage,
  KnowledgeBaseArticlePage,
  FAQPage,
  ContactPage,
  SystemStatusPage,
  CustomerTicketsPage,
  CustomerProfilePage
} from './components/portal';

// Create a client
const queryClient = new QueryClient();

// Check if user is authenticated
const isAuthenticated = () => {
  // Check for either token or currentUser (for backwards compatibility)
  return localStorage.getItem('token') !== null || localStorage.getItem('currentUser') !== null;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#363636',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Landing page - standalone without layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to="/tickets" replace />
              </ProtectedRoute>
            } />
            <Route path="/landing" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />
            
            {/* Redirect /ticketing to /tickets */}
            <Route path="/ticketing" element={<Navigate to="/tickets" replace />} />
            
            {/* Ticketing routes with dedicated layout */}
            <Route path="/tickets/*" element={
              <ProtectedRoute>
                <TicketingLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TicketDashboard />} />
              <Route path="my" element={<MyTicketsPage />} />
              <Route path="new" element={<NewTicketPage />} />
              <Route path="reports" element={<TicketReportsPage />} />
              <Route path="analytics" element={<TicketAnalyticsPage />} />
              <Route path="settings" element={<TicketSettingsPage />} />
              <Route path="settings/sla" element={<SlaSettingsPage />} />
              <Route path="settings/agents" element={<AgentSettingsPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="by-public-id/:publicId" element={<TicketPublicIdRedirect />} />
              <Route path=":ticketId" element={<TicketDetailPage />} />
              <Route path=":ticketId/edit" element={<TicketEditPage />} />
            </Route>

            {/* Customer Portal routes - public facing */}
            <Route path="/portal/*" element={<CustomerPortalLayout />}>
              <Route index element={<PortalHomePage />} />
              <Route path="knowledge-base" element={<KnowledgeBaseCategoriesPage />} />
              <Route path="knowledge-base/categories/:slug" element={<KnowledgeBaseCategoryPage />} />
              <Route path="knowledge-base/articles/:slug" element={<KnowledgeBaseArticlePage />} />
              <Route path="faqs" element={<FAQPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="status" element={<SystemStatusPage />} />
              <Route path="tickets" element={<CustomerTicketsPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
            </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
