import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  FileText,
  Clock,
  BookOpen,
  Settings
} from 'lucide-react';
import { getModule, getSectionsByModule, deleteSection } from '../lib/api';
import { Module, Section } from '../types';

export default function ModuleSections() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (moduleId) {
      loadModuleAndSections();
    }
  }, [moduleId]);

  const loadModuleAndSections = async () => {
    try {
      setLoading(true);
      const [moduleData, sectionsData] = await Promise.all([
        getModule(moduleId),
        getSectionsByModule(moduleId)
      ]);
      setModule(moduleData);
      setSections(sectionsData);
    } catch (err) {
      setError('Failed to load module and sections');
      console.error('Error loading module and sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await deleteSection(sectionId);
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Failed to delete section');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading sections..." />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Module not found'}</p>
          <Link to="/modules" className="text-blue-600 hover:text-blue-800">
            ← Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/modules"
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Modules
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
                  <p className="text-gray-600">{module.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {sections.length} sections
                </span>
                <Link
                  to={`/modules/${moduleId}/sections/new`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Estimated Time</p>
                <p className="font-medium">{module.estimatedTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="font-medium">{module.difficulty}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{module.category}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">ERP Module ID</p>
                <p className="font-medium">{module.erpModuleId || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sections List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Sections</h2>
            <p className="text-sm text-gray-600">Manage the sections for this module</p>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No sections found for this module</p>
              <Link
                to={`/modules/${moduleId}/sections/new`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Section
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sections.map((section) => (
                <div key={section.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {section.order}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {section.title}
                          </h3>
                          <p className="text-gray-600">{section.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">
                              {section.lessons?.length || 0} lessons
                            </span>
                            {section.erpSectionId && (
                              <span className="text-sm text-gray-500">
                                ERP ID: {section.erpSectionId}
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              section.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {section.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/modules/${moduleId}/sections/${section.id}/lessons`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Lessons"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/modules/${moduleId}/sections/${section.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Section"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
