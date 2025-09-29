import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';

// Shared components
import { Layout } from '@/shared';
import { Dashboard, Login, Profile, LandingPage } from '@/shared';

// Training module components
import { 
  Modules,
  ModuleSections,
  SectionView,
  LessonView,
  ContentManagement,
  Search,
  Progress,
  Assessments,
  TakeAssessment,
  UserManagement,
  UploadContent,
  StatusCheck
} from '@/modules/training';

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
  UserManagementPage
} from '@/modules/ticketing';

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
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Landing page - standalone without layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />
            <Route path="/landing" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />
            
            {/* Redirect /ticketing to /tickets */}
            <Route path="/ticketing" element={<Navigate to="/tickets" replace />} />
            
            {/* Ticketing routes with dedicated layout - completely separate */}
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
              <Route path="users" element={<UserManagementPage />} />
              <Route path=":ticketId" element={<TicketDetailPage />} />
              <Route path=":ticketId/edit" element={<TicketEditPage />} />
            </Route>

            {/* Training routes with training layout */}
            <Route path="/training/*" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Training module routes */}
              <Route path="modules" element={<Modules />} />
              <Route path="modules/:moduleId" element={<ModuleSections />} />
              <Route path="modules/:moduleId/sections" element={<ModuleSections />} />
              <Route path="sections/:sectionId" element={<SectionView />} />
              <Route path="lessons/:lessonId" element={<LessonView />} />
              
              {/* Content and assessment routes */}
              <Route path="content-management" element={<ContentManagement />} />
              <Route path="upload" element={<UploadContent />} />
              <Route path="search" element={<Search />} />
              <Route path="progress" element={<Progress />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="assessments/:id/take" element={<TakeAssessment />} />
              
              {/* Settings and administration */}
              <Route path="settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Settings page coming soon...</p></div>} />
              <Route path="settings/modules" element={<div className="p-8"><h1 className="text-2xl font-bold">Module Master</h1><p className="text-gray-600 mt-2">Module management coming soon...</p></div>} />
              <Route path="settings/sections" element={<div className="p-8"><h1 className="text-2xl font-bold">Section Master</h1><p className="text-gray-600 mt-2">Section management coming soon...</p></div>} />
              <Route path="settings/roles" element={<div className="p-8"><h1 className="text-2xl font-bold">Role Master</h1><p className="text-gray-600 mt-2">Role management coming soon...</p></div>} />
              <Route path="settings/users" element={<UserManagement />} />
              <Route path="settings/system" element={<div className="p-8"><h1 className="text-2xl font-bold">System Settings</h1><p className="text-gray-600 mt-2">System settings page coming soon...</p></div>} />
              <Route path="settings/data" element={<div className="p-8"><h1 className="text-2xl font-bold">Data Management</h1><p className="text-gray-600 mt-2">Data management page coming soon...</p></div>} />
              <Route path="users" element={<UserManagement />} />
              <Route path="profile" element={<Profile />} />
              <Route path="status" element={<StatusCheck />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
