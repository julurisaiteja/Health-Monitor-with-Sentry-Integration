import React, { useState, useEffect } from 'react';

const DEFAULT_FORM = {
  title: '',
  content: '',
  priority: 'medium',
  completed: false,
};

export default function NoteForm({ item, onSubmit, onCancel }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        content: item.content || '',
        priority: item.priority || 'medium',
        completed: item.completed || false,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [item]);

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.content.trim()) newErrors.content = 'Content is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(form);
  };

  const isEditing = !!item;

  return (
    <div className="form-overlay">
      <div className="form-card">
        <div className="form-header">
          <h3>{isEditing ? '✏️ Edit Note' : '➕ Create New Note'}</h3>
          <button className="btn-icon" onClick={onCancel} title="Close">✕</button>
        </div>

        <form id="note-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="note-title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              id="note-title"
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={form.title}
              onChange={handleChange}
              placeholder="Enter note title..."
              maxLength={100}
              autoFocus
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="note-content" className="form-label">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="note-content"
              name="content"
              className={`form-textarea ${errors.content ? 'input-error' : ''}`}
              value={form.content}
              onChange={handleChange}
              placeholder="Write your note content..."
              rows={4}
              maxLength={1000}
            />
            {errors.content && <span className="error-text">{errors.content}</span>}
            <span className="char-count">{form.content.length}/1000</span>
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="note-priority" className="form-label">Priority</label>
              <select
                id="note-priority"
                name="priority"
                className="form-select"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div className="form-group form-group-half">
              <label className="form-label">Status</label>
              <label className="toggle-label" htmlFor="note-completed">
                <input
                  id="note-completed"
                  type="checkbox"
                  name="completed"
                  checked={form.completed}
                  onChange={handleChange}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">{form.completed ? 'Completed' : 'Pending'}</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              id="btn-cancel-form"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-form"
              className="btn btn-primary"
            >
              {isEditing ? '💾 Update Note' : '✅ Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
