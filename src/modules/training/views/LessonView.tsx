import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  isActive: boolean;
  sectionId: number;
}

interface Section {
  id: number;
  title: string;
  moduleId: number;
}

interface Module {
  id: number;
  title: string;
  category: string;
}

const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch lesson details
      const lessonResponse = await fetch(`http://localhost:5015/api/Modules/lessons/${lessonId}`);
      if (!lessonResponse.ok) {
        throw new Error('Failed to fetch lesson details');
      }
      const lessonData = await lessonResponse.json();
      setLesson(lessonData);

      // Fetch section details
      const sectionResponse = await fetch(`http://localhost:5015/api/Modules/sections/${lessonData.sectionId}`);
      if (sectionResponse.ok) {
        const sectionData = await sectionResponse.json();
        setSection(sectionData);

        // Fetch module details
        const moduleResponse = await fetch(`http://localhost:5015/api/Modules/${sectionData.moduleId}`);
        if (moduleResponse.ok) {
          const moduleData = await moduleResponse.json();
          setModule(moduleData);
        }
      }

    } catch (err) {
      console.error('Error fetching lesson data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = () => {
    setCompleted(true);
    // TODO: Call API to mark lesson as completed for the user
  };

  if (loading) {
    return (
      <div className="text-sm leading-snug space-y-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-xs"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-sm"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="text-sm leading-snug space-y-sm">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-xs" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Found</h3>
          <p className="text-gray-600 mb-xs">
            {error || 'The lesson you are looking for could not be found.'}
          </p>
          <Link
            to="/modules"
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-sm">
        <Link to="/modules" className="hover:text-blue-600 transition-colors">
          Modules
        </Link>
        <span>/</span>
        {module && (
          <>
            <Link to={`/modules/${module.id}`} className="hover:text-blue-600 transition-colors">
              {module.title}
            </Link>
            <span>/</span>
          </>
        )}
        {section && (
          <>
            <Link to={`/sections/${section.id}`} className="hover:text-blue-600 transition-colors">
              {section.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{lesson.title}</span>
      </div>

      {/* Lesson Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-sm mb-sm">
        <div className="flex items-start justify-between mb-xs">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
              {completed && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </span>
              )}
              {!lesson.isActive && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  Disabled
                </span>
              )}
            </div>
            {lesson.description && (
              <p className="text-gray-600 text-lg">{lesson.description}</p>
            )}
          </div>
          {section && (
            <Link
              to={`/sections/${section.id}`}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Section
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lesson.duration} minutes
          </span>
          <span>•</span>
          <span>Lesson {lesson.order}</span>
          {module && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {module.category}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="text-sm leading-snug space-y-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-xs flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Lesson Content
          </h2>
          
          <div className="prose max-w-none">
            {lesson.content ? (
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-xs" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Content Available</h3>
                <p className="text-gray-600">
                  This lesson doesn't have any content yet. Check back later for updates.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {lesson.content && lesson.isActive && (
          <div className="border-t border-gray-200 p-sm bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Estimated reading time: {lesson.duration} minutes
              </div>
              <button
                onClick={handleMarkComplete}
                disabled={completed}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  completed
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {completed ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonView;

