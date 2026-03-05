const db = require('../db');
const { getEmbedding } = require('./doubao');
const { cosineSimilarity } = require('../utils/embedding');

const userEmbCache = new Map();
const USER_EMB_TTL = 10 * 60 * 1000;

function getTagEmbeddingsMap() {
  const rows = db.prepare('SELECT name, embedding FROM tag_library WHERE embedding IS NOT NULL').all();
  const map = {};
  for (const r of rows) {
    try { map[r.name.toLowerCase()] = JSON.parse(r.embedding); } catch {}
  }
  return map;
}

function scoreCardSemantic(card, userEmb, tagEmbMap) {
  const cardTags = JSON.parse(card.tags || '[]').map(t => t.replace(/^#/, '').toLowerCase());
  if (cardTags.length === 0 || !userEmb) return 0;

  let maxSim = 0, totalSim = 0, matched = 0;
  for (const ct of cardTags) {
    const tagEmb = tagEmbMap[ct];
    if (!tagEmb) continue;
    const sim = cosineSimilarity(userEmb, tagEmb);
    totalSim += sim;
    matched++;
    if (sim > maxSim) maxSim = sim;
  }

  const avgSim = matched > 0 ? totalSim / matched : 0;
  const semanticScore = (maxSim * 0.6 + avgSim * 0.4) * 100;
  const freshness = Math.max(0, 5 - (Date.now() - new Date(card.created_at).getTime()) / 86400000);
  return semanticScore + freshness;
}

async function getUserEmbedding(userId, userTags) {
  if (userTags.length === 0) return null;
  const cached = userEmbCache.get(userId);
  if (cached && Date.now() - cached.ts < USER_EMB_TTL) return cached.emb;

  try {
    const emb = await getEmbedding(userTags.join(' '));
    userEmbCache.set(userId, { emb, ts: Date.now() });
    return emb;
  } catch (e) {
    console.warn('[推荐] Embedding 失败，回退字符串匹配:', e.message);
    return null;
  }
}

function formatCard(row) {
  return {
    id: row.id,
    tags: JSON.parse(row.tags),
    heat: row.heat,
    title: row.title,
    summary: row.summary,
    gradient: row.gradient,
    source: row.source || 'ai_generated',
    author: {
      name: row.author_name,
      avatar: row.author_avatar,
      color: row.author_color,
      title: row.author_title
    },
    aiFirstMessage: row.ai_first_message,
    quickReplies: JSON.parse(row.quick_replies)
  };
}

module.exports = {
  getTagEmbeddingsMap,
  scoreCardSemantic,
  getUserEmbedding,
  formatCard
};
