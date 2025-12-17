// Environment configuration for API URLs
import { Platform } from 'react-native';

interface EnvironmentConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
}

// Determine environment - for now, hardcode to development
// Change to 'production' when deploying
const ENV: 'development' | 'staging' | 'production' = 'development';

const environments: Record<'development' | 'staging' | 'production', EnvironmentConfig> = {
  development: {
    apiUrl: Platform.select({
      android: 'http://10.0.2.2:5016', // Android emulator localhost
      ios: 'http://localhost:5016',     // iOS simulator
      web: 'http://localhost:5016',     // Web
      default: 'http://localhost:5016',
    }) as string,
    environment: 'development',
  },
  staging: {
    apiUrl: 'https://staging-api.babajishivram.com', // Replace with your staging URL
    environment: 'staging',
  },
  production: {
    apiUrl: 'https://api.babajishivram.com', // Replace with your production URL
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
