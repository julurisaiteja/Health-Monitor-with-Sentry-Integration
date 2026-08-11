'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Sentry = require('@sentry/node');

const router = express.Router();

// ─── In-Memory Database ───────────────────────────────────────────────────────
// Using an in-memory array as the database (no external DB required per spec)
let items = [
  {
    id: uuidv4(),
    title: 'Welcome to Release Health Monitor',
    content: 'This is your first note. Create, edit, and delete notes using the UI.',
    priority: 'low',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Sentry Integration Active',
    content: 'Sentry is monitoring this application for errors and tracking release health metrics.',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Release v1.1.1 - Bug Fixed',
    content: 'This release fixes the unhandled exception from v1.0.0. Crash-free session rate should improve.',
    priority: 'medium',
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Helper: Find item by ID ──────────────────────────────────────────────────
function findItemById(id) {
  return items.find((item) => item.id === id);
}

// ─── GET /api/items ───────────────────────────────────────────────────────────
// Fetches all items
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    count: items.length,
    data: items,
  });
});

// ─── GET /api/items/:id ───────────────────────────────────────────────────────
// Fetches a single item by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const item = findItemById(id);

  if (!item) {
    return res.status(404).json({
      success: false,
      error: `Item with id '${id}' not found`,
    });
  }

  res.status(200).json({
    success: true,
    data: item,
  });
});

// ─── POST /api/items ──────────────────────────────────────────────────────────
// Creates a new item
router.post('/', (req, res) => {
  const { title, content, priority = 'medium', completed = false } = req.body;

  // Validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Title is required and must be a non-empty string',
    });
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Content is required and must be a non-empty string',
    });
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: `Priority must be one of: ${validPriorities.join(', ')}`,
    });
  }

  const newItem = {
    id: uuidv4(),
    title: title.trim(),
    content: content.trim(),
    priority,
    completed: Boolean(completed),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);

  res.status(201).json({
    success: true,
    data: newItem,
  });
});

// ─── PUT /api/items/:id ───────────────────────────────────────────────────────
// Updates an existing item by ID
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: `Item with id '${id}' not found`,
    });
  }

  const { title, content, priority, completed } = req.body;
  const existingItem = items[itemIndex];

  // Validate priority if provided
  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Priority must be one of: ${validPriorities.join(', ')}`,
      });
    }
  }

  const updatedItem = {
    ...existingItem,
    title: title !== undefined ? title.trim() : existingItem.title,
    content: content !== undefined ? content.trim() : existingItem.content,
    priority: priority !== undefined ? priority : existingItem.priority,
    completed: completed !== undefined ? Boolean(completed) : existingItem.completed,
    updatedAt: new Date().toISOString(),
  };

  items[itemIndex] = updatedItem;

  res.status(200).json({
    success: true,
    data: updatedItem,
  });
});

// ─── DELETE /api/items/:id ────────────────────────────────────────────────────
// Deletes an item by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      error: `Item with id '${id}' not found`,
    });
  }

  items.splice(itemIndex, 1);

  // Return 204 No Content on successful deletion
  res.status(204).send();
});

module.exports = router;
