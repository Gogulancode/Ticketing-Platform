import React, { useState } from 'react';
import { Search as SearchIcon, Filter, FileText, Image, File, Eye, X } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'scribe';
  module: string;
  tags: string[];
  description: string;
  uploadedBy: string;
  uploadedAt: string;
}

import { useEffect } from 'react';
import { getUploadedContent } from '../lib/api';

const fileTypeIcons = {
  pdf: FileText,
  doc: File,
  image: Image,
  scribe: FileText
};

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUploadedContent()
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load search results');
        setLoading(false);
      });
  }, []);

  const modules = ['Freight Management', 'Inventory Control', 'Financial Reports', 'Customer Management'];
  const documentTypes = ['PDF', 'Document', 'Image', 'Scribe'];
  const availableTags = ['workflow', 'documentation', 'screenshots', 'compliance', 'manual', 'tutorial', 'procedures', 'step-by-step'];

  const handleSearch = () => {
    let filteredResults = results;
    if (searchQuery) {
      filteredResults = filteredResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedModule) {
      filteredResults = filteredResults.filter(result => result.module === selectedModule);
    }

    if (selectedType) {
      filteredResults = filteredResults.filter(result => result.type === selectedType.toLowerCase());
    }

    if (selectedTags.length > 0) {
      filteredResults = filteredResults.filter(result =>
        selectedTags.some(tag => result.tags.includes(tag))
      );
    }

    setResults(filteredResults);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedModule('');
    setSelectedType('');
    setSelectedTags([]);
    setResults(mockResults);
  };

  React.useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedModule, selectedType, selectedTags]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Training Content</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword or module..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors ${
              showFilters ? 'text-gray-600 bg-red-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Module Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Modules</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Types</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-red-100 text-gray-800 border border-red-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(selectedModule || selectedType || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedModule && (
            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-gray-800 text-sm rounded-full">
              Module: {selectedModule}
              <button
                onClick={() => setSelectedModule('')}
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedType && (
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Type: {selectedType}
              <button
                onClick={() => setSelectedType('')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Search Results ({results.length})
          </h2>
        </div>

        {results.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {results.map(result => {
              const FileIcon = fileTypeIcons[result.type];
              
              return (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <FileIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{result.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-gray-800 text-xs font-medium rounded-full">
                            {result.module}
                          </span>
                          {result.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {result.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{result.tags.length - 3} more
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Uploaded by {result.uploadedBy} • {result.uploadedAt}
                        </div>
                      </div>
                    </div>
                    
                    <button className="ml-4 flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-red-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;