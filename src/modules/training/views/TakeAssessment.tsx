
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  Save,
  Send
} from 'lucide-react';
import { getAssessment } from '../../../shared/lib/api';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  questions: Question[];
  passingScore: number;
}


// ...existing code...

const TakeAssessment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(mockAssessment.timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Calculate score and redirect to results
    setTimeout(() => {
      navigate(`/assessments/${id}/results`, { 
        state: { 
          answers, 
          timeSpent: (assessment ? assessment.timeLimit * 60 : 0) - timeRemaining 
        } 
      });
    }, 1000);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const currentQ = assessment ? assessment.questions[currentQuestion] : null;
  const isLastQuestion = assessment ? currentQuestion === assessment.questions.length - 1 : false;
  const isFirstQuestion = currentQuestion === 0;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Submitted!</h2>
          <p className="text-gray-600">Processing your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/assessments')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{assessment?.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {assessment?.questions.length ?? 0}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Answered: {getAnsweredCount()}/{assessment?.questions.length ?? 0}</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 sticky top-6">
              <h3 className="font-medium text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                {assessment?.questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`
                      relative p-3 text-sm font-medium rounded-lg transition-colors
                      ${index === currentQuestion 
                        ? 'bg-blue-600 text-white' 
                        : answers[q.id] 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {index + 1}
                    {flaggedQuestions.has(q.id) && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 space-y-2 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-100 rounded"></div>
                  <span>Not answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {currentQ && (
                    <>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {currentQ.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-sm text-gray-500">{currentQ.points} points</span>
                      <h2 className="text-lg font-medium text-gray-900">{currentQ.question}</h2>
                    </>
                  )}
                </div>
                <button
                  onClick={() => currentQ && toggleFlag(currentQ.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentQ.id)
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-8">
                {currentQ?.type === 'multiple-choice' && currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <label
                        key={index}
                        className={`
                          flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                          ${answers[currentQ.id] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={currentQ.id}
                          value={option}
                          checked={answers[currentQ.id] === option}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          className="sr-only"
                        />
                        <div className={`
                          w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                          ${answers[currentQ.id] === option
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {answers[currentQ.id] === option && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQ?.type === 'true-false' && (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className={`
                          flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                          ${answers[currentQ.id] === option.toLowerCase()
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={currentQ.id}
                          value={option.toLowerCase()}
                          checked={answers[currentQ.id] === option.toLowerCase()}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          className="sr-only"
                        />
                        <div className={`
                          w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                          ${answers[currentQ.id] === option.toLowerCase()
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {answers[currentQ.id] === option.toLowerCase() && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQ?.type === 'short-answer' && (
                  <textarea
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={isFirstQuestion}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors
                    ${isFirstQuestion
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {/* Save progress */}}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </button>

                  {isLastQuestion ? (
                    <button
                      onClick={() => setShowConfirmSubmit(true)}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Assessment
                    </button>
                  ) : (
                    <button
                    onClick={() => setCurrentQuestion(assessment ? Math.min(assessment.questions.length - 1, currentQuestion + 1) : currentQuestion)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Submit Assessment?</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                You have answered {getAnsweredCount()} out of {assessment?.questions.length ?? 0} questions.
              </p>
              {assessment && getAnsweredCount() < assessment.questions.length && (
                <p className="text-orange-600 text-sm">
                  You have {assessment.questions.length - getAnsweredCount()} unanswered questions.
                </p>
              )}
              <p className="text-gray-600">
                Once submitted, you cannot change your answers.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeAssessment;