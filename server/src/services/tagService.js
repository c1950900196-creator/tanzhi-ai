const { db } = require('../db');
const { callDoubao, getEmbedding, getEmbeddingsBatch, parseJsonResponse } = require('./doubao');
const { cosineSimilarity } = require('../utils/embedding');

async function findSimilarTagsFromEmbedding(queryEmb, topK = 5, threshold = 0.65) {
  const allTags = await db.all('SELECT id, name, category, embedding, usage_count FROM tag_library WHERE embedding IS NOT NULL');
  const scored = [];
  for (const tag of allTags) {
    try {
      const tagEmb = JSON.parse(tag.embedding);
      const sim = cosineSimilarity(queryEmb, tagEmb);
      if (sim >= threshold) scored.push({ ...tag, similarity: sim });
    } catch {}
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

async function ensureTagInLibrary(tagName) {
  const clean = tagName.replace(/^#/, '').trim();
  if (!clean) return;
  const existing = await db.get('SELECT id FROM tag_library WHERE name = ?', clean);
  if (existing) {
    await db.run('UPDATE tag_library SET usage_count = usage_count + 1 WHERE id = ?', existing.id);
    return;
  }
  try {
    const emb = await getEmbedding(clean);
    await db.run('INSERT IGNORE INTO tag_library (name, embedding) VALUES (?, ?)', clean, JSON.stringify(emb));
  } catch (e) {
    await db.run('INSERT IGNORE INTO tag_library (name) VALUES (?)', clean);
    console.warn(`[标签] Embedding 失败 (${clean}):`, e.message);
  }
}

async function smartTag(title) {
  try {
    const titleEmb = await getEmbedding(title);
    const similar = await findSimilarTagsFromEmbedding(titleEmb, 5, 0.55);

    if (similar.length >= 2) {
      const picked = similar.slice(0, 3);
      for (const t of picked) {
        await db.run('UPDATE tag_library SET usage_count = usage_count + 1 WHERE id = ?', t.id);
      }
      return picked.map(t => '#' + t.name);
    }

    const existingNames = (await db.all('SELECT name FROM tag_library ORDER BY usage_count DESC LIMIT 50')).map(r => r.name);
    const libText = existingNames.length > 0 ? `已有标签库：${existingNames.join('、')}` : '';

    const prompt = `为以下标题打2-3个标签。${libText ? '\n' + libText + '\n优先使用已有标签，没有合适的则新建（2-4字）。' : '创建2-3个简洁标签（2-4字）。'}
标签应概括话题领域，如：国际局势、新能源、游戏、职场、教育、科技、影视、社会民生等。

标题：${title}

只返回 JSON 数组：["标签1","标签2"]`;

    const content = await callDoubao([
      { role: 'system', content: '只输出合法 JSON，不要其他文字。' },
      { role: 'user', content: prompt }
    ], 0.3);
    const tags = parseJsonResponse(content);

    const finalTags = [...(similar.length > 0 ? similar.slice(0, 1).map(t => t.name) : []), ...tags].slice(0, 3);
    for (const t of finalTags) await ensureTagInLibrary(t);
    return finalTags.map(t => t.startsWith('#') ? t : '#' + t);
  } catch (e) {
    console.warn('[smartTag] 失败，回退到 AI 打标签:', e.message);
    return ['#热点话题'];
  }
}

async function smartTagBatch(titles) {
  try {
    const embeddings = await getEmbeddingsBatch(titles);
    const results = {};

    const needAi = [];
    for (let i = 0; i < titles.length; i++) {
      const similar = await findSimilarTagsFromEmbedding(embeddings[i], 5, 0.55);
      if (similar.length >= 2) {
        const picked = similar.slice(0, 3);
        for (const t of picked) await db.run('UPDATE tag_library SET usage_count = usage_count + 1 WHERE id = ?', t.id);
        results[i] = picked.map(t => '#' + t.name);
      } else {
        needAi.push({ idx: i, title: titles[i], partial: similar.map(t => t.name) });
      }
    }

    if (needAi.length > 0) {
      const existingNames = (await db.all('SELECT name FROM tag_library ORDER BY usage_count DESC LIMIT 50')).map(r => r.name);
      const libText = existingNames.length > 0 ? `已有标签库（优先匹配）：${existingNames.join('、')}` : '';
      const titlesText = needAi.map((n, j) => `${j + 1}. ${n.title}`).join('\n');

      const prompt = `为以下标题各打2-3个标签。${libText ? '\n' + libText : ''}
标签应概括话题领域（2-4字），如：国际局势、新能源、游戏、职场、教育等。

${titlesText}

严格返回 JSON：{"1":["标签A","标签B"],...}`;

      try {
        const content = await callDoubao([
          { role: 'system', content: '只输出合法 JSON。' },
          { role: 'user', content: prompt }
        ], 0.3);
        const tagMap = parseJsonResponse(content);

        for (let j = 0; j < needAi.length; j++) {
          const aiTags = tagMap[String(j + 1)] || ['热点话题'];
          const combined = [...needAi[j].partial, ...aiTags].slice(0, 3);
          for (const t of combined) await ensureTagInLibrary(t);
          results[needAi[j].idx] = combined.map(t => t.startsWith('#') ? t : '#' + t);
        }
      } catch (e) {
        console.warn('[smartTagBatch] AI 回退:', e.message);
        for (const n of needAi) {
          results[n.idx] = n.partial.length > 0 ? n.partial.map(t => '#' + t) : ['#热点话题'];
        }
      }
    }

    return results;
  } catch (e) {
    console.warn('[smartTagBatch] Embedding 失败，全量回退 AI:', e.message);
    const fallback = {};
    try {
      const existingNames = (await db.all('SELECT name FROM tag_library ORDER BY usage_count DESC LIMIT 50')).map(r => r.name);
      const libText = existingNames.length > 0 ? `已有标签库：${existingNames.join('、')}` : '';
      const titlesText = titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
      const content = await callDoubao([
        { role: 'system', content: '只输出合法 JSON。' },
        { role: 'user', content: `为以下标题各打2-3个标签。${libText}\n${titlesText}\n返回：{"1":["标签"],...}` }
      ], 0.3);
      const tagMap = parseJsonResponse(content);
      for (let i = 0; i < titles.length; i++) {
        const tags = tagMap[String(i + 1)] || ['热点话题'];
        for (const t of tags) await ensureTagInLibrary(t);
        fallback[i] = tags.map(t => t.startsWith('#') ? t : '#' + t);
      }
    } catch {
      for (let i = 0; i < titles.length; i++) fallback[i] = ['#热点话题'];
    }
    return fallback;
  }
}

module.exports = {
  findSimilarTagsFromEmbedding,
  ensureTagInLibrary,
  smartTag,
  smartTagBatch
};
