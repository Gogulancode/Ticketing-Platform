import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  Package,
  BarChart3,
  Users,
  Ship,
  Archive,
  Shield,
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit3,
  X,
  Search
} from 'lucide-react';
import { toggleModuleStatus, toggleSectionStatus, createModule, createSection } from '../../../shared/lib/api';
import { useAuth } from '../../../contexts/AuthContext';

const moduleCategoryIcons = {
  Procurement: Package,
  Transportation: Truck,
  'Inventory Management': Archive,
  'Finance & Accounting': BarChart3,
  'Human Resources': Users,
  'Production & Manufacturing': ArrowUpFromLine,
  Sales: ArrowDownToLine,
  Logistics: Ship,
};

const ModulesPage: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [sectionsData, setSectionsData] = useState<{[key: number]: any[]}>({});
  const [loadingSections, setLoadingSections] = useState<{[key: number]: boolean}>({});
  const [toggleLoading, setToggleLoading] = useState<{[key: string]: boolean}>({});
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  
  // Custom content creation states
  const [showCreateModuleForm, setShowCreateModuleForm] = useState(false);
  const [showCreateSectionForm, setShowCreateSectionForm] = useState<number | null>(null);
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: '',
    category: '',
    estimatedTime: '',
    difficulty: 'Beginner',
    prerequisites: '',
    learningObjectives: ''
  });
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    order: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      // Use direct fetch since our api/modules.ts file exports aren't working correctly
      const response = await fetch('http://localhost:5015/api/Modules');
      console.log('Modules Response:', response);
      
      if (response.ok) {
        const data = await response.json();
        
        // Sort to show modules with sections first
        const sortedModules = data.sort((a: any, b: any) => {
          const aSections = a.sections?.length || 0;
          const bSections = b.sections?.length || 0;
          
          if (aSections > 0 && bSections === 0) return -1;
          if (bSections > 0 && aSections === 0) return 1;
          return 0;
        });
        
        setModules(sortedModules);
      } else {
        throw new Error(`API call failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      // Set some mock data for demo
      setModules([
        {
          id: 1,
          title: 'ERP Fundamentals',
          description: 'Learn the basics of Enterprise Resource Planning',
          category: 'Finance & Accounting',
          duration: 4,
          difficultyLevel: 1,
          isActive: true,
          sections: []
        },
        {
          id: 2,
          title: 'Procurement Management',
          description: 'Master the procurement process and vendor management',
          category: 'Procurement',
          duration: 6,
          difficultyLevel: 2,
          isActive: true,
          sections: [
            { id: 1, title: 'Introduction to Procurement', isActive: true },
            { id: 2, title: 'Vendor Management', isActive: true }
          ]
        }
      ]);
    }
  };

  // Search functionality
  const filterModules = (query: string, moduleList: any[]) => {
    if (!query.trim()) {
      return moduleList;
    }

    const searchTerm = query.toLowerCase();
    return moduleList.filter((module) => {
      // Search in module title, description, and category
      const moduleMatches = 
        module.title.toLowerCase().includes(searchTerm) ||
        module.description.toLowerCase().includes(searchTerm) ||
        module.category.toLowerCase().includes(searchTerm) ||
        module.difficulty?.toLowerCase().includes(searchTerm) ||
        module.estimatedTime?.toLowerCase().includes(searchTerm);

      // Search in prerequisites and learning objectives if they're arrays
      const prerequisiteMatches = Array.isArray(module.prerequisites) 
        ? module.prerequisites.some((prereq: string) => prereq.toLowerCase().includes(searchTerm))
        : false;

      const objectiveMatches = Array.isArray(module.learningObjectives)
        ? module.learningObjectives.some((objective: string) => objective.toLowerCase().includes(searchTerm))
        : false;

      // Search in sections if they exist
      const sectionMatches = module.sections?.some((section: any) =>
        section.title.toLowerCase().includes(searchTerm) ||
        section.description?.toLowerCase().includes(searchTerm)
      );

      // Search in expanded sections data
      const expandedSectionMatches = sectionsData[module.id]?.some((section: any) =>
        section.title.toLowerCase().includes(searchTerm) ||
        section.description?.toLowerCase().includes(searchTerm)
      );

      return moduleMatches || prerequisiteMatches || objectiveMatches || sectionMatches || expandedSectionMatches;
    });
  };

  // Update filtered modules when search query or modules change
  useEffect(() => {
    setFilteredModules(filterModules(searchQuery, modules));
  }, [searchQuery, modules, sectionsData]);

  // Function to highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleToggleModuleStatus = async (moduleId: number, currentStatus: boolean) => {
    const key = `module-${moduleId}`;
    setToggleLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      await toggleModuleStatus(moduleId, !currentStatus);
      await fetchModules(); // Refresh the modules list
    } catch (error) {
      console.error('Error toggling module status:', error);
    } finally {
      setToggleLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleSectionStatus = async (sectionId: number, currentStatus: boolean, moduleId: number) => {
    const key = `section-${sectionId}`;
    setToggleLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      await toggleSectionStatus(moduleId, sectionId, !currentStatus);
      // Refresh sections for this module
      await toggleSection(moduleId);
      await toggleSection(moduleId);
    } catch (error) {
      console.error('Error toggling section status:', error);
    } finally {
      setToggleLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleSection = async (moduleId: number) => {
    const isExpanded = expandedModules.has(moduleId);
    
    if (isExpanded) {
      setExpandedModules(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    } else {
      setExpandedModules(prev => new Set(prev).add(moduleId));
      
      if (!sectionsData[moduleId]) {
        setLoadingSections(prev => ({ ...prev, [moduleId]: true }));
        try {
          const response = await fetch(`http://localhost:5015/api/Modules/${moduleId}/sections`);
          if (response.ok) {
            const sections = await response.json();
            setSectionsData(prev => ({ ...prev, [moduleId]: sections }));
          }
        } catch (error) {
          console.error('Error fetching sections:', error);
        } finally {
          setLoadingSections(prev => ({ ...prev, [moduleId]: false }));
        }
      }
    }
  };

  // Custom module creation handlers
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newModule = {
        title: moduleFormData.title,
        description: moduleFormData.description,
        category: moduleFormData.category,
        color: '#3B82F6', // Default blue color
        estimatedTime: moduleFormData.estimatedTime,
        difficulty: moduleFormData.difficulty,
        prerequisites: moduleFormData.prerequisites.split(',').map(p => p.trim()).filter(p => p),
        learningObjectives: moduleFormData.learningObjectives.split(',').map(o => o.trim()).filter(o => o),
        order: modules.length + 1,
        erpModuleId: null // This marks it as custom content
      };

      await createModule(newModule);
      
      // Reset form and close
      setModuleFormData({
        title: '',
        description: '',
        category: '',
        estimatedTime: '',
        difficulty: 'Beginner',
        prerequisites: '',
        learningObjectives: ''
      });
      setShowCreateModuleForm(false);
      
      // Refresh modules list
      await fetchModules();
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !showCreateSectionForm) return;

    setIsSubmitting(true);
    try {
      const newSection = {
        title: sectionFormData.title,
        description: sectionFormData.description,
        moduleId: showCreateSectionForm,
        order: sectionFormData.order,
        erpSectionId: null // This marks it as custom content
      };

      await createSection(newSection);
      
      // Reset form and close
      setSectionFormData({
        title: '',
        description: '',
        order: 1
      });
      setShowCreateSectionForm(null);
      
      // Refresh sections for this module
      const response = await fetch(`http://localhost:5015/api/Modules/${showCreateSectionForm}/sections`);
      if (response.ok) {
        const sections = await response.json();
        setSectionsData(prev => ({ ...prev, [showCreateSectionForm]: sections }));
      }
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModuleForm = () => {
    setModuleFormData({
      title: '',
      description: '',
      category: '',
      estimatedTime: '',
      difficulty: 'Beginner',
      prerequisites: '',
      learningObjectives: ''
    });
    setShowCreateModuleForm(false);
  };

  const resetSectionForm = () => {
    setSectionFormData({
      title: '',
      description: '',
      order: 1
    });
    setShowCreateSectionForm(null);
  };

  return (
    <div className="text-sm leading-snug space-y-sm">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold leading-tight text-gray-900">Modules</h1>
          <p className="text-gray-600 mt-xs">Explore comprehensive ERP training modules</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCreateModuleForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Custom Module
            </button>
          )}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-2 py-2 rounded-lg border border-red-200">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Mode</span>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            <strong>Admin Controls:</strong> Use the toggle buttons to enable/disable modules and sections. 
            Modules with sections are shown first for better organization.
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search modules, sections, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search (ESC)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredModules.length === 0 
                ? 'No modules found matching your search.' 
                : `Showing ${filteredModules.length} of ${modules.length} modules`
              }
            </div>
            <div className="text-xs text-gray-500">
              Press ESC to clear
            </div>
          </div>
        )}
        {!searchQuery && (
          <div className="mt-2 text-xs text-gray-500">
            Search by module name, description, category, difficulty, sections, or content
          </div>
        )}
      </div>

      {/* Create Custom Module Modal */}
      {showCreateModuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create Custom Module</h2>
              <button
                onClick={resetModuleForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateModule} className="p-6 space-y-4">
              <div>
                <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Module Title *
                </label>
                <input
                  id="moduleTitle"
                  type="text"
                  value={moduleFormData.title}
                  onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter module title"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="moduleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="moduleDescription"
                  value={moduleFormData.description}
                  onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter module description"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="moduleCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="moduleCategory"
                    value={moduleFormData.category}
                    onChange={(e) => setModuleFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Custom Training">Custom Training</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Inventory Management">Inventory Management</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Project Management">Project Management</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="moduleEstimatedTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Time
                  </label>
                  <input
                    id="moduleEstimatedTime"
                    type="text"
                    value={moduleFormData.estimatedTime}
                    onChange={(e) => setModuleFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 hours"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="moduleDifficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="moduleDifficulty"
                  value={moduleFormData.difficulty}
                  onChange={(e) => setModuleFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="modulePrerequisites" className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisites
                </label>
                <input
                  id="modulePrerequisites"
                  type="text"
                  value={moduleFormData.prerequisites}
                  onChange={(e) => setModuleFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter prerequisites separated by commas"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple prerequisites with commas</p>
              </div>
              
              <div>
                <label htmlFor="moduleLearningObjectives" className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Objectives
                </label>
                <input
                  id="moduleLearningObjectives"
                  type="text"
                  value={moduleFormData.learningObjectives}
                  onChange={(e) => setModuleFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter learning objectives separated by commas"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple objectives with commas</p>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetModuleForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Section Modal */}
      {showCreateSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create Custom Section</h2>
              <button
                onClick={resetSectionForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSection} className="p-6 space-y-4">
              <div>
                <label htmlFor="sectionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title *
                </label>
                <input
                  id="sectionTitle"
                  type="text"
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section title"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="sectionDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="sectionDescription"
                  value={sectionFormData.description}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section description"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="sectionOrder" className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <input
                  id="sectionOrder"
                  type="number"
                  min="1"
                  value={sectionFormData.order}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetSectionForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {filteredModules.map((module) => {
          const IconComponent = moduleCategoryIcons[module.category as keyof typeof moduleCategoryIcons] || Package;
          const isExpanded = expandedModules.has(module.id);
          const sections = sectionsData[module.id] || module.sections || [];
          const isLoadingSections = loadingSections[module.id];
          const moduleToggleLoading = toggleLoading[`module-${module.id}`];
          
          return (
            <div key={module.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${module.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`w-6 h-6 ${module.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${module.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                          {searchQuery ? highlightSearchTerm(module.title, searchQuery) : module.title}
                        </h3>
                        {!module.isActive && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Disabled
                          </span>
                        )}
                        {module.erpModuleId ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            ERP Content
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Custom Content
                          </span>
                        )}
                        {sections.length > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {sections.length} sections
                          </span>
                        )}
                      </div>
                      <p className={`mb-4 ${module.isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {searchQuery ? highlightSearchTerm(module.description, searchQuery) : module.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{module.category}</span>
                        <span>•</span>
                        <span>{module.duration} hours</span>
                        <span>•</span>
                        <span>Level {module.difficultyLevel}</span>
                        {sections.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{sections.length} sections</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleModuleStatus(module.id, module.isActive)}
                        disabled={moduleToggleLoading}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          module.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } ${moduleToggleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {moduleToggleLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : module.isActive ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        {module.isActive ? 'Enabled' : 'Disabled'}
                      </button>
                    )}
                    
                    {sections.length > 0 && (
                      <button
                        onClick={() => toggleSection(module.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>View Sections</span>
                        <ArrowDownToLine className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    
                    {isAdmin && (
                      <button
                        onClick={() => setShowCreateSectionForm(module.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Section</span>
                      </button>
                    )}
                    
                    <Link
                      to={`/modules/${module.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span>Start Learning</span>
                      <ArrowUpFromLine className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {isLoadingSections ? (
                    <div className="p-6 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-600">
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Loading sections...
                      </div>
                    </div>
                  ) : sections.length > 0 ? (
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Module Sections</h4>
                      <div className="grid gap-3">
                        {sections.map((section: any, index: number) => {
                          const sectionToggleLoading = toggleLoading[`section-${section.id}`];
                          
                          return (
                            <div key={section.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                  {index + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className={`font-medium ${section.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                      {searchQuery ? highlightSearchTerm(section.title, searchQuery) : section.title}
                                    </h5>
                                    {section.erpSectionId ? (
                                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                                        ERP
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm ${section.isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {searchQuery ? highlightSearchTerm(section.description || '', searchQuery) : section.description}
                                  </p>
                                </div>
                                {!section.isActive && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                    Disabled
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {isAdmin && (
                                  <button
                                    onClick={() => handleToggleSectionStatus(section.id, section.isActive, module.id)}
                                    disabled={sectionToggleLoading}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      section.isActive 
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    } ${sectionToggleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {sectionToggleLoading ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : section.isActive ? (
                                      <ToggleRight className="w-4 h-4" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4" />
                                    )}
                                    {section.isActive ? 'Enabled' : 'Disabled'}
                                  </button>
                                )}
                                
                                <Link
                                  to={`/sections/${section.id}`}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  <span>Start</span>
                                  <ArrowUpFromLine className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No sections available for this module.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules available</h3>
          <p className="text-gray-600">Check back later for new training modules.</p>
        </div>
      )}

      {modules.length > 0 && filteredModules.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules found</h3>
          <p className="text-gray-600">
            No modules match your search for "{searchQuery}". 
            <button 
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-700 ml-1 underline"
            >
              Clear search
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default ModulesPage;
