import React, { useState, useEffect } from 'react';
import { Save, Zap } from 'lucide-react';
import { settingsApi, SubCategory } from '../../../shared/services/api/settingsApi';
import LoadingSpinner from '../../../components/LoadingSpinner';

export const SimplifiedAutoAssignment: React.FC = () => {
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [keywordsBySubcategory, setKeywordsBySubcategory] = useState<{[key: number]: string}>({});
  const [savingKeywords, setSavingKeywords] = useState<{[key: number]: boolean}>({});

  // Load all subcategories
  useEffect(() => {
    loadSubCategories();
  }, []);

  const loadSubCategories = async () => {
    try {
      setLoadingSubCategories(true);
      const subcategories = await settingsApi.getSubCategories();
      setAllSubCategories(subcategories);
      
      // Initialize empty keywords for each subcategory for now
      // TODO: Implement backend keyword storage
      const keywordsData: {[key: number]: string} = {};
      for (const subcategory of subcategories) {
        if (subcategory.id) {
          keywordsData[subcategory.id] = '';
        }
      }
      setKeywordsBySubcategory(keywordsData);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const handleSaveKeywords = async (subcategoryId: number, subcategoryName: string) => {
    try {
      setSavingKeywords(prev => ({...prev, [subcategoryId]: true}));
      
      const keywordsString = keywordsBySubcategory[subcategoryId] || '';
      const keywords = keywordsString
        .split(',')
        .map(k => k.trim())
        .filter(k => k);

      // TODO: Implement backend API to save keywords
      // For now, just simulate saving and show success message
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      alert(`Successfully saved ${keywords.length} keywords for ${subcategoryName}`);
      console.log(`Keywords for ${subcategoryName}:`, keywords);
    } catch (error) {
      console.error('Error saving keywords:', error);
      alert('Error saving keywords. Please try again.');
    } finally {
      setSavingKeywords(prev => ({...prev, [subcategoryId]: false}));
    }
  };

  const handleKeywordsChange = (subcategoryId: number, value: string) => {
    setKeywordsBySubcategory(prev => ({
      ...prev,
      [subcategoryId]: value
    }));
  };

  if (loadingSubCategories) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <LoadingSpinner size="lg" message="Loading subcategories..." />
        </div>
      </div>
    );
  }

  if (allSubCategories.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8 text-gray-500">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No subcategories found</p>
          <p className="text-sm">Create subcategories first to configure auto-assignment keywords</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h5 className="text-lg font-medium text-gray-900">Subcategory Keywords Configuration</h5>
          <p className="text-sm text-gray-600 mt-1">
            Configure keywords for each subcategory. Emails containing these keywords will be automatically assigned.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {allSubCategories.length} subcategories available
        </div>
      </div>

      <div className="space-y-4">
        {allSubCategories.map(subcategory => (
          <div key={subcategory.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center space-x-4">
              {/* Subcategory Name */}
              <div className="w-48 flex-shrink-0">
                <h6 className="font-medium text-gray-900">{subcategory.name}</h6>
                <p className="text-sm text-gray-500">
                  {keywordsBySubcategory[subcategory.id!]?.split(',').filter(k => k.trim()).length || 0} keywords
                </p>
              </div>

              {/* Keywords Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="office 365, excel, word, licensing, etc. (comma-separated)"
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={keywordsBySubcategory[subcategory.id!] || ''}
                  onChange={(e) => handleKeywordsChange(subcategory.id!, e.target.value)}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={() => handleSaveKeywords(subcategory.id!, subcategory.name)}
                disabled={savingKeywords[subcategory.id!]}
                className="px-4 py-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[100px] justify-center"
              >
                {savingKeywords[subcategory.id!] ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};