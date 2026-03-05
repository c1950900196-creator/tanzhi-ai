const { Router } = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { card_id, event_type, source, meta } = req.body;
    if (!card_id || !event_type) return res.status(400).json({ error: '参数不完整' });
    await db.run(
      'INSERT INTO card_events (user_id, card_id, event_type, source, meta) VALUES (?,?,?,?,?)',
      req.user.id, card_id, event_type, source || null, meta ? JSON.stringify(meta) : null
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
