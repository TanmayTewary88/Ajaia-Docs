const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /documents - list owned + shared documents
router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;

  const owned = db.prepare(`
    SELECT d.*, 'owner' as role, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  const shared = db.prepare(`
    SELECT d.*, ds.permission as role, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON u.id = d.owner_id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  res.json({ owned, shared });
});

// POST /documents - create new document
router.post('/', authenticate, (req, res) => {
  const { title, content } = req.body;
  const id = uuidv4();
  const docTitle = (title || 'Untitled Document').trim();
  const docContent = content || '';

  db.prepare(
    'INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)'
  ).run(id, docTitle, docContent, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json(doc);
});

// GET /documents/:id - get single document
router.get('/:id', authenticate, (req, res) => {
  const doc = db.prepare(`
    SELECT d.*, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const userId = req.user.id;
  const isOwner = doc.owner_id === userId;
  const share = db.prepare(
    'SELECT permission FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, userId);

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const attachments = db.prepare(
    'SELECT id, filename, original_name, mime_type, size, created_at FROM attachments WHERE document_id = ?'
  ).all(req.params.id);

  const shares = isOwner ? db.prepare(`
    SELECT ds.*, u.name, u.email FROM document_shares ds
    JOIN users u ON u.id = ds.shared_with_id
    WHERE ds.document_id = ?
  `).all(req.params.id) : [];

  res.json({
    ...doc,
    role: isOwner ? 'owner' : share.permission,
    attachments,
    shares
  });
});

// PATCH /documents/:id - update document
router.patch('/:id', authenticate, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const userId = req.user.id;
  const isOwner = doc.owner_id === userId;
  const share = db.prepare(
    'SELECT permission FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, userId);

  if (!isOwner && (!share || share.permission === 'view')) {
    return res.status(403).json({ error: 'You do not have edit access' });
  }

  const { title, content } = req.body;
  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title.trim()); }
  if (content !== undefined) { updates.push('content = ?'); values.push(content); }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /documents/:id - delete document (owner only)
router.delete('/:id', authenticate, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the owner can delete this document' });
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ message: 'Document deleted' });
});

// POST /documents/:id/share - share with another user
router.post('/:id/share', authenticate, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the owner can share this document' });
  }

  const { email, permission = 'view' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'Permission must be view or edit' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!targetUser) return res.status(404).json({ error: 'No user found with that email' });
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot share a document with yourself' });
  }

  const existing = db.prepare(
    'SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, targetUser.id);

  if (existing) {
    db.prepare(
      'UPDATE document_shares SET permission = ? WHERE document_id = ? AND shared_with_id = ?'
    ).run(permission, req.params.id, targetUser.id);
  } else {
    db.prepare(
      'INSERT INTO document_shares (id, document_id, shared_with_id, permission) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), req.params.id, targetUser.id, permission);
  }

  res.json({ message: `Shared with ${targetUser.name}`, user: { id: targetUser.id, name: targetUser.name, email: targetUser.email }, permission });
});

// DELETE /documents/:id/share/:userId - revoke share
router.delete('/:id/share/:userId', authenticate, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the owner can manage sharing' });
  }

  db.prepare(
    'DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).run(req.params.id, req.params.userId);

  res.json({ message: 'Access revoked' });
});

module.exports = router;
