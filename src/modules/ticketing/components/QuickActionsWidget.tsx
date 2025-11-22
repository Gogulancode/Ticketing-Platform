import React from 'react';
import { Plus, Search } from 'lucide-react';

const QuickActionsWidget: React.FC = () => {
  const quickActions = [
    {
      icon: Plus,
      label: 'New Ticket',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => window.location.href = '/tickets/new'
    },
    {
      icon: Search,
      label: 'Search Tickets',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white p-3 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg group flex flex-col items-center gap-2 min-h-[80px] justify-center`}
            >
              <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Quick access to common tasks</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsWidget;