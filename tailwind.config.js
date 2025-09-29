/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        xs: '0.75rem',
        sm: '0.8125rem',   // 13px
        base: '0.875rem',  // 14px (global default via base layer)
        lg: '1rem',        // 16px
        xl: '1.125rem',    // 18px
      },
      lineHeight: {
        tight: '1.15',
        snug: '1.25',
      },
      spacing: {
        xs: '0.25rem',  // 4px
        sm: '0.5rem',   // 8px
        md: '0.75rem',  // 12px
      },
    },
  },
  plugins: [],
};
