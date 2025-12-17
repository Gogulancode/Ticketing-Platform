import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Paperclip, XCircle, Loader2, CheckCircle, AlertCircle, Wand2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  isActive: boolean;
}

interface Department {
  id: number;
  name: string;
  isActive: boolean;
}

interface PriorityLevel {
  id: number;
  name: string;
  level: number;
  isActive: boolean;
}

interface QuickTemplate {
  id: number;
  label: string;
  titleTemplate: string;
  descriptionTemplate: string;
  categoryId?: number;
  priority: number;
  isActive: boolean;
}

interface CustomField {
  id: number;
  label: string;
  type: string;
  isRequired: boolean;
  placeholder?: string;
  options?: string[];
  displayOrder?: number;
  isActive?: boolean;
}

export default function NewTicket() {
  const navigate = useNavigate();
  const { serverUrl, token, user } = useAuthStore();
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState(2);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | number | string[]>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Settings data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<SubCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [priorities, setPriorities] = useState<PriorityLevel[]>([]);
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (categoryId) {
      const catIdNum = parseInt(categoryId);
      const filtered = subcategories.filter(s => s.categoryId === catIdNum && s.isActive !== false);
      setFilteredSubcategories(filtered);
      if (subcategoryId && !filtered.some(s => s.id === parseInt(subcategoryId))) {
        setSubcategoryId('');
      }
    } else {
      setFilteredSubcategories([]);
      setSubcategoryId('');
    }
  }, [categoryId, subcategories]);

  useEffect(() => {
    if (categoryId && subcategoryId) {
      loadCustomFields(parseInt(categoryId), parseInt(subcategoryId));
    } else {
      setCustomFields([]);
      setCustomFieldValues({});
    }
  }, [categoryId, subcategoryId]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [catRes, subRes, deptRes, prioRes, templatesRes] = await Promise.all([
        fetch(`${serverUrl}/api/tickets/settings/categories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/subcategories`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/departments`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/priorities`, { headers }),
        fetch(`${serverUrl}/api/tickets/settings/quick-templates`, { headers }),
      ]);

      let loadedDepartments: Department[] = [];
      
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories((data || []).filter((c: Category) => c.isActive !== false));
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubcategories((data || []).filter((s: SubCategory) => s.isActive !== false));
      }
      if (deptRes.ok) {
        const data = await deptRes.json();
        // Handle API response format: { value: [...] } or direct array
        const deptList = data.value || data || [];
        loadedDepartments = (deptList || []).filter((d: Department) => d.isActive !== false);
        setDepartments(loadedDepartments);
        
        // Pre-select user's department if available
        if (user?.department && loadedDepartments.length > 0) {
          const userDepartment = loadedDepartments.find(
            (dept: Department) => dept.name.toLowerCase() === user.department?.toLowerCase()
          );
          if (userDepartment) {
            setDepartmentId(userDepartment.id.toString());
            console.log('✅ Pre-selected department:', userDepartment.name);
          }
        }
      }
      if (prioRes.ok) {
        const data = await prioRes.json();
        const active = (data || []).filter((p: PriorityLevel) => p.isActive !== false);
        setPriorities(active.sort((a: PriorityLevel, b: PriorityLevel) => a.level - b.level));
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setQuickTemplates((data || []).filter((t: QuickTemplate) => t.isActive !== false));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadCustomFields = async (catId: number, subId: number) => {
    try {
      const response = await fetch(
        `${serverUrl}/api/tickets/settings/custom-fields?categoryId=${catId}&subcategoryId=${subId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const active = (data || [])
          .filter((f: CustomField) => f.isActive !== false)
          .sort((a: CustomField, b: CustomField) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setCustomFields(active);
      }
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    }
  };

  const handleQuickTemplate = (template: QuickTemplate) => {
    setTitle(template.titleTemplate);
    setDescription(template.descriptionTemplate);
    setPriority(template.priority);
    if (template.categoryId) {
      setCategoryId(template.categoryId.toString());
    }
  };

  const handleEnhance = async () => {
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please write at least 10 characters');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch(`${serverUrl}/api/ai/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: description,
          context: 'ticket description',
          tone: 'professional',
          fixGrammar: true,
          improveClarity: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.enhancedText) {
          setDescription(result.enhancedText);
          toast.success('✨ Description enhanced!');
        }
      }
    } catch (err) {
      toast.error('Failed to enhance');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxSize = 10 * 1024 * 1024;
    const oversized = newFiles.filter(f => f.size > maxSize);

    if (oversized.length > 0) {
      toast.error(`Files too large: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    if (attachments.length + newFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setAttachments(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCustomFieldChange = (fieldId: number, value: string | number | string[]) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId.toString()]: value }));
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id.toString()];

    switch (field.type) {
      case 'select':
        return (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        );
      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please fill in title and description');
      return;
    }

    if (!categoryId || !subcategoryId || !departmentId) {
      setError('Please select category, subcategory, and department');
      return;
    }

    const requiredFields = customFields.filter(f => f.isRequired);
    const missingFields = requiredFields.filter(f => {
      const value = customFieldValues[f.id.toString()];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const attachmentPromises = attachments.map(async (file) => {
        return new Promise<{ fileName: string; contentType: string; base64Content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              base64Content: base64,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const attachmentData = await Promise.all(attachmentPromises);

      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        category: 0,
        categoryId: parseInt(categoryId),
        subcategoryId: parseInt(subcategoryId),
        departmentId: parseInt(departmentId),
        customFieldValues: customFieldValues,
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      };

      const response = await fetch(`${serverUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success('Ticket created successfully!');
        
        // Show desktop notification
        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification({
            title: 'Ticket Created',
            body: `Your ticket "${title}" has been submitted successfully.`
          });
        }
        
        navigate('/my-tickets');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `Failed to create ticket (${response.status})`);
      }
    } catch (err) {
      setError('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formProgress = (() => {
    const fields = ['title', 'description', 'categoryId', 'subcategoryId', 'departmentId'];
    const values = { title, description, categoryId, subcategoryId, departmentId };
    const completed = fields.filter(f => (values as any)[f]?.trim()).length;
    return Math.round((completed / fields.length) * 100);
  })();

  if (isLoadingSettings) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Create New Ticket</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all duration-300"
                  style={{ width: `${formProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{formProgress}%</span>
              {formProgress === 100 && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Quick Templates */}
          {quickTemplates.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Templates</h3>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.slice(0, 4).map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleQuickTemplate(template)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || description.trim().length < 10}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                AI Enhance
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about your issue..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              required
            />
          </div>

          {/* Category & Subcategory */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!categoryId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Select subcategory</option>
                  {filteredSubcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Department & Priority */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {priorities.length > 0 ? (
                    priorities.map(p => (
                      <option key={p.id} value={p.level}>{p.name}</option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                      <option value={4}>Critical</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Additional Information</h3>
              <div className="space-y-4">
                {customFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="flex items-center gap-2 mb-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4" />
                Add Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </label>
              <span className="text-xs text-gray-500">Max 5 files, 10MB each</span>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formProgress < 100}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
