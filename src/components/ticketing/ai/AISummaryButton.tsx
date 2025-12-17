import React, { useState } from 'react';
import { SparklesIcon, DocumentTextIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { summarizeTicket, SummarizationResponse, TicketCommentSummary } from '../../../api/aiApi';

interface AISummaryButtonProps {
  ticketSubject: string;
  ticketDescription: string;
  category?: string;
  status?: string;
  comments?: Array<{
    author: string;
    isInternal: boolean;
    content: string;
    createdAt: string;
  }>;
}

const AISummaryButton: React.FC<AISummaryButtonProps> = ({
  ticketSubject,
  ticketDescription,
  category,
  status,
  comments = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummarizationResponse | null>(null);

  const handleSummarize = async () => {
    try {
      setIsLoading(true);
      setIsOpen(true);
      
      const commentSummaries: TicketCommentSummary[] = comments.map(c => ({
        author: c.author,
        isInternal: c.isInternal,
        content: c.content,
        createdAt: c.createdAt,
      }));

      const result = await summarizeTicket({
        ticketSubject,
        ticketDescription,
        category: typeof category === 'string' ? category : (category as any)?.name,
        status: typeof status === 'string' ? status : (status as any)?.name,
        comments: commentSummaries,
        summaryType: 'detailed',
      });
      setSummary(result);
    } catch (error) {
      console.error('Failed to summarize:', error);
      setSummary({ success: false, keyPoints: [], actionItems: [], errorMessage: 'Failed to generate summary' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSummarize}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
        title="AI Summarize"
      >
        {isLoading ? (
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <SparklesIcon className="h-3.5 w-3.5" />
        )}
        <span>AI Summary</span>
      </button>

      {/* Summary Modal/Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-50">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">AI Summary</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-600" />
                  <span className="ml-3 text-gray-600">Analyzing ticket...</span>
                </div>
              ) : summary?.success ? (
                <div className="space-y-4">
                  {summary.summary && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {summary.summary}
                      </p>
                    </div>
                  )}

                  {summary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-600">
                            <span className="text-gray-500 mr-2">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.actionItems.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Action Items</h4>
                      <ul className="space-y-1">
                        {summary.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start text-sm text-amber-700">
                            <span className="mr-2">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.customerSentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Customer Sentiment:</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        summary.customerSentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        summary.customerSentiment === 'negative' || summary.customerSentiment === 'frustrated' ? 'bg-red-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {summary.customerSentiment}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">{summary?.errorMessage || 'Failed to generate summary'}</p>
                  <button
                    onClick={handleSummarize}
                    className="mt-3 text-sm text-gray-600 hover:text-gray-700"
                  >
                    Try Again
                  </button>
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

export default AISummaryButton;
