// Environment configuration for API URLs
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface EnvironmentConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
}

// Determine environment from EAS build or fallback to development
const getEnvironmentFromBuild = (): 'development' | 'staging' | 'production' => {
  // Check EAS build environment variables first (set during build)
  // In EAS builds, process.env.ENVIRONMENT is baked in at build time
  const buildEnv = process.env.ENVIRONMENT;
  
  // Also check expo config extra
  const extraEnv = Constants.expoConfig?.extra?.environment;
  
  const easEnv = buildEnv || extraEnv || 'development';
  
  console.log('Environment detection:', { buildEnv, extraEnv, easEnv });
  
  if (easEnv === 'production') return 'production';
  if (easEnv === 'staging' || easEnv === 'preview') return 'staging';
  return 'development';
};

const ENV = getEnvironmentFromBuild();

// Try to get URL from app.json extra.apiUrls first
const getApiUrlFromConfig = (env: 'development' | 'staging' | 'production'): string | undefined => {
  const apiUrls = Constants.expoConfig?.extra?.apiUrls;
  if (apiUrls && apiUrls[env]) {
    return apiUrls[env];
  }
  return undefined;
};

const environments: Record<'development' | 'staging' | 'production', EnvironmentConfig> = {
  development: {
    apiUrl: getApiUrlFromConfig('development') || Platform.select({
      android: 'http://10.0.2.2:5016', // Android emulator localhost
      ios: 'http://localhost:5016',     // iOS simulator
      web: 'http://localhost:5016',     // Web
      default: 'http://localhost:5016',
    }) as string,
    environment: 'development',
  },
  staging: {
    apiUrl: getApiUrlFromConfig('staging') || 'https://enrichbeauty.solutionsnextwave.com/api',
    environment: 'staging',
  },
  production: {
    apiUrl: getApiUrlFromConfig('production') || 'https://support.yourcompany.com/api',
    environment: 'production',
  },
};

const getEnvironmentConfig = (): EnvironmentConfig => {
  return environments[ENV];
};

export const { apiUrl, environment } = getEnvironmentConfig();

export default {
  apiUrl,
  environment,
  isDevelopment: environment === 'development',
  isStaging: environment === 'staging',
  isProduction: environment === 'production',
};
