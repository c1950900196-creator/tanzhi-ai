const { Router } = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');
const { getTagEmbeddingsMap, scoreCardSemantic, getUserEmbedding, formatCard } = require('../services/recommend');

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await db.get('SELECT role, tags FROM users WHERE id = ?', req.user.id);
    if (!user || !user.role) return res.status(400).json({ error: '请先完成身份设置' });

    const userTags = JSON.parse(user.tags || '[]');
    const totalCount = 20;
    const zhihuCount = Math.round(totalCount * 0.15);
    const aiCount = totalCount - zhihuCount;

    const userEmb = await getUserEmbedding(req.user.id, userTags);
    const tagEmbMap = await getTagEmbeddingsMap();

    const aiCards = await db.all("SELECT * FROM cards WHERE (source IS NULL OR source = 'ai_generated') AND target_role = ? ORDER BY created_at DESC", user.role);
    const scored = aiCards.map(card => ({
      ...card,
      score: userEmb ? scoreCardSemantic(card, userEmb, tagEmbMap) : 0
    }));
    scored.sort((a, b) => b.score - a.score);
    const pickedAi = scored.slice(0, aiCount);

    const zhihuCards = await db.all("SELECT * FROM cards WHERE source = 'zhihu' ORDER BY created_at DESC LIMIT 50");
    const zhihuScored = zhihuCards.map(card => ({
      ...card,
      score: userEmb ? scoreCardSemantic(card, userEmb, tagEmbMap) : Math.random()
    }));
    zhihuScored.sort((a, b) => b.score - a.score);
    const pickedZhihu = zhihuScored.slice(0, zhihuCount);

    const mixed = [];
    let ai = 0, zh = 0;
    for (let i = 0; i < totalCount; i++) {
      if (zh < pickedZhihu.length && (i % 6 === 4 || ai >= pickedAi.length)) {
        mixed.push(pickedZhihu[zh++]);
      } else if (ai < pickedAi.length) {
        mixed.push(pickedAi[ai++]);
      }
    }
    while (zh < pickedZhihu.length) mixed.push(pickedZhihu[zh++]);
    while (ai < pickedAi.length && mixed.length < totalCount) mixed.push(pickedAi[ai++]);

    res.json(mixed.map(formatCard));
  } catch (e) {
    console.error('获取卡片失败:', e.message);
    res.status(500).json({ error: '获取卡片失败: ' + e.message });
  }
});

module.exports = router;
