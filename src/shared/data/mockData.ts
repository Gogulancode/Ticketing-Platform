import { Module, User, Assessment } from '../types';

export const modules: Module[] = [
  {
    id: '1',
    title: 'Freight Management',
    description: 'Learn freight booking, tracking, and cost optimization strategies.',
    icon: 'Ship',
    color: 'purple',
    estimatedTime: '1-2 hours',
    difficulty: 'Intermediate',
    prerequisites: [],
    learningObjectives: [
      'Master freight booking procedures',
      'Understand shipping modes',
      'Learn cost optimization'
    ],
    isLocked: false,
    progress: 0,
    sections: [
      {
        id: '1-1',
        title: 'Freight Booking',
        description: 'Booking and managing freight shipments',
        lessons: [
          {
            id: '1-1-1',
            title: 'Freight Booking Procedures',
            type: 'video',
            isCompleted: false,
            isLocked: false,
            content: 'Freight booking procedures...',
            duration: '25 min',
            hasAssessment: false
          }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Inventory Management',
    description: 'Optimize inventory levels, tracking, and warehouse management.',
    icon: 'Archive',
    color: 'orange',
    estimatedTime: '1-2 hours',
    difficulty: 'Beginner',
    prerequisites: [],
    learningObjectives: [
      'Learn inventory optimization',
      'Master stock tracking',
      'Understand warehouse management'
    ],
    isLocked: true,
    progress: 0,
    sections: [
      {
        id: '2-1',
        title: 'Stock Management',
        description: 'Managing inventory and stock levels',
        lessons: [
          {
            id: '2-1-1',
            title: 'Inventory Basics',
            type: 'video',
            isCompleted: false,
            isLocked: false,
            content: 'Stock management principles...',
            duration: '20 min',
            hasAssessment: false
          }
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Reporting & Analytics',
    description: 'Generate insights through comprehensive reporting and data analysis.',
    icon: 'BarChart3',
    color: 'red',
    estimatedTime: '1-2 hours',
    difficulty: 'Advanced',
    prerequisites: ['1', '2'],
    learningObjectives: [
      'Master report generation',
      'Learn data analysis',
      'Understand KPI tracking'
    ],
    isLocked: true,
    progress: 0,
    sections: [
      {
        id: '3-1',
        title: 'Report Generation',
        description: 'Creating and customizing reports',
        lessons: [
          {
            id: '3-1-1',
            title: 'Basic Reporting',
            type: 'video',
            isCompleted: false,
            isLocked: false,
            content: 'Report generation procedures...',
            duration: '30 min',
            hasAssessment: false
          }
        ]
      }
    ]
  },
  {
    id: '4',
    title: 'Customer Management',
    description: 'Build and maintain strong customer relationships and communication.',
    icon: 'Users',
    color: 'indigo',
    estimatedTime: '1 hour',
    difficulty: 'Beginner',
    prerequisites: [],
    learningObjectives: [
      'Learn customer communication',
      'Master relationship building',
      'Understand service excellence'
    ],
    isLocked: true,
    progress: 0,
    sections: [
      {
        id: '4-1',
        title: 'Customer Relations',
        description: 'Building strong customer relationships',
        lessons: [
          {
            id: '4-1-1',
            title: 'Customer Communication',
            type: 'video',
            isCompleted: false,
            isLocked: false,
            content: 'Customer data management...',
            duration: '25 min',
            hasAssessment: false
          }
        ]
      }
    ]
  }
];

// Current user data
export const currentUser: User = {
  id: 'user1',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'Admin',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  department: 'Training & Development',
  joinDate: '2023-01-15',
  completedModules: 2,
  totalModules: 6,
  overallProgress: 33
};

// Recent uploads data
export const recentUploads = [
  {
    id: '1',
    title: 'Freight Booking Template',
    description: 'Template document for freight booking procedures',
    type: 'doc' as const,
    module: 'Freight Management',
    uploadedBy: 'Lisa Rodriguez',
    uploadedAt: '3 days ago'
  },
  {
    id: '2',
    title: 'Inventory Checklist',
    description: 'Visual checklist for inventory management',
    type: 'image' as const,
    module: 'Inventory Control',
    uploadedBy: 'David Kim',
    uploadedAt: '1 week ago'
  }
];

// Mock assessments data
export const assessments: Assessment[] = [
  {
    id: '1',
    title: 'Freight Management Quiz',
    description: 'Test your understanding of freight booking and management',
    moduleId: '1',
    sectionId: '1-1',
    questions: [],
    passingScore: 70,
    timeLimit: 30,
    attempts: [],
    maxAttempts: 3,
    isActive: true,
    isRequired: true,
    lessonId: '1-1-3'
  },
  {
    id: '2',
    title: 'Documentation & Compliance Assessment',
    description: 'Evaluate your knowledge of import documentation and compliance requirements',
    moduleId: '1',
    sectionId: '1-2',
    questions: [],
    passingScore: 80,
    timeLimit: 45,
    attempts: [],
    maxAttempts: 3,
    isActive: true,
    isRequired: false
  }
];
