// Training Module System Exports

// Core Training Views (Pages)
export { default as Modules } from './views/Modules';
export { default as ModuleSections } from './views/ModuleSections';
export { default as SectionView } from './views/SectionView';
export { default as LessonView } from './views/LessonView';
export { default as ContentManagement } from './views/ContentManagement';
export { default as Progress } from './views/Progress';
export { default as Assessments } from './views/Assessments';
export { default as TakeAssessment } from './views/TakeAssessment';
export { default as UploadContent } from './views/UploadContent';

// Additional Training Views
export { default as Search } from './views/Search';
export { default as UserManagement } from './views/UserManagement';
export { default as StatusCheck } from './views/StatusCheck';

// Settings Views
export { default as Settings } from './views/Settings';
export { default as ModuleMaster } from './views/settings/ModuleMaster';
export { default as SectionMaster } from './views/settings/SectionMaster';
export { default as RoleMaster } from './views/settings/RoleMaster';

// Legacy Exports (for compatibility)
export { default as RoleMasterPage } from './views/RoleMaster';
export { default as RoleSyncAdmin } from './views/RoleSyncAdmin';

// Training Components
export { default as EnhancedContentManagement } from './components/EnhancedContentManagement';
export { default as AdvancedContentManagement } from './components/AdvancedContentManagement';
export { default as RoleMapping } from './components/RoleMapping';
export { default as RoleMasterComponent } from './components/RoleMaster';
export { default as RoleModuleImport } from './components/RoleModuleImport';
export { default as RoleSync } from './components/RoleSync';
