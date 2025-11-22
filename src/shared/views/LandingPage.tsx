import React from 'react';
import { Link } from 'react-router-dom';
import BusinessHubLogo from '../../components/BusinessHubLogo';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <BusinessHubLogo size="lg" className="mr-4" />
            <div className="text-left">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Business Hub
              </h1>
              <p className="text-lg text-gray-500 font-medium mt-1">
                by Babaji Shivram
              </p>
            </div>
          </div>
          <p className="text-xl text-indigo-600 mb-6 font-semibold">
            Empowering Growth Through Learning & Support
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your business operations with our integrated platform. Access comprehensive training programs, 
            manage support efficiently, and drive organizational excellence with powerful tools designed for modern businesses.
          </p>
        </div>
        
        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Learning Academy - Only show in development */}
          {import.meta.env.VITE_ENABLE_TRAINING_MODULE === 'true' && (
            <Link
              to="/training"
              className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  📚 Learning Academy
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  Accelerate professional growth with our comprehensive training modules. Build skills, 
                  complete assessments, and advance your career with interactive learning experiences.
                </p>
                <div className="flex items-center justify-center text-blue-600 font-semibold group-hover:text-indigo-600 transition-colors">
                  Start Learning 
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

          {/* Support Hub */}
          <Link
            to="/tickets"
            className={`group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2 hover:scale-105 ${
              import.meta.env.VITE_ENABLE_TRAINING_MODULE !== 'true' ? 'md:col-span-2 max-w-xl mx-auto' : ''
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                🛠️ Support Hub
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Streamline your support operations with intelligent ticket management. Track issues, 
                collaborate with teams, and deliver exceptional service with our advanced tools.
              </p>
              <div className="flex items-center justify-center text-green-600 font-semibold group-hover:text-emerald-600 transition-colors">
                Manage Support
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
