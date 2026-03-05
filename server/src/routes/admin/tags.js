const { Router } = require('express');
const db = require('../../db');
const adminAuth = require('../../middleware/admin');
const { getEmbedding, getEmbeddingsBatch } = require('../../services/doubao');
const { ensureTagInLibrary } = require('../../services/tagService');

const router = Router();

router.get('/', adminAuth, (req, res) => {
  const tags = db.prepare('SELECT id, name, category, usage_count, embedding, created_at FROM tag_library ORDER BY usage_count DESC').all()
    .map(t => ({ id: t.id, name: t.name, category: t.category, usage_count: t.usage_count, has_embedding: !!t.embedding, created_at: t.created_at }));
  res.json({ tags, total: tags.length });
});

router.post('/init', adminAuth, async (req, res) => {
  try {
    const rows = db.prepare('SELECT tags FROM cards').all();
    const tagSet = new Set();
    for (const row of rows) {
      try {
        const tags = JSON.parse(row.tags || '[]');
        tags.forEach(t => { const clean = t.replace(/^#/, '').trim(); if (clean && clean !== '热点话题') tagSet.add(clean); });
      } catch {}
    }
    const tagNames = [...tagSet];
    if (tagNames.length === 0) return res.json({ success: true, added: 0, message: '没有可导入的标签' });

    const existingTags = new Set(db.prepare('SELECT name FROM tag_library').all().map(r => r.name));
    const newTags = tagNames.filter(t => !existingTags.has(t));
    if (newTags.length === 0) return res.json({ success: true, added: 0, message: '所有标签已存在' });

    console.log(`[标签初始化] 待处理 ${newTags.length} 个新标签`);
    let added = 0, failed = 0;
    const batchSize = 16;

    for (let i = 0; i < newTags.length; i += batchSize) {
      const batch = newTags.slice(i, i + batchSize);
      try {
        const embeddings = await getEmbeddingsBatch(batch);
        const insertStmt = db.prepare('INSERT OR IGNORE INTO tag_library (name, embedding) VALUES (?, ?)');
        for (let j = 0; j < batch.length; j++) {
          try {
            insertStmt.run(batch[j], JSON.stringify(embeddings[j]));
            added++;
          } catch { failed++; }
        }
      } catch (e) {
        console.warn(`[标签初始化] Batch embedding 失败:`, e.message);
        const insertStmt = db.prepare('INSERT OR IGNORE INTO tag_library (name) VALUES (?)');
        for (const t of batch) { insertStmt.run(t); added++; }
      }
      console.log(`[标签初始化] 进度: ${Math.min(i + batchSize, newTags.length)}/${newTags.length}`);
    }

    console.log(`[标签初始化] 完成: 新增 ${added}, 失败 ${failed}`);
    res.json({ success: true, added, failed, total: newTags.length });
  } catch (e) {
    console.error('[标签初始化] 错误:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const tag = db.prepare('SELECT id, name FROM tag_library WHERE id = ?').get(id);
  if (!tag) return res.status(404).json({ error: '标签不存在' });
  db.prepare('DELETE FROM tag_library WHERE id = ?').run(id);
  res.json({ ok: true, deleted: tag.name });
});

router.post('/merge', adminAuth, async (req, res) => {
  try {
    const { sourceIds, targetName } = req.body;
    if (!sourceIds || !targetName) return res.status(400).json({ error: '缺少参数' });

    const sourceNames = [];
    let totalUsage = 0;
    for (const id of sourceIds) {
      const tag = db.prepare('SELECT name, usage_count FROM tag_library WHERE id = ?').get(id);
      if (tag) { sourceNames.push(tag.name); totalUsage += tag.usage_count; }
    }

    const cleanTarget = targetName.replace(/^#/, '').trim();
    const existingTarget = db.prepare('SELECT id FROM tag_library WHERE name = ?').get(cleanTarget);

    if (existingTarget) {
      db.prepare('UPDATE tag_library SET usage_count = usage_count + ? WHERE id = ?').run(totalUsage, existingTarget.id);
    } else {
      try {
        const emb = await getEmbedding(cleanTarget);
        db.prepare('INSERT INTO tag_library (name, usage_count, embedding) VALUES (?, ?, ?)').run(cleanTarget, totalUsage, JSON.stringify(emb));
      } catch {
        db.prepare('INSERT INTO tag_library (name, usage_count) VALUES (?, ?)').run(cleanTarget, totalUsage);
      }
    }

    for (const id of sourceIds) {
      const tag = db.prepare('SELECT name FROM tag_library WHERE id = ?').get(id);
      if (tag && tag.name !== cleanTarget) db.prepare('DELETE FROM tag_library WHERE id = ?').run(id);
    }

    for (const srcName of sourceNames) {
      const cards = db.prepare("SELECT id, tags FROM cards WHERE tags LIKE ?").all(`%${srcName}%`);
      for (const card of cards) {
        try {
          const tags = JSON.parse(card.tags);
          const updated = tags.map(t => t.replace(/^#/, '') === srcName ? '#' + cleanTarget : t);
          const deduped = [...new Set(updated)];
          db.prepare('UPDATE cards SET tags = ? WHERE id = ?').run(JSON.stringify(deduped), card.id);
        } catch {}
      }
    }

    res.json({ ok: true, merged: sourceNames, target: cleanTarget });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
