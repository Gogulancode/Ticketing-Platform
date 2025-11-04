import React, { useState } from 'react';
import { 
  Users,
  Building,
  Tag,
  AlertCircle,
  ChevronDown,
  Star,
  Clock,
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTicketAssignment } from '../hooks/useTicketAssignment';

interface EnhancedTicketFormProps {
  onSubmit: (ticketData: any) => void;
  isLoading?: boolean;
}

const EnhancedTicketForm: React.FC<EnhancedTicketFormProps> = ({ 
  onSubmit, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: '',
    categoryId: '',
    subcategoryId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assignedAgentId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAgentRecommendations, setShowAgentRecommendations] = useState(false);

  const {
    departments,
    availableCategories,
    availableSubcategories,
    recommendedAgents,
    allAvailableAgents,
    groupStats,
    loading: assignmentLoading
  } = useTicketAssignment(formData.departmentId, formData.categoryId, formData.subcategoryId);

  // Get estimated resolution time
  const estimatedResolutionTime = availableCategories
    .find(c => c.id === formData.categoryId)?.estimatedResolutionTime;

  // Get subcategory info
  const selectedSubcategory = availableSubcategories
    .find(s => s.id === formData.subcategoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.subcategoryId) newErrors.subcategoryId = 'Subcategory is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Include recommended agent if available
    const recommendedAgent = recommendedAgents[0];
    const ticketData = {
      ...formData,
      recommendedAgentId: recommendedAgent?.agent.id,
      estimatedResolutionTime
    };

    onSubmit(ticketData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-red-700 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Create New Ticket</h2>
        <p className="text-sm text-gray-600 mt-1">
          Please provide details about your issue. We'll recommend the best agent based on your selections.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Brief description of your issue"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Department Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-2" />
            Your Department *
          </label>
          <div className="relative">
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                departmentId: e.target.value,
                categoryId: '', // Reset category when department changes
                subcategoryId: '',
                assignedAgentId: ''
              }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                errors.departmentId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select your department</option>
              {departments.filter(d => d.isActive).map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.departmentId && <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>}
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Issue Category *
            </label>
            <div className="relative">
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  categoryId: e.target.value,
                  subcategoryId: '', // Reset subcategory when category changes
                  assignedAgentId: ''
                }))}
                disabled={!formData.departmentId || assignmentLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                  errors.categoryId ? 'border-red-300' : 'border-gray-300'
                } ${!formData.departmentId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select category</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Issue *
            </label>
            <div className="relative">
              <select
                value={formData.subcategoryId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, subcategoryId: e.target.value }));
                  setShowAgentRecommendations(true);
                }}
                disabled={!formData.categoryId || assignmentLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                  errors.subcategoryId ? 'border-red-300' : 'border-gray-300'
                } ${!formData.categoryId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select specific issue</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.subcategoryId && <p className="mt-1 text-sm text-red-600">{errors.subcategoryId}</p>}
            
            {/* Show subcategory info */}
            {selectedSubcategory && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedSubcategory.priority)}`}>
                    {selectedSubcategory.priority.charAt(0).toUpperCase() + selectedSubcategory.priority.slice(1)} Priority
                  </span>
                  {estimatedResolutionTime && (
                    <span className="flex items-center text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      ~{estimatedResolutionTime}h resolution
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{selectedSubcategory.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Priority Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['low', 'medium', 'high', 'urgent'].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: priority as any }))}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.priority === priority 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-xs font-medium ${getPriorityColor(priority)} px-2 py-1 rounded-full`}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={12}
            className={`w-full px-3 py-2 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Please provide detailed information about your issue..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Agent Recommendations */}
        {showAgentRecommendations && recommendedAgents.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Recommended Agents ({recommendedAgents.length})
            </h3>
            
            <div className="space-y-3">
              {recommendedAgents.slice(0, 3).map((rec, index) => (
                <div 
                  key={rec.agent.id}
                  className={`p-3 bg-white border rounded-lg ${
                    index === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {index === 0 && <Star className="w-4 h-4 text-green-600" />}
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {rec.agent.name}
                          {index === 0 && <span className="ml-2 text-xs text-green-600 font-bold">BEST MATCH</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rec.group.name} • {rec.reason}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-3 h-3 mr-1" />
                        {rec.agent.workload} tickets
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        {rec.agent.avgResponseTime}h avg
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-green-700">
              <Info className="w-3 h-3 inline mr-1" />
              Your ticket will be automatically assigned to the best available agent when submitted.
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || assignmentLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedTicketForm;
