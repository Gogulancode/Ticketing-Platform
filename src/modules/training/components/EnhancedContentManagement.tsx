import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  FileText, 
  Video, 
  Image, 
  Link, 
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  Clock,
  User
} from 'lucide-react';

// Types for Enhanced Content
interface EnhancedContent {
  id: number;
  title: string;
  description?: string;
  contentType: 'Text' | 'Video' | 'Image' | 'Document' | 'Interactive';
  content: string;
  metadata?: string;
  estimatedReadTime?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  moduleId?: number;
  sectionId?: number;
  orderIndex: number;
}

interface CreateContentRequest {
  title: string;
  description?: string;
  contentType: string;
  content: string;
  metadata?: string;
  estimatedReadTime?: number;
  difficulty: string;
  tags?: string;
  isPublished: boolean;
  moduleId?: number;
  sectionId?: number;
  orderIndex: number;
}

const EnhancedContentManagement: React.FC = () => {
  const [contents, setContents] = useState<EnhancedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedContent, setSelectedContent] = useState<EnhancedContent | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateContentRequest>({
    title: '',
    description: '',
    contentType: 'Text',
    content: '',
    metadata: '',
    estimatedReadTime: 5,
    difficulty: 'Beginner',
    tags: '',
    isPublished: false,
    orderIndex: 999
  });

  useEffect(() => {
    loadContents();
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'Admin' || user.role === 'QA');
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      // const data = await enhancedContentApi.getAllContents();
      
      // Mock data for demonstration
      const mockContents: EnhancedContent[] = [
        {
          id: 1,
          title: 'Introduction to Shipping Regulations',
          description: 'Comprehensive overview of international shipping regulations',
          contentType: 'Text',
          content: '<h2>Shipping Regulations Overview</h2><p>This lesson covers the fundamental shipping regulations...</p>',
          estimatedReadTime: 15,
          difficulty: 'Beginner',
          tags: 'regulations,shipping,compliance',
          isPublished: true,
          createdBy: 'John Doe',
          createdAt: '2024-01-15T10:00:00Z',
          orderIndex: 1
        },
        {
          id: 2,
          title: 'Container Safety Procedures',
          description: 'Safety protocols for container handling',
          contentType: 'Video',
          content: 'https://example.com/safety-video.mp4',
          estimatedReadTime: 20,
          difficulty: 'Intermediate',
          tags: 'safety,containers,procedures',
          isPublished: true,
          createdBy: 'Jane Smith',
          createdAt: '2024-01-16T14:30:00Z',
          orderIndex: 2
        }
      ];
      
      setContents(mockContents);
      setError(null);
    } catch (err) {
      setError('Failed to load content');
      console.error('Content loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = () => {
    setSelectedContent(null);
    setFormData({
      title: '',
      description: '',
      contentType: 'Text',
      content: '',
      metadata: '',
      estimatedReadTime: 5,
      difficulty: 'Beginner',
      tags: '',
      isPublished: false,
      orderIndex: 999
    });
    setShowEditor(true);
  };

  const handleEditContent = (content: EnhancedContent) => {
    setSelectedContent(content);
    setFormData({
      title: content.title,
      description: content.description || '',
      contentType: content.contentType,
      content: content.content,
      metadata: content.metadata || '',
      estimatedReadTime: content.estimatedReadTime || 5,
      difficulty: content.difficulty,
      tags: content.tags || '',
      isPublished: content.isPublished,
      moduleId: content.moduleId,
      sectionId: content.sectionId,
      orderIndex: content.orderIndex
    });
    setShowEditor(true);
  };

  const handleSaveContent = async () => {
    try {
      if (selectedContent) {
        // Update existing content
        console.log('Updating content:', formData);
      } else {
        // Create new content
        console.log('Creating content:', formData);
      }
      
      setShowEditor(false);
      await loadContents();
    } catch (err) {
      console.error('Failed to save content:', err);
      alert('Failed to save content');
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      console.log('Deleting content:', contentId);
      await loadContents();
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert('Failed to delete content');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Video className="h-4 w-4" />;
      case 'Image': return <Image className="h-4 w-4" />;
      case 'Document': return <FileText className="h-4 w-4" />;
      case 'Interactive': return <Link className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesType = filterType === 'all' || content.contentType === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || content.difficulty === filterDifficulty;
    const matchesSearch = searchTerm === '' || 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.description && content.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (content.tags && content.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesDifficulty && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <BookOpen className="h-8 w-8 mr-3" />
              Enhanced Content Management
            </h1>
            <p className="text-gray-600">Create and manage rich learning content with multimedia support</p>
          </div>
          
          {isAdmin && (
            <button
              onClick={handleCreateContent}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="Text">Text</option>
                <option value="Video">Video</option>
                <option value="Image">Image</option>
                <option value="Document">Document</option>
                <option value="Interactive">Interactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterDifficulty('all');
                  setSearchTerm('');
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Found</h3>
              <p className="text-gray-600">
                {contents.length === 0 
                  ? "No content has been created yet."
                  : "No content matches your current filters."
                }
              </p>
            </div>
          ) : (
            filteredContents.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      {getContentTypeIcon(content.contentType)}
                      <span className="text-sm text-gray-600">{content.contentType}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {content.isPublished ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {content.title}
                  </h3>

                  {content.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {content.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {content.estimatedReadTime}m
                      </span>
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {content.createdBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(content.difficulty)}`}>
                      {content.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {content.tags && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {content.tags.split(',').slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag.trim()}
                          </span>
                        ))}
                        {content.tags.split(',').length > 3 && (
                          <span className="text-xs text-gray-500">+{content.tags.split(',').length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEditContent(content)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      content.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {content.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Content Editor Modal */}
      {showEditor && (
        <ContentEditorModal
          content={selectedContent}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveContent}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

// Content Editor Modal Component
interface ContentEditorModalProps {
  content?: EnhancedContent | null;
  formData: CreateContentRequest;
  setFormData: (data: CreateContentRequest) => void;
  onSave: () => void;
  onClose: () => void;
}

const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  content,
  formData,
  setFormData,
  onSave,
  onClose
}) => {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {content ? 'Edit Content' : 'Create New Content'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({...formData, contentType: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Text">Text</option>
                <option value="Video">Video</option>
                <option value="Image">Image</option>
                <option value="Document">Document</option>
                <option value="Interactive">Interactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Brief description of the content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            {formData.contentType === 'Text' ? (
              <textarea
                rows={10}
                required
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter your content here. You can use HTML for rich formatting..."
              />
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder={`Enter ${formData.contentType.toLowerCase()} URL...`}
                />
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Or upload a file</span>
                  <input
                    type="file"
                    className="text-sm text-gray-600"
                    accept={formData.contentType === 'Video' ? 'video/*' : formData.contentType === 'Image' ? 'image/*' : '*/*'}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
              <input
                type="number"
                min="1"
                value={formData.estimatedReadTime}
                onChange={(e) => setFormData({...formData, estimatedReadTime: parseInt(e.target.value) || 5})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Index</label>
              <input
                type="number"
                min="0"
                value={formData.orderIndex}
                onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 999})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="shipping, safety, regulations, compliance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
            <textarea
              rows={3}
              value={formData.metadata}
              onChange={(e) => setFormData({...formData, metadata: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder='{"author": "John Doe", "version": "1.0", "keywords": ["shipping", "safety"]}'
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : (content ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedContentManagement;
