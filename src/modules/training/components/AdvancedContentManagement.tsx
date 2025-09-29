import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, FileText, Video, Image, Search, Filter, Eye, 
  Edit3, Trash2, Download, Share2, Copy, Star, Clock,
  CheckCircle, AlertCircle, XCircle, BarChart3, Users,
  Tag, Calendar, ArrowUp, ArrowDown, MoreHorizontal,
  Plus, Bookmark, Play, Pause, SkipForward, Volume2,
  Grid, List, Settings, BookOpen, Target, Award,
  TrendingUp, Activity, Globe, Shield, Zap, Brain
} from 'lucide-react';

interface AdvancedContentManagementProps {
  moduleId?: number;
  sectionId?: number;
  userRole: string;
  userId: string;
}

interface ContentItem {
  id: number;
  title: string;
  description: string;
  type: 'Document' | 'Video' | 'Interactive' | 'Image' | 'Audio' | 'Simulation' | 'VR' | 'AR';
  status: 'Draft' | 'InReview' | 'Published' | 'Archived';
  moduleId: number;
  moduleName: string;
  sectionId?: number;
  sectionName?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  rating: number;
  duration?: number;
  fileSize?: number;
  downloadCount: number;
  version: number;
  thumbnail?: string;
  isBookmarked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  accessibility: {
    hasTranscript: boolean;
    hasClosedCaptions: boolean;
    isScreenReaderFriendly: boolean;
    supportsMultipleLanguages: boolean;
  };
  analytics: {
    completionRate: number;
    averageTimeSpent: number;
    userSatisfaction: number;
    engagementScore: number;
    effectivenessScore: number;
  };
  learningOutcomes: string[];
  prerequisites: string[];
  adaptiveMetrics: {
    difficultyScore: number;
    personalizedRelevance: number;
    optimalSequencePosition: number;
  };
  aiInsights: {
    contentQuality: number;
    learningEffectiveness: number;
    improvementSuggestions: string[];
  };
}

interface SearchFilters {
  searchTerm: string;
  contentType: string;
  status: string;
  difficulty: string;
  tags: string[];
  dateRange: { start: Date | null; end: Date | null };
  minRating: number;
  maxDuration: number;
  hasAccessibility: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const AdvancedContentManagement: React.FC<AdvancedContentManagementProps> = ({
  moduleId,
  sectionId,
  userRole,
  userId
}) => {
  // State Management
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'cards'>('grid');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Advanced Filters
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    contentType: 'all',
    status: 'all',
    difficulty: 'all',
    tags: [],
    dateRange: { start: null, end: null },
    minRating: 0,
    maxDuration: 0,
    hasAccessibility: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    totalContent: 0,
    publishedContent: 0,
    totalViews: 0,
    averageRating: 0,
    completionRate: 0,
    engagementScore: 0,
    contentEffectiveness: 0,
    learnerSatisfaction: 0
  });

  // AI Recommendations
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<any[]>([]);

  // Mock Data with Industry Standard Features
  useEffect(() => {
    const mockContents: ContentItem[] = [
      {
        id: 1,
        title: "AI-Powered ERP Analytics Dashboard",
        description: "Interactive simulation of AI-driven analytics in modern ERP systems with real-time decision making scenarios",
        type: "Interactive",
        status: "Published",
        moduleId: 1,
        moduleName: "Advanced ERP Analytics",
        sectionId: 1,
        sectionName: "AI Integration",
        tags: ["ai", "analytics", "dashboard", "simulation", "advanced"],
        createdBy: "Dr. Sarah Chen",
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01'),
        views: 2450,
        rating: 4.8,
        duration: 45,
        fileSize: 125.6,
        downloadCount: 680,
        version: 3,
        thumbnail: "/api/thumbnails/ai-dashboard.jpg",
        isBookmarked: true,
        difficulty: "Advanced",
        accessibility: {
          hasTranscript: true,
          hasClosedCaptions: true,
          isScreenReaderFriendly: true,
          supportsMultipleLanguages: true
        },
        analytics: {
          completionRate: 94,
          averageTimeSpent: 42.3,
          userSatisfaction: 4.7,
          engagementScore: 89,
          effectivenessScore: 92
        },
        learningOutcomes: [
          "Design AI-powered analytics dashboards",
          "Implement predictive analytics in ERP",
          "Interpret complex data visualizations",
          "Make data-driven business decisions"
        ],
        prerequisites: ["Data Analytics Fundamentals", "ERP Basics"],
        adaptiveMetrics: {
          difficultyScore: 8.5,
          personalizedRelevance: 9.2,
          optimalSequencePosition: 15
        },
        aiInsights: {
          contentQuality: 9.1,
          learningEffectiveness: 8.8,
          improvementSuggestions: [
            "Add more hands-on exercises",
            "Include industry case studies",
            "Enhance mobile compatibility"
          ]
        }
      },
      {
        id: 2,
        title: "Virtual Reality Supply Chain Simulation",
        description: "Immersive VR experience simulating complex supply chain scenarios with real-world challenges and decision points",
        type: "VR",
        status: "Published",
        moduleId: 2,
        moduleName: "Supply Chain Management",
        sectionId: 3,
        sectionName: "Advanced Simulations",
        tags: ["vr", "supply-chain", "simulation", "immersive", "logistics"],
        createdBy: "Prof. Michael Torres",
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25'),
        views: 1890,
        rating: 4.9,
        duration: 60,
        fileSize: 2.1, // GB
        downloadCount: 234,
        version: 2,
        thumbnail: "/api/thumbnails/vr-supply-chain.jpg",
        isBookmarked: false,
        difficulty: "Expert",
        accessibility: {
          hasTranscript: true,
          hasClosedCaptions: false,
          isScreenReaderFriendly: false,
          supportsMultipleLanguages: false
        },
        analytics: {
          completionRate: 87,
          averageTimeSpent: 58.7,
          userSatisfaction: 4.8,
          engagementScore: 95,
          effectivenessScore: 91
        },
        learningOutcomes: [
          "Navigate complex supply chain networks",
          "Optimize logistics operations",
          "Handle supply chain disruptions",
          "Implement sustainable practices"
        ],
        prerequisites: ["Supply Chain Fundamentals", "Logistics Management"],
        adaptiveMetrics: {
          difficultyScore: 9.5,
          personalizedRelevance: 7.8,
          optimalSequencePosition: 25
        },
        aiInsights: {
          contentQuality: 9.4,
          learningEffectiveness: 9.1,
          improvementSuggestions: [
            "Add accessibility features",
            "Reduce cognitive load",
            "Include assessment checkpoints"
          ]
        }
      }
      // Add more sophisticated content items...
    ];
    
    setTimeout(() => {
      setContents(mockContents);
      setFilteredContents(mockContents);
      setAnalyticsData({
        totalContent: mockContents.length,
        publishedContent: mockContents.filter(c => c.status === 'Published').length,
        totalViews: mockContents.reduce((sum, c) => sum + c.views, 0),
        averageRating: mockContents.reduce((sum, c) => sum + c.rating, 0) / mockContents.length,
        completionRate: mockContents.reduce((sum, c) => sum + c.analytics.completionRate, 0) / mockContents.length,
        engagementScore: mockContents.reduce((sum, c) => sum + c.analytics.engagementScore, 0) / mockContents.length,
        contentEffectiveness: mockContents.reduce((sum, c) => sum + c.analytics.effectivenessScore, 0) / mockContents.length,
        learnerSatisfaction: mockContents.reduce((sum, c) => sum + c.analytics.userSatisfaction, 0) / mockContents.length,
      });
      setLoading(false);
    }, 1000);
  }, []);

  // Advanced Filtering Logic
  useEffect(() => {
    let filtered = [...contents];

    // AI-powered semantic search
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(searchTerm) ||
        content.description.toLowerCase().includes(searchTerm) ||
        content.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        content.learningOutcomes.some(outcome => outcome.toLowerCase().includes(searchTerm))
      );
    }

    // Multi-dimensional filtering
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(content => content.type === filters.contentType);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(content => content.status === filters.status);
    }

    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(content => content.difficulty === filters.difficulty);
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(content =>
        filters.tags.every(tag => content.tags.includes(tag))
      );
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(content => content.rating >= filters.minRating);
    }

    if (filters.maxDuration > 0) {
      filtered = filtered.filter(content => !content.duration || content.duration <= filters.maxDuration);
    }

    if (filters.hasAccessibility) {
      filtered = filtered.filter(content => 
        content.accessibility.hasTranscript && 
        content.accessibility.isScreenReaderFriendly
      );
    }

    // Advanced sorting with AI recommendations
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'effectiveness':
          aValue = a.analytics.effectivenessScore;
          bValue = b.analytics.effectivenessScore;
          break;
        case 'engagement':
          aValue = a.analytics.engagementScore;
          bValue = b.analytics.engagementScore;
          break;
        case 'personalizedRelevance':
          aValue = a.adaptiveMetrics.personalizedRelevance;
          bValue = b.adaptiveMetrics.personalizedRelevance;
          break;
        case 'aiQuality':
          aValue = a.aiInsights.contentQuality;
          bValue = b.aiInsights.contentQuality;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredContents(filtered);
  }, [contents, filters]);

  // Helper Functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Draft': return <Edit3 className="w-4 h-4 text-gray-500" />;
      case 'InReview': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'Archived': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Document': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Video': return <Video className="w-5 h-5 text-red-500" />;
      case 'Interactive': return <Target className="w-5 h-5 text-purple-500" />;
      case 'Image': return <Image className="w-5 h-5 text-green-500" />;
      case 'Audio': return <Volume2 className="w-5 h-5 text-orange-500" />;
      case 'VR': return <Globe className="w-5 h-5 text-cyan-500" />;
      case 'AR': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'Simulation': return <Brain className="w-5 h-5 text-indigo-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-orange-600 bg-orange-100';
      case 'Expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFileSize = (size?: number, isGB: boolean = false) => {
    if (!size) return 'N/A';
    if (isGB) return `${size.toFixed(1)} GB`;
    return size >= 1000 ? `${(size / 1000).toFixed(1)} GB` : `${size.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading advanced content management...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Enhanced Header with AI Insights */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Industry-Standard Content Management</h1>
            <p className="text-blue-100">
              AI-powered content management with adaptive learning, analytics, and personalization
            </p>
          </div>
          
          {(userRole === 'Admin' || userRole === 'ContentManager') && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <Brain className="w-4 h-4" />
                AI Insights
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Plus className="w-4 h-4" />
                Create Content
              </button>
            </div>
          )}
        </div>

        {/* Advanced Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Total Content</p>
                <p className="text-lg font-bold">{analyticsData.totalContent}</p>
              </div>
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Published</p>
                <p className="text-lg font-bold text-green-300">{analyticsData.publishedContent}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-300" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Total Views</p>
                <p className="text-lg font-bold text-purple-300">{analyticsData.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-6 h-6 text-purple-300" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Avg. Rating</p>
                <p className="text-lg font-bold text-yellow-300">{analyticsData.averageRating.toFixed(1)}</p>
              </div>
              <Star className="w-6 h-6 text-yellow-300" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Completion Rate</p>
                <p className="text-lg font-bold text-green-300">{analyticsData.completionRate.toFixed(0)}%</p>
              </div>
              <Target className="w-6 h-6 text-green-300" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Engagement</p>
                <p className="text-lg font-bold text-cyan-300">{analyticsData.engagementScore.toFixed(0)}%</p>
              </div>
              <Activity className="w-6 h-6 text-cyan-300" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Effectiveness</p>
                <p className="text-lg font-bold text-orange-300">{analyticsData.contentEffectiveness.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-6 h-6 text-orange-300" />
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Satisfaction</p>
                <p className="text-lg font-bold text-pink-300">{analyticsData.learnerSatisfaction.toFixed(1)}</p>
              </div>
              <Award className="w-6 h-6 text-pink-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* AI-Powered Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="AI-powered semantic search: content, skills, outcomes, concepts..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
          </div>

          {/* Smart Filters */}
          <div className="flex gap-2">
            <select
              value={filters.contentType}
              onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Document">Documents</option>
              <option value="Video">Videos</option>
              <option value="Interactive">Interactive</option>
              <option value="VR">Virtual Reality</option>
              <option value="AR">Augmented Reality</option>
              <option value="Simulation">Simulations</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="personalizedRelevance">AI Relevance</option>
              <option value="effectiveness">Effectiveness</option>
              <option value="engagement">Engagement</option>
              <option value="aiQuality">AI Quality Score</option>
              <option value="rating">User Rating</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-3 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={3}>3+ Stars</option>
                  <option value={2}>2+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Duration</label>
                <select
                  value={filters.maxDuration}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDuration: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={0}>Any Duration</option>
                  <option value={15}>15 min or less</option>
                  <option value={30}>30 min or less</option>
                  <option value={60}>1 hour or less</option>
                  <option value={120}>2 hours or less</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasAccessibility}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasAccessibility: e.target.checked }))}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-sm">Accessibility Features Required</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    searchTerm: '',
                    contentType: 'all',
                    status: 'all',
                    difficulty: 'all',
                    tags: [],
                    dateRange: { start: null, end: null },
                    minRating: 0,
                    maxDuration: 0,
                    hasAccessibility: false,
                    sortBy: 'updatedAt',
                    sortOrder: 'desc'
                  })}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary with AI Insights */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Showing {filteredContents.length} of {contents.length} content items
          </span>
          {filters.sortBy === 'personalizedRelevance' && (
            <div className="flex items-center gap-2 text-purple-600 text-sm">
              <Brain className="w-4 h-4" />
              <span>AI-personalized for you</span>
            </div>
          )}
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
              Bulk Actions
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Content Display */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content) => (
            <div key={content.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
              {/* Enhanced Thumbnail with Overlay */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {content.thumbnail ? (
                  <img 
                    src={content.thumbnail} 
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getTypeIcon(content.type)}
                  </div>
                )}
                
                {/* Intelligent Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-white text-sm">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {content.analytics.effectivenessScore}% effective
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {content.analytics.engagementScore}% engagement
                      </span>
                    </div>
                  </div>
                </div>

                {/* Smart Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    content.status === 'Published' ? 'bg-green-100 text-green-800' :
                    content.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                    content.status === 'InReview' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusIcon(content.status)}
                    {content.status}
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty)}`}>
                    {content.difficulty}
                  </div>
                </div>

                {/* AI Quality Indicator */}
                <div className="absolute top-3 right-3">
                  <div className="bg-black/75 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {content.aiInsights.contentQuality.toFixed(1)}
                  </div>
                </div>

                {/* Duration and Size */}
                {content.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(content.duration)}
                  </div>
                )}
              </div>

              {/* Enhanced Content Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{content.title}</h3>
                  <button className="text-gray-400 hover:text-gray-600 ml-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{content.description}</p>

                {/* Learning Outcomes Preview */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-1">Key Learning Outcomes:</p>
                  <div className="text-xs text-gray-600">
                    {content.learningOutcomes.slice(0, 2).map((outcome, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span className="line-clamp-1">{outcome}</span>
                      </div>
                    ))}
                    {content.learningOutcomes.length > 2 && (
                      <span className="text-gray-400">+{content.learningOutcomes.length - 2} more</span>
                    )}
                  </div>
                </div>

                {/* Smart Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {content.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  {content.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{content.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Advanced Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{content.views}</div>
                    <div className="text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900 flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {content.rating}
                    </div>
                    <div className="text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{content.analytics.completionRate}%</div>
                    <div className="text-gray-500">Complete</div>
                  </div>
                </div>

                {/* Accessibility & AI Indicators */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {content.accessibility.hasTranscript && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" title="Has Transcript" />
                    )}
                    {content.accessibility.hasClosedCaptions && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" title="Has Closed Captions" />
                    )}
                    {content.accessibility.isScreenReaderFriendly && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full" title="Screen Reader Friendly" />
                    )}
                    {content.accessibility.supportsMultipleLanguages && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full" title="Multiple Languages" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>v{content.version}</span>
                    <div className="flex items-center gap-1">
                      <Brain className="w-3 h-3 text-purple-500" />
                      <span>{content.adaptiveMetrics.personalizedRelevance.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                      <Bookmark className={`w-4 h-4 ${content.isBookmarked ? 'text-yellow-500 fill-current' : ''}`} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredContents.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No content matches your criteria</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search terms, or let AI recommend content for you
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Clear Filters
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Get AI Recommendations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedContentManagement;
