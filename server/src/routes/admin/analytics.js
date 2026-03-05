const { Router } = require('express');
const db = require('../../db');
const adminAuth = require('../../middleware/admin');

const router = Router();

router.get('/analytics', adminAuth, (req, res) => {
  const totalViews = db.prepare("SELECT count(*) as c FROM card_events WHERE event_type = 'view'").get().c;
  const totalClicks = db.prepare("SELECT count(*) as c FROM card_events WHERE event_type = 'click'").get().c;

  const bySource = {};
  for (const src of ['ai_generated', 'zhihu']) {
    const views = db.prepare("SELECT count(*) as c FROM card_events WHERE event_type = 'view' AND source = ?").get(src).c;
    const clicks = db.prepare("SELECT count(*) as c FROM card_events WHERE event_type = 'click' AND source = ?").get(src).c;
    const chatEnds = db.prepare("SELECT meta FROM card_events WHERE event_type = 'chat_end' AND source = ?").all(src);
    let totalSec = 0, totalChars = 0, chatCount = chatEnds.length;
    for (const row of chatEnds) {
      try { const m = JSON.parse(row.meta || '{}'); totalSec += m.duration_sec || 0; totalChars += m.total_chars || 0; } catch {}
    }
    bySource[src] = {
      views, clicks,
      click_rate: views > 0 ? (clicks / views * 100).toFixed(1) + '%' : '0%',
      chats: chatCount,
      avg_chat_sec: chatCount > 0 ? Math.round(totalSec / chatCount) : 0,
      avg_chars: chatCount > 0 ? Math.round(totalChars / chatCount) : 0
    };
  }

  res.json({
    overview: {
      total_views: totalViews, total_clicks: totalClicks,
      click_rate: totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(1) + '%' : '0%'
    },
    by_source: bySource
  });
});

router.get('/analytics/users', adminAuth, (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at, last_active FROM users').all();
  const result = users.map(u => {
    const views = db.prepare("SELECT count(*) as c FROM card_events WHERE user_id = ? AND event_type = 'view'").get(u.id).c;
    const clicks = db.prepare("SELECT count(*) as c FROM card_events WHERE user_id = ? AND event_type = 'click'").get(u.id).c;
    const chatEnds = db.prepare("SELECT meta FROM card_events WHERE user_id = ? AND event_type = 'chat_end'").all(u.id);
    let totalSec = 0, totalChars = 0;
    for (const row of chatEnds) {
      try { const m = JSON.parse(row.meta || '{}'); totalSec += m.duration_sec || 0; totalChars += m.total_chars || 0; } catch {}
    }
    return {
      id: u.id, username: u.username, role: u.role, created_at: u.created_at, last_active: u.last_active,
      views, clicks,
      click_rate: views > 0 ? (clicks / views * 100).toFixed(1) + '%' : '0%',
      chats: chatEnds.length,
      total_chat_sec: totalSec, total_chars: totalChars,
      avg_chat_sec: chatEnds.length > 0 ? Math.round(totalSec / chatEnds.length) : 0,
      avg_chars: chatEnds.length > 0 ? Math.round(totalChars / chatEnds.length) : 0
    };
  });
  res.json(result);
});

router.get('/analytics/user/:id', adminAuth, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.prepare('SELECT id, username, role, tags, created_at FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const views = db.prepare("SELECT count(*) as c FROM card_events WHERE user_id = ? AND event_type = 'view'").get(userId).c;
  const clicks = db.prepare("SELECT count(*) as c FROM card_events WHERE user_id = ? AND event_type = 'click'").get(userId).c;
  const chatEnds = db.prepare("SELECT meta FROM card_events WHERE user_id = ? AND event_type = 'chat_end'").all(userId);
  let totalSec = 0, totalChars = 0;
  for (const row of chatEnds) {
    try { const m = JSON.parse(row.meta || '{}'); totalSec += m.duration_sec || 0; totalChars += m.total_chars || 0; } catch {}
  }

  const recentEvents = db.prepare(`
    SELECT e.event_type, e.source, e.meta, e.created_at, c.title as card_title
    FROM card_events e LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.user_id = ? ORDER BY e.created_at DESC LIMIT 50
  `).all(userId).map(r => ({
    event_type: r.event_type, card_title: r.card_title, source: r.source,
    meta: r.meta ? JSON.parse(r.meta) : null, created_at: r.created_at
  }));

  res.json({
    user: { id: user.id, username: user.username, role: user.role, tags: user.tags ? JSON.parse(user.tags) : null },
    stats: {
      views, clicks,
      click_rate: views > 0 ? (clicks / views * 100).toFixed(1) + '%' : '0%',
      chats: chatEnds.length,
      avg_chat_sec: chatEnds.length > 0 ? Math.round(totalSec / chatEnds.length) : 0,
      avg_chars: chatEnds.length > 0 ? Math.round(totalChars / chatEnds.length) : 0,
      total_chat_sec: totalSec, total_chars: totalChars
    },
    recent_events: recentEvents
  });
});

module.exports = router;
