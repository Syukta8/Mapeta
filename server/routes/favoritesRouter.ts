import { Router } from 'express';
import { db } from '../db/database.js';
import { randomUUID } from 'crypto';

export const favoritesRouter = Router();

// GET /api/favorites
favoritesRouter.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM favorites ORDER BY created_at DESC');
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[FavoritesRouter] Get error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/favorites
favoritesRouter.post('/', (req, res) => {
  try {
    const { name, type = 'custom', lat, lng, address } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Name, lat, and lng are required' });
    }

    const id = `fav-${randomUUID().slice(0, 8)}`;
    const createdAt = Date.now();

    // If saving Home or Work, replace existing one
    if (type === 'home' || type === 'work') {
      db.prepare('DELETE FROM favorites WHERE type = ?').run(type);
    }

    const stmt = db.prepare(`
      INSERT INTO favorites (id, name, type, lat, lng, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, type, Number(lat), Number(lng), address || '', createdAt);

    const inserted = db.prepare('SELECT * FROM favorites WHERE id = ?').get(id);
    res.json({ success: true, data: inserted });
  } catch (err: any) {
    console.error('[FavoritesRouter] Save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/favorites/:id
favoritesRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM favorites WHERE id = ?').run(id);
    res.json({ success: true, data: { id } });
  } catch (err: any) {
    console.error('[FavoritesRouter] Delete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
