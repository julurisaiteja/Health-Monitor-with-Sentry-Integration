import React from 'react';

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const PRIORITY_LABELS = {
  high: '🔴 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
};

function NoteCard({ item, onEdit, onDelete, onToggleComplete }) {
  const handleDelete = () => {
    if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      onDelete(item.id);
    }
  };

  const formattedDate = new Date(item.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`note-card ${item.completed ? 'note-completed' : ''} priority-${item.priority}`}>
      <div className="note-header">
        <div className="note-title-row">
          <button
            className={`checkbox ${item.completed ? 'checked' : ''}`}
            onClick={() => onToggleComplete(item)}
            title={item.completed ? 'Mark as pending' : 'Mark as complete'}
            id={`toggle-${item.id}`}
          >
            {item.completed ? '✓' : ''}
          </button>
          <h3 className={`note-title ${item.completed ? 'line-through' : ''}`}>
            {item.title}
          </h3>
        </div>
        <span
          className="priority-badge"
          style={{ '--priority-color': PRIORITY_COLORS[item.priority] }}
        >
          {PRIORITY_LABELS[item.priority]}
        </span>
      </div>

      <p className="note-content">{item.content}</p>

      <div className="note-footer">
        <span className="note-date">Updated: {formattedDate}</span>
        <div className="note-actions">
          <button
            id={`edit-${item.id}`}
            className="btn btn-sm btn-secondary"
            onClick={() => onEdit(item)}
          >
            ✏️ Edit
          </button>
          <button
            id={`delete-${item.id}`}
            className="btn btn-sm btn-danger"
            onClick={handleDelete}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NoteList({ items, onEdit, onDelete, onToggleComplete }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No notes yet</h3>
        <p>Click "Add Note" to create your first note.</p>
      </div>
    );
  }

  return (
    <div className="note-grid">
      {items.map((item) => (
        <NoteCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  );
}
