import React, { useState } from 'react';
import * as Sentry from '@sentry/react';
import axios from 'axios';

// ─── ErrorButtons Component ───────────────────────────────────────────────────
// This component provides buttons to simulate errors for Sentry testing.
// Each button corresponds to a specific release version's error scenario.

export default function ErrorButtons({ showNotification }) {
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => {
    const entry = {
      id: Date.now(),
      msg,
      type,
      time: new Date().toLocaleTimeString(),
    };
    setLog((prev) => [entry, ...prev].slice(0, 20));
  };

  // ──────────────────────────────────────────────────────────────────────────
  // v1.0.0 ERROR #1: Unhandled Frontend Exception
  // This throws a raw Error that is NOT caught → Sentry captures automatically
  // ──────────────────────────────────────────────────────────────────────────
  const triggerUnhandledFrontendException = () => {
    addLog('[v1.0.0] Triggering unhandled frontend exception...', 'warning');
    showNotification('🚨 Triggering unhandled exception! Check Sentry.', 'error');
    // Intentional: this error is NOT caught, Sentry captures it automatically
    setTimeout(() => {
      throw new Error('Intentional Unhandled Exception! - v1.0.0 Frontend Error');
    }, 100);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // v1.0.0 ERROR #2: Backend Async Rejection
  // Calls the backend endpoint that triggers Promise.reject()
  // ──────────────────────────────────────────────────────────────────────────
  const triggerBackendAsyncRejection = async () => {
    addLog('[v1.0.0] Triggering backend async rejection...', 'warning');
    try {
      const res = await axios.get('/api/debug/async-error');
      addLog(`Backend responded: ${res.data.message}`, 'success');
      showNotification('✅ Backend async rejection triggered! Check Sentry.', 'warning');
    } catch (err) {
      addLog(`Backend error: ${err.message}`, 'error');
      showNotification(`❌ Backend error: ${err.message}`, 'error');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // v1.1.0 ERROR: Handled Exception via Sentry.captureException()
  // This is caught in try/catch and reported manually — "handled error"
  // ──────────────────────────────────────────────────────────────────────────
  const triggerHandledError = () => {
    addLog('[v1.1.0] Triggering handled error with captureException...', 'info');
    try {
      // Intentional: simulate a logic error
      const data = null;
      // This will throw a TypeError
      const result = data.property.nested;
      console.log(result);
    } catch (error) {
      // Manually report to Sentry using captureException (v1.1.0 pattern)
      const eventId = Sentry.captureException(error, {
        tags: {
          release: import.meta.env.VITE_SENTRY_RELEASE || 'health-monitor-frontend@1.1.0',
          errorType: 'handled-exception',
          version: 'v1.1.0',
        },
        extra: {
          context: 'ErrorButtons component - triggerHandledError()',
          intentional: true,
        },
      });
      addLog(`✅ Handled error captured! Sentry Event ID: ${eventId}`, 'success');
      showNotification(`✅ Handled error sent to Sentry (ID: ${eventId})`, 'success');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // v1.0.0 FIXED in v1.1.1: This button does NOT throw (bug fixed)
  // ──────────────────────────────────────────────────────────────────────────
  const triggerFixedFeature = () => {
    addLog('[v1.1.1] Bug fixed! This feature now works correctly.', 'success');
    showNotification('✅ v1.1.1: Bug fixed! This feature works correctly now.', 'success');
    // In v1.0.0 this would throw, but in v1.1.1 it is handled gracefully
    try {
      const result = { status: 'success', message: 'Feature working correctly in v1.1.1' };
      addLog(`Feature result: ${JSON.stringify(result)}`, 'success');
    } catch (err) {
      // This block should never execute in v1.1.1
      Sentry.captureException(err, { tags: { unexpected: true } });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ALERT TRIGGER: Trigger many errors rapidly to fire the Sentry alert rule
  // ──────────────────────────────────────────────────────────────────────────
  const triggerAlertFlood = async () => {
    addLog('[ALERT] Flooding errors to trigger alert rule (>5 errors)...', 'warning');
    showNotification('⚡ Sending 6+ errors to trigger alert rule...', 'warning');

    for (let i = 1; i <= 7; i++) {
      try {
        // Each iteration sends a distinct captureException
        Sentry.captureException(
          new Error(`Alert Flood Error #${i} - Threshold Test`),
          {
            tags: {
              alertTest: 'true',
              iteration: String(i),
              release: import.meta.env.VITE_SENTRY_RELEASE || 'health-monitor-frontend@1.1.1',
            },
            extra: {
              purpose: 'Triggering Sentry alert rule threshold (>5 errors in 1 hour)',
              timestamp: new Date().toISOString(),
            },
          }
        );
        addLog(`Sent error #${i} to Sentry`, 'warning');
        // Small delay between captures
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        addLog(`Error sending #${i}: ${err.message}`, 'error');
      }
    }

    addLog('✅ All 7 errors sent! Check Sentry Alerts for notification.', 'success');
    showNotification('✅ 7 errors sent! Check your email/Slack for Sentry alert.', 'success');
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      case 'success': return 'log-success';
      default: return 'log-info';
    }
  };

  return (
    <div className="error-testing">
      <div className="testing-header">
        <h2>🔬 Sentry Error Testing Console</h2>
        <p className="testing-subtitle">
          Use these buttons to simulate errors and verify Sentry integration across releases.
        </p>
      </div>

      {/* ── Release v1.0.0 Errors ── */}
      <div className="testing-section">
        <div className="release-tag release-100">
          <span className="release-dot"></span>
          Release v1.0.0 — Error Simulation
        </div>
        <p className="section-desc">
          These errors simulate the bugs introduced in v1.0.0. They should appear in Sentry
          tagged as <code>health-monitor-frontend@1.0.0</code>.
        </p>
        <div className="btn-group">
          <button
            id="btn-trigger-unhandled"
            className="btn btn-danger btn-lg"
            onClick={triggerUnhandledFrontendException}
          >
            <span className="btn-icon-left">💥</span>
            Trigger Unhandled Exception (v1.0.0)
          </button>
          <button
            id="btn-trigger-async"
            className="btn btn-warning btn-lg"
            onClick={triggerBackendAsyncRejection}
          >
            <span className="btn-icon-left">⚡</span>
            Trigger Backend Async Rejection (v1.0.0)
          </button>
        </div>
      </div>

      {/* ── Release v1.1.0 Errors ── */}
      <div className="testing-section">
        <div className="release-tag release-110">
          <span className="release-dot"></span>
          Release v1.1.0 — Handled Error
        </div>
        <p className="section-desc">
          This simulates a handled error captured manually with{' '}
          <code>Sentry.captureException()</code>. Should appear tagged as{' '}
          <code>health-monitor-frontend@1.1.0</code>.
        </p>
        <div className="btn-group">
          <button
            id="btn-trigger-handled"
            className="btn btn-info btn-lg"
            onClick={triggerHandledError}
          >
            <span className="btn-icon-left">🎯</span>
            Trigger Handled Error (v1.1.0)
          </button>
        </div>
      </div>

      {/* ── Release v1.1.1 Bug Fix ── */}
      <div className="testing-section">
        <div className="release-tag release-111">
          <span className="release-dot"></span>
          Release v1.1.1 — Bug Fixed
        </div>
        <p className="section-desc">
          This demonstrates the bug fix in v1.1.1. The feature that previously crashed now
          works correctly, improving the crash-free session rate.
        </p>
        <div className="btn-group">
          <button
            id="btn-trigger-fixed"
            className="btn btn-success btn-lg"
            onClick={triggerFixedFeature}
          >
            <span className="btn-icon-left">✅</span>
            Test Fixed Feature (v1.1.1)
          </button>
        </div>
      </div>

      {/* ── Alert Trigger ── */}
      <div className="testing-section testing-section-alert">
        <div className="release-tag release-alert">
          <span className="release-dot"></span>
          Alert Rule Testing
        </div>
        <p className="section-desc">
          Sends 7 errors to Sentry in rapid succession to exceed the alert threshold
          (&gt;5 errors in 1 hour) and trigger your configured alert rule.
        </p>
        <div className="btn-group">
          <button
            id="btn-trigger-alert"
            className="btn btn-alert btn-lg"
            onClick={triggerAlertFlood}
          >
            <span className="btn-icon-left">🚨</span>
            Flood Errors to Trigger Alert (7 errors)
          </button>
        </div>
      </div>

      {/* ── Activity Log ── */}
      <div className="activity-log">
        <div className="log-header">
          <h3>📋 Activity Log</h3>
          {log.length > 0 && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setLog([])}
            >
              Clear
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <p className="log-empty">No activity yet. Trigger an error above to see logs.</p>
        ) : (
          <div className="log-list">
            {log.map((entry) => (
              <div key={entry.id} className={`log-entry ${getLogClass(entry.type)}`}>
                <span className="log-time">{entry.time}</span>
                <span className="log-msg">{entry.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
