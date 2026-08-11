import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';

// ─── Sentry Initialization ────────────────────────────────────────────────────
// Must be initialized BEFORE rendering the React app
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE || 'health-monitor-frontend@1.1.1',
  environment: import.meta.env.MODE || 'development',

  integrations: [
    // Browser tracing integration for performance monitoring
    Sentry.browserTracingIntegration(),
    // Session replay for capturing user sessions
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Performance Monitoring - capture 100% of transactions in dev
  tracesSampleRate: 1.0,

  // Session Replay - capture 100% of sessions, 100% of sessions with errors
  // This is essential for release health tracking (crash-free session rate)
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Enable debug logging in development
  debug: import.meta.env.MODE === 'development',

  // Trace propagation to backend
  tracePropagationTargets: [
    'localhost',
    /^http:\/\/localhost:5000/,
    /^\/api/,
  ],
});

// ─── Render React App ─────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
