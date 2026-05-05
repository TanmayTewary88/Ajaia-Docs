const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported: .txt, .md, .docx, images`));
    }
  }
});

// POST /upload/import - import file as new document
router.post('/import', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let title = path.basename(req.file.originalname, path.extname(req.file.originalname));
    let content = '';

    if (req.file.mimetype === 'text/plain' || req.file.mimetype === 'text/markdown') {
      const text = fs.readFileSync(req.file.path, 'utf8');
      // Convert plain text to basic HTML
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      content = escaped.split('\n').map(line => {
        if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith('- ') || line.startsWith('* ')) return `<li>${line.slice(2)}</li>`;
        if (line.trim() === '') return '';
        return `<p>${line}</p>`;
      }).join('');
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.convertToHtml({ path: req.file.path });
      content = result.value;
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'This file type cannot be imported as a document. Use .txt, .md, or .docx files.' });
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    const docId = uuidv4();
    db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)').run(
      docId, title, content, req.user.id
    );

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    res.status(201).json({ document: doc, message: `Imported "${req.file.originalname}" successfully` });

  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

// POST /upload/attach/:docId - attach file to a document
router.post('/attach/:docId', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.docId);
  if (!doc) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Document not found' });
  }

  const userId = req.user.id;
  const isOwner = doc.owner_id === userId;
  const share = db.prepare(
    'SELECT permission FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.docId, userId);

  if (!isOwner && (!share || share.permission === 'view')) {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Edit access required to attach files' });
  }

  const attachId = uuidv4();
  db.prepare(
    'INSERT INTO attachments (id, document_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(attachId, req.params.docId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  res.status(201).json({
    id: attachId,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    size: req.file.size
  });
});

// GET /upload/file/:filename - serve uploaded file
router.get('/file/:filename', authenticate, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

// DELETE /upload/attach/:attachId
router.delete('/attach/:attachId', authenticate, (req, res) => {
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.attachId);
  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(attachment.document_id);
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the document owner can remove attachments' });
  }

  const filePath = path.join(UPLOAD_DIR, attachment.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.attachId);
  res.json({ message: 'Attachment removed' });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  res.status(400).json({ error: err.message });
});

module.exports = router;
