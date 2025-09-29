import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, PlayCircle, Clock, AlertCircle } from 'lucide-react';

interface Section {
  id: number;
  title: string;
  description: string;
  moduleId: number;
  order: number;
  isActive: boolean;
  erpSectionId?: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  isActive: boolean;
}

interface Module {
  id: number;
  title: string;
  category: string;
}

const SectionView: React.FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [section, setSection] = useState<Section | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sectionId) {
      fetchSectionData();
    }
  }, [sectionId]);

  const fetchSectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch section details
      const sectionResponse = await fetch(`http://localhost:5015/api/Modules/sections/${sectionId}`);
      if (!sectionResponse.ok) {
        throw new Error('Failed to fetch section details');
      }
      const sectionData = await sectionResponse.json();
      setSection(sectionData);

      // Fetch module details
      const moduleResponse = await fetch(`http://localhost:5015/api/Modules/${sectionData.moduleId}`);
      if (moduleResponse.ok) {
        const moduleData = await moduleResponse.json();
        setModule(moduleData);
      }

      // Fetch lessons for this section
      try {
        const lessonsResponse = await fetch(`http://localhost:5015/api/Modules/sections/${sectionId}/lessons`);
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData);
        } else {
          // No lessons found, set empty array
          setLessons([]);
        }
      } catch (err) {
        console.log('No lessons found for this section');
        setLessons([]);
      }

    } catch (err) {
      console.error('Error fetching section data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load section');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm leading-snug space-y-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-xs"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-sm"></div>
          <div className="space-y-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="text-sm leading-snug space-y-sm">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-xs" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Section Not Found</h3>
          <p className="text-gray-600 mb-xs">
            {error || 'The section you are looking for could not be found.'}
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
    <div className="text-sm leading-snug space-y-sm">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-sm">
        <Link to="/modules" className="hover:text-blue-600 transition-colors">
          Modules
        </Link>
        <span>/</span>
        {module && (
          <>
            <Link to={`/modules/${section.moduleId}`} className="hover:text-blue-600 transition-colors">
              {module.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{section.title}</span>
      </div>

      {/* Section Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-sm mb-sm">
        <div className="flex items-start justify-between mb-xs">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{section.title}</h1>
              {section.erpSectionId ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  ERP Content
                </span>
              ) : (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  Custom Content
                </span>
              )}
              {!section.isActive && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  Disabled
                </span>
              )}
            </div>
            {section.description && (
              <p className="text-gray-600 text-lg">{section.description}</p>
            )}
          </div>
          <Link
            to={`/modules/${section.moduleId}`}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Module
          </Link>
        </div>

        {module && (
          <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {module.category}
            </span>
            <span>•</span>
            <span>Section {section.order}</span>
            {lessons.length > 0 && (
              <>
                <span>•</span>
                <span>{lessons.length} lessons</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lessons Content */}
      {lessons.length > 0 ? (
        <div className="space-y-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-xs">Lessons</h2>
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-semibold ${lesson.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {lesson.title}
                      </h3>
                      {!lesson.isActive && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className={`mb-3 ${lesson.isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration} minutes
                      </span>
                      <span>•</span>
                      <span>Lesson {lesson.order}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  {lesson.isActive ? (
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Start Lesson
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Disabled
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-xs" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lessons Available</h3>
          <p className="text-gray-600">
            This section doesn't have any lessons yet. Check back later for new content.
          </p>
        </div>
      )}
    </div>
  );
};

export default SectionView;

