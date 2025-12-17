import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  LightBulbIcon,
  DocumentTextIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  getAIStatus,
  categorizeTicket,
  suggestResponses,
  summarizeTicket,
  AIStatusResponse,
  CategorizationResponse,
  ResponseSuggestionResponse,
  SummarizationResponse,
  SuggestedResponse,
  TicketCommentSummary,
} from '../../../api/aiApi';

interface AIAssistantPanelProps {
  ticketId: number;
  ticketSubject: string;
  ticketDescription: string;
  category?: string | { name?: string; id?: number } | null;
  priority?: string | { name?: string; id?: number } | null;
  status?: string | { name?: string; id?: number } | null;
  customerName?: string;
  comments?: Array<{
    author: string;
    isInternal: boolean;
    content: string;
    createdAt: string;
  }>;
  availableCategories?: string[];
  onApplyCategory?: (category: string, priority: string) => void;
  onInsertResponse?: (content: string) => void;
}

// Helper to extract string value from string or object
const extractStringValue = (value: string | { name?: string; id?: number } | null | undefined): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return undefined;
};

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  ticketId,
  ticketSubject,
  ticketDescription,
  category,
  priority,
  status,
  customerName,
  comments = [],
  availableCategories = [],
  onApplyCategory,
  onInsertResponse,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'categorize' | 'summarize'>('suggestions');
  
  // AI Status
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  
  // Categorization
  const [categorization, setCategorization] = useState<CategorizationResponse | null>(null);
  const [isLoadingCategorization, setIsLoadingCategorization] = useState(false);
  
  // Response Suggestions
  const [suggestions, setSuggestions] = useState<SuggestedResponse[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  
  // Summarization
  const [summary, setSummary] = useState<SummarizationResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const status = await getAIStatus();
      setAiStatus(status);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus({ enabled: false, connected: false, provider: 'unknown', model: 'unknown', errorMessage: 'Failed to connect' });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleCategorize = async () => {
    try {
      setIsLoadingCategorization(true);
      const result = await categorizeTicket({
        subject: ticketSubject,
        description: ticketDescription,
        availableCategories: availableCategories.length > 0 ? availableCategories : ['General', 'Technical', 'Billing', 'Sales', 'Support'],
        availablePriorities: ['Low', 'Medium', 'High', 'Critical'],
      });
      setCategorization(result);
    } catch (error) {
      console.error('Failed to categorize:', error);
      setCategorization({ success: false, confidence: 0, errorMessage: 'Failed to categorize ticket' });
    } finally {
      setIsLoadingCategorization(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const commentSummaries: TicketCommentSummary[] = comments.slice(-5).map(c => ({
        author: c.author,
        isInternal: c.isInternal,
        content: c.content,
        createdAt: c.createdAt,
      }));

      const result = await suggestResponses({
        ticketSubject,
        ticketDescription,
        category: extractStringValue(category),
        priority: extractStringValue(priority),
        recentComments: commentSummaries,
        customerName,
        suggestionCount: 3,
        tone: selectedTone,
      });
      
      if (result.success) {
        setSuggestions(result.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSummarize = async () => {
    try {
      setIsLoadingSummary(true);
      const commentSummaries: TicketCommentSummary[] = comments.map(c => ({
        author: c.author,
        isInternal: c.isInternal,
        content: c.content,
        createdAt: c.createdAt,
      }));

      const result = await summarizeTicket({
        ticketSubject,
        ticketDescription,
        category: extractStringValue(category),
        status: extractStringValue(status),
        comments: commentSummaries,
        summaryType: 'detailed',
      });
      setSummary(result);
    } catch (error) {
      console.error('Failed to summarize:', error);
      setSummary({ success: false, keyPoints: [], actionItems: [], errorMessage: 'Failed to summarize ticket' });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Don't show if AI is disabled
  if (isLoadingStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          <span>Checking AI status...</span>
        </div>
      </div>
    );
  }

  if (!aiStatus?.enabled) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
          <SparklesIcon className="h-5 w-5" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          AI features are not configured. Go to Settings → AI to enable.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-red-50 to-red-50 dark:from-gray-700 dark:to-gray-600 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">AI Assistant</span>
          {aiStatus?.connected ? (
            <span className="flex items-center text-xs text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Connected
            </span>
          ) : (
            <span className="flex items-center text-xs text-gray-500">
              <XCircleIcon className="h-3 w-3 mr-1" />
              Disconnected
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'suggestions'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
              }`}
            >
              <LightBulbIcon className="h-4 w-4" />
              <span>Suggest Reply</span>
            </button>
            <button
              onClick={() => setActiveTab('categorize')}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'categorize'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
              }`}
            >
              <TagIcon className="h-4 w-4" />
              <span>Categorize</span>
            </button>
            <button
              onClick={() => setActiveTab('summarize')}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'summarize'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>Summarize</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Tone:</label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as any)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                    <button
                    onClick={handleGenerateSuggestions}
                    disabled={isLoadingSuggestions}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingSuggestions ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="h-4 w-4" />
                    )}
                    <span>Generate</span>
                  </button>
                </div>

                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            {suggestion.title}
                          </span>
                          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            {suggestion.tone}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {suggestion.content}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => onInsertResponse?.(suggestion.content)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-gray-700 dark:text-gray-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <span>Use This</span>
                          </button>
                          <button
                            onClick={() => copyToClipboard(suggestion.content)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Click "Generate" to get AI-powered response suggestions
                  </p>
                )}
              </div>
            )}

            {/* Categorize Tab */}
            {activeTab === 'categorize' && (
              <div>
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleCategorize}
                    disabled={isLoadingCategorization}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingCategorization ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <TagIcon className="h-4 w-4" />
                    )}
                    <span>Analyze</span>
                  </button>
                </div>

                {categorization?.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Suggested Category</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {categorization.suggestedCategory || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Suggested Priority</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {categorization.suggestedPriority || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all"
                          style={{ width: `${categorization.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {Math.round(categorization.confidence * 100)}%
                      </span>
                    </div>

                    {categorization.reasoning && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Reasoning</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {categorization.reasoning}
                        </p>
                      </div>
                    )}

                    {onApplyCategory && categorization.suggestedCategory && categorization.suggestedPriority && (
                      <button
                        onClick={() => onApplyCategory(categorization.suggestedCategory!, categorization.suggestedPriority!)}
                        className="w-full py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Apply Suggestions
                      </button>
                    )}
                  </div>
                ) : categorization?.errorMessage ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {categorization.errorMessage}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Click "Analyze" to get AI-powered category and priority suggestions
                  </p>
                )}
              </div>
            )}

            {/* Summarize Tab */}
            {activeTab === 'summarize' && (
              <div>
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleSummarize}
                    disabled={isLoadingSummary}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingSummary ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <DocumentTextIcon className="h-4 w-4" />
                    )}
                    <span>Summarize</span>
                  </button>
                </div>

                {summary?.success ? (
                  <div className="space-y-3">
                    {summary.summary && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Summary</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {summary.summary}
                        </p>
                      </div>
                    )}

                    {summary.keyPoints.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Key Points</span>
                        <ul className="mt-1 space-y-1">
                          {summary.keyPoints.map((point, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-gray-600 dark:text-gray-400 mr-2">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.actionItems.length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                        <span className="text-xs text-yellow-700 dark:text-yellow-400">Action Items</span>
                        <ul className="mt-1 space-y-1">
                          {summary.actionItems.map((item, index) => (
                            <li key={index} className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start">
                              <span className="mr-2">→</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.customerSentiment && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Customer Sentiment:</span>
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          summary.customerSentiment === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          summary.customerSentiment === 'negative' || summary.customerSentiment === 'frustrated' ? 'bg-red-100 text-gray-700 dark:bg-red-900 dark:text-gray-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {summary.customerSentiment}
                        </span>
                      </div>
                    )}
                  </div>
                ) : summary?.errorMessage ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {summary.errorMessage}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Click "Summarize" to get an AI-generated summary of this ticket
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Model Info */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Powered by {aiStatus?.provider} ({aiStatus?.model})
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;
