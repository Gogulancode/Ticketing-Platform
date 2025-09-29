import React from 'react';
import { CheckCircle, Award, TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getModules } from '../../../shared/lib/api';

const Progress: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  // Removed unused loading state

  useEffect(() => {
    getModules().then((data) => {
      setModules(data || []);
    });
  }, []);

  // Calculate progress stats
  const completedModules = modules.filter(m => m.isCompleted).length;
  const inProgressModules = modules.filter(m => m.completionRate > 0 && !m.isCompleted).length;
  const notStartedModules = modules.filter(m => m.completionRate === 0).length;
  const overallProgress = modules.length > 0
    ? Math.round(
        modules.reduce((acc, m) => acc + (m.completionRate || 0), 0) / modules.length
      )
    : 0;

  return (
    <>
      <div className="space-y-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
            <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-sm mb-sm">
          <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedModules}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressModules}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-purple-600">{overallProgress}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Started</p>
                <p className="text-2xl font-bold text-gray-600">{notStartedModules}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Award className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Module Progress */}
          <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-xs">Module Progress</h2>
            
            <div className="space-y-sm">
              {modules.map(module => (
                <div key={module.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{module.title}</h3>
                    <div className="flex items-center space-x-2">
                      {module.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <span className="text-sm font-medium text-gray-600">
                        {module.completionRate}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        module.isCompleted ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${module.completionRate}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-end text-xs text-gray-500">
                    <span>{module.estimatedTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-xs flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </h2>
            
            <div className="space-y-sm">
              {/* TODO: recentActivity and getActivityIcon need to be implemented or removed */}
            </div>
            
            <button className="w-full mt-xs px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
              View All Activity
            </button>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg p-sm shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-xs flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Achievements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">First Module Complete</h3>
                <p className="text-sm text-green-700">Completed your first training module</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Quick Learner</h3>
                <p className="text-sm text-blue-700">Completed a module in under 1 hour</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-full mr-4">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-purple-900">Dedicated Learner</h3>
                <p className="text-sm text-purple-700">50% overall progress achieved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Progress;
