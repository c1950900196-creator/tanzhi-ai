const db = require('../db');
const { smartTagBatch } = require('./tagService');
const { GRADIENTS, HEATS, QUICK_REPLY_TEMPLATES } = require('../utils/constants');

async function fetchZhihuHot() {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const apis = [
    {
      url: 'https://api.zhihu.com/topstory/hot-list?limit=50&desktop=true',
      parse: (data) => (data.data || []).map(item => ({
        title: item.target?.title || '',
        excerpt: item.target?.excerpt || item.excerpt || '',
        url: `https://www.zhihu.com/question/${item.target?.id || item.id}`,
        heat: item.detail_text || ''
      })).filter(i => i.title)
    },
    {
      url: 'https://www.zhihu.com/api/v4/search/top_search',
      parse: (data) => (data.top_search?.words || []).map(item => ({
        title: item.display_query || item.query || '',
        excerpt: '',
        url: `https://www.zhihu.com/search?q=${encodeURIComponent(item.query)}`,
        heat: '热搜'
      })).filter(i => i.title)
    }
  ];

  for (const { url, parse } of apis) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const data = await res.json();
      const items = parse(data);
      if (items.length > 0) return items;
    } catch (e) {
      console.warn(`[知乎] ${url} 失败:`, e.message);
    }
  }
  throw new Error('所有知乎 API 均不可用');
}

async function processZhihuToCards(items) {
  const existingUrls = new Set(
    db.prepare("SELECT source_url FROM cards WHERE source = 'zhihu' AND source_url IS NOT NULL").all().map(r => r.source_url)
  );
  const newItems = items.filter(i => !i.url || !existingUrls.has(i.url));
  if (newItems.length === 0) return [];

  console.log(`[知乎] 为 ${newItems.length} 条热榜用 RAG 打标签...`);
  const tagMap = await smartTagBatch(newItems.map(i => i.title));

  const insertStmt = db.prepare(`INSERT INTO cards (target_role, tags, heat, title, summary, gradient, author_name, author_avatar, author_color, author_title, ai_first_message, quick_replies, source, source_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const results = [];

  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i];
    const title = item.title;
    const excerpt = item.excerpt || item.title;
    const tags = tagMap[i] || ['#热点话题'];
    const qr = QUICK_REPLY_TEMPLATES[i % QUICK_REPLY_TEMPLATES.length];

    const result = insertStmt.run(
      'general', JSON.stringify(tags), HEATS[i % HEATS.length],
      title, excerpt, GRADIENTS[i % GRADIENTS.length],
      '知乎热榜', '知', '#3b82f6',
      '知乎热榜', excerpt, JSON.stringify(qr),
      'zhihu', item.url || null
    );
    results.push({ id: result.lastInsertRowid, title, tags });
  }
  return results;
}

async function cronFetchZhihu() {
  try {
    console.log('[定时] 开始爬取知乎热榜...');
    const items = await fetchZhihuHot();
    const cards = await processZhihuToCards(items);
    console.log(`[定时] 完成，新增 ${cards.length} 张知乎卡片`);
  } catch (e) {
    console.error('[定时] 知乎爬取失败:', e.message);
  }
}

module.exports = { fetchZhihuHot, processZhihuToCards, cronFetchZhihu };
