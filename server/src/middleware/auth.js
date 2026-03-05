const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

const lastActiveCache = new Map();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret);
    const now = Date.now();
    const last = lastActiveCache.get(req.user.id) || 0;
    if (now - last > 60000) {
      lastActiveCache.set(req.user.id, now);
      db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);
    }
    next();
  } catch {
    return res.status(401).json({ error: 'token 无效或已过期' });
  }
}

module.exports = authMiddleware;
