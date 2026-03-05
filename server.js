const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

// GET /api/comments/:blockId
app.get('/api/comments/:blockId', async (req, res) => {
  try {
    const { blockId } = req.params;
    const result = await pool.query(
      'SELECT id, block_id, author_name, content, created_at FROM comments WHERE block_id = $1 ORDER BY created_at ASC',
      [blockId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/comments/:blockId
app.post('/api/comments/:blockId', async (req, res) => {
  try {
    const { blockId } = req.params;
    const { author_name, content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le commentaire ne peut pas être vide' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Commentaire trop long (max 2000 caractères)' });
    }

    const name = (author_name || 'Anonyme').trim().substring(0, 100);
    const result = await pool.query(
      'INSERT INTO comments (block_id, author_name, content) VALUES ($1, $2, $3) RETURNING *',
      [blockId, name, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'feasibility-report.html'));
});

app.listen(PORT, () => {
  console.log(`Secondo.ia running on port ${PORT}`);
});
