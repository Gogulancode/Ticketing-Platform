import React from 'react';
import { Monitor, Smartphone, Apple, Download, CheckCircle, ExternalLink } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

interface AppDownload {
  id: string;
  name: string;
  description: string;
  platform: 'windows' | 'macos' | 'android' | 'ios';
  icon: React.ReactNode;
  downloadUrl: string;
  version: string;
  size: string;
  features: string[];
  isAvailable: boolean;
}

const DownloadsPage: React.FC = () => {
  const apps: AppDownload[] = [
    {
      id: 'desktop-windows',
      name: 'Nivo Chat for Windows',
      description: 'Desktop chat application for real-time messaging and ticket collaboration',
      platform: 'windows',
      icon: <Monitor className="w-8 h-8" />,
      downloadUrl: `${API_CONFIG.BASE_URL}/downloads/desktop/windows`,
      version: '1.0.0',
      size: '~85 MB',
      features: [
        'Real-time messaging with SignalR',
        'Desktop notifications',
        'File sharing & attachments',
        'Ticket integration',
        'Presence status indicators'
      ],
      isAvailable: true
    },
    {
      id: 'desktop-macos',
      name: 'Nivo Chat for macOS',
      description: 'Desktop chat application for Mac users',
      platform: 'macos',
      icon: <Apple className="w-8 h-8" />,
      downloadUrl: `${API_CONFIG.BASE_URL}/downloads/desktop/macos`,
      version: '1.0.0',
      size: '~90 MB',
      features: [
        'Native macOS experience',
        'Real-time messaging',
        'Desktop notifications',
        'File sharing & attachments'
      ],
      isAvailable: false // Coming soon
    },
    {
      id: 'mobile-android',
      name: 'Nivo Support for Android',
      description: 'Mobile support app for creating and managing tickets on the go',
      platform: 'android',
      icon: <Smartphone className="w-8 h-8" />,
      downloadUrl: 'https://play.google.com/store/apps/details?id=com.yourcompany.nivosupport',
      version: '1.0.0',
      size: '~25 MB',
      features: [
        'Create tickets from anywhere',
        'Push notifications',
        'View ticket history',
        'Attach photos & files',
        'Offline support'
      ],
      isAvailable: false // Coming soon
    },
    {
      id: 'mobile-ios',
      name: 'Nivo Support for iOS',
      description: 'Mobile support app for iPhone and iPad users',
      platform: 'ios',
      icon: <Apple className="w-8 h-8" />,
      downloadUrl: 'https://apps.apple.com/app/nivo-support',
      version: '1.0.0',
      size: '~30 MB',
      features: [
        'Native iOS experience',
        'Create tickets from anywhere',
        'Push notifications',
        'Face ID / Touch ID support'
      ],
      isAvailable: false // Coming soon
    }
  ];

  const handleDownload = (app: AppDownload) => {
    if (!app.isAvailable) {
      return;
    }
    
    // For internal downloads, use fetch to get the file
    if (app.downloadUrl.startsWith('/api')) {
      window.location.href = app.downloadUrl;
    } else {
      // For external links (app stores), open in new tab
      window.open(app.downloadUrl, '_blank');
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'windows':
        return 'bg-blue-500';
      case 'macos':
        return 'bg-gray-800';
      case 'android':
        return 'bg-green-500';
      case 'ios':
        return 'bg-gray-800';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Download Apps</h1>
        <p className="text-gray-600">
          Get the Nivo apps for your devices to stay connected and manage support tickets from anywhere.
        </p>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <div
            key={app.id}
            className={`bg-white rounded-xl border ${
              app.isAvailable ? 'border-gray-200' : 'border-gray-100'
            } shadow-sm overflow-hidden ${
              app.isAvailable ? 'hover:shadow-md' : 'opacity-75'
            } transition-shadow`}
          >
            {/* App Header */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`${getPlatformColor(app.platform)} text-white p-3 rounded-xl`}>
                  {app.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                    {!app.isAvailable && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{app.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Version {app.version}</span>
                    <span>•</span>
                    <span>{app.size}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                <ul className="space-y-1">
                  {app.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Download Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => handleDownload(app)}
                disabled={!app.isAvailable}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  app.isAvailable
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {app.downloadUrl.startsWith('/api') ? (
                  <Download className="w-5 h-5" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                <span>
                  {app.isAvailable
                    ? app.downloadUrl.startsWith('/api')
                      ? 'Download Now'
                      : 'Get from Store'
                    : 'Coming Soon'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* System Requirements */}
      <div className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-blue-500" />
              Desktop (Windows)
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Windows 10 or later (64-bit)</li>
              <li>• 4 GB RAM minimum</li>
              <li>• 200 MB available disk space</li>
              <li>• Internet connection required</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-green-500" />
              Mobile (Android/iOS)
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Android 8.0+ or iOS 13.0+</li>
              <li>• 100 MB available storage</li>
              <li>• Internet connection required</li>
              <li>• Push notification permissions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Need help with installation?{' '}
          <button
            onClick={() => window.location.href = '/tickets/new'}
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Create a support ticket
          </button>
        </p>
      </div>
    </div>
  );
};

export default DownloadsPage;
