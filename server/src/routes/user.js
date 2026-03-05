const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, role, tags, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    tags: user.tags ? JSON.parse(user.tags) : null,
    created_at: user.created_at
  });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { role, tags } = req.body;
  db.prepare('UPDATE users SET role = ?, tags = ? WHERE id = ?').run(role || null, tags ? JSON.stringify(tags) : null, req.user.id);
  const user = db.prepare('SELECT id, username, role, tags FROM users WHERE id = ?').get(req.user.id);
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    tags: user.tags ? JSON.parse(user.tags) : null
  });
});

module.exports = router;
