// Mock Settings API for when backend is not available
export const mockSettingsApi = {
  getTicketCategories: () => Promise.resolve([
    { id: 1, name: 'General', description: 'General inquiries', isActive: true, displayOrder: 1 },
    { id: 12, name: 'IT', description: 'IT Support requests', isActive: true, displayOrder: 2 },
    { id: 2, name: 'HR', description: 'Human Resources', isActive: true, displayOrder: 3 },
    { id: 3, name: 'Finance', description: 'Finance related', isActive: true, displayOrder: 4 }
  ]),

  getSubCategories: () => Promise.resolve([
    { id: 1, name: 'General', categoryId: 1, description: 'General subcategory', isActive: true, displayOrder: 1 },
    { id: 35, name: 'Software', categoryId: 12, description: 'Software issues', isActive: true, displayOrder: 2 },
    { id: 2, name: 'Hardware', categoryId: 12, description: 'Hardware issues', isActive: true, displayOrder: 3 },
    { id: 3, name: 'Network', categoryId: 12, description: 'Network issues', isActive: true, displayOrder: 4 }
  ]),

  getPriorityLevels: () => Promise.resolve([
    { id: 1, name: 'Low', level: 1, color: '#22c55e', isActive: true, sortOrder: 1 },
    { id: 2, name: 'Medium', level: 2, color: '#eab308', isActive: true, sortOrder: 2 },
    { id: 3, name: 'High', level: 3, color: '#f97316', isActive: true, sortOrder: 3 },
    { id: 4, name: 'Critical', level: 4, color: '#ef4444', isActive: true, sortOrder: 4 },
    { id: 5, name: 'Urgent', level: 5, color: '#dc2626', isActive: true, sortOrder: 5 }
  ]),

  getTicketStatuses: () => Promise.resolve([
    { id: 0, name: 'Open', workflowOrder: 0, isActive: true, color: '#3b82f6', isDefault: true },
    { id: 1, name: 'In Progress', workflowOrder: 1, isActive: true, color: '#eab308', isDefault: false },
    { id: 2, name: 'Resolved', workflowOrder: 2, isActive: true, color: '#22c55e', isDefault: false },
    { id: 3, name: 'Closed', workflowOrder: 3, isActive: true, color: '#6b7280', isDefault: false },
    { id: 4, name: 'On Hold', workflowOrder: 4, isActive: true, color: '#f97316', isDefault: false }
  ]),

  getIssueTypes: () => Promise.resolve([
    { id: 1, name: 'Bug', description: 'Software bug', isActive: true, displayOrder: 1, color: '#ef4444' },
    { id: 2, name: 'User Issue', description: 'User reported issue', isActive: true, displayOrder: 2, color: '#3b82f6' },
    { id: 3, name: 'System Failure', description: 'System failure', isActive: true, displayOrder: 3, color: '#dc2626' },
    { id: 4, name: 'Performance Issue', description: 'Performance problems', isActive: true, displayOrder: 4, color: '#f97316' },
    { id: 5, name: 'Feature Request', description: 'New feature request', isActive: true, displayOrder: 5, color: '#22c55e' },
    { id: 6, name: 'Data Issue', description: 'Data related problems', isActive: true, displayOrder: 6, color: '#8b5cf6' },
    { id: 7, name: 'Security Issue', description: 'Security concerns', isActive: true, displayOrder: 7, color: '#dc2626' },
    { id: 8, name: 'Integration Issue', description: 'Third-party integration problems', isActive: true, displayOrder: 8, color: '#06b6d4' }
  ]),

  getAgents: () => Promise.resolve([
    { id: 1, userId: 'user1', name: 'John Doe', email: 'john@example.com', isActive: true },
    { id: 2, userId: 'user2', name: 'Jane Smith', email: 'jane@example.com', isActive: true },
    { id: 3, userId: 'user3', name: 'Bob Johnson', email: 'bob@example.com', isActive: true }
  ]),

  getDepartments: () => Promise.resolve([
    { id: 1, name: 'IT Support', description: 'IT Support department', isActive: true, sortOrder: 1 },
    { id: 2, name: 'HR', description: 'Human Resources', isActive: true, sortOrder: 2 },
    { id: 3, name: 'Finance', description: 'Finance department', isActive: true, sortOrder: 3 }
  ])
};