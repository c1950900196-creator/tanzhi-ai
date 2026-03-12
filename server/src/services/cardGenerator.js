const { db } = require('../db');
const { callDoubao, callDoubaoWithSearch, getEmbedding, parseJsonResponse } = require('./doubao');
const { cosineSimilarity } = require('../utils/embedding');
const { GRADIENTS, AUTHOR_COLORS, HEATS } = require('../utils/constants');

const DEDUP_THRESHOLD = 0.85;
const MAX_RETRIES = 2;
const DAILY_PER_ROLE = 50;
const BATCH_SIZE = 6;
const BATCH_DELAY_MS = 15000;

async function getExistingEmbeddings() {
  const rows = await db.all(
    "SELECT id, title, title_embedding FROM cards WHERE source = 'ai_generated'"
  );
  const result = [];
  for (const row of rows) {
    if (row.title_embedding) {
      try {
        result.push({ id: row.id, title: row.title, embedding: JSON.parse(row.title_embedding) });
      } catch {}
    }
  }
  return result;
}

async function backfillEmbeddings() {
  const rows = await db.all(
    "SELECT id, title FROM cards WHERE source = 'ai_generated' AND title_embedding IS NULL"
  );
  if (rows.length === 0) return 0;
  console.log(`[去重] 为 ${rows.length} 张存量卡片生成 title embedding...`);
  let filled = 0;
  for (const row of rows) {
    try {
      const emb = await getEmbedding(row.title);
      await db.run('UPDATE cards SET title_embedding = ? WHERE id = ?', JSON.stringify(emb), row.id);
      filled++;
    } catch (e) {
      console.warn(`[去重] 卡片 ${row.id} embedding 失败:`, e.message);
    }
  }
  console.log(`[去重] 存量 embedding 补充完成: ${filled}/${rows.length}`);
  return filled;
}

async function dedup(newCards, existingEmbeddings) {
  const kept = [];
  const dropped = [];

  for (const card of newCards) {
    try {
      const emb = await getEmbedding(card.title);
      card._embedding = emb;

      let maxSim = 0;
      let dupTitle = '';
      for (const existing of existingEmbeddings) {
        const sim = cosineSimilarity(emb, existing.embedding);
        if (sim > maxSim) {
          maxSim = sim;
          dupTitle = existing.title;
        }
      }

      if (maxSim >= DEDUP_THRESHOLD) {
        console.log(`[去重] 丢弃「${card.title}」(相似度 ${(maxSim * 100).toFixed(1)}% ≈「${dupTitle}」)`);
        dropped.push(card);
      } else {
        kept.push(card);
        existingEmbeddings.push({ id: -1, title: card.title, embedding: emb });
      }
    } catch (e) {
      console.warn(`[去重] embedding 失败，保留卡片「${card.title}」:`, e.message);
      kept.push(card);
    }
  }

  return { kept, dropped };
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const result = [];
  for (const t of tags) {
    if (typeof t === 'string' && t.includes(' ') && t.includes('#')) {
      result.push(...t.split(/\s+/).filter(s => s.startsWith('#') && s.length > 1));
    } else if (typeof t === 'string' && t.trim()) {
      result.push(t.trim());
    }
  }
  return [...new Set(result)];
}

async function insertCards(parsed, targetRole, source) {
  const results = [];
  for (let i = 0; i < parsed.length; i++) {
    const c = parsed[i];
    c.tags = normalizeTags(c.tags);
    let embeddingStr = null;
    if (c._embedding) {
      embeddingStr = JSON.stringify(c._embedding);
    } else if (source === 'ai_generated') {
      try {
        embeddingStr = JSON.stringify(await getEmbedding(c.title));
      } catch {}
    }

    const result = await db.run(
      `INSERT INTO cards (target_role, tags, heat, title, summary, gradient, author_name, author_avatar, author_color, author_title, ai_first_message, quick_replies, source, title_embedding) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      targetRole, JSON.stringify(c.tags || []), HEATS[i % HEATS.length],
      c.title, c.summary, GRADIENTS[i % GRADIENTS.length],
      c.author_name, c.author_name[0], AUTHOR_COLORS[i % AUTHOR_COLORS.length],
      c.author_title, c.ai_first_message, JSON.stringify(c.quick_replies || []), source,
      embeddingStr
    );
    results.push({ id: result.lastInsertRowid, title: c.title, tags: c.tags });
  }
  return results;
}

function buildPrompt(roleName, topicsStr, count, excludeTitles) {
  let excludeHint = '';
  if (excludeTitles.length > 0) {
    excludeHint = `\n\n⚠️ 以下标题已经存在，请生成完全不同的话题方向：\n${excludeTitles.slice(-30).map(t => `- ${t}`).join('\n')}\n`;
  }

  return `你是"探知"产品的内容生成引擎。请为${roleName}群体生成 ${count} 张认知卡片，覆盖不同话题领域。

覆盖领域：${topicsStr}
${excludeHint}
⚠️ 内容风格要求（非常重要）：
- 不要生成纯技术原理科普，而是要贴近真实职场场景和个人成长
- 话题应该让用户觉得"这跟我的工作/面试/升职/日常直接相关"
- ${roleName === '程序员' ? '程序员的话题举例：如何在技术面试中脱颖而出、怎么和产品经理高效沟通、写了三年CRUD如何突破瓶颈、简历上没有大厂经历怎么办、如何让leader注意到你的价值' : '产品经理的话题举例：如何模拟产品经理面试五个高频问题、怎么做一份让老板满意的竞品分析、如何用数据说服研发排期、跳槽时怎么谈到理想薪资、如何让老板觉得你值得升职加薪'}
- 语气像朋友聊天，不要像论文或教材

每张卡片要求：
1. title: 引发好奇心的问题式标题（15-30字）
2. summary: 展开（150-250字），有具体场景和案例
3. tags: 2-3个标签 ["#...", "#..."]
4. author_name: 拟人化中文名（2-3字）
5. author_title: 头衔（5-15字，有亲切感）
6. ai_first_message: 首条消息（150-250字），末尾2-3个追问方向
7. quick_replies: 3个口语化快捷回复

严格以 JSON 数组格式返回：
[{"title":"...","summary":"...","tags":["#..."],"author_name":"...","author_title":"...","ai_first_message":"...","quick_replies":["..."]}]`;
}

// ==================== 单次生成（手动触发，6张） ====================

async function generateCards(targetRole, topics) {
  const startTime = Date.now();
  const roleName = targetRole === 'developer' ? '程序员' : '产品经理';
  const topicsStr = topics || (targetRole === 'developer'
    ? '技术面试、职场沟通、架构设计、AI应用、职业规划、团队协作、代码质量、开源贡献'
    : '产品面试、用户增长、数据驱动、竞品分析、职业晋升、需求管理、商业模式、用户体验');

  await backfillEmbeddings();
  const existingEmbeddings = await getExistingEmbeddings();
  console.log(`[去重] 已有 ${existingEmbeddings.length} 张卡片的 embedding 可用于比对`);

  const allKept = [];
  const allDroppedTitles = [];
  const allExcludeTitles = [];
  let remaining = 6;
  let retryCount = 0;

  for (let retry = 0; retry <= MAX_RETRIES && remaining > 0; retry++) {
    const countToGen = retry === 0 ? 6 : remaining;
    console.log(`[生成] 第 ${retry + 1} 轮，生成 ${countToGen} 张卡片...`);

    const prompt = buildPrompt(roleName, topicsStr, countToGen, allExcludeTitles);
    const content = await callDoubao([
      { role: 'system', content: '你是一个专业的内容生成引擎，只输出合法的 JSON，不要输出其他任何文字。' },
      { role: 'user', content: prompt }
    ], 0.9);

    const parsed = parseJsonResponse(content);
    const { kept, dropped } = await dedup(parsed, existingEmbeddings);

    allKept.push(...kept);
    allDroppedTitles.push(...dropped.map(c => c.title));
    allExcludeTitles.push(...kept.map(c => c.title), ...dropped.map(c => c.title));
    remaining = 6 - allKept.length;

    if (dropped.length === 0) break;
    retryCount = retry + 1;
    console.log(`[去重] 第 ${retry + 1} 轮：保留 ${kept.length}，丢弃 ${dropped.length}，还需补 ${remaining}`);
  }

  console.log(`[生成] 最终保留 ${allKept.length} 张卡片，开始入库`);
  const results = await insertCards(allKept, targetRole, 'ai_generated');
  const durationMs = Date.now() - startTime;

  try {
    await db.run(
      `INSERT INTO generation_logs (type, target_role, requested, kept, dedup_dropped, retries, card_ids, card_titles, dropped_titles, duration_ms, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      'ai_generate', targetRole, 6, results.length, allDroppedTitles.length, retryCount,
      JSON.stringify(results.map(r => r.id)),
      JSON.stringify(results.map(r => r.title)),
      JSON.stringify(allDroppedTitles),
      durationMs, 'success'
    );
  } catch (e) {
    console.warn('[日志] 写入生成记录失败:', e.message);
  }

  return results;
}

// ==================== 联网搜索热门话题 ====================

async function researchTrendingTopics(roleName) {
  try {
    const prompt = `请搜索最近一周互联网上${roleName}群体最关注的热门话题、行业动态和职场讨论。

要求：
1. 涵盖技术趋势、职场发展、行业新闻、求职面试、薪资待遇、团队管理等方面
2. 列出25-30个具体话题，每个话题一行
3. 话题要具体、有时效性，避免泛泛而谈
4. 重点关注：最新AI/大模型进展、行业裁员/招聘动态、热门技术栈变化、职场热门讨论
5. 直接输出话题列表，不需要序号，不需要其他说明`;

    const content = await callDoubaoWithSearch([
      { role: 'user', content: prompt }
    ], 0.7);
    console.log(`[研究] ${roleName}联网搜索热门话题成功`);
    return content;
  } catch (e) {
    console.warn(`[研究] ${roleName}联网搜索失败，使用默认话题:`, e.message);
    return null;
  }
}

// ==================== 每日批量生成（100张） ====================

async function generateOneBatch(targetRole, topicsStr, batchSize, existingEmbeddings, allExcludeTitles) {
  const roleName = targetRole === 'developer' ? '程序员' : '产品经理';
  const batchStart = Date.now();
  const batchKept = [];
  const batchDroppedTitles = [];
  let remaining = batchSize;

  for (let retry = 0; retry <= MAX_RETRIES && remaining > 0; retry++) {
    const countToGen = retry === 0 ? batchSize : remaining;
    const prompt = buildPrompt(roleName, topicsStr, countToGen, allExcludeTitles);
    const content = await callDoubao([
      { role: 'system', content: '你是一个专业的内容生成引擎，只输出合法的 JSON，不要输出其他任何文字。' },
      { role: 'user', content: prompt }
    ], 0.9);

    const parsed = parseJsonResponse(content);
    const { kept, dropped } = await dedup(parsed, existingEmbeddings);

    batchKept.push(...kept);
    batchDroppedTitles.push(...dropped.map(c => c.title));
    allExcludeTitles.push(...kept.map(c => c.title), ...dropped.map(c => c.title));
    remaining = batchSize - batchKept.length;

    if (dropped.length === 0) break;
  }

  const results = await insertCards(batchKept, targetRole, 'ai_generated');
  const durationMs = Date.now() - batchStart;

  try {
    await db.run(
      `INSERT INTO generation_logs (type, target_role, requested, kept, dedup_dropped, retries, card_ids, card_titles, dropped_titles, duration_ms, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      'daily_generate', targetRole, batchSize, results.length, batchDroppedTitles.length, 0,
      JSON.stringify(results.map(r => r.id)),
      JSON.stringify(results.map(r => r.title)),
      JSON.stringify(batchDroppedTitles),
      durationMs, 'success'
    );
  } catch {}

  return { results, droppedCount: batchDroppedTitles.length };
}

async function dailyGenerate() {
  const dailyStart = Date.now();
  console.log('[每日生成] ========== 开始每日内容生成 ==========');

  const roles = ['developer', 'product_manager'];
  let totalKept = 0;
  let totalDropped = 0;

  for (const role of roles) {
    const roleName = role === 'developer' ? '程序员' : '产品经理';
    const roleStart = Date.now();

    console.log(`[每日生成] 为${roleName}联网搜索当前热门话题...`);
    const trendingTopics = await researchTrendingTopics(roleName);

    const defaultTopics = role === 'developer'
      ? '技术面试、职场沟通、架构设计、AI应用、职业规划、团队协作、代码质量、开源贡献、技术管理、系统设计、副业变现、远程办公'
      : '产品面试、用户增长、数据驱动、竞品分析、职业晋升、需求管理、商业模式、用户体验、项目管理、市场分析、AI产品、创业思维';

    const topicsStr = trendingTopics
      ? `参考以下近期热门话题方向进行创作（务必结合时事热点）：\n${trendingTopics}\n\n同时覆盖以下基础领域：${defaultTopics}`
      : defaultTopics;

    await backfillEmbeddings();
    const existingEmbeddings = await getExistingEmbeddings();
    const allExcludeTitles = [];

    let roleKept = 0;
    let roleDropped = 0;
    let batchNum = 0;
    let consecutiveFailures = 0;

    while (roleKept < DAILY_PER_ROLE) {
      batchNum++;
      const remaining = DAILY_PER_ROLE - roleKept;
      const batchTarget = Math.min(BATCH_SIZE, remaining);

      console.log(`[每日生成] ${roleName} 第${batchNum}批 (目标${batchTarget}张, 已完成${roleKept}/${DAILY_PER_ROLE})...`);

      try {
        const { results, droppedCount } = await generateOneBatch(
          role, topicsStr, batchTarget, existingEmbeddings, allExcludeTitles
        );

        roleKept += results.length;
        roleDropped += droppedCount;
        consecutiveFailures = 0;

        console.log(`[每日生成] ${roleName} 第${batchNum}批完成: +${results.length}张, 累计${roleKept}/${DAILY_PER_ROLE}`);
      } catch (e) {
        console.error(`[每日生成] ${roleName} 第${batchNum}批失败:`, e.message);
        consecutiveFailures++;
        try {
          await db.run(
            `INSERT INTO generation_logs (type, target_role, requested, status, error_msg, duration_ms) VALUES (?,?,?,?,?,?)`,
            'daily_generate', role, batchTarget, 'failed', e.message, 0
          );
        } catch {}
      }

      if (consecutiveFailures >= 3) {
        console.error(`[每日生成] ${roleName} 连续失败${consecutiveFailures}次，跳过剩余`);
        break;
      }

      if (batchNum >= 20) {
        console.warn(`[每日生成] ${roleName} 已达最大批次数20，停止`);
        break;
      }

      if (roleKept < DAILY_PER_ROLE) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    const roleDuration = ((Date.now() - roleStart) / 1000 / 60).toFixed(1);
    console.log(`[每日生成] ${roleName}完成: 生成${roleKept}张, 去重${roleDropped}张, 耗时${roleDuration}分钟`);
    totalKept += roleKept;
    totalDropped += roleDropped;

    if (role !== roles[roles.length - 1]) {
      console.log('[每日生成] 角色间休息30秒...');
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  const totalDuration = ((Date.now() - dailyStart) / 1000 / 60).toFixed(1);
  console.log(`[每日生成] ========== 全部完成: ${totalKept}张卡片, 去重${totalDropped}张, 耗时${totalDuration}分钟 ==========`);

  try {
    await db.run(
      `INSERT INTO generation_logs (type, requested, kept, dedup_dropped, duration_ms, status) VALUES (?,?,?,?,?,?)`,
      'daily_summary', DAILY_PER_ROLE * 2, totalKept, totalDropped, Date.now() - dailyStart, 'success'
    );
  } catch {}
}

module.exports = { insertCards, generateCards, dailyGenerate };
