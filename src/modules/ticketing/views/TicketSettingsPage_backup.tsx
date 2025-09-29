import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Mail,
  Brain,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  User,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  TestTube
} from 'lucide-react';
import { settingsApi, Department, TicketCategoryConfig, SubCategory, PriorityLevel, TicketStatusConfig, CategoryEmailMapping, TicketGroup as ApiTicketGroup, Agent as ApiAgent } from '../../../shared/services/api/settingsApi';
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
  const [emailMappings, setEmailMappings] = useState<CategoryEmailMapping[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState('');

  // Email configuration states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingEmailMapping, setEditingEmailMapping] = useState<Partial<CategoryEmailMapping> | null>(null);
  const [emailConfigTab, setEmailConfigTab] = useState<'basic' | 'smtp' | 'imap' | 'auto-assignment'>('basic');

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
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      switch (activeTab) {
        case 'categories':
          const categoriesData = await settingsApi.getTicketCategories();
          setCategories(categoriesData);
          break;
        case 'departments':
          const departmentsData = await settingsApi.getDepartments();
          setDepartments(departmentsData);
          break;
        case 'priorities':
          const prioritiesData = await settingsApi.getPriorityLevels();
          setPriorities(prioritiesData);
          break;
        case 'statuses':
          const statusesData = await settingsApi.getTicketStatuses();
          setStatuses(statusesData);
          break;
        case 'groups':
          const groupsData = await settingsApi.getTicketGroups();
          setGroups(groupsData);
          break;
        case 'agents':
          const agentsData = await settingsApi.getAgentsWithGroups();
          // Transform the API response to match our Agent interface
          const transformedAgents = agentsData.map(item => ({
            ...item.agent,
            groups: item.groups
          }));
          setAgents(transformedAgents);
          break;
        case 'email':
          const [categoriesForEmail, mappingsData] = await Promise.all([
            settingsApi.getTicketCategories(),
            settingsApi.getCategoryEmailMappings()
          ]);
          setCategories(categoriesForEmail);
          setEmailMappings(mappingsData);
          break;
      }
    } catch (err) {
      setError(`Failed to load ${activeTab} data`);
      console.error(`Error loading ${activeTab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (type: string) => {
    setModalType(type);
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any, type: string) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

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

  const handleSave = async (data: any) => {
    try {
      switch (modalType) {
        case 'category':
          if (editingItem) {
            const updated = await settingsApi.updateCategory(editingItem.id, data);
            setCategories(categories.map(c => c.id === editingItem.id ? updated : c));
          } else {
            const created = await settingsApi.createCategory(data);
            setCategories([...categories, created]);
          }
          break;
        case 'department':
          if (editingItem) {
            const updated = await settingsApi.updateDepartment(editingItem.id, data);
            setDepartments(departments.map(d => d.id === editingItem.id ? updated : d));
          } else {
            const created = await settingsApi.createDepartment(data);
            setDepartments([...departments, created]);
          }
          break;
        case 'priority':
          if (editingItem) {
            const updated = await settingsApi.updatePriority(editingItem.id, data);
            setPriorities(priorities.map(p => p.id === editingItem.id ? updated : p));
          } else {
            const created = await settingsApi.createPriority(data);
            setPriorities([...priorities, created]);
          }
          break;
        case 'status':
          if (editingItem) {
            const updated = await settingsApi.updateStatus(editingItem.id, data);
            setStatuses(statuses.map(s => s.id === editingItem.id ? updated : s));
          } else {
            const created = await settingsApi.createStatus(data);
            setStatuses([...statuses, created]);
          }
          break;
        case 'group':
          if (editingItem) {
            const updated = await settingsApi.updateGroup(editingItem.id, data);
            setGroups(groups.map(g => g.id === editingItem.id ? updated : g));
          } else {
            const created = await settingsApi.createGroup(data);
            setGroups([...groups, created]);
          }
          break;
        case 'agent':
          if (editingItem) {
            const updated = await settingsApi.updateAgent(editingItem.id, data);
            setAgents(agents.map(a => a.id === editingItem.id ? updated : a));
          } else {
            const created = await settingsApi.createAgent(data);
            setAgents([...agents, created]);
          }
          break;
      }
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      setError(`Failed to save ${modalType}`);
      console.error(`Error saving ${modalType}:`, err);
    }
  };

  const handleEmailConfigure = (category: TicketCategoryConfig) => {
    const existingMapping = emailMappings.find(m => m.categoryId === category.id);
    setEditingEmailMapping(existingMapping || {
      categoryId: category.id,
      emailAddress: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUseSsl: true,
      smtpUsername: '',
      smtpPassword: '',
      imapHost: '',
      imapPort: 993,
      imapUseSsl: true,
      imapUsername: '',
      imapPassword: '',
      keywordMappings: '',
      isActive: true
    });
    setEmailConfigTab('basic');
    setShowEmailModal(true);
  };

  const handleEmailMappingUpdate = async () => {
    if (!editingEmailMapping) return;

    try {
      if (editingEmailMapping.id) {
        const updated = await settingsApi.updateCategoryEmailMapping(editingEmailMapping.id, editingEmailMapping);
        setEmailMappings(emailMappings.map(m => m.id === editingEmailMapping.id ? updated : m));
      } else {
        const created = await settingsApi.createCategoryEmailMapping(editingEmailMapping);
        setEmailMappings([...emailMappings, created]);
      }
      setShowEmailModal(false);
      setEditingEmailMapping(null);
    } catch (err) {
      setError('Failed to save email configuration');
      console.error('Error saving email mapping:', err);
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
          onClick={() => handleAdd('category')}
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
                  onClick={() => handleEdit(category, 'category')}
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
