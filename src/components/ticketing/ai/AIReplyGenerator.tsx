import React, { useState } from 'react';
import { SparklesIcon, LightBulbIcon, XMarkIcon, ArrowPathIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { suggestResponses, ResponseSuggestionResponse, SuggestedResponse, TicketCommentSummary } from '../../../api/aiApi';

interface AIReplyGeneratorProps {
  ticketSubject: string;
  ticketDescription: string;
  category?: string;
  priority?: string;
  customerName?: string;
  comments?: Array<{
    author: string;
    isInternal: boolean;
    content: string;
    createdAt: string;
  }>;
  onInsertResponse?: (content: string) => void;
}

const AIReplyGenerator: React.FC<AIReplyGeneratorProps> = ({
  ticketSubject,
  ticketDescription,
  category,
  priority,
  customerName,
  comments = [],
  onInsertResponse,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedResponse[]>([]);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setIsOpen(true);
      
      const commentSummaries: TicketCommentSummary[] = comments.slice(-5).map(c => ({
        author: c.author,
        isInternal: c.isInternal,
        content: c.content,
        createdAt: c.createdAt,
      }));

      const result = await suggestResponses({
        ticketSubject,
        ticketDescription,
        category: typeof category === 'string' ? category : (category as any)?.name,
        priority: typeof priority === 'string' ? priority : (priority as any)?.name,
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
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUse = (content: string) => {
    onInsertResponse?.(content);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
        title="Generate AI response suggestions"
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        <span>AI Suggest Reply</span>
      </button>

      {/* Generator Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-50">
              <div className="flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">AI Response Suggestions</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Tone:</label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                Generate
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-600" />
                  <span className="ml-3 text-gray-600">Generating suggestions...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-700">{suggestion.title}</span>
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-white rounded border">
                          {suggestion.tone}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{suggestion.content}</p>
                      </div>
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => handleUse(suggestion.content)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                        >
                          Use This
                        </button>
                        <button
                          onClick={() => handleCopy(suggestion.content, index)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <LightBulbIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Click "Generate" to get AI-powered response suggestions</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReplyGenerator;
