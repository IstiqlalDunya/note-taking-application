const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('notetaking.sqlite');

db.serialize(() => {
  // Users table
  db.run('DROP TABLE IF EXISTS users');
  db.run(`CREATE TABLE users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // Notes table
  db.run('DROP TABLE IF EXISTS notes');
  db.run(`CREATE TABLE notes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    note_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Insert sample users (password is hashed for production)
  const stmt = db.prepare(`INSERT INTO users(username, email, password) VALUES(?, ?, ?)`);
  stmt.run('john_doe', 'john@example.com', 'password123');
  stmt.run('jane_smith', 'jane@example.com', 'password456');
  stmt.finalize();

  // Insert sample notes
  const noteStmt = db.prepare(`INSERT INTO notes(user_id, title, content, note_date) VALUES(?, ?, ?, ?)`);
  noteStmt.run(1, 'Meeting Notes', 'Discuss project milestones', '2026-04-20');
  noteStmt.run(1, 'Shopping List', 'Milk, eggs, bread', '2026-04-21');
  noteStmt.run(2, 'Workout Plan', '30 min cardio, weights', '2026-04-22');
  noteStmt.finalize();
});

db.close(() => {
  console.log('Database created and initial data inserted.');
});