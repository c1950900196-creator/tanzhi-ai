const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../db');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2) return res.status(400).json({ error: '用户名至少 2 个字符' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少 6 位' });
  const existing = await db.get('SELECT id FROM users WHERE username = ?', username);
  if (existing) return res.status(409).json({ error: '用户名已存在' });
  const hashed = bcrypt.hashSync(password, 10);
  const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashed);
  const token = jwt.sign({ id: result.lastInsertRowid, username }, config.jwtSecret, { expiresIn: '30d' });
  res.json({ token, user: { id: result.lastInsertRowid, username, role: null, tags: null } });
});

router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  const user = await db.get('SELECT * FROM users WHERE username = ?', username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: '用户名或密码错误' });
  const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, tags: user.tags ? JSON.parse(user.tags) : null } });
});

module.exports = router;
