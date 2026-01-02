// Dynamic app configuration based on build environment
export default ({ config }) => {
  // Get environment from EAS build env var (set in eas.json)
  const environment = process.env.ENVIRONMENT || 'development';
  
  console.log('Building with environment:', environment);
  
  return {
    ...config,
    extra: {
      ...config.extra,
      environment: environment, // This will be 'staging' for preview builds
      apiUrls: {
        development: 'http://10.0.2.2:5016',
        staging: 'https://enrichbeauty.solutionsnextwave.com/api',
        production: 'https://support.yourcompany.com/api',
      },
      eas: {
        projectId: 'a20ffd82-abd9-495a-b145-8217216b08e6',
      },
    },
  };
};
