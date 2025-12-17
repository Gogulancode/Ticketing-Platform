import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  Ticket, 
  ArrowRight,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import { 
  useFeaturedArticles, 
  useFeaturedFAQs, 
  useActiveAnnouncements,
  useKnowledgeBaseCategories,
  searchPortal
} from '../../api/customerPortalApi';

const PortalHomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<{
    articles: any[];
    faqs: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  const { data: featuredArticles, isLoading: loadingArticles } = useFeaturedArticles(6);
  const { data: featuredFaqs, isLoading: loadingFaqs } = useFeaturedFAQs(5);
  const { data: announcements } = useActiveAnnouncements();
  const { data: categories, isLoading: loadingCategories } = useKnowledgeBaseCategories();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchPortal(searchQuery, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // Non-pinned announcements
  const regularAnnouncements = announcements?.filter(a => !a.isPinned).slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-red-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          How can we help you today?
        </h1>
        <p className="text-gray-100 mb-8 max-w-2xl">
          Search our knowledge base for answers, browse FAQs, or submit a support ticket.
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for articles, FAQs, or topics..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-red-300 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Search Results for "{searchQuery}"
            </h2>
            <button
              onClick={clearSearch}
              className="text-sm text-gray-600 hover:underline"
            >
              Clear results
            </button>
          </div>

          {searchResults.articles.length === 0 && searchResults.faqs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No results found. Try different keywords or browse our categories below.
            </p>
          ) : (
            <div className="space-y-6">
              {searchResults.articles.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Articles ({searchResults.articles.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.articles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/portal/knowledge-base/articles/${article.slug}`}
                        className="block p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <p className="font-medium text-gray-900">{article.title}</p>
                        {article.summary && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.faqs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    FAQs ({searchResults.faqs.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.faqs.map((faq) => (
                      <Link
                        key={faq.id}
                        to={`/portal/faqs#faq-${faq.id}`}
                        className="block p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <p className="font-medium text-gray-900">{faq.question}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/portal/knowledge-base"
          className="group bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-red-300 transition-all"
        >
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
            <BookOpen className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Knowledge Base</h3>
          <p className="text-sm text-gray-500 mb-4">
            Browse our comprehensive guides and tutorials
          </p>
          <span className="text-gray-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Browse Articles <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link
          to="/portal/faqs"
          className="group bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-red-300 transition-all"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
            <HelpCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">FAQs</h3>
          <p className="text-sm text-gray-500 mb-4">
            Quick answers to common questions
          </p>
          <span className="text-green-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            View FAQs <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link
          to="/portal/tickets/new"
          className="group bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-red-300 transition-all"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
            <Ticket className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Submit a Request</h3>
          <p className="text-sm text-gray-500 mb-4">
            Can't find what you need? Contact our support team
          </p>
          <span className="text-purple-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Get Help <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            <Link to="/portal/knowledge-base" className="text-gray-600 hover:underline text-sm">
              View all categories →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/portal/knowledge-base/categories/${category.slug}`}
                className="bg-white rounded-lg p-4 border hover:border-red-300 hover:shadow-sm transition-all"
              >
                <h3 className="font-medium text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  {category.articleCount} article{category.articleCount !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Articles */}
      {featuredArticles && featuredArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-gray-600" />
              Popular Articles
            </h2>
            <Link to="/portal/knowledge-base" className="text-gray-600 hover:underline text-sm">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <Link
                key={article.id}
                to={`/portal/knowledge-base/articles/${article.slug}`}
                className="bg-white rounded-lg p-6 border hover:shadow-md hover:border-red-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs px-2 py-1 bg-red-100 text-gray-700 rounded-full">
                    {article.categoryName || 'General'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {article.summary}
                  </p>
                )}
                <div className="mt-4 text-xs text-gray-400">
                  {article.viewCount} views
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured FAQs */}
      {featuredFaqs && featuredFaqs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-green-600" />
              Frequently Asked Questions
            </h2>
            <Link to="/portal/faqs" className="text-gray-600 hover:underline text-sm">
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-xl border divide-y">
            {featuredFaqs.map((faq) => (
              <details key={faq.id} className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Recent Announcements */}
      {regularAnnouncements.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Updates</h2>
          <div className="space-y-4">
            {regularAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg p-4 border-l-4 ${
                  announcement.type === 0 ? 'border-l-blue-500' :
                  announcement.type === 1 ? 'border-l-amber-500' :
                  announcement.type === 2 ? 'border-l-green-500' :
                  announcement.type === 3 ? 'border-l-orange-500' :
                  'border-l-purple-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {announcement.typeDisplay}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PortalHomePage;
