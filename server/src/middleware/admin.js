const config = require('../config');

function adminAuth(req, res, next) {
  if (req.headers['x-admin-key'] !== config.adminKey) {
    return res.status(403).json({ error: '无管理权限' });
  }
  next();
}

module.exports = adminAuth;
