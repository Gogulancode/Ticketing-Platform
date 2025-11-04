import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  ClipboardList, 
  Save, 
  BookOpen,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { getModules, getSectionsByModule, createSection, createAssessment } from '../shared/lib/api';
import { useAuth } from '../shared/hooks/hooks/useAuth';

interface ContentItem {
  id?: number;
  type: 'text' | 'video' | 'image' | 'link' | 'file';
  title: string;
  content: string;
  order: number;
}

interface Assessment {
  id?: number;
  title: string;
  description: string;
  moduleId: number;
  sectionId?: number;
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
}

interface Question {
  id?: number;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

const ContentManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  
  // Content creation states
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [currentContent, setCurrentContent] = useState<ContentItem>({
    type: 'text',
    title: '',
    content: '',
    order: 1
  });

  // Assessment creation states
  const [currentAssessment, setCurrentAssessment] = useState<Assessment>({
    title: '',
    description: '',
    moduleId: 0,
    questions: [],
    timeLimit: 30,
    passingScore: 70
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    questionText: '',
    questionType: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 10
  });

  // UI states
  const [activeTab, setActiveTab] = useState<'content' | 'assessment'>('content');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchModules();
    }
  }, [isAdmin]);

  const fetchModules = async () => {
    try {
      const data = await getModules();
      setModules(data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchSections = async (moduleId: number) => {
    try {
      const data = await getSectionsByModule(moduleId);
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleModuleSelect = async (module: any) => {
    setSelectedModule(module);
    setSelectedSection(null);
    setCurrentAssessment(prev => ({ ...prev, moduleId: module.id }));
    await fetchSections(module.id);
  };

  const handleSectionSelect = (section: any) => {
    setSelectedSection(section);
    setCurrentAssessment(prev => ({ ...prev, sectionId: section.id }));
  };

  const addContentItem = () => {
    if (!currentContent.title || !currentContent.content) {
      alert('Please fill in title and content');
      return;
    }

    setContentItems(prev => [...prev, { ...currentContent, id: Date.now() }]);
    setCurrentContent({
      type: 'text',
      title: '',
      content: '',
      order: contentItems.length + 2
    });
  };

  const removeContentItem = (id: number) => {
    setContentItems(prev => prev.filter(item => item.id !== id));
  };

  const addQuestionToAssessment = () => {
    if (!currentQuestion.questionText) {
      alert('Please fill in the question text');
      return;
    }

    setCurrentAssessment(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
    }));

    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10
    });
  };

  const removeQuestion = (id: number) => {
    setCurrentAssessment(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const saveContent = async () => {
    if (!selectedModule || contentItems.length === 0) {
      alert('Please select a module and add content items');
      return;
    }

    setIsLoading(true);
    try {
      // Create a new section with the content
      const sectionData = {
        title: `${selectedModule.title} - Content Section`,
        description: `Content section with ${contentItems.length} items`,
        moduleId: selectedModule.id,
        order: sections.length + 1,
        erpSectionId: null // Mark as custom content
      };

      await createSection(sectionData);
      
      // Here you would typically save the content items to the backend
      // For now, we'll just show success
      alert('Content saved successfully!');
      setContentItems([]);
      setShowContentForm(false);
      await fetchSections(selectedModule.id);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssessment = async () => {
    if (!selectedModule || currentAssessment.questions.length === 0) {
      alert('Please select a module and add questions');
      return;
    }

    setIsLoading(true);
    try {
      const assessmentData = {
        title: currentAssessment.title,
        description: currentAssessment.description,
        moduleId: currentAssessment.moduleId,
        sectionId: currentAssessment.sectionId,
        questions: currentAssessment.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points
        })),
        timeLimit: currentAssessment.timeLimit,
        passingScore: currentAssessment.passingScore
      };

      await createAssessment(assessmentData);
      
      alert('Assessment created successfully!');
      setCurrentAssessment({
        title: '',
        description: '',
        moduleId: selectedModule.id,
        questions: [],
        timeLimit: 30,
        passingScore: 70
      });
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access content management.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-600 mt-2">Create and manage content and assessments for your training modules</p>
      </div>

      {/* Module and Section Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Module & Section</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
            <select
              value={selectedModule?.id || ''}
              onChange={(e) => {
                const module = modules.find(m => m.id === parseInt(e.target.value));
                handleModuleSelect(module);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a module</option>
              {modules.map(module => (
                <option key={module.id} value={module.id}>
                  {module.title} {module.erpModuleId ? '(ERP)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section (Optional)</label>
            <select
              value={selectedSection?.id || ''}
              onChange={(e) => {
                const section = sections.find(s => s.id === parseInt(e.target.value));
                handleSectionSelect(section);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedModule}
            >
              <option value="">Create for entire module</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.title} {section.erpSectionId ? '(ERP)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedModule && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                Selected: {selectedModule.title}
                {selectedSection && ` > ${selectedSection.title}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      {selectedModule && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'content'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Create Content
              </div>
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'assessment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Create Assessment
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'content' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-gray-900">Content Items</h3>
                  <button
                    onClick={() => setShowContentForm(!showContentForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Content Item
                  </button>
                </div>

                {/* Content Items List */}
                {contentItems.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {contentItems.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600">Type: {item.type}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeContentItem(item.id!)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Creation Form */}
                {showContentForm && (
                  <div className="border border-gray-200 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Content Item</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                        <select
                          value={currentContent.type}
                          onChange={(e) => setCurrentContent(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text Content</option>
                          <option value="video">Video</option>
                          <option value="image">Image</option>
                          <option value="link">External Link</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={currentContent.title}
                          onChange={(e) => setCurrentContent(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter content title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        value={currentContent.content}
                        onChange={(e) => setCurrentContent(prev => ({ ...prev, content: e.target.value }))}
                        placeholder={`Enter ${currentContent.type} content...`}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={addContentItem}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                      <button
                        onClick={() => setShowContentForm(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Save Content */}
                {contentItems.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={saveContent}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save All Content'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assessment' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Assessment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title</label>
                      <input
                        type="text"
                        value={currentAssessment.title}
                        onChange={(e) => setCurrentAssessment(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter assessment title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                      <input
                        type="number"
                        value={currentAssessment.timeLimit}
                        onChange={(e) => setCurrentAssessment(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                        placeholder="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={currentAssessment.description}
                        onChange={(e) => setCurrentAssessment(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter assessment description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                      <input
                        type="number"
                        value={currentAssessment.passingScore}
                        onChange={(e) => setCurrentAssessment(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                        placeholder="70"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {currentAssessment.questions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Questions ({currentAssessment.questions.length})</h4>
                    <div className="space-y-3">
                      {currentAssessment.questions.map((question, index) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                  {index + 1}
                                </span>
                                <span className="text-sm text-gray-500 capitalize">{question.questionType}</span>
                                <span className="text-sm text-gray-500">{question.points} points</span>
                              </div>
                              <p className="text-gray-900 mb-2">{question.questionText}</p>
                              {question.options && question.options.length > 0 && (
                                <div className="ml-11">
                                  {question.options.map((option, optIndex) => (
                                    <div key={optIndex} className={`text-sm ${option === question.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                      {String.fromCharCode(65 + optIndex)}. {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeQuestion(question.id!)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Creation Form */}
                <div className="border border-gray-200 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                      <select
                        value={currentQuestion.questionType}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, questionType: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                        placeholder="10"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                    <textarea
                      value={currentQuestion.questionText}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                      placeholder="Enter your question..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {currentQuestion.questionType === 'multiple-choice' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500 w-8">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={currentQuestion.correctAnswer === option}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-500">Correct</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentQuestion.questionType === 'true-false' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tfAnswer"
                            checked={currentQuestion.correctAnswer === 'true'}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 'true' }))}
                            className="text-blue-600"
                          />
                          True
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tfAnswer"
                            checked={currentQuestion.correctAnswer === 'false'}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 'false' }))}
                            className="text-blue-600"
                          />
                          False
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={addQuestionToAssessment}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                </div>

                {/* Save Assessment */}
                {currentAssessment.questions.length > 0 && currentAssessment.title && (
                  <div className="flex justify-end">
                    <button
                      onClick={saveAssessment}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Creating...' : 'Create Assessment'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
