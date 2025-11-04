// Shared Components and Utilities

// Layout Components
export { default as Layout } from './components/Layout/Layout';
export { default as Sidebar } from './components/Layout/Sidebar';
export { default as TopNavbar } from './components/Layout/TopNavbar';

// Authentication & Authorization
export { PermissionGuard, RoleGuard, ContentManagementGuard, AssessmentGuard, UserManagementGuard, SettingsGuard } from './components/PermissionGuard';
export { default as PermissionManager } from './components/PermissionManager';

// Common Views (Pages)
export { default as Dashboard } from './components/Dashboard';
export { default as LoginOld } from './components/Login'; // OLD DEMO LOGIN - DO NOT USE
export { default as Profile } from './components/Profile';
export { default as Notifications } from './components/Notifications';
export { default as LandingPage } from './views/LandingPage';

// Add shared utilities, hooks, and services here as they are created
