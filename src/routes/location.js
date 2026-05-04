const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Upsert current user's location
router.post('/', async (req, res) => {
  const { lat, lng } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }
  try {
    await pool.query(
      `INSERT INTO user_locations (user_id, username, lat, lng, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, updated_at = NOW()`,
      [req.user.id, req.user.username, lat, lng]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove current user's location (stop sharing)
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM user_locations WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active group locations (updated in last 5 minutes)
router.get('/group', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, username, lat, lng, updated_at
       FROM user_locations
       WHERE updated_at > NOW() - INTERVAL '5 minutes'
       ORDER BY username`
    );
    res.json({ locations: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
