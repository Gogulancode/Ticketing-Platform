import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Play,
  RotateCcw,
  AlertCircle,
  BookOpen,
  Target,
  Award,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Type,
  List,
  CheckSquare
} from 'lucide-react';
import { getAssessments, getModules, createAssessment } from '../../../shared/lib/api';
interface Question {
  id: string;
  type: 'multiple-choice' | 'single-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  module: string;
  moduleId: string;
  sectionId?: string;
  description: string;
  questions: Question[];
  totalQuestions: number;
  totalPoints: number;
  timeLimit: number;
  passingScore: number;
  attempts: number;
  maxAttempts: number;
  lastScore?: number;
  bestScore?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  lastAttempt?: string;
  isRequired?: boolean;
  triggerType: 'section-completion' | 'module-completion';
  isActive: boolean;
}

const Assessments: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [selectedModule, setSelectedModule] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<string | null>(null);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('🔄 Modules state changed:', modules);
    console.log('📊 Modules count:', modules.length);
    if (modules.length > 0) {
      console.log('🎯 First module:', modules[0]);
    }
  }, [modules]);

  React.useEffect(() => {
    console.log('🔄 Starting to load assessments and modules...');
    setLoading(true);
    
    // Load modules and assessments separately so one failure doesn't affect the other
    const loadData = async () => {
      let modulesData = [];
      let assessmentsData = [];
      
      // Load modules
      try {
        console.log('📚 Loading modules...');
        modulesData = await getModules();
        console.log('✅ Modules loaded successfully:', modulesData);
        setModules(modulesData || []);
      } catch (err) {
        console.error('❌ Failed to load modules:', err);
        setModules([]);
      }
      
      // Load assessments
      try {
        console.log('📝 Loading assessments...');
        assessmentsData = await getAssessments();
        console.log('✅ Assessments loaded successfully:', assessmentsData);
        setAssessments(assessmentsData || []);
      } catch (err) {
        console.warn('⚠️ Failed to load assessments (continuing without them):', err);
        setAssessments([]);
      }
      
      setLoading(false);
      
      if (modulesData.length === 0 && assessmentsData.length === 0) {
        setError('Failed to load both modules and assessments. Check authentication.');
      } else if (modulesData.length === 0) {
        setError('Failed to load modules. Check API connection.');
      }
    };
    
    loadData();
  }, []);

  const [newAssessment, setNewAssessment] = useState({
    title: '',
    moduleId: '',
    sectionId: '',
    description: '',
    totalQuestions: 10,
    totalPoints: 100,
    timeLimit: 30,
    passingScore: 70,
    maxAttempts: 3,
    isRequired: false,
    triggerType: 'section-completion' as 'section-completion' | 'module-completion',
    isActive: true
  });

  const [newQuestion, setNewQuestion] = useState<Question>({
    id: '',
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 5
  });



  const filteredAssessments = assessments.filter(assessment => {
    const statusMatch = filter === 'all' || (assessment.status || 'not-started') === filter;
    const moduleMatch = !selectedModule || assessment.moduleId === selectedModule;
    return statusMatch && moduleMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-orange-500" />;
      default: return <FileQuestion className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButton = (assessment: Assessment) => {
    const status = assessment.status || 'not-started';
    
    if (status === 'completed') {
      return (
        <Link to={`/assessments/${assessment.id}/review`} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Trophy className="h-4 w-4 mr-2" />
          Review
        </Link>
      );
    }

    if (status === 'failed' && assessment.attempts < assessment.maxAttempts) {
      return (
        <Link to={`/assessments/${assessment.id}/take`} className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake
        </Link>
      );
    }

    if (status === 'failed' && assessment.attempts >= assessment.maxAttempts) {
      return (
        <button disabled className="flex items-center px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
          <XCircle className="h-4 w-4 mr-2" />
          Max Attempts
        </button>
      );
    }

    return (
      <Link to={`/assessments/${assessment.id}/take`} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        <Play className="h-4 w-4 mr-2" />
        Start
      </Link>
    );
  };

  const stats = {
    total: assessments.length,
    completed: assessments.filter(a => a.status === 'completed').length,
    failed: assessments.filter(a => a.status === 'failed').length,
    notStarted: assessments.filter(a => a.status === 'not-started').length
  };

  const handleAddAssessment = async () => {
    if (newAssessment.title && newAssessment.moduleId && newAssessment.description) {
      try {
        const selectedModule = modules.find(m => m.id == newAssessment.moduleId);
        
        // Prepare assessment data for API
        const assessmentData = {
          title: newAssessment.title,
          moduleId: parseInt(newAssessment.moduleId),
          sectionId: newAssessment.sectionId ? parseInt(newAssessment.sectionId) : null,
          description: newAssessment.description,
          passingScore: newAssessment.passingScore,
          timeLimit: newAssessment.timeLimit,
          maxAttempts: newAssessment.maxAttempts,
          isRequired: newAssessment.isRequired,
          triggerType: newAssessment.triggerType === 'section-completion' ? 0 : 1 // 0=SectionCompletion, 1=ModuleCompletion
        };

        console.log('📤 Creating assessment:', assessmentData);
        
        // Save to backend
        const createdAssessment = await createAssessment(assessmentData);
        console.log('✅ Assessment created:', createdAssessment);
        
        // Create local assessment object for immediate UI update
        const assessment: Assessment = {
          id: createdAssessment.id?.toString() || Date.now().toString(),
          title: newAssessment.title,
          module: selectedModule?.title || '',
          moduleId: newAssessment.moduleId,
          sectionId: newAssessment.sectionId || undefined,
          description: newAssessment.description,
          questions: [],
          totalQuestions: newAssessment.totalQuestions,
          totalPoints: newAssessment.totalPoints,
          timeLimit: newAssessment.timeLimit,
          passingScore: newAssessment.passingScore,
          attempts: 0,
          maxAttempts: newAssessment.maxAttempts,
          status: 'not-started' as const,
          isRequired: newAssessment.isRequired,
          triggerType: newAssessment.triggerType,
          isActive: newAssessment.isActive
        };

        // Update local state
        setAssessments(prev => [...prev, assessment]);
        
        // Show success message and open question builder
        alert(`Assessment "${newAssessment.title}" created successfully and saved to database! Now you can add questions.`);
        setShowQuestionBuilder(assessment.id);
        
      } catch (error) {
        console.error('❌ Failed to create assessment:', error);
        alert(`Failed to create assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      // Reset form and close popup
      setNewAssessment({
        title: '',
        moduleId: '',
        sectionId: '',
        description: '',
        totalQuestions: 10,
        totalPoints: 100,
        timeLimit: 30,
        passingScore: 70,
        maxAttempts: 3,
        isRequired: false,
        triggerType: 'section-completion',
        isActive: true
      });
      setShowAddForm(false);
    } else {
      alert('Please fill in all required fields: Title, Module, and Description');
    }
  };

  const handleAddQuestion = (assessmentId: string) => {
    if (!newQuestion.question.trim()) {
      alert('Question text is required');
      return;
    }

    if (newQuestion.type === 'multiple-choice' || newQuestion.type === 'single-choice') {
      const validOptions = newQuestion.options?.filter(opt => opt.trim()) || [];
      if (validOptions.length < 2) {
        alert('At least 2 options are required for choice questions');
        return;
      }
      if (!newQuestion.correctAnswer) {
        alert('Please select the correct answer');
        return;
      }
    }

    if (newQuestion.type === 'true-false' && !newQuestion.correctAnswer) {
      alert('Please select True or False as the correct answer');
      return;
    }

    const question: Question = {
      ...newQuestion,
      id: Date.now().toString(),
      options: newQuestion.type === 'multiple-choice' || newQuestion.type === 'single-choice' 
        ? newQuestion.options?.filter(opt => opt.trim()) 
        : undefined
    };

    setAssessments(prev => prev.map(assessment => 
      assessment.id === assessmentId
        ? { 
            ...assessment, 
            questions: [...assessment.questions, question],
            totalPoints: assessment.totalPoints + question.points
          }
        : assessment
    ));

    // Reset form
    setNewQuestion({
      id: '',
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 5
    });

    alert('Question added successfully!');
  };

  const handleDeleteQuestion = (assessmentId: string, questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setAssessments(prev => prev.map(assessment => 
        assessment.id === assessmentId
          ? { 
              ...assessment, 
              questions: assessment.questions.filter(q => q.id !== questionId),
              totalPoints: assessment.totalPoints - (assessment.questions.find(q => q.id === questionId)?.points || 0)
            }
          : assessment
      ));
    }
  };



  const handleDeleteAssessment = (assessmentId: string) => {
    if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      setAssessments(prev => prev.filter(assessment => assessment.id !== assessmentId));
      alert('Assessment deleted successfully!');
    }
  };

  const handleToggleAssessmentStatus = (assessmentId: string) => {
    setAssessments(prev => prev.map(assessment => 
      assessment.id === assessmentId 
        ? { ...assessment, isActive: !assessment.isActive }
        : assessment
    ));
  };



  const getSectionTitle = (moduleId: string, sectionId?: string) => {
    if (!sectionId) return null;
    const module = modules.find((m: any) => m.id === moduleId);
    return module?.sections?.find((s: { id: string; title: string }) => s.id === sectionId)?.title || 'Unknown Section';
  };

  const validateForm = () => {
    const errors = [];
    if (!newAssessment.title.trim()) errors.push('Title is required');
    if (!newAssessment.moduleId) errors.push('Module selection is required');
    if (!newAssessment.description.trim()) errors.push('Description is required');
    
    // Validate section selection for section-completion trigger
    if (newAssessment.triggerType === 'section-completion') {
      if (!newAssessment.sectionId) {
        errors.push('Section selection is required when assessment appears after section completion');
      }
      // Check if the selected module has sections
      const selectedModule = modules.find(m => m.id === newAssessment.moduleId);
      if (selectedModule && (!selectedModule.sections || selectedModule.sections.length === 0)) {
        errors.push('The selected module has no sections. Please choose "After Module Completion" or select a different module');
      }
    }
    
    if (newAssessment.totalQuestions < 1) errors.push('Number of questions must be at least 1');
    if (newAssessment.timeLimit < 1) errors.push('Time limit must be at least 1 minute');
    if (newAssessment.passingScore < 0 || newAssessment.passingScore > 100) {
      errors.push('Passing score must be between 0 and 100');
    }
    if (newAssessment.maxAttempts < 1) errors.push('Maximum attempts must be at least 1');
    
    return errors;
  };

  const handleFormSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return;
    }
    await handleAddAssessment();
  };

  const resetForm = () => {
    setNewAssessment({
      title: '',
      moduleId: '',
      sectionId: '',
      description: '',
      totalQuestions: 10,
      totalPoints: 100,
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      isRequired: false,
      triggerType: 'section-completion',
      isActive: true
    });
  };

  const handleCloseForm = () => {
    if (confirm('Are you sure you want to close? Any unsaved changes will be lost.')) {
      resetForm();
      setShowAddForm(false);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice': return <CheckSquare className="h-4 w-4" />;
      case 'single-choice': return <List className="h-4 w-4" />;
      case 'true-false': return <HelpCircle className="h-4 w-4" />;
      case 'short-answer': return <Type className="h-4 w-4" />;
      case 'essay': return <Type className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };



  // Auto-populate section dropdown when module changes
  React.useEffect(() => {
    if (newAssessment.moduleId && newAssessment.triggerType === 'section-completion') {
      const selectedModule = modules.find(m => m.id === newAssessment.moduleId);
      if (selectedModule && selectedModule.sections && selectedModule.sections.length > 0) {
        // Auto-select first section if only one exists
        if (selectedModule.sections.length === 1) {
          setNewAssessment(prev => ({ ...prev, sectionId: selectedModule.sections![0].id }));
        }
      }
    }
  }, [newAssessment.moduleId, newAssessment.triggerType]);

  return (
    <div className="space-y-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">Manage and track assessment progress</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              console.log('🧪 Manual API test started...');
              try {
                const result = await getModules();
                console.log('🧪 Manual API test result:', result);
                alert(`Manual test: Found ${result.length} modules`);
              } catch (error) {
                console.error('🧪 Manual API test error:', error);
                alert(`Manual test error: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Test API
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-sm">
        <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileQuestion className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Not Started</p>
              <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
          </select>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Modules</option>
            {modules.map(module => (
              <option key={module.id} value={module.id}>{module.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assessments List */}
      <div className="space-y-sm">
        {filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(assessment.status || 'not-started')}
                    <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assessment.status || 'not-started')}`}>
                      {(assessment.status || 'not-started').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {assessment.isRequired && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-xs">{assessment.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-xs">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {assessment.module}
                    </div>
                    <div className="flex items-center">
                      <FileQuestion className="h-4 w-4 mr-2" />
                      {assessment.questions.length}/{assessment.totalQuestions} questions
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      {assessment.totalPoints} points
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {assessment.timeLimit} min
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      {assessment.passingScore}% to pass
                    </div>
                  </div>

                  {/* Assessment Placement Info */}
                  <div className="mb-xs p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {assessment.triggerType === 'section-completion' ? (
                          <List className="h-5 w-5 text-blue-600 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Assessment Placement</p>
                        {assessment.triggerType === 'section-completion' ? (
                          <p className="text-sm text-gray-600">
                            Appears after completing section: 
                            <span className="font-medium text-blue-700 ml-1">
                              {getSectionTitle(assessment.moduleId, assessment.sectionId) || 'Unknown Section'}
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">
                            Appears after completing the entire 
                            <span className="font-medium text-green-700 ml-1">{assessment.module}</span> module
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">
                      Trigger: {assessment.triggerType === 'section-completion' ? 'Section Completion' : 'Module Completion'}
                    </span>
                    {assessment.lastScore && (
                      <span className="text-gray-500">
                        Last Score: <span className={assessment.lastScore >= assessment.passingScore ? 'text-green-600' : 'text-red-600'}>
                          {assessment.lastScore}%
                        </span>
                      </span>
                    )}
                    <span className="text-gray-500">
                      Attempts: {assessment.attempts}/{assessment.maxAttempts}
                    </span>
                  </div>

                  {/* Questions Preview */}
                  {assessment.questions.length > 0 && (
                    <div className="mt-xs p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Assessment Questions ({assessment.questions.length})</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {assessment.questions.reduce((sum, q) => sum + q.points, 0)} total points
                          </span>
                          <button
                            onClick={() => setShowQuestionBuilder(showQuestionBuilder === assessment.id ? null : assessment.id)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {showQuestionBuilder === assessment.id ? 'Hide' : 'View'} Questions
                          </button>
                        </div>
                      </div>
                      
                      {showQuestionBuilder === assessment.id && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {assessment.questions.map((question, index) => (
                            <div key={question.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center space-x-2">
                                {getQuestionTypeIcon(question.type)}
                                <span className="text-sm text-gray-900">
                                  {index + 1}. {question.question.substring(0, 50)}...
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {question.points} pts
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteQuestion(assessment.id, question.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      if (showQuestionBuilder === assessment.id) {
                        setShowQuestionBuilder(null);
                      } else {
                        setShowQuestionBuilder(assessment.id);
                        // Reset question form when opening
                        setNewQuestion({
                          id: '',
                          type: 'multiple-choice',
                          question: '',
                          options: ['', '', '', ''],
                          correctAnswer: '',
                          explanation: '',
                          points: 5
                        });
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title={showQuestionBuilder === assessment.id ? "Close Question Builder" : "Add Questions"}
                  >
                    {showQuestionBuilder === assessment.id ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditingAssessment(assessment.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit Assessment"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleAssessmentStatus(assessment.id)}
                    className={`p-2 rounded transition-colors ${
                      assessment.isActive 
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    title={assessment.isActive ? 'Deactivate Assessment' : 'Activate Assessment'}
                  >
                    {assessment.isActive ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment(assessment.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete Assessment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {getActionButton(assessment)}
                </div>
              </div>

              {/* Question Builder */}
              {showQuestionBuilder === assessment.id && (
                <div className="mt-sm p-4 bg-gray-50 rounded-lg border-t">
                  <div className="flex items-center justify-between mb-xs">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Question Builder - {assessment.title}
                    </h4>
                    <div className="text-sm text-gray-600">
                      Module: <span className="font-medium">{assessment.module}</span>
                      {assessment.sectionId && (
                        <span> → Section: <span className="font-medium">{getSectionTitle(assessment.moduleId, assessment.sectionId)}</span></span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-xs p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Questions: {assessment.questions.length}/{assessment.totalQuestions}</span>
                      <span>Total Points: {assessment.questions.reduce((sum, q) => sum + q.points, 0)}</span>
                      <span>Target Points: {assessment.totalPoints}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (assessment.questions.length / assessment.totalQuestions) * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-sm">
                    {/* Question Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                        <select
                          value={newQuestion.type}
                          onChange={(e) => setNewQuestion(prev => ({ 
                            ...prev, 
                            type: e.target.value as Question['type'],
                            options: e.target.value === 'multiple-choice' || e.target.value === 'single-choice' ? ['', '', '', ''] : undefined,
                            correctAnswer: ''
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="single-choice">Single Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="short-answer">Short Answer</option>
                          <option value="essay">Essay</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                        <input
                          type="number"
                          min="1"
                          value={newQuestion.points}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                      <textarea
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {/* Options for Multiple Choice / Single Choice */}
                    {(newQuestion.type === 'multiple-choice' || newQuestion.type === 'single-choice') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                        <div className="space-y-2">
                          {newQuestion.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={newQuestion.correctAnswer === option}
                                onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: option }))}
                                className="text-blue-600"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(newQuestion.options || [])];
                                  newOptions[index] = e.target.value;
                                  setNewQuestion(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Option ${index + 1}`}
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewQuestion(prev => ({ 
                              ...prev, 
                              options: [...(prev.options || []), ''] 
                            }))}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}

                    {/* True/False Options */}
                    {newQuestion.type === 'true-false' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="trueFalse"
                              value="true"
                              checked={newQuestion.correctAnswer === 'true'}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                              className="text-blue-600 mr-2"
                            />
                            True
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="trueFalse"
                              value="false"
                              checked={newQuestion.correctAnswer === 'false'}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                              className="text-blue-600 mr-2"
                            />
                            False
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Correct Answer for Short Answer/Essay */}
                    {(newQuestion.type === 'short-answer' || newQuestion.type === 'essay') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {newQuestion.type === 'essay' ? 'Sample Answer/Keywords' : 'Correct Answer'}
                        </label>
                        <textarea
                          value={newQuestion.correctAnswer}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                          rows={newQuestion.type === 'essay' ? 4 : 2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={newQuestion.type === 'essay' ? 'Enter sample answer or key points...' : 'Enter the correct answer...'}
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                      <textarea
                        value={newQuestion.explanation}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>

                    {/* Add Question Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAddQuestion(assessment.id)}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-xs" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
            <p className="text-gray-600 mb-xs">Create your first assessment to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </button>
          </div>
        )}
      </div>

      {/* Add Assessment Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-sm max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-xs">
              <h3 className="text-lg font-semibold text-gray-900">Create New Assessment</h3>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Assessment title"
                />
              </div>
              
              {/* Module Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Select Module * 
                    <span className="ml-2 text-xs text-gray-500">({modules.length} modules loaded)</span>
                  </span>
                </label>
                {modules.length === 0 && (
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    {loading ? 'Loading modules...' : 'No modules available. Check console for errors.'}
                  </div>
                )}
                <select
                  value={newAssessment.moduleId}
                  onChange={(e) => {
                    console.log('📝 Module selected:', e.target.value, typeof e.target.value);
                    const selectedModule = modules.find(m => m.id == e.target.value);
                    console.log('🎯 Found module:', selectedModule?.title, 'Sections:', selectedModule?.sections?.length);
                    setNewAssessment(prev => ({ ...prev, moduleId: e.target.value, sectionId: '' }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose the module for this assessment</option>
                  {modules.map(module => (
                    <option key={module.id} value={module.id}>
                      {module.title} {module.sections?.length ? `(${module.sections.length} sections)` : '(No sections)'}
                    </option>
                  ))}
                </select>
                {modules.length > 0 && (
                  <div className="mt-1 text-xs text-gray-600">
                    Debug: {modules.length} modules loaded - {modules.map(m => m.title).join(', ').substring(0, 100)}...
                  </div>
                )}
                {newAssessment.moduleId && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: <span className="font-medium">{modules.find(m => m.id === newAssessment.moduleId)?.title}</span>
                  </p>
                )}
              </div>

              {/* Assessment Placement Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    When should this assessment appear? *
                  </span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="triggerType"
                      value="section-completion"
                      checked={newAssessment.triggerType === 'section-completion'}
                      onChange={(e) => setNewAssessment(prev => ({ 
                        ...prev, 
                        triggerType: e.target.value as 'section-completion' | 'module-completion',
                        sectionId: e.target.value === 'module-completion' ? '' : prev.sectionId
                      }))}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">After Section Completion</div>
                      <div className="text-sm text-gray-600">
                        Assessment appears immediately after a specific section is completed
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="triggerType"
                      value="module-completion"
                      checked={newAssessment.triggerType === 'module-completion'}
                      onChange={(e) => setNewAssessment(prev => ({ 
                        ...prev, 
                        triggerType: e.target.value as 'section-completion' | 'module-completion',
                        sectionId: e.target.value === 'module-completion' ? '' : prev.sectionId
                      }))}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">After Module Completion</div>
                      <div className="text-sm text-gray-600">
                        Assessment appears after all sections in the module are completed
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Section Selection (only when section-completion is selected) */}
              {newAssessment.triggerType === 'section-completion' && newAssessment.moduleId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <List className="h-4 w-4 mr-2" />
                      Select Section *
                    </span>
                  </label>
                  <select
                    value={newAssessment.sectionId}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, sectionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose which section triggers this assessment</option>
                    {(() => {
                      const selectedModule = modules.find(m => m.id === newAssessment.moduleId || m.id === parseInt(newAssessment.moduleId));
                      console.log('🔍 Section dropdown debug:', {
                        moduleId: newAssessment.moduleId,
                        moduleIdType: typeof newAssessment.moduleId,
                        selectedModule: selectedModule?.title,
                        sectionsCount: selectedModule?.sections?.length || 0,
                        firstSection: selectedModule?.sections?.[0]?.title
                      });
                      
                      if (!selectedModule) {
                        return <option disabled>Please select a module first</option>;
                      }
                      
                      if (!selectedModule.sections || selectedModule.sections.length === 0) {
                        return <option disabled>No sections available in this module</option>;
                      }
                      
                      return selectedModule.sections.map((section: { id: string; title: string; description?: string }, index: number) => (
                        <option key={section.id} value={section.id}>
                          Section {index + 1}: {section.title}
                          {section.description ? ` - ${section.description}` : ''}
                        </option>
                      ));
                    })()}
                  </select>
                  {newAssessment.sectionId && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        <strong>Assessment Placement:</strong> This assessment will appear immediately after students complete 
                        "<span className="font-medium">
                          {modules.find(m => m.id === newAssessment.moduleId)?.sections?.find((s: { id: string; title: string }) => s.id === newAssessment.sectionId)?.title}
                        </span>" 
                        in the "{modules.find(m => m.id === newAssessment.moduleId)?.title}" module.
                      </p>
                    </div>
                  )}
                  {!modules.find(m => m.id === newAssessment.moduleId)?.sections?.length && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> The selected module has no sections. Consider choosing "After Module Completion" instead.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Module Completion Summary */}
              {newAssessment.triggerType === 'module-completion' && newAssessment.moduleId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-green-800">
                        <strong>Assessment Placement:</strong> This assessment will appear after students complete all sections 
                        in the "{modules.find(m => m.id === newAssessment.moduleId)?.title}" module.
                      </p>
                      {modules.find(m => m.id === newAssessment.moduleId)?.sections?.length && (
                        <p className="text-xs text-green-700 mt-1">
                          Students must complete {modules.find(m => m.id === newAssessment.moduleId)?.sections?.length} sections 
                          before this assessment becomes available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Assessment Summary Preview */}
              {newAssessment.moduleId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Assessment Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assessment Title:</span>
                      <span className="font-medium">{newAssessment.title || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Module:</span>
                      <span className="font-medium">{modules.find(m => m.id === newAssessment.moduleId)?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Appears:</span>
                      <span className="font-medium">
                        {newAssessment.triggerType === 'section-completion' 
                          ? `After "${modules.find(m => m.id === newAssessment.moduleId)?.sections?.find((s: { id: string; title: string }) => s.id === newAssessment.sectionId)?.title || 'Section not selected'}" section`
                          : 'After completing the entire module'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions/Time:</span>
                      <span className="font-medium">{newAssessment.totalQuestions} questions in {newAssessment.timeLimit} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passing Score:</span>
                      <span className="font-medium">{newAssessment.passingScore}% ({Math.round((newAssessment.passingScore / 100) * newAssessment.totalPoints)} points)</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Form Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newAssessment.description}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this assessment covers and its purpose..."
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Questions</label>
                  <input
                    type="number"
                    min="1"
                    value={newAssessment.totalQuestions}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of questions in the assessment</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Points</label>
                  <input
                    type="number"
                    min="1"
                    value={newAssessment.totalPoints}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, totalPoints: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total points for the assessment</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={newAssessment.timeLimit}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time limit in minutes</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newAssessment.passingScore}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum score to pass (%)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Attempts</label>
                  <input
                    type="number"
                    min="1"
                    value={newAssessment.maxAttempts}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of attempts allowed</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAssessment.isRequired}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Required Assessment
                  </span>
                  <p className="text-xs text-gray-500 ml-6">Students must pass this assessment to proceed</p>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAssessment.isActive}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                  <p className="text-xs text-gray-500 ml-6">Assessment is available to students</p>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-sm">
              <button
                onClick={handleCloseForm}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Create Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessments;
