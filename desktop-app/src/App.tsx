import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import NewTicket from './pages/NewTicket';
import MyTickets from './pages/MyTickets';
import Reports from './pages/Reports';

// Initialize settings store to ensure theme is loaded
void useSettingsStore.getState();

// Global action event bus for tray actions
export const actionEventBus = {
  listeners: new Set<(action: string) => void>(),
  emit(action: string) {
    this.listeners.forEach(listener => listener(action));
  },
  subscribe(listener: (action: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

function AppRoutes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    let cleanupNavigate: (() => void) | undefined;
    let cleanupAction: (() => void) | undefined;

    // Listen for navigation from electron main process (tray menu)
    if (window.electronAPI?.onNavigate) {
      cleanupNavigate = window.electronAPI.onNavigate((path: string) => {
        if (isAuthenticated) {
          navigate(path);
        }
      });
    }

    // Listen for actions from electron main process (e.g., new-ticket)
    if (window.electronAPI?.onAction) {
      cleanupAction = window.electronAPI.onAction((action: string) => {
        actionEventBus.emit(action);
      });
    }

    // Cleanup listeners on unmount or when dependencies change
    return () => {
      cleanupNavigate?.();
      cleanupAction?.();
    };
  }, [navigate, isAuthenticated]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<Dashboard />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;
