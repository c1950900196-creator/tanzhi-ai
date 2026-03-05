const { Router } = require('express');
const db = require('../../db');
const adminAuth = require('../../middleware/admin');
const { getEmbedding } = require('../../services/doubao');
const { cosineSimilarity } = require('../../utils/embedding');
const { smartTag } = require('../../services/tagService');

const router = Router();

router.post('/', adminAuth, async (req, res) => {
  try {
    const { text, threshold = 0.4, topK = 10 } = req.body;
    if (!text) return res.status(400).json({ error: '请输入测试文本' });

    const queryEmb = await getEmbedding(text);
    const allTags = db.prepare('SELECT id, name, category, usage_count, embedding FROM tag_library WHERE embedding IS NOT NULL').all();
    const scored = [];
    for (const tag of allTags) {
      try {
        const tagEmb = JSON.parse(tag.embedding);
        const sim = cosineSimilarity(queryEmb, tagEmb);
        scored.push({ id: tag.id, name: tag.name, category: tag.category, usage_count: tag.usage_count, similarity: parseFloat(sim.toFixed(4)) });
      } catch {}
    }
    scored.sort((a, b) => b.similarity - a.similarity);

    const smartTagResult = await smartTag(text);

    res.json({
      query: text,
      total_tags_with_embedding: allTags.length,
      all_matches: scored.slice(0, topK),
      above_threshold: scored.filter(s => s.similarity >= 0.55),
      smart_tag_output: smartTagResult,
      threshold_used: 0.55
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
