require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database connection using Pool (reconnects are handled automatically)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        message TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS donation_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2),
        message TEXT,
        submitted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables are ready.');
  } catch (err) {
    console.error('Error initializing database tables:', err.message);
  } finally {
    client.release();
  }
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// POST /api/contact — save a contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO contact_submissions (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, subject || '', message]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Contact insert error:', err.message);
    res.status(500).json({ error: 'Failed to save submission.' });
  }
});

// POST /api/donate — save a donation form submission
app.post('/api/donate', async (req, res) => {
  const { name, email, amount, message } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO donation_submissions (name, email, amount, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, amount || 0, message || '']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Donation insert error:', err.message);
    res.status(500).json({ error: 'Failed to save submission.' });
  }
});

// GET /api/admin/contacts — fetch all contact submissions (admin only)
app.get('/api/admin/contacts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_submissions ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch contacts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// GET /api/admin/donations — fetch all donation submissions (admin only)
app.get('/api/admin/donations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donation_submissions ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch donations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// DELETE /api/admin/contacts/:id
app.delete('/api/admin/contacts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contact_submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// DELETE /api/admin/donations/:id
app.delete('/api/admin/donations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM donation_submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`ACI Africa server running at http://localhost:${PORT}`);
    console.log(`Admin portal: http://localhost:${PORT}/admin.html`);
  });
}).catch(err => {
  console.error('Could not connect to database:', err.message);
  process.exit(1);
});
