import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // base: '/support-staging/', // REMOVED - folder itself is at /support-staging/
    server: {
      port: 5175,
      proxy: {
        '/api': {
          target: 'http://localhost:5016',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/training': path.resolve(__dirname, './src/modules/training'),
        '@/ticketing': path.resolve(__dirname, './src/modules/ticketing'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@api': path.resolve(__dirname, './src/api'),
        '@components': path.resolve(__dirname, './src/components'),
      },
    },
  };
});
