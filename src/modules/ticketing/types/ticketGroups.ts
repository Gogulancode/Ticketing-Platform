export interface AgentGroup {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  categories: string[]; // Category IDs this group handles
  departments: string[]; // Departments this group supports
  isActive: boolean;
  priority: number; // For ordering groups
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  department: string;
  specializations: string[]; // Areas of expertise
  isActive: boolean;
  isAgent: boolean;
  workload: number; // Current ticket count
  avgResponseTime: number; // In hours
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: TicketSubcategory[];
  assignedGroups: string[]; // Agent group IDs
  isActive: boolean;
  estimatedResolutionTime: number; // In hours
}

export interface TicketSubcategory {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string;
  assignedGroups: string[]; // Agent group IDs  
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  supportGroups: string[]; // Agent group IDs that support this department
  isActive: boolean;
}

// Mock data for the enhanced system
export const mockAgents: Agent[] = [
  // IT Support Group
  { id: '1', name: 'John Smith', email: 'john.smith@company.com', department: 'IT', specializations: ['Network', 'Hardware'], isActive: true, isAgent: true, workload: 5, avgResponseTime: 2.5 },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'IT', specializations: ['Software', 'Database'], isActive: true, isAgent: true, workload: 3, avgResponseTime: 1.8 },
  
  // HR Support Group  
  { id: '3', name: 'Mike Davis', email: 'mike.davis@company.com', department: 'HR', specializations: ['Employee Relations', 'Payroll'], isActive: true, isAgent: true, workload: 7, avgResponseTime: 4.2 },
  { id: '4', name: 'Lisa Chen', email: 'lisa.chen@company.com', department: 'HR', specializations: ['Benefits', 'Recruitment'], isActive: true, isAgent: true, workload: 4, avgResponseTime: 3.1 },
  
  // Training Support Group
  { id: '5', name: 'David Wilson', email: 'david.wilson@company.com', department: 'Training', specializations: ['LMS', 'Content'], isActive: true, isAgent: true, workload: 6, avgResponseTime: 2.8 },
  { id: '6', name: 'Emma Taylor', email: 'emma.taylor@company.com', department: 'Training', specializations: ['Assessment', 'Certification'], isActive: true, isAgent: true, workload: 2, avgResponseTime: 1.5 },
  
  // Finance Support Group
  { id: '7', name: 'Robert Brown', email: 'robert.brown@company.com', department: 'Finance', specializations: ['Expenses', 'Budgets'], isActive: true, isAgent: true, workload: 4, avgResponseTime: 3.8 },
  { id: '8', name: 'Amy White', email: 'amy.white@company.com', department: 'Finance', specializations: ['Invoicing', 'Reports'], isActive: true, isAgent: true, workload: 3, avgResponseTime: 2.2 },
];

export const mockDepartments: Department[] = [
  { id: '1', name: 'Information Technology', code: 'IT', supportGroups: ['it-support', 'general-support'], isActive: true },
  { id: '2', name: 'Human Resources', code: 'HR', supportGroups: ['hr-support', 'general-support'], isActive: true },
  { id: '3', name: 'Finance', code: 'FIN', supportGroups: ['finance-support', 'general-support'], isActive: true },
  { id: '4', name: 'Operations', code: 'OPS', supportGroups: ['operations-support', 'general-support'], isActive: true },
  { id: '5', name: 'Training & Development', code: 'TRN', supportGroups: ['training-support', 'general-support'], isActive: true },
  { id: '6', name: 'Quality Assurance', code: 'QA', supportGroups: ['qa-support', 'general-support'], isActive: true },
];

export const mockAgentGroups: AgentGroup[] = [
  {
    id: 'it-support',
    name: 'IT Support Team',
    description: 'Handles all technical issues, hardware, software, and network problems',
    agents: mockAgents.filter(a => ['1', '2'].includes(a.id)),
    categories: ['technical', 'hardware', 'software'],
    departments: ['IT', 'Operations'],
    isActive: true,
    priority: 1
  },
  {
    id: 'hr-support', 
    name: 'HR Support Team',
    description: 'Employee relations, payroll, benefits, and HR policy questions',
    agents: mockAgents.filter(a => ['3', '4'].includes(a.id)),
    categories: ['hr', 'payroll', 'benefits'],
    departments: ['HR', 'Finance'],
    isActive: true,
    priority: 2
  },
  {
    id: 'training-support',
    name: 'Training Support Team', 
    description: 'Learning management, content issues, assessments, and certifications',
    agents: mockAgents.filter(a => ['5', '6'].includes(a.id)),
    categories: ['training', 'lms', 'content'],
    departments: ['Training', 'HR'],
    isActive: true,
    priority: 3
  },
  {
    id: 'finance-support',
    name: 'Finance Support Team',
    description: 'Budget, expenses, invoicing, and financial reporting support',
    agents: mockAgents.filter(a => ['7', '8'].includes(a.id)),
    categories: ['finance', 'expenses', 'budget'],
    departments: ['Finance', 'Operations'],
    isActive: true,
    priority: 4
  },
  {
    id: 'general-support',
    name: 'General Support Team',
    description: 'Cross-functional support for general inquiries and escalations',
    agents: mockAgents.filter(a => a.workload < 5), // Agents with lower workload
    categories: ['general', 'other'],
    departments: ['IT', 'HR', 'Finance', 'Operations', 'Training', 'Quality'],
    isActive: true,
    priority: 5
  }
];

export const mockTicketCategories: TicketCategory[] = [
  {
    id: 'technical',
    name: 'Technical Issues',
    description: 'Hardware, software, network, and system-related problems',
    icon: 'Laptop',
    assignedGroups: ['it-support', 'general-support'],
    isActive: true,
    estimatedResolutionTime: 4,
    subcategories: [
      {
        id: 'hardware',
        name: 'Hardware Issues',
        description: 'Physical device problems, repairs, replacements',
        parentCategoryId: 'technical',
        assignedGroups: ['it-support'],
        isActive: true,
        priority: 'high',
        tags: ['hardware', 'device', 'repair']
      },
      {
        id: 'software',
        name: 'Software Issues', 
        description: 'Application bugs, installation problems, licensing',
        parentCategoryId: 'technical',
        assignedGroups: ['it-support'],
        isActive: true,
        priority: 'medium',
        tags: ['software', 'application', 'bug']
      },
      {
        id: 'network',
        name: 'Network & Connectivity',
        description: 'Internet, VPN, network access issues',
        parentCategoryId: 'technical', 
        assignedGroups: ['it-support'],
        isActive: true,
        priority: 'urgent',
        tags: ['network', 'connectivity', 'internet']
      }
    ]
  },
  {
    id: 'training',
    name: 'Training & Learning',
    description: 'LMS access, content issues, assessments, certifications',
    icon: 'BookOpen',
    assignedGroups: ['training-support', 'general-support'],
    isActive: true,
    estimatedResolutionTime: 2,
    subcategories: [
      {
        id: 'lms-access',
        name: 'LMS Access Issues',
        description: 'Cannot login, password reset, account locked',
        parentCategoryId: 'training',
        assignedGroups: ['training-support'],
        isActive: true,
        priority: 'medium',
        tags: ['lms', 'access', 'login']
      },
      {
        id: 'content-issues',
        name: 'Content Problems',
        description: 'Videos not playing, broken links, missing materials',
        parentCategoryId: 'training',
        assignedGroups: ['training-support'],
        isActive: true,
        priority: 'medium',
        tags: ['content', 'video', 'materials']
      },
      {
        id: 'assessments',
        name: 'Assessment Issues',
        description: 'Quiz problems, scoring issues, certification errors',
        parentCategoryId: 'training',
        assignedGroups: ['training-support'],
        isActive: true,
        priority: 'high',
        tags: ['assessment', 'quiz', 'certification']
      }
    ]
  },
  {
    id: 'hr',
    name: 'HR & People',
    description: 'Employee relations, payroll, benefits, and HR policies',
    icon: 'Users',
    assignedGroups: ['hr-support', 'general-support'],
    isActive: true,
    estimatedResolutionTime: 6,
    subcategories: [
      {
        id: 'payroll',
        name: 'Payroll Issues',
        description: 'Salary, deductions, pay slip problems',
        parentCategoryId: 'hr',
        assignedGroups: ['hr-support'],
        isActive: true,
        priority: 'urgent',
        tags: ['payroll', 'salary', 'pay']
      },
      {
        id: 'benefits',
        name: 'Benefits & Leave',
        description: 'Health insurance, leave applications, policy questions',
        parentCategoryId: 'hr',
        assignedGroups: ['hr-support'],
        isActive: true,
        priority: 'medium',
        tags: ['benefits', 'leave', 'insurance']
      }
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    description: 'Expenses, budgets, invoicing, and financial processes',
    icon: 'DollarSign',
    assignedGroups: ['finance-support', 'general-support'],
    isActive: true,
    estimatedResolutionTime: 8,
    subcategories: [
      {
        id: 'expenses',
        name: 'Expense Claims',
        description: 'Expense submission, approval, reimbursement issues',
        parentCategoryId: 'finance',
        assignedGroups: ['finance-support'],
        isActive: true,
        priority: 'medium',
        tags: ['expenses', 'claims', 'reimbursement']
      },
      {
        id: 'budget',
        name: 'Budget & Planning',
        description: 'Budget allocation, planning, financial reports',
        parentCategoryId: 'finance',
        assignedGroups: ['finance-support'],
        isActive: true,
        priority: 'low',
        tags: ['budget', 'planning', 'reports']
      }
    ]
  }
];
