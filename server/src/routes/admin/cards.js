const { Router } = require('express');
const db = require('../../db');
const adminAuth = require('../../middleware/admin');
const { generateCards } = require('../../services/cardGenerator');
const { fetchZhihuHot, processZhihuToCards } = require('../../services/zhihuCrawler');

const router = Router();

router.post('/generate-cards', adminAuth, async (req, res) => {
  try {
    const { role, topics } = req.body;
    const targetRole = role || 'developer';
    const results = await generateCards(targetRole, topics);
    const roleName = targetRole === 'developer' ? '程序员' : '产品经理';
    console.log(`[管理] 成功为 ${roleName} 生成 ${results.length} 张卡片`);
    res.json({ success: true, count: results.length, cards: results });
  } catch (e) {
    console.error('生成卡片失败:', e.message);
    res.status(500).json({ error: '生成卡片失败: ' + e.message });
  }
});

router.post('/fetch-zhihu', adminAuth, async (req, res) => {
  try {
    console.log('[知乎] 开始爬取热榜...');
    const items = await fetchZhihuHot();
    console.log(`[知乎] 获取到 ${items.length} 条热榜`);
    const cards = await processZhihuToCards(items);
    console.log(`[知乎] 成功生成 ${cards.length} 张卡片`);
    res.json({ success: true, fetched: items.length, newCards: cards.length, cards });
  } catch (e) {
    console.error('[知乎] 失败:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/cards-stats', adminAuth, (req, res) => {
  const byRole = db.prepare('SELECT target_role, count(*) as count FROM cards GROUP BY target_role').all();
  const bySource = db.prepare("SELECT COALESCE(source,'ai_generated') as source, count(*) as count FROM cards GROUP BY source").all();
  const total = db.prepare('SELECT count(*) as count FROM cards').get();
  res.json({ total: total.count, byRole, bySource });
});

router.get('/cards', adminAuth, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { source, role } = req.query;

  let where = '1=1';
  const params = [];
  if (source === 'zhihu') { where += " AND source = 'zhihu'"; }
  else if (source === 'ai_generated') { where += " AND (source = 'ai_generated' OR source IS NULL)"; }
  if (role) { where += ' AND target_role = ?'; params.push(role); }

  const total = db.prepare(`SELECT count(*) as c FROM cards WHERE ${where}`).get(...params).c;
  const cards = db.prepare(`SELECT * FROM cards WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

  res.json({
    cards: cards.map(c => ({
      id: c.id, title: c.title, summary: c.summary.slice(0, 80) + (c.summary.length > 80 ? '...' : ''),
      tags: JSON.parse(c.tags || '[]'), target_role: c.target_role, heat: c.heat,
      source: c.source || 'ai_generated', source_url: c.source_url,
      author_name: c.author_name, author_title: c.author_title,
      created_at: c.created_at
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

router.delete('/cards/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const card = db.prepare('SELECT id, title FROM cards WHERE id = ?').get(id);
  if (!card) return res.status(404).json({ error: '卡片不存在' });
  db.prepare('DELETE FROM card_events WHERE card_id = ?').run(id);
  db.prepare('DELETE FROM cards WHERE id = ?').run(id);
  res.json({ ok: true, deleted: card.title });
});

module.exports = router;
