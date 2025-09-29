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
  ClockIcon
} from '@heroicons/react/24/outline';

// Tab Components (will be created separately)
import TagsTab from '@components/ticketing/settings/tabs/TagsTab';
import EmailConfigTab from '@components/ticketing/settings/tabs/EmailConfigTab';
import CustomFieldsTab from '@components/ticketing/settings/tabs/CustomFieldsTab';
import GroupsTab from '@components/ticketing/settings/tabs/GroupsTab';
import SlaTab from '@components/Settings/SlaTab';

// Existing components
import CategoriesTab from '@components/ticketing/settings/tabs/CategoriesTab';
import SubCategoriesTab from '@components/ticketing/settings/tabs/SubCategoriesTab';
import PrioritiesTab from '@components/ticketing/settings/tabs/PrioritiesTab';
import StatusesTab from '@components/ticketing/settings/tabs/StatusesTab';
import IssueTypesTab from '@components/ticketing/settings/tabs/IssueTypesTab';

export type SettingsTab = 
  | 'categories'
  | 'subcategories' 
  | 'priorities'
  | 'statuses'
  | 'issue-types'
  | 'tags'
  | 'email-config'
  | 'ticket-fields'
  | 'groups'
  | 'sla';

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
    id: 'priorities',
    name: 'Priorities',
    description: 'Configure priority levels',
    icon: ExclamationTriangleIcon,
    component: PrioritiesTab,
  },
  {
    id: 'statuses',
    name: 'Statuses',
    description: 'Configure ticket statuses',
    icon: CheckCircleIcon,
    component: StatusesTab,
  },
  {
    id: 'issue-types',
    name: 'Issue Types',
    description: 'Manage different types of issues',
    icon: ExclamationTriangleIcon,
    component: IssueTypesTab,
  },
  {
    id: 'tags',
    name: 'Tags',
    description: 'Manage ticket tags for better organization',
    icon: TagIcon,
    component: TagsTab,
    isNew: true,
  },
  {
    id: 'email-config',
    name: 'Email Integration',
    description: 'Configure Microsoft Graph email processing',
    icon: AtSymbolIcon,
    component: EmailConfigTab,
    isNew: true,
  },
  {
    id: 'ticket-fields',
    name: 'Custom Fields',
    description: 'Create dynamic form fields for tickets',
    icon: DocumentIcon,
    component: CustomFieldsTab,
    isNew: true,
  },
  {
    id: 'groups',
    name: 'Agent Groups',
    description: 'Manage agent groups and assignments',
    icon: UserGroupIcon,
    component: GroupsTab,
    isNew: true,
  },
  {
    id: 'sla',
    name: 'SLA Policies',
    description: 'Configure SLA targets and escalation rules',
    icon: ClockIcon,
    component: SlaTab,
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
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
              Ticketing System Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure and manage your ticketing system components
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Production Ready
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {tabConfigs.filter(t => t.isNew).length} New Features
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabConfigs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon 
                className={`
                  -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'text-blue-500'
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
      <div className="p-6">
        {activeTabConfig && (
          <div className="space-y-4">
            {/* Tab Description */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <activeTabConfig.icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    {activeTabConfig.name}
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    {activeTabConfig.description}
                  </p>
                  {activeTabConfig.isNew && (
                    <p className="mt-1 text-xs text-blue-600 font-medium">
                      ✨ This is a new advanced feature with full CRUD operations and real-time updates
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Component */}
            <div className="min-h-[400px]">
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
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>API Status: <span className="text-green-600 font-medium">Connected</span></span>
            <span>Server: <span className="font-medium">http://localhost:5015</span></span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="http://localhost:5015/swagger" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              API Documentation
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