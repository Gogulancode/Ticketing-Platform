// Type definitions for the Training Portal
export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'QA' | 'User';
  email: string;
  avatar?: string;
}

export interface Module {
  id: number; // Changed from string to number to match API
  originalModuleId?: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  estimatedTime: string;
  difficulty: string;
  prerequisites: string[];
  learningObjectives: string[];
  isActive: boolean;
  order: number;
  erpModuleId?: string;
  progress: number;
  isLocked: boolean;
  sections?: Section[];
  completionRate?: number; // Made optional
  isCompleted?: boolean; // Made optional
}

export interface Section {
  id: number; // Changed from string to number
  title: string;
  description: string;
  moduleId: number; // Changed from string to number
  order: number;
  isActive: boolean;
  erpSectionId?: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'interactive' | 'quiz';
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  content?: string;
  videoUrl?: string;
  documentContent?: string;
  scribeLink?: string;
  assessment?: Assessment; // Embedded assessment data
  hasAssessment: boolean;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  sectionId?: string;
  lessonId?: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // in minutes
  attempts: QuizAttempt[];
  maxAttempts: number;
  isActive: boolean;
  isRequired: boolean; // Whether completing this assessment is required for module completion
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: { [questionId: string]: string };
  score: number;
  passed: boolean;
}

export interface UploadedContent {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'scribe';
  module: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  description: string;
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  module: string;
  tags: string[];
  relevance: number;
}

export interface ProgressData {
  totalModules: number;
  completedModules: number;
  overallProgress: number;
  recentActivity: string[];
}

// Role Management Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  originalRoleId?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  roleId: string;
  moduleId: string;
  sectionId?: string;
  moduleName: string;
  sectionName?: string;
  erpRoleId?: string;
  erpModuleId?: string;
  erpSectionId?: string;
  isActive: boolean;
}

export interface RoleFilter {
  search: string;
  isActive?: boolean;
  hasModuleAccess?: boolean;
  page: number;
  pageSize: number;
  sortBy: 'name' | 'createdAt' | 'permissions';
  sortOrder: 'asc' | 'desc';
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  totalPermissions: number;
  rolesWithoutPermissions: number;
}
