import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import axios from 'axios';
import NoteList from './components/NoteList.jsx';
import NoteForm from './components/NoteForm.jsx';
import ErrorButtons from './components/ErrorButtons.jsx';

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API_URL = '/api/items';
const DEMO_STORAGE_KEY = 'release-health-monitor-demo-notes-v1';
const DEMO_MODE = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('.workers.dev') ||
  window.location.hostname.endsWith('.pages.dev')
);
const SAMPLE_NOTES = [
  {
    id: 'sample-101',
    title: 'Investigate elevated checkout latency',
    content: 'Review the p95 response-time increase from the latest release and confirm the payment dependency health.',
    priority: 'high',
    completed: false,
    updatedAt: '2026-10-05T09:40:00.000Z',
  },
  {
    id: 'sample-102',
    title: 'Verify Sentry release markers',
    content: 'Check release association and source-map coverage for the current frontend build.',
    priority: 'medium',
    completed: false,
    updatedAt: '2026-10-04T16:15:00.000Z',
  },
  {
    id: 'sample-103',
    title: 'Review alert routing rules',
    content: 'Confirm the on-call channel receives critical error and latency alerts.',
    priority: 'low',
    completed: true,
    updatedAt: '2026-10-03T11:20:00.000Z',
  },
];

function loadDemoNotes() {
  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : SAMPLE_NOTES;
  } catch {
    return SAMPLE_NOTES;
  }
}

function saveDemoNotes(notes) {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Keep the current preview session usable when storage is unavailable.
  }
}

// ─── Sentry Error Boundary Fallback ──────────────────────────────────────────
function ErrorFallback({ error, componentStack, resetError }) {
  return (
    <div className="error-boundary">
      <div className="error-boundary-content">
        <div className="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p className="error-message">{error?.message || 'An unexpected error occurred'}</p>
        <details className="error-details">
          <summary>Stack Trace</summary>
          <pre>{componentStack}</pre>
        </details>
        <button className="btn btn-primary" onClick={resetError}>
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────────────────────
function AppContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');

  // ─── Notification Helper ────────────────────────────────────────────────────
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ─── Fetch All Items ────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (DEMO_MODE) {
      setItems(loadDemoNotes());
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_URL);
      setItems(response.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch notes';
      setError(msg);
      Sentry.captureException(err, {
        tags: { operation: 'fetchItems' },
        extra: { url: API_URL },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Create Item ────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    if (DEMO_MODE) {
      const nextItems = [{ ...formData, id: `sample-${Date.now()}`, updatedAt: new Date().toISOString() }, ...items];
      setItems(nextItems);
      saveDemoNotes(nextItems);
      setShowForm(false);
      showNotification('Sample note saved in this browser.');
      return;
    }

    try {
      const response = await axios.post(API_URL, formData);
      setItems((prev) => [...prev, response.data.data]);
      setShowForm(false);
      showNotification('✅ Note created successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      showNotification(`❌ Error: ${msg}`, 'error');
      Sentry.captureException(err, { tags: { operation: 'createItem' } });
    }
  };

  // ─── Update Item ────────────────────────────────────────────────────────────
  const handleUpdate = async (id, formData) => {
    if (DEMO_MODE) {
      const nextItems = items.map((item) => item.id === id
        ? { ...item, ...formData, updatedAt: new Date().toISOString() }
        : item);
      setItems(nextItems);
      saveDemoNotes(nextItems);
      setEditingItem(null);
      setShowForm(false);
      showNotification('Sample note updated in this browser.');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/${id}`, formData);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? response.data.data : item))
      );
      setEditingItem(null);
      setShowForm(false);
      showNotification('✅ Note updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      showNotification(`❌ Error: ${msg}`, 'error');
      Sentry.captureException(err, { tags: { operation: 'updateItem' } });
    }
  };

  // ─── Delete Item ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (DEMO_MODE) {
      const nextItems = items.filter((item) => item.id !== id);
      setItems(nextItems);
      saveDemoNotes(nextItems);
      showNotification('Sample note deleted from this browser.');
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      showNotification('🗑️ Note deleted successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      showNotification(`❌ Error: ${msg}`, 'error');
      Sentry.captureException(err, { tags: { operation: 'deleteItem' } });
    }
  };

  // ─── Toggle Complete ────────────────────────────────────────────────────────
  const handleToggleComplete = async (item) => {
    await handleUpdate(item.id, { ...item, completed: !item.completed });
  };

  // ─── Edit Item ──────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingItem(null);
    setShowForm(false);
  };

  const handleFormSubmit = (formData) => {
    if (editingItem) {
      handleUpdate(editingItem.id, formData);
    } else {
      handleCreate(formData);
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: items.length,
    completed: items.filter((i) => i.completed).length,
    pending: items.filter((i) => !i.completed).length,
    high: items.filter((i) => i.priority === 'high' && !i.completed).length,
  };

  const release = import.meta.env.VITE_SENTRY_RELEASE || 'health-monitor-frontend@1.1.1';

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-logo">
              <span className="logo-icon">🛡️</span>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">Release Health Monitor</h1>
              <p className="brand-subtitle">Powered by Sentry Integration</p>
            </div>
          </div>
          <div className="header-meta">
            <span className="release-badge">
              <span className="badge-dot"></span>
              {release}
            </span>
          </div>
        </div>
      </header>

      {/* ── Notification ── */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="notification-close">✕</button>
        </div>
      )}

      <main className="main">
        {DEMO_MODE && (
          <div className="demo-notice" role="status">
            <strong>Demo mode</strong>
            <span>Sample notes are editable and saved only in this browser. Sentry test events are simulated locally.</span>
          </div>
        )}
        {/* ── Stats Bar ── */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Notes</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card stat-urgent">
            <div className="stat-number">{stats.high}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          <button
            id="tab-notes"
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            📝 Notes Manager
          </button>
          <button
            id="tab-sentry"
            className={`tab-btn ${activeTab === 'sentry' ? 'active' : ''}`}
            onClick={() => setActiveTab('sentry')}
          >
            🔍 Sentry Error Testing
          </button>
        </div>

        {/* ── Tab: Notes ── */}
        {activeTab === 'notes' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">Your Notes</h2>
              <button
                id="btn-add-note"
                className="btn btn-primary"
                onClick={() => { setEditingItem(null); setShowForm(true); }}
              >
                <span>+</span> Add Note
              </button>
            </div>

            {showForm && (
              <NoteForm
                item={editingItem}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
              />
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading notes...</p>
              </div>
            )}

            {error && !loading && (
              <div className="error-state">
                <p>⚠️ {error}</p>
                <button className="btn btn-secondary" onClick={fetchItems}>Retry</button>
              </div>
            )}

            {!loading && !error && (
              <NoteList
                items={items}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            )}
          </div>
        )}

        {/* ── Tab: Sentry Testing ── */}
        {activeTab === 'sentry' && (
          <div className="tab-content">
            <ErrorButtons showNotification={showNotification} />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Release Health Monitor &copy; 2024 — Built with React + Express + Sentry</p>
        <p className="footer-release">Current Release: <strong>{release}</strong></p>
      </footer>
    </div>
  );
}

// ─── Wrap with Sentry Error Boundary ─────────────────────────────────────────
export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
      <AppContent />
    </Sentry.ErrorBoundary>
  );
}
