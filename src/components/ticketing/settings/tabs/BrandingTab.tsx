import React, { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  TrashIcon, 
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { 
  useBrandingSettings, 
  useUpdateBrandingSettings, 
  useUploadLogo,
  useDeleteLogo,
  UpdateBrandingSettingsRequest 
} from '@/api/brandingApi';
import { API_CONFIG } from '@/config/api';
import toast from 'react-hot-toast';

const BrandingTab: React.FC = () => {
  const { data: branding, isLoading, error } = useBrandingSettings();
  const updateMutation = useUpdateBrandingSettings();
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();

  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UpdateBrandingSettingsRequest>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when data loads
  React.useEffect(() => {
    if (branding) {
      setFormData({
        loginTitle: branding.loginTitle,
        loginSubtitle: branding.loginSubtitle,
        appName: branding.appName,
        appTagline: branding.appTagline || '',
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        footerText: branding.footerText,
      });
    }
  }, [branding]);

  const handleInputChange = (field: keyof UpdateBrandingSettingsRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success('Branding settings saved successfully');
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to save branding settings');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, GIF, SVG, or WebP.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    try {
      await uploadLogoMutation.mutateAsync(file);
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload logo');
    }

    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;
    
    try {
      await deleteLogoMutation.mutateAsync();
      toast.success('Logo deleted successfully');
    } catch (err) {
      toast.error('Failed to delete logo');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />
        <span className="text-gray-700">Failed to load branding settings</span>
      </div>
    );
  }

  // Keep /api prefix for staging where static files are under /api
  const logoUrl = branding?.logoUrl 
    ? `${API_CONFIG.BASE_URL}${branding.logoUrl}`
    : null;

  return (
    <div className="space-y-8">
      {/* Logo Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PhotoIcon className="h-5 w-5 text-gray-600" />
          Logo
        </h3>
        
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <PhotoIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-600">
              Upload your company logo to display on the login page and navigation. 
              Recommended size: 200x200 pixels. Max file size: 5MB.
            </p>
            
            <div className="flex items-center gap-3">
              <input
                ref={logoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.svg,.webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
              </button>
              
              {logoUrl && (
                <button
                  onClick={handleDeleteLogo}
                  disabled={deleteLogoMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-gray-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>

            {branding?.logoFileName && (
              <p className="text-xs text-gray-500">
                Current file: {branding.logoFileName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Login Page Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PaintBrushIcon className="h-5 w-5 text-gray-600" />
          Login Page Content
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <textarea
                value={formData.loginTitle || ''}
                onChange={(e) => handleInputChange('loginTitle', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Hello,\nI'm Nivo"
              />
              <p className="text-xs text-gray-500 mt-1">Use \n for line breaks</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle / Description
              </label>
              <textarea
                value={formData.loginSubtitle || ''}
                onChange={(e) => handleInputChange('loginSubtitle', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Welcome message for the login page..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Name
              </label>
              <input
                type="text"
                value={formData.appName || ''}
                onChange={(e) => handleInputChange('appName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Nivo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Text
              </label>
              <input
                type="text"
                value={formData.footerText || ''}
                onChange={(e) => handleInputChange('footerText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="© {year} Company Name. All rights reserved."
              />
              <p className="text-xs text-gray-500 mt-1">Use {'{year}'} as placeholder for current year</p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div 
              className="rounded-lg p-6 text-white min-h-[300px]"
              style={{ 
                background: `linear-gradient(135deg, ${formData.primaryColor || '#3b82f6'} 0%, ${formData.secondaryColor || '#1e40af'} 100%)` 
              }}
            >
              {/* Logo Preview */}
              {logoUrl && (
                <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              
              <h2 className="text-2xl font-bold mb-3 whitespace-pre-line">
                {(formData.loginTitle || 'Hello,\nI\'m Nivo').replace(/\\n/g, '\n')}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                {formData.loginSubtitle || 'Welcome message will appear here...'}
              </p>
              
              <div className="mt-auto pt-8 text-xs text-white/60">
                {(formData.footerText || '© {year} Company').replace('{year}', new Date().getFullYear().toString())}
              </div>
            </div>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Theme Colors</h4>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Primary:</label>
              <input
                type="color"
                value={formData.primaryColor || '#3b82f6'}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-500 font-mono">
                {formData.primaryColor || '#3b82f6'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Secondary:</label>
              <input
                type="color"
                value={formData.secondaryColor || '#1e40af'}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-500 font-mono">
                {formData.secondaryColor || '#1e40af'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {branding?.updatedAt && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(branding.updatedAt).toLocaleString()}
              {branding.updatedByName && ` by ${branding.updatedByName}`}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
            hasChanges 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircleIcon className="h-5 w-5" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default BrandingTab;
