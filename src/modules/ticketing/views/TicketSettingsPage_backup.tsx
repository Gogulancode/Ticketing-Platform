import React, { useState, useEffect } from 'react';
import {
  Mail,
  Brain,
  Plus,
  Edit,
  Trash2,
  Users,
  Tag,
  AlertCircle,
  CheckCircle,
  Building,
  User
} from 'lucide-react';
import { settingsApi, Department, TicketCategoryConfig, PriorityLevel, TicketStatusConfig } from '../../../shared/services/api/settingsApi';
import { SimplifiedAutoAssignment } from '../components/SimplifiedAutoAssignment';

interface TicketGroup {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Agent {
  id: number;
  userId: string;
  name: string;
  email: string;
  departmentId?: number;
  departmentName?: string;
  agentGroupId?: number;
  agentGroupName?: string;
  isActive: boolean;
  maxTicketsCapacity: number;
  currentTicketCount: number;
  availabilityStatus: string;
  createdAt: string;
  updatedAt: string;
  groups?: TicketGroup[];
}

const TicketSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for different entities
  const [categories, setCategories] = useState<TicketCategoryConfig[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [statuses, setStatuses] = useState<TicketStatusConfig[]>([]);
  const [groups, setGroups] = useState<TicketGroup[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const tabs = [
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'priorities', label: 'Priorities', icon: AlertCircle },
    { id: 'statuses', label: 'Statuses', icon: CheckCircle },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'agents', label: 'Agents', icon: User },
    { id: 'email', label: 'Email Integration', icon: Mail },
    { id: 'auto-assignment', label: 'Auto Assignment', icon: Brain },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        switch (activeTab) {
          case 'categories': {
            const categoriesData = await settingsApi.getTicketCategories();
            if (!isMounted) break;
            setCategories(categoriesData);
            break;
          }
          case 'departments': {
            const departmentsData = await settingsApi.getDepartments();
            if (!isMounted) break;
            setDepartments(departmentsData);
            break;
          }
          case 'priorities': {
            const prioritiesData = await settingsApi.getPriorityLevels();
            if (!isMounted) break;
            setPriorities(prioritiesData);
            break;
          }
          case 'statuses': {
            const statusesData = await settingsApi.getTicketStatuses();
            if (!isMounted) break;
            setStatuses(statusesData);
            break;
          }
          case 'groups': {
            const groupsData = await settingsApi.getTicketGroups();
            if (!isMounted) break;
            setGroups(groupsData);
            break;
          }
          case 'agents': {
            const agentsData = await settingsApi.getAgentsWithGroups();
            if (!isMounted) break;
            const transformedAgents = agentsData.map((item) => ({
              ...item.agent,
              groups: item.groups
            }));
            setAgents(transformedAgents);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to load ${activeTab} data`);
        }
        console.error(`Error loading ${activeTab}:`, err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleCategorySubmit = async (existing?: TicketCategoryConfig) => {
    if (typeof window === 'undefined') {
      return;
    }

    const nameInput = window.prompt('Category name', existing?.name ?? '');
    const name = nameInput?.trim();
    if (!name) {
      return;
    }

    const descriptionInput = window.prompt('Category description', existing?.description ?? '') ?? '';
    const description = descriptionInput.trim() ? descriptionInput.trim() : undefined;

    const payload = {
      name,
      description,
      isActive: existing?.isActive ?? true,
      order: existing?.order ?? categories.length + 1
    };

    try {
      if (existing) {
        const updated = await settingsApi.updateCategory(existing.id, payload);
        setCategories((prev) => prev.map((category) => (category.id === existing.id ? updated : category)));
      } else {
        const created = await settingsApi.createCategory(payload);
        setCategories((prev) => [...prev, created]);
      }
    } catch (err) {
      setError('Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  const handleCategoryCreate = () => handleCategorySubmit();

  const handleCategoryEdit = (category: TicketCategoryConfig) => handleCategorySubmit(category);

  const handleDelete = async (id: number, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      switch (type) {
        case 'category':
          await settingsApi.deleteCategory(id);
          setCategories(categories.filter(c => c.id !== id));
          break;
        case 'department':
          await settingsApi.deleteDepartment(id);
          setDepartments(departments.filter(d => d.id !== id));
          break;
        case 'priority':
          await settingsApi.deletePriority(id);
          setPriorities(priorities.filter(p => p.id !== id));
          break;
        case 'status':
          await settingsApi.deleteStatus(id);
          setStatuses(statuses.filter(s => s.id !== id));
          break;
        case 'group':
          await settingsApi.deleteGroup(id);
          setGroups(groups.filter(g => g.id !== id));
          break;
        case 'agent':
          await settingsApi.deleteAgent(id);
          setAgents(agents.filter(a => a.id !== id));
          break;
      }
    } catch (err) {
      setError(`Failed to delete ${type}`);
      console.error(`Error deleting ${type}:`, err);
    }
  };


  const renderAutoAssignmentTab = () => {
    return (
      <div className="space-y-sm">
        <div className="flex items-center space-x-3 mb-sm">
          <Brain className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold leading-tight">Auto Assignment Configuration</h2>
            <p className="text-sm text-gray-600 mt-xs">Configure keyword-based automatic ticket assignment to subcategories</p>
          </div>
        </div>

        <SimplifiedAutoAssignment />

        <div className="mt-sm p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-xs">How Auto Assignment Works:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Email Processing:</strong> When emails are received, the system analyzes the subject and content</li>
            <li>• <strong>Keyword Matching:</strong> Keywords you configure for each subcategory are searched in the email</li>
            <li>• <strong>Automatic Assignment:</strong> If keywords match, the ticket is automatically assigned to that subcategory</li>
            <li>• <strong>Multiple Keywords:</strong> Use comma-separated keywords for each subcategory (e.g., "login, password, access")</li>
            <li>• <strong>Priority Order:</strong> First matching subcategory wins if multiple matches are found</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCategoriesTab = () => (
    <div className="space-y-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold leading-tight">Ticket Categories</h3>
        <button
          onClick={handleCategoryCreate}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid gap-3">
        {categories.map((category) => (
          <div key={category.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full bg-blue-500"
                  ></div>
                  <h4 className="font-medium">{category.name}</h4>
                  {!category.isActive && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                {category.subCategories && category.subCategories.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Subcategories: </span>
                    <span className="text-xs text-gray-700">
                      {category.subCategories.map(sub => sub.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleCategoryEdit(category)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id, 'category')}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlaceholderTab = (tabName: string) => {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{tabName} Configuration</h3>
        <p className="text-gray-500">This section will be implemented soon.</p>
      </div>
    );
  };

  return (
    <div className="text-sm leading-snug space-y-sm">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold leading-tight">Ticket Settings</h1>
        <div className="text-sm text-gray-500">Configure ticket system parameters</div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'categories' && renderCategoriesTab()}
            {activeTab === 'departments' && renderPlaceholderTab('Departments')}
            {activeTab === 'priorities' && renderPlaceholderTab('Priorities')}
            {activeTab === 'statuses' && renderPlaceholderTab('Statuses')}
            {activeTab === 'groups' && renderPlaceholderTab('Groups')}
            {activeTab === 'agents' && renderPlaceholderTab('Agents')}
            {activeTab === 'email' && renderPlaceholderTab('Email Integration')}
            {activeTab === 'auto-assignment' && renderAutoAssignmentTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketSettingsPage;
