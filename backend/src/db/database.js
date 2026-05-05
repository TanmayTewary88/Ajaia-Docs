const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../data/ajaia.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      content TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      shared_with_id TEXT NOT NULL,
      permission TEXT NOT NULL DEFAULT 'view',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(document_id, shared_with_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  // Seed demo users
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count === 0) {
    const hash1 = bcrypt.hashSync('password123', 10);
    const hash2 = bcrypt.hashSync('password123', 10);
    const hash3 = bcrypt.hashSync('password123', 10);

    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(
      'user-alice', 'alice@demo.com', 'Alice Johnson', hash1
    );
    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(
      'user-bob', 'bob@demo.com', 'Bob Smith', hash2
    );
    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(
      'user-carol', 'carol@demo.com', 'Carol White', hash3
    );

    // Seed a sample document for Alice
    db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)').run(
      'doc-welcome',
      'Welcome to AjaiaDocs',
      '<h1>Welcome to AjaiaDocs! 👋</h1><p>This is your collaborative document editor. Here\'s what you can do:</p><ul><li><strong>Create</strong> new documents from the sidebar</li><li><em>Edit</em> with rich text formatting</li><li><u>Share</u> documents with other users</li><li>Upload files to import content</li></ul><h2>Getting Started</h2><p>Click <strong>New Document</strong> to create your first document, or try editing this one!</p>',
      'user-alice'
    );

    // Share welcome doc with Bob
    db.prepare('INSERT INTO document_shares (id, document_id, shared_with_id, permission) VALUES (?, ?, ?, ?)').run(
      'share-1', 'doc-welcome', 'user-bob', 'edit'
    );

    console.log('✅ Database seeded with demo users:');
    console.log('   alice@demo.com / password123');
    console.log('   bob@demo.com   / password123');
    console.log('   carol@demo.com / password123');
  }
}

module.exports = { db, initializeDatabase };
