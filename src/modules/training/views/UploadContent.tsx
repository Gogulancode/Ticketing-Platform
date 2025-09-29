import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Image, Link, X, Plus, Video, ChevronDown, Users, User, Shield } from 'lucide-react';
import { getModules, getSectionsByModule } from '../../../shared/lib/api';
import { getModulesDirect, getSectionsByModuleDirect } from '../../../shared/lib/api';
import { uploadContent, UploadedContent } from '../../../shared/services/api/uploadedContent';
// Replace previous roles API import with unified backend roles fetch
import { getRoles as fetchCoreRoles } from '../../../shared/lib/api';
import { Module, Section } from '../types';
import RecentUploads from '../components/RecentUploads';

const UploadContent: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    module: '', // Keep as string for form handling
    section: '', // Keep as string for form handling
    description: '',
    scribeLink: '',
    videoUrl: '',
    contentType: 'document',
    tags: [] as string[],
    accessRoles: [] as string[],
    accessUsers: [] as string[],
    accessType: 'roles' as 'roles' | 'users' | 'both',
    lessonIndex: 1
  });
  
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [document, setDocument] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');

  // Load modules and sections on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('UploadContent: Starting to load modules...');
        
        // Try direct API call first (most reliable)
        try {
          console.log('UploadContent: Trying direct API call...');
          const directData = await getModulesDirect();
          console.log('UploadContent: Direct API success:', {
            dataLength: directData?.length,
            firstModule: directData?.[0]
          });
          
          if (Array.isArray(directData) && directData.length > 0) {
            console.log('UploadContent: Setting modules from direct API');
            setModules(directData);
            setLoading(false);
            return;
          }
        } catch (directError) {
          console.error('UploadContent: Direct API call failed:', directError);
        }
        
        // Fallback to wrapped API call
        try {
          console.log('UploadContent: Trying wrapped API call...');
          const modulesData = await getModules();
          console.log('UploadContent: Wrapped API result:', modulesData);
          
          setModules(modulesData || []);
        } catch (wrappedError) {
          console.error('UploadContent: Wrapped API call failed:', wrappedError);
          setModules([]);
        }
        
      } catch (error) {
        console.error('UploadContent: Error loading modules:', error);
        setModules([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load sections when module changes
  useEffect(() => {
    const loadSections = async () => {
      if (!formData.module) {
        console.log('No module selected, clearing sections');
        setSections([]);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Loading sections for module:', formData.module);
        const moduleId = parseInt(formData.module);
        
        // Try direct API first
        try {
          const sectionsData = await getSectionsByModuleDirect(moduleId);
          console.log('Direct sections API success:', sectionsData);
          setSections(sectionsData || []);
          return;
        } catch (directError) {
          console.error('Direct sections API failed:', directError);
        }
        
        // Fallback to wrapped API
        const sectionsData = await getSectionsByModule(moduleId);
        console.log('Wrapped sections API result:', sectionsData);
        setSections(sectionsData || []);
      } catch (error) {
        console.error('Error loading sections:', error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [formData.module]);

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    department?: string;
  }[]>([]);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  // Search terms for filtering roles and users in assignment UI
  const [roleSearch, setRoleSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Load roles and initial users
  useEffect(() => {
    const load = async () => {
      try {
        const roleData = await fetchCoreRoles();
        let activeNames: string[] = [];
        if (Array.isArray(roleData)) {
          activeNames = roleData
            .filter((r: any) => r.isActive !== false) // treat undefined as active
            .map((r: any) => r.name);
        } else if (roleData?.roles) {
          activeNames = roleData.roles
            .filter((r: any) => r.isActive !== false)
            .map((r: any) => r.name);
        }
        // Deduplicate & sort
        const dedup = Array.from(new Set(activeNames)).sort((a,b)=>a.localeCompare(b));
        setAvailableRoles(dedup);
      } catch (e) {
        console.error('Failed to load roles', e);
      }
      try {
        const res = await fetch('http://localhost:5015/api/users?pageSize=500');
        const data = await res.json();
        const userArr = Array.isArray(data) ? data : (data.users || []);
        setAvailableUsers(userArr.filter((u: any) => u.isActive));
      } catch (e) {
        console.error('Failed to load users', e);
      }
    };
    load();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.roles-dropdown')) {
        setShowRolesDropdown(false);
      }
      if (!target.closest('.users-dropdown')) {
        setShowUsersDropdown(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => {
        window.document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, []);

  // Sections are already filtered by module in the state
  const availableSections = sections || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Reset section when module changes
      ...(name === 'module' && { section: '' })
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      accessRoles: prev.accessRoles.includes(role)
        ? prev.accessRoles.filter(r => r !== role)
        : [...prev.accessRoles, role]
    }));
  };

  // Handle user selection
  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      accessUsers: prev.accessUsers.includes(userId)
        ? prev.accessUsers.filter(u => u !== userId)
        : [...prev.accessUsers, userId]
    }));
  };

  // Handle access type change
  const handleAccessTypeChange = (type: 'roles' | 'users' | 'both') => {
    setFormData(prev => ({
      ...prev,
      accessType: type,
      // Clear selections when switching types
      ...(type === 'roles' ? { accessUsers: [] } : {}),
      ...(type === 'users' ? { accessRoles: [] } : {})
    }));
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setScreenshots(prev => [...prev, ...files]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDocument(file);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      alert('Please enter a title for the content.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Please enter a description for the content.');
      return;
    }
    
    if (!formData.module) {
      alert('Please select a module.');
      return;
    }
    
    try {
      // Prepare the content data
      const contentData: UploadedContent = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.description.trim(), // Use description as content for now
        type: (formData.contentType.charAt(0).toUpperCase() + formData.contentType.slice(1)) as 'Document' | 'Video' | 'Image' | 'Interactive',
        moduleId: parseInt(formData.module),
        sectionId: formData.section ? parseInt(formData.section) : undefined,
        lessonId: formData.lessonIndex || undefined,
        tags: formData.tags,
        accessRoles: formData.accessRoles,
        scribeLink: formData.scribeLink?.trim() || undefined,
        videoUrl: formData.videoUrl?.trim() || undefined,
        // Add required fields for backend
        filePath: '',
        fileName: '',
        fileSize: 0,
        contentType: 'application/json',
        uploadedById: 'current-user', // TODO: Get from auth context
        isActive: true,
      };

      console.log('Submitting content:', contentData);
      
      const result = await uploadContent(contentData);
      console.log('Content uploaded successfully:', result);
      
      // Show success message with navigation option
      const userConfirmed = window.confirm(
        '🎉 Content created successfully! Would you like to view it in the module page?'
      );
      
      if (userConfirmed && formData.module) {
        // Navigate to the module page to view the uploaded content
        navigate(`/modules/${formData.module}/sections`);
      } else {
        // Reset form if user chooses to stay
        setFormData({
          title: '',
          module: '',
          section: '',
          description: '',
          scribeLink: '',
          videoUrl: '',
          tags: [],
          contentType: 'document',
          accessType: 'roles',
          accessRoles: [],
          accessUsers: [],
          lessonIndex: 1
        });
      }
      
      setScreenshots([]);
      setDocument(null);
      
    } catch (error) {
      console.error('Error uploading content:', error);
      alert(`Failed to upload content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-600 mt-2">
          Create and manage comprehensive training content including interactive guides, videos, documents, 
          and multimedia with advanced access control and rich metadata
        </p>
        
        {/* Feature Highlights */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Interactive Guides</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Scribe integration with step-by-step tutorials</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Video className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Video Content</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Embedded players and multi-media support</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Access Control</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">Role-based and user-specific permissions</p>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Image className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">Rich Metadata</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">Lesson indexing and content categorization</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading modules and sections...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter content title"
              />
            </div>

            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                ERP Module * {modules.length > 0 && `(${modules.length} available)`}
              </label>
              <select
                id="module"
                name="module"
                required
                value={formData.module}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {modules.length === 0 ? 'Loading modules...' : 'Select a module'}
                </option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>{module.title}</option>
                ))}
              </select>
              {modules.length === 0 && !loading && (
                <p className="text-xs text-orange-600 mt-1">No modules found. Check API connection.</p>
              )}
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                Section * {sections.length > 0 && `(${sections.length} available)`}
              </label>
              <select
                id="section"
                name="section"
                required
                value={formData.section}
                onChange={handleInputChange}
                disabled={!formData.module}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.module 
                    ? 'Select a module first' 
                    : sections.length === 0 
                      ? 'Loading sections...' 
                      : 'Select a section'
                  }
                </option>
                {availableSections.map(section => (
                  <option key={section.id} value={section.id}>{section.title}</option>
                ))}
              </select>
              {!formData.module && (
                <p className="text-xs text-gray-500 mt-1">Please select a module first</p>
              )}
              {formData.module && sections.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">No sections found for this module</p>
              )}
            </div>
          </div>
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="lessonIndex" className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Index
              </label>
              <input
                type="number"
                id="lessonIndex"
                name="lessonIndex"
                min="1"
                value={formData.lessonIndex}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lesson order (1, 2, 3...)"
              />
              <p className="text-xs text-gray-500 mt-1">Order in which this lesson appears in the section</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={formData.contentType || 'document'}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, contentType: e.target.value }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="document">📄 Document/Text - PDF, Word docs, written materials</option>
                <option value="video">🎥 Video Content - Training videos with embedded players</option>
                <option value="interactive">🎯 Interactive Guide - Step-by-step Scribe tutorials</option>
                <option value="image">🖼️ Image/Screenshots - Visual aids and diagrams</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                <strong>Interactive Guides:</strong> Create engaging step-by-step tutorials with Scribe integration that capture screenshots and provide guided walkthroughs for complex ERP processes
              </p>
            </div>
          </div>


          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the training content and its purpose"
            />
          </div>
        </div>

        {/* File Uploads */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
          
          {/* Dynamic Upload Section Based on Content Type */}
          {formData.contentType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📄 Document Upload (PDF or Word)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="document"
                />
                <label htmlFor="document" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Click to upload document</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 50MB</p>
                </label>
              </div>
              
              {document && (
                <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700">{document.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocument(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {formData.contentType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎥 Video Files & Supporting Materials
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="video/*,image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="video-files"
                />
                <label htmlFor="video-files" className="cursor-pointer">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Click to upload video files or supporting images</p>
                  <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI, PNG, JPG up to 100MB each</p>
                </label>
              </div>
              
              {screenshots.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        {file.type.startsWith('video/') ? (
                          <Video className="h-8 w-8 text-gray-400" />
                        ) : (
                          <Image className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.contentType === 'interactive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Interactive Guide Screenshots
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="interactive-screenshots"
                />
                <label htmlFor="interactive-screenshots" className="cursor-pointer">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Upload screenshots for the interactive guide</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
                </label>
              </div>
              
              {screenshots.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.contentType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🖼️ Image & Screenshot Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="image-uploads"
                />
                <label htmlFor="image-uploads" className="cursor-pointer">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Upload images, diagrams, and visual aids</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, SVG up to 25MB each</p>
                </label>
              </div>
              
              {screenshots.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div className="space-y-6">
            {/* Scribe Link */}
            {(formData.contentType === 'interactive' || !formData.contentType) && (
            <div>
              <label htmlFor="scribeLink" className="block text-sm font-medium text-gray-700 mb-2">
                Scribe Link (for Interactive Guides)
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  id="scribeLink"
                  name="scribeLink"
                  value={formData.scribeLink}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://scribe.com/..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Link to your Scribe interactive guide</p>
            </div>
            )}

            {/* Video URL */}
            {(formData.contentType === 'video' || !formData.contentType) && (
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL (for Video Content)
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/embed/... or https://vimeo.com/..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">YouTube embed URL, Vimeo URL, or direct video link</p>
            </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Access Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Access Control</label>
              
              {/* Access Type Selection */}
              <div className="mb-4">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accessType"
                      value="roles"
                      checked={formData.accessType === 'roles'}
                      onChange={() => handleAccessTypeChange('roles')}
                      className="mr-2"
                    />
                    <Shield className="h-4 w-4 mr-1" />
                    Assign to Roles
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accessType"
                      value="users"
                      checked={formData.accessType === 'users'}
                      onChange={() => handleAccessTypeChange('users')}
                      className="mr-2"
                    />
                    <User className="h-4 w-4 mr-1" />
                    Assign to Individual Users
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accessType"
                      value="both"
                      checked={formData.accessType === 'both'}
                      onChange={() => handleAccessTypeChange('both')}
                      className="mr-2"
                    />
                    <Users className="h-4 w-4 mr-1" />
                    Assign to Both
                  </label>
                </div>
              </div>

              {/* Roles Section */}
              {(formData.accessType === 'roles' || formData.accessType === 'both') && (
                <div className="mb-4">
                  <div className="relative roles-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowRolesDropdown(!showRolesDropdown)}
                      className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-gray-500" />
                        {formData.accessRoles.length > 0 
                          ? `${formData.accessRoles.length} role(s) selected`
                          : 'Select roles...'
                        }
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showRolesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showRolesDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 border-b bg-gray-50 sticky top-0">
                            <input
                              type="text"
                              value={roleSearch}
                              onChange={e => setRoleSearch(e.target.value)}
                              placeholder="Search roles..."
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <div className="flex gap-2 mt-2">
                              <button type="button" onClick={() => formData.accessRoles.length !== availableRoles.length && setFormData(prev => ({...prev, accessRoles: availableRoles}))} className="flex-1 text-xs px-2 py-1 border rounded hover:bg-white">Select All</button>
                              <button type="button" onClick={() => setFormData(prev => ({...prev, accessRoles: []}))} className="flex-1 text-xs px-2 py-1 border rounded hover:bg-white">Clear</button>
                            </div>
                          </div>
                          <div className="p-2">
                            {availableRoles
                              .filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()))
                              .map(role => (
                                <label
                                  key={role}
                                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.accessRoles.includes(role)}
                                    onChange={() => handleRoleToggle(role)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                  />
                                  <span className="text-sm text-gray-700">{role}</span>
                                </label>
                              ))}
                            {availableRoles.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase())).length === 0 && (
                              <div className="text-xs text-gray-500 p-2">No roles match search.</div>
                            )}
                          </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Roles Display */}
                  {formData.accessRoles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.accessRoles.map(role => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => handleRoleToggle(role)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Section */}
              {(formData.accessType === 'users' || formData.accessType === 'both') && (
                <div className="mb-4">
                  <div className="relative users-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowUsersDropdown(!showUsersDropdown)}
                      className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {formData.accessUsers.length > 0 
                          ? `${formData.accessUsers.length} user(s) selected`
                          : 'Select users...'
                        }
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showUsersDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showUsersDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 border-b bg-gray-50 sticky top-0">
                            <input
                              type="text"
                              value={userSearch}
                              onChange={e => setUserSearch(e.target.value)}
                              placeholder="Search users..."
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <div className="flex gap-2 mt-2">
                              <button type="button" onClick={() => setFormData(prev => ({...prev, accessUsers: availableUsers.map(u=>u.id)}))} className="flex-1 text-xs px-2 py-1 border rounded hover:bg-white">Select All</button>
                              <button type="button" onClick={() => setFormData(prev => ({...prev, accessUsers: []}))} className="flex-1 text-xs px-2 py-1 border rounded hover:bg-white">Clear</button>
                            </div>
                          </div>
                          <div className="p-2">
                            {availableUsers
                              .filter(user => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(userSearch.toLowerCase()))
                              .map(user => (
                                <label
                                  key={user.id}
                                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.accessUsers.includes(user.id)}
                                    onChange={() => handleUserToggle(user.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {user.email} {user.department && `• ${user.department}`}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            {availableUsers.filter(user => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                              <div className="text-xs text-gray-500 p-2">No users match search.</div>
                            )}
                          </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Users Display */}
                  {formData.accessUsers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.accessUsers.map(userId => {
                        const user = availableUsers.find(u => u.id === userId);
                        return user ? (
                          <span
                            key={userId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {user.firstName} {user.lastName}
                            <button
                              type="button"
                              onClick={() => handleUserToggle(userId)}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Upload className="h-4 w-4 mr-2 inline" />
            Create Content
          </button>
        </div>
      </form>
      )}
      
      {/* Recent Uploads Section */}
      <div className="mt-8">
        <RecentUploads modules={modules} />
      </div>
    </div>
  );
};

export default UploadContent;