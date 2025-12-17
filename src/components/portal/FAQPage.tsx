import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Search,
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { useActiveFAQs, useKnowledgeBaseCategories } from '../../api/customerPortalApi';

const FAQPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined;
  
  const { data: faqs, isLoading } = useActiveFAQs(categoryId);
  const { data: categories } = useKnowledgeBaseCategories();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());
  const [expandAll, setExpandAll] = React.useState(false);

  // Filter FAQs by search query
  const filteredFaqs = React.useMemo(() => {
    if (!faqs) return [];
    if (!searchQuery.trim()) return faqs;
    
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [faqs, searchQuery]);

  // Group FAQs by category
  const groupedFaqs = React.useMemo(() => {
    const groups: Record<string, typeof filteredFaqs> = {};
    
    filteredFaqs.forEach(faq => {
      const categoryName = faq.categoryName || 'General';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(faq);
    });
    
    return groups;
  }, [filteredFaqs]);

  const toggleFaq = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredFaqs.map(f => f.id)));
    }
    setExpandAll(!expandAll);
  };

  // Auto-expand FAQ from URL hash
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#faq-')) {
      const faqId = parseInt(hash.replace('#faq-', ''));
      if (!isNaN(faqId)) {
        setExpandedIds(new Set([faqId]));
        // Scroll to the FAQ after a short delay
        setTimeout(() => {
          document.getElementById(hash.substring(1))?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-green-600" />
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600">
          Find quick answers to commonly asked questions
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryId || ''}
            onChange={(e) => {
              const value = e.target.value;
              window.location.href = value 
                ? `/portal/faqs?category=${value}` 
                : '/portal/faqs';
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Expand/Collapse All */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {filteredFaqs.length} question{filteredFaqs.length !== 1 ? 's' : ''} found
          </span>
          <button
            onClick={toggleExpandAll}
            className="text-sm text-gray-600 hover:underline flex items-center gap-1"
          >
            {expandAll ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand All
              </>
            )}
          </button>
        </div>
      </div>

      {/* FAQs by Category */}
      {Object.keys(groupedFaqs).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedFaqs).map(([categoryName, categoryFaqs]) => (
            <section key={categoryName}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                {categoryName}
              </h2>
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="divide-y">
                  {categoryFaqs.map((faq) => {
                    const isExpanded = expandedIds.has(faq.id);
                    return (
                      <div key={faq.id} id={`faq-${faq.id}`}>
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 flex-1">
                            {faq.question}
                          </span>
                          {faq.isFeatured && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                              Popular
                            </span>
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 pl-12">
                            <div className="prose prose-sm max-w-none text-gray-600">
                              {faq.answer.split('\n').map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {faq.viewCount} views
                              </span>
                              <div className="flex items-center gap-3">
                                <button className="text-xs text-gray-500 hover:text-gray-600 flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  Related articles
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-12 text-center">
          <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchQuery 
              ? 'No FAQs match your search.' 
              : 'No FAQs available yet.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-600 hover:underline text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Still Need Help? */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Can't find what you're looking for?</h3>
        <p className="text-green-100 mb-4">
          Browse our knowledge base for more detailed guides, or contact our support team.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/portal/knowledge-base"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Browse Knowledge Base
          </Link>
          <Link
            to="/portal/contact"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-400 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
