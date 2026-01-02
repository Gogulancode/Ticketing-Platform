import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// StrictMode disabled in development to prevent double API calls
// In production, React doesn't double-render anyway
createRoot(document.getElementById('root')!).render(
  <App />
);
