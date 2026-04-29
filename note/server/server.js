const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const DB_PATH = path.join(__dirname, 'notetaking.sqlite');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Pretty JSON
app.set('json spaces', 2);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

// ===== DATABASE =====
function getDb() {
  const db = new sqlite3.Database(DB_PATH);
  return db;
}

function initDB() {
  const db = getDb();
  
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notes(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      note_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  });

  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (row && row.count === 0) {
      console.log('Inserting sample users...');
      const stmt = db.prepare('INSERT INTO users(username, email, password) VALUES(?,?,?)');
      stmt.run('john_doe', 'john@example.com', 'password123');
      stmt.run('jane_smith', 'jane@example.com', 'password456');
      stmt.run('test', 'test@test.com', 'test');
      stmt.finalize();

      setTimeout(() => {
        const noteStmt = db.prepare('INSERT INTO notes(user_id, title, content, note_date) VALUES(?,?,?,?)');
        noteStmt.run(1, 'Meeting Notes', 'Discuss project milestones', '2026-04-20');
        noteStmt.run(1, 'Shopping List', 'Milk, eggs, bread', '2026-04-21');
        noteStmt.run(2, 'Workout Plan', 'Cardio and weights', '2026-04-22');
        noteStmt.run(3, 'Project Ideas', 'Brainstorm features', '2026-04-23');
        noteStmt.finalize();
        console.log('Sample data created');
      }, 500);
    }
    db.close();
  });
}

initDB();

// ===== TEST ROUTE =====
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// ===== AUTH ROUTES =====
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const db = getDb();
  db.get('SELECT id FROM users WHERE username=? OR email=?', [username, email], (err, row) => {
    if (err) { db.close(); return res.status(500).json({ error: err.message }); }
    if (row) { db.close(); return res.status(400).json({ error: 'Username or email exists' }); }
    
    db.run('INSERT INTO users(username, email, password) VALUES(?,?,?)',
      [username, email, password], function(err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, username, email });
      });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDb();
  db.get('SELECT id, username, email FROM users WHERE (username=? OR email=?) AND password=?',
    [username, username, password], (err, row) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Invalid credentials' });
      res.json({ id: row.id, username: row.username, email: row.email });
    });
});

// ===== USER PROFILE ROUTES =====


// Get all users (for admin/debug purposes)
app.get('/api/users', (req, res) => {
  const db = getDb();
  db.all('SELECT id, username, email, password, created_at FROM users ORDER BY id', [], (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(rows || []);
  });
});

// Get user profile with note count
app.get('/api/users/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT id, username, email, password, created_at FROM users WHERE id=?', [req.params.id], (err, user) => {
    if (err) { db.close(); return res.status(500).json({ error: err.message }); }
    if (!user) { db.close(); return res.status(404).json({ error: 'User not found' }); }
    
    // Get note count
    db.get('SELECT COUNT(*) as count FROM notes WHERE user_id=?', [req.params.id], (err2, row) => {
      db.close();
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        noteCount: row ? row.count : 0
      });
    });
  });
});

// Update user profile
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, currentPassword, newPassword } = req.body;
  
  console.log('Update request body:', JSON.stringify({ ...req.body, currentPassword: '***', newPassword: '***' }));

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required' });
  }

  const db = getDb();

  // Verify user exists and password is correct
  db.get('SELECT * FROM users WHERE id=?', [id], (err, user) => {
    if (err) { db.close(); return res.status(500).json({ error: 'Database error: ' + err.message }); }
    if (!user) { db.close(); return res.status(404).json({ error: 'User not found' }); }

    if (user.password !== currentPassword) {
      db.close();
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check username/email uniqueness
    db.get('SELECT id FROM users WHERE (username=? OR email=?) AND id!=?',
      [username, email, id], (err, existing) => {
        if (err) { db.close(); return res.status(500).json({ error: err.message }); }
        
        if (existing) {
          db.close();
          if (existing.username === username) {
            return res.status(400).json({ error: 'Username already taken' });
          }
          return res.status(400).json({ error: 'Email already taken' });
        }

        // Update
        const finalPassword = newPassword || currentPassword;
        
        db.run('UPDATE users SET username=?, email=?, password=? WHERE id=?',
          [username, email, finalPassword, id], function(err) {
            db.close();
            if (err) {
              console.error('Update error:', err);
              return res.status(500).json({ error: 'Failed to update: ' + err.message });
            }
            console.log('User updated:', username);
            res.json({
              id: parseInt(id),
              username,
              email,
              affected: this.changes,
              message: 'Profile updated successfully'
            });
          });
      });
  });
});

// Delete user account
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete account' });
  }

  const db = getDb();
  db.get('SELECT * FROM users WHERE id=? AND password=?', [id, password], (err, user) => {
    if (err) { db.close(); return res.status(500).json({ error: err.message }); }
    if (!user) { db.close(); return res.status(400).json({ error: 'Password incorrect. Account not deleted.' }); }

    // Delete notes first
    db.run('DELETE FROM notes WHERE user_id=?', [id], (err) => {
      if (err) { db.close(); return res.status(500).json({ error: 'Error deleting notes: ' + err.message }); }

      // Delete user
      db.run('DELETE FROM users WHERE id=?', [id], function(err) {
        db.close();
        if (err) return res.status(500).json({ error: 'Error deleting account: ' + err.message });
        console.log('Account deleted:', id);
        res.json({
          id: parseInt(id),
          affected: this.changes,
          message: 'Account and all notes deleted'
        });
      });
    });
  });
});


// Get all notes (for viewer page)
app.get('/api/notes/all', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM notes ORDER BY updated_at DESC', [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ===== NOTES ROUTES =====
app.get('/api/notes/:userId', (req, res) => {
  const { userId } = req.params;
  const { date } = req.query;
  const db = getDb();
  
  let query = 'SELECT * FROM notes WHERE user_id=?';
  let params = [userId];
  if (date) { query += ' AND note_date=?'; params.push(date); }
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/notes/detail/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM notes WHERE id=?', [req.params.id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Note not found' });
    res.json(row);
  });
});

app.post('/api/notes', (req, res) => {
  const { user_id, title, content, note_date } = req.body;
  if (!user_id || !title || !note_date) {
    return res.status(400).json({ error: 'user_id, title, note_date required' });
  }
  
  const db = getDb();
  db.run('INSERT INTO notes(user_id, title, content, note_date) VALUES(?,?,?,?)',
    [user_id, title, content || '', note_date], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID, user_id: parseInt(user_id), title,
        content: content || '', note_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
});

app.put('/api/notes/:id', (req, res) => {
  const { title, content, note_date } = req.body;
  if (!title || !note_date) {
    return res.status(400).json({ error: 'title and note_date required' });
  }
  
  const db = getDb();
  db.run('UPDATE notes SET title=?, content=?, note_date=?, updated_at=datetime("now") WHERE id=?',
    [title, content || '', note_date, req.params.id], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Note not found' });
      res.json({ id: parseInt(req.params.id), affected: this.changes, message: 'Note updated' });
    });
});

app.delete('/api/notes/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM notes WHERE id=?', [req.params.id], function(err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: parseInt(req.params.id), affected: this.changes, message: 'Note deleted' });
  });
});

// ===== 404 HANDLER (must be after all routes) =====
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log(`  Server: http://0.0.0.0:${PORT}`);
  console.log(`  Test:   http://localhost:${PORT}/api/test`);
  console.log('========================================');
  console.log('');
});