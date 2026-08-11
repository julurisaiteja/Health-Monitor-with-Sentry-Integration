'use strict';

// Load environment variables FIRST before any other imports
require('dotenv').config();

const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// ─── Sentry Initialization ────────────────────────────────────────────────────
// IMPORTANT: Sentry.init() must be called before any other code
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE || 'health-monitor-backend@1.1.1',
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Profiling
  profilesSampleRate: 1.0,
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
});

const express = require('express');
const cors = require('cors');
const itemsRouter = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
// The Sentry request handler must be the FIRST middleware
app.use(Sentry.expressErrorHandler ? Sentry.expressErrorHandler() : (req, res, next) => next());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'sentry-trace', 'baggage'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logging middleware ───────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.SENTRY_RELEASE || 'health-monitor-backend@1.1.1',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/items', itemsRouter);

// ─── v1.0.0 Error Simulation Endpoint ────────────────────────────────────────
// Triggers an unhandled async rejection for v1.0.0 testing
app.get('/api/debug/async-error', async (req, res) => {
  console.log('[DEBUG] Triggering unhandled async rejection for v1.0.0 testing...');
  // Intentional: simulate an unhandled async rejection
  Promise.reject(new Error('Intentional Async Rejection! - v1.0.0 Backend Error'));
  // Send response before the rejection propagates
  res.json({ message: 'Async rejection triggered. Check Sentry for the error.' });
});

// ─── v1.0.0 Sync Error Simulation Endpoint ───────────────────────────────────
app.get('/api/debug/sync-error', (req, res, next) => {
  console.log('[DEBUG] Triggering synchronous unhandled exception for v1.0.0 testing...');
  try {
    // Intentional: trigger an unhandled exception in backend
    throw new Error('Intentional Unhandled Backend Exception! - v1.0.0 Error');
  } catch (err) {
    // Pass to Sentry error handler
    next(err);
  }
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.url });
});

// ─── Sentry Error Handler ─────────────────────────────────────────────────────
// The Sentry error handler MUST be before any other error middleware
if (Sentry.expressErrorHandler) {
  app.use(Sentry.expressErrorHandler());
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    sentryEventId: res.sentry,
  });
});

// ─── Unhandled Rejection Handler ─────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
  // Sentry will automatically capture this via its Node integration
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Health Monitor Backend running on http://localhost:${PORT}`);
  console.log(`📊 Release: ${process.env.SENTRY_RELEASE || 'health-monitor-backend@1.1.1'}`);
  console.log(`🔍 Sentry DSN configured: ${!!process.env.SENTRY_DSN}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET    http://localhost:${PORT}/health`);
  console.log(`  GET    http://localhost:${PORT}/api/items`);
  console.log(`  GET    http://localhost:${PORT}/api/items/:id`);
  console.log(`  POST   http://localhost:${PORT}/api/items`);
  console.log(`  PUT    http://localhost:${PORT}/api/items/:id`);
  console.log(`  DELETE http://localhost:${PORT}/api/items/:id`);
  console.log(`  GET    http://localhost:${PORT}/api/debug/async-error`);
  console.log(`  GET    http://localhost:${PORT}/api/debug/sync-error\n`);
});

module.exports = app;
