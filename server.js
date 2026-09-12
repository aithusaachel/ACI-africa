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
    await client.query(`
      CREATE TABLE IF NOT EXISTS member_applications (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        country VARCHAR(100),
        occupation VARCHAR(255),
        interests TEXT,
        motivation TEXT,
        submitted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS leader_applications (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        country VARCHAR(100),
        position VARCHAR(255),
        experience VARCHAR(100),
        availability VARCHAR(100),
        linkedin VARCHAR(500),
        background TEXT,
        vision TEXT,
        submitted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        signed_up_at TIMESTAMP DEFAULT NOW()
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

// POST /api/join-member — save a membership application
app.post('/api/join-member', async (req, res) => {
  const { firstname, lastname, email, phone, country, occupation, interest, motivation } = req.body;
  if (!firstname || !lastname || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required.' });
  }
  const interests = Array.isArray(interest) ? interest.join(', ') : (interest || '');
  try {
    const result = await pool.query(
      `INSERT INTO member_applications (firstname, lastname, email, phone, country, occupation, interests, motivation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [firstname, lastname, email, phone || '', country || '', occupation || '', interests, motivation || '']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Member application insert error:', err.message);
    res.status(500).json({ error: 'Failed to save application.' });
  }
});

// POST /api/join-leader — save a leadership application
app.post('/api/join-leader', async (req, res) => {
  const { firstname, lastname, email, phone, country, position, experience, availability, linkedin, background, vision } = req.body;
  if (!firstname || !lastname || !email || !position) {
    return res.status(400).json({ error: 'First name, last name, email, and position are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO leader_applications (firstname, lastname, email, phone, country, position, experience, availability, linkedin, background, vision)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [firstname, lastname, email, phone || '', country || '', position, experience || '', availability || '', linkedin || '', background || '', vision || '']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Leader application insert error:', err.message);
    res.status(500).json({ error: 'Failed to save application.' });
  }
});

// ─── Admin API Middleware ───────────────────────────────────────────────────
const ADMIN_PASS = process.env.ADMIN_PASS || 'aciafrica2024';
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-password'];
  if (token === ADMIN_PASS) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/admin/members — fetch all membership applications
app.get('/api/admin/members', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM member_applications ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// GET /api/admin/leaders — fetch all leadership applications
app.get('/api/admin/leaders', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leader_applications ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// POST /api/newsletter — save a newsletter/notify-me signup
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  try {
    await pool.query(
      'INSERT INTO newsletter_signups (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Newsletter signup error:', err.message);
    res.status(500).json({ error: 'Failed to save signup.' });
  }
});

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

// POST /api/chat — Chatbot proxy using Gemini API
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      reply: "Thank you for reaching out to ACI Africa! We bring clean water, education, and emergency relief to communities across Africa. For detailed inquiries, please email us at hello@globalwelfare.org or visit our Contact page."
    });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: messages
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.[0]?.text) {
      res.json({ reply: data.candidates[0].content.parts[0].text });
    } else if (data.error) {
      console.error('Gemini API Error:', data.error.message);
      res.json({ reply: "Thank you for contacting ACI Africa! How can we assist you with clean water, education, or disaster relief initiatives today?" });
    } else {
      res.json({ reply: "Thank you for reaching out to ACI Africa! Please let us know if you have questions about our causes or donating." });
    }
  } catch (err) {
    console.error('Chat endpoint error:', err.message);
    res.json({ reply: "Thank you for reaching out to ACI Africa! Feel free to explore our causes or contact us at hello@globalwelfare.org." });
  }
});


// GET /api/admin/contacts — fetch all contact submissions (admin only)
app.get('/api/admin/contacts', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_submissions ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch contacts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// GET /api/admin/newsletter — fetch all newsletter signups (admin only)
app.get('/api/admin/newsletter', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM newsletter_signups ORDER BY signed_up_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch signups.' });
  }
});

// DELETE /api/admin/newsletter/:id
app.delete('/api/admin/newsletter/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM newsletter_signups WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// GET /api/admin/donations — fetch all donation submissions (admin only)
app.get('/api/admin/donations', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donation_submissions ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch donations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// DELETE /api/admin/contacts/:id
app.delete('/api/admin/contacts/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM contact_submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// DELETE /api/admin/donations/:id
app.delete('/api/admin/donations/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM donation_submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// DELETE /api/admin/members/:id
app.delete('/api/admin/members/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM member_applications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// DELETE /api/admin/leaders/:id
app.delete('/api/admin/leaders/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM leader_applications WHERE id = $1', [req.params.id]);
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

  // Keep-alive ping to prevent Render free-tier spin down
  const https = require('https');
  setInterval(() => {
    https.get('https://aci-africa.onrender.com');
  }, 14 * 60 * 1000); // Ping every 14 minutes

}).catch(err => {
  console.error('Could not connect to database:', err.message);
  process.exit(1);
});
