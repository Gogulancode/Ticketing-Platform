import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  Package,
  BarChart3,
  Users,
  FileText,
  Image,
  File,
  Ship,
  Archive
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getModules, getCurrentUser } from '../lib/api';

const iconMap = {
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  Package,
  BarChart3,
  Users,
  Ship,      // ✅ added
  Archive    // ✅ added
};

const fileTypeIcons = {
  pdf: FileText,
  doc: File,
  image: Image,
  scribe: FileText
};

const Dashboard: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getModules(),
      getCurrentUser()
    ])
      .then(([modulesData, userData]) => {
        setModules(modulesData);
        setCurrentUser(userData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Show skeleton UI while loading
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="h-16 bg-gray-100 rounded-lg" />
            <div className="h-16 bg-gray-100 rounded-lg" />
            <div className="h-16 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-100 rounded-lg" />
            <div className="h-40 bg-gray-100 rounded-lg" />
            <div className="h-40 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedModules = modules.filter((m: any) => m.progress >= 100).length;
  const inProgressModules = modules.filter((m: any) => m.progress > 0 && m.progress < 100).length;

  // TODO: Replace with real API call for uploads
  type Upload = {
    id: string;
    title: string;
    description: string;
    type: keyof typeof fileTypeIcons;
    module: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  const recentUploads: Upload[] = [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {currentUser?.name || 'User'}!
        </h1>
        <p className="text-gray-600">
          You're logged in as <span className="font-medium text-gray-600">{currentUser?.role || 'User'}</span>.
          Continue your training journey or explore new modules.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Completed Modules</h3>
            <p className="text-2xl font-bold text-gray-600 mt-1">{completedModules}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="font-medium text-orange-900">In Progress</h3>
            <p className="text-2xl font-bold text-orange-600 mt-1">{inProgressModules}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-900">Total Modules</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">{modules.length}</p>
          </div>
        </div>
      </div>

      {/* My Modules Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.slice(0, 6).map((module: any) => {
            const IconComponent =
              iconMap[module.icon as keyof typeof iconMap] || File;

            const moduleLink = `/modules/${module.id}`; // generalized route

            return (
              <Link
                to={moduleLink}
                key={module.id}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    {IconComponent && (
                      <IconComponent className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  {module.progress >= 100 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Completed
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{module.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{module.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{module.difficulty}</span>
                    <span>{module.estimatedTime}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Uploads Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Uploads</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {recentUploads.map((upload) => {
              const FileIcon = fileTypeIcons[upload.type] || File;

              return (
                <div key={upload.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{upload.title}</h3>
                        <p className="text-sm text-gray-600">{upload.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="px-2 py-1 bg-red-100 text-gray-800 text-xs font-medium rounded-full">
                            {upload.module}
                          </span>
                          <span className="text-xs text-gray-500">
                            by {upload.uploadedBy} • {upload.uploadedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-red-50 rounded-lg transition-colors">
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
