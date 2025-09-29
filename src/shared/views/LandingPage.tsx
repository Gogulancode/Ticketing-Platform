import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          ERP Training Platform
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Welcome to our comprehensive training platform. Choose your destination to get started.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Training Modules - Only show in development */}
          {import.meta.env.VITE_ENABLE_TRAINING_MODULE === 'true' && (
            <Link 
              to="/training"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors duration-200 block"
            >
              <h3 className="text-xl mb-2">Training Modules</h3>
              <p className="text-blue-100">Access learning modules and assessments</p>
            </Link>
          )}
          
          <Link 
            to="/tickets"
            className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors duration-200 block ${
              import.meta.env.VITE_ENABLE_TRAINING_MODULE !== 'true' ? 'md:col-span-2 max-w-md mx-auto' : ''
            }`}
          >
            <h3 className="text-xl mb-2">Ticketing System</h3>
            <p className="text-green-100">Manage support tickets and requests</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
