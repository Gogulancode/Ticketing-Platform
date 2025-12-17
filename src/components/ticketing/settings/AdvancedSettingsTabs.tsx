import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  TagIcon,
  AtSymbolIcon,
  DocumentIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  PhotoIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { API_CONFIG } from '@/config/api';

// Tab Components (will be created separately)
import TagsTab from '@components/ticketing/settings/tabs/TagsTab';
import EmailConfigTab from '@components/ticketing/settings/tabs/EmailConfigTab';
import CustomFieldsTab from '@components/ticketing/settings/tabs/CustomFieldsTab';
import GroupsTab from '@components/ticketing/settings/tabs/GroupsTab';
import SlaTab from '@components/Settings/SlaTab';
import QuickTemplatesTab from '@components/ticketing/settings/tabs/QuickTemplatesTab';
import BranchesTab from '@components/ticketing/settings/tabs/BranchesTab';
import AISettingsTab from '@components/ticketing/settings/tabs/AISettingsTab';
import BrandingTab from '@components/ticketing/settings/tabs/BrandingTab';

// Existing components
import CategoriesTab from '@components/ticketing/settings/tabs/CategoriesTab';
import SubCategoriesTab from '@components/ticketing/settings/tabs/SubCategoriesTab';
import PrioritiesTab from '@components/ticketing/settings/tabs/PrioritiesTab';
import StatusesTab from '@components/ticketing/settings/tabs/StatusesTab';
import DepartmentsTab from '@components/ticketing/settings/tabs/DepartmentsTab';
import CategoryAdminsTab from '@components/ticketing/settings/tabs/CategoryAdminsTab';

export type SettingsTab = 
  | 'categories'
  | 'subcategories' 
  | 'departments'
  | 'category-admins'
  | 'priorities'
  | 'statuses'
  | 'tags'
  | 'email-config'
  | 'ticket-fields'
  | 'groups'
  | 'sla'
  | 'quick-templates'
  | 'branches'
  | 'ai'
  | 'branding';

interface TabConfig {
  id: SettingsTab;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  component: React.ComponentType;
  badge?: string;
  isNew?: boolean;
}

const tabConfigs: TabConfig[] = [
  {
    id: 'categories',
    name: 'Categories',
    description: 'Manage ticket categories',
    icon: Squares2X2Icon,
    component: CategoriesTab,
  },
  {
    id: 'subcategories',
    name: 'Sub-Categories',
    description: 'Manage ticket sub-categories',
    icon: ListBulletIcon,
    component: SubCategoriesTab,
  },
  {
    id: 'departments',
    name: 'Departments',
    description: 'Manage organization departments',
    icon: BuildingOffice2Icon,
    component: DepartmentsTab,
  },
  {
    id: 'category-admins',
    name: 'Category Admins',
    description: 'Assign users to manage specific categories',
    icon: ShieldCheckIcon,
    component: CategoryAdminsTab,
    isNew: true,
  },
  {
    id: 'priorities',
    name: 'Priorities',
    description: 'Configure priority levels',
    icon: ExclamationTriangleIcon,
    component: PrioritiesTab,
  },
  {
    id: 'statuses',
    name: 'Status',
    description: 'Configure ticket statuses',
    icon: CheckCircleIcon,
    component: StatusesTab,
  },
  {
    id: 'tags',
    name: 'Tags',
    description: 'Manage ticket tags for better organization',
    icon: TagIcon,
    component: TagsTab,
  },
  {
    id: 'email-config',
    name: 'Email Integration',
    description: 'Configure Microsoft Graph email processing',
    icon: AtSymbolIcon,
    component: EmailConfigTab,
  },
  {
    id: 'ticket-fields',
    name: 'Custom Fields',
    description: 'Create dynamic form fields for tickets',
    icon: DocumentIcon,
    component: CustomFieldsTab,
  },
  {
    id: 'groups',
    name: 'Agent Groups',
    description: 'Manage agent groups and assignments',
    icon: UserGroupIcon,
    component: GroupsTab,
  },
  {
    id: 'sla',
    name: 'SLA Policies',
    description: 'Configure SLA targets and escalation rules',
    icon: ClockIcon,
    component: SlaTab,
  },
  {
    id: 'quick-templates',
    name: 'Quick Templates',
    description: 'Manage quick start templates for ticket creation',
    icon: BoltIcon,
    component: QuickTemplatesTab,
  },
  {
    id: 'branches',
    name: 'Branches',
    description: 'Manage organization branches/locations for analytics',
    icon: BuildingOffice2Icon,
    component: BranchesTab,
    isNew: true,
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    description: 'Configure AI-powered ticket assistance features',
    icon: SparklesIcon,
    component: AISettingsTab,
    isNew: true,
  },
  {
    id: 'branding',
    name: 'Branding',
    description: 'Customize logo, login page content and theme colors',
    icon: PhotoIcon,
    component: BrandingTab,
    isNew: true,
  },
];

interface AdvancedSettingsTabsProps {
  initialTab?: SettingsTab;
}

const AdvancedSettingsTabs: React.FC<AdvancedSettingsTabsProps> = ({
  initialTab = 'categories'
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const activeTabConfig = tabConfigs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden max-w-full">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Cog6ToothIcon className="h-6 w-6 lg:h-8 lg:w-8 text-gray-600 flex-shrink-0" />
              <span className="truncate">Ticketing System Settings</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure and manage your ticketing system components
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Production Ready
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-x-4 lg:gap-x-6 px-4 lg:px-6 min-w-max lg:min-w-0 lg:flex-wrap lg:gap-y-2" aria-label="Tabs">
          {tabConfigs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex-shrink-0
                ${activeTab === tab.id
                  ? 'border-red-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon 
                className={`
                  -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'text-gray-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
                aria-hidden="true" 
              />
              <span>{tab.name}</span>
              {tab.isNew && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  New
                </span>
              )}
              {tab.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 lg:p-6">
        {activeTabConfig && (
          <div className="space-y-4">
            {/* Tab Description */}
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <activeTabConfig.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-800">
                    {activeTabConfig.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-700">
                    {activeTabConfig.description}
                  </p>
                  {activeTabConfig.isNew && (
                    <p className="mt-1 text-xs text-gray-600 font-medium">
                      ✨ This is a new advanced feature with full CRUD operations and real-time updates
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Component */}
            <div className="min-h-[400px] overflow-x-auto">
              {ActiveComponent ? (
                <ActiveComponent />
              ) : (
                <div className="text-center py-12">
                  <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tab not implemented</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This tab component is under development.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 lg:px-6 py-4 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-sm text-gray-500">
          <div className="flex flex-wrap items-center gap-4">
            <span>API Status: <span className="text-green-600 font-medium">Connected</span></span>
            <span className="hidden sm:inline">Server: <span className="font-medium">localhost:5016</span></span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a 
              href={`${API_CONFIG.BASE_URL.replace('/api', '')}/swagger`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-500 font-medium"
            >
              API Docs
            </a>
            <span>•</span>
            <span className="font-medium">v2.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettingsTabs;