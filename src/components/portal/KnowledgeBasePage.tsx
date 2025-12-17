import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  ChevronRight, 
  Clock, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  ArrowLeft,
  Folder
} from 'lucide-react';
import { 
  useKnowledgeBaseCategories,
  useKnowledgeBaseCategoryBySlug,
  useKnowledgeBaseArticles,
  useArticleBySlug,
  useSubmitArticleFeedback
} from '../../api/customerPortalApi';

// Category List Page
export const KnowledgeBaseCategoriesPage: React.FC = () => {
  const { data: categories, isLoading } = useKnowledgeBaseCategories();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
        <p className="text-gray-600">
          Browse our comprehensive guides, tutorials, and documentation
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Link
            key={category.id}
            to={`/portal/knowledge-base/categories/${category.slug}`}
            className="group bg-white rounded-xl p-6 border hover:shadow-lg hover:border-red-300 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                <Folder className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {category.description}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {category.articleCount} article{category.articleCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Sub-categories preview */}
            {category.subCategories.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Includes:</p>
                <div className="flex flex-wrap gap-2">
                  {category.subCategories.slice(0, 3).map((sub) => (
                    <span key={sub.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {sub.name}
                    </span>
                  ))}
                  {category.subCategories.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{category.subCategories.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {categories?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No categories available yet.</p>
        </div>
      )}
    </div>
  );
};

// Category Detail Page
export const KnowledgeBaseCategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  const { data: category, isLoading: loadingCategory } = useKnowledgeBaseCategoryBySlug(slug || '');
  const { data: articles, isLoading: loadingArticles } = useKnowledgeBaseArticles(
    category?.id,
    page,
    20
  );

  if (loadingCategory) {
    return <LoadingState />;
  }

  if (!category) {
    return <NotFoundState message="Category not found" />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/portal/knowledge-base" className="hover:text-gray-600">
          Knowledge Base
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-white rounded-xl p-6 border">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>

      {/* Sub-categories */}
      {category.subCategories.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.subCategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/portal/knowledge-base/categories/${sub.slug}`}
              className="bg-white rounded-lg p-4 border hover:border-red-300 hover:shadow-sm transition-all"
            >
              <h3 className="font-medium text-gray-900 mb-1">{sub.name}</h3>
              <p className="text-sm text-gray-500">
                {sub.articleCount} article{sub.articleCount !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Articles List */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Articles</h2>
        </div>
        
        {loadingArticles ? (
          <div className="p-8 text-center text-gray-500">Loading articles...</div>
        ) : articles && articles.length > 0 ? (
          <div className="divide-y">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/portal/knowledge-base/articles/${article.slug}`}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.viewCount} views
                    </span>
                    {article.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No articles in this category yet.
          </div>
        )}
      </div>
    </div>
  );
};

// Article Detail Page
export const KnowledgeBaseArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug || '');
  const submitFeedback = useSubmitArticleFeedback();
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);

  const handleFeedback = async (isHelpful: boolean) => {
    if (feedbackSubmitted || !article) return;
    
    try {
      await submitFeedback.mutateAsync({
        articleId: article.id,
        data: { isHelpful }
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!article) {
    return <NotFoundState message="Article not found" />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link to="/portal/knowledge-base" className="hover:text-gray-600">
          Knowledge Base
        </Link>
        <ChevronRight className="h-4 w-4" />
        {article.categoryName && (
          <>
            <span className="text-gray-600">{article.categoryName}</span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-gray-900 line-clamp-1">{article.title}</span>
      </nav>

      {/* Back Link */}
      <Link 
        to="/portal/knowledge-base"
        className="inline-flex items-center gap-2 text-gray-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge Base
      </Link>

      {/* Article Card */}
      <article className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            {article.categoryName && (
              <span className="text-xs px-2 py-1 bg-red-100 text-gray-700 rounded-full">
                {article.categoryName}
              </span>
            )}
            {article.isFeatured && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {article.authorName && (
              <span>By {article.authorName}</span>
            )}
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.viewCount} views
            </span>
          </div>
        </div>

        {/* Summary */}
        {article.summary && (
          <div className="p-6 bg-red-50 border-b">
            <p className="text-gray-700 italic">{article.summary}</p>
          </div>
        )}

        {/* Content */}
        <div 
          className="p-6 prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && (
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {article.tags.split(',').map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Feedback */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Was this helpful?</span>
              {feedbackSubmitted ? (
                <span className="text-sm text-green-600 font-medium">
                  Thanks for your feedback!
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">Yes ({article.helpfulCount})</span>
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-sm">No ({article.notHelpfulCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share Article
            </button>
          </div>
        </div>
      </article>

      {/* Still Need Help? */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
        <p className="text-gray-100 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <Link
          to="/portal/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
        >
          Submit a Support Request
        </Link>
      </div>
    </div>
  );
};

// Loading State Component
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
  </div>
);

// Not Found State Component
const NotFoundState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-12">
    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <p className="text-gray-500 mb-4">{message}</p>
    <Link
      to="/portal/knowledge-base"
      className="text-gray-600 hover:underline"
    >
      Back to Knowledge Base
    </Link>
  </div>
);

export default KnowledgeBaseCategoriesPage;
