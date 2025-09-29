import React, { useState } from 'react';
import { Shield, Settings } from 'lucide-react';
import RoleMapping from '../components/RoleMapping';
import RoleSync from '../components/RoleSync';

type TabType = 'roles' | 'details';

const RoleMaster: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('roles');

  const tabs = [
    {
      id: 'roles' as TabType,
      label: 'Roles',
      icon: Shield,
      component: <RoleSync />
    },
    {
      id: 'details' as TabType,
      label: 'Role Details',
      icon: Settings,
      component: <RoleMapping />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Role Master</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage roles and role-based access control for the ERP training platform
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Auto-sync every 24 hours</span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default RoleMaster;

