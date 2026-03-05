const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { getEmbedding } = require('../services/doubao');
const { findSimilarTagsFromEmbedding } = require('../services/tagService');

const router = Router();

router.get('/recommend', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT tags FROM users WHERE id = ?').get(req.user.id);
    const userTags = JSON.parse(user?.tags || '[]');

    if (userTags.length === 0) {
      const popular = db.prepare('SELECT name FROM tag_library ORDER BY usage_count DESC LIMIT 20').all();
      return res.json({ tags: popular.map(t => t.name), source: 'popular' });
    }

    const queryText = userTags.join(' ');
    const queryEmb = await getEmbedding(queryText);
    const similar = findSimilarTagsFromEmbedding(queryEmb, 20, 0.4);
    const userTagSet = new Set(userTags.map(t => t.replace(/^#/, '').toLowerCase()));
    const recommended = similar.filter(t => !userTagSet.has(t.name.toLowerCase())).slice(0, 10);

    res.json({ tags: recommended.map(t => ({ name: t.name, similarity: t.similarity.toFixed(2) })), source: 'rag' });
  } catch (e) {
    const popular = db.prepare('SELECT name FROM tag_library ORDER BY usage_count DESC LIMIT 20').all();
    res.json({ tags: popular.map(t => t.name), source: 'popular_fallback' });
  }
});

module.exports = router;
