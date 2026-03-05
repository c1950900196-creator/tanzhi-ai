const { db } = require('../db');
const { callDoubao, parseJsonResponse } = require('./doubao');
const { GRADIENTS, AUTHOR_COLORS, HEATS } = require('../utils/constants');

async function insertCards(parsed, targetRole, source) {
  const results = [];
  for (let i = 0; i < parsed.length; i++) {
    const c = parsed[i];
    const result = await db.run(
      `INSERT INTO cards (target_role, tags, heat, title, summary, gradient, author_name, author_avatar, author_color, author_title, ai_first_message, quick_replies, source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      targetRole, JSON.stringify(c.tags || []), HEATS[i % HEATS.length],
      c.title, c.summary, GRADIENTS[i % GRADIENTS.length],
      c.author_name, c.author_name[0], AUTHOR_COLORS[i % AUTHOR_COLORS.length],
      c.author_title, c.ai_first_message, JSON.stringify(c.quick_replies || []), source
    );
    results.push({ id: result.lastInsertRowid, title: c.title, tags: c.tags });
  }
  return results;
}

async function generateCards(targetRole, topics) {
  const roleName = targetRole === 'developer' ? '程序员' : '产品经理';
  const topicsStr = topics || (targetRole === 'developer'
    ? '技术面试、职场沟通、架构设计、AI应用、职业规划、团队协作、代码质量、开源贡献'
    : '产品面试、用户增长、数据驱动、竞品分析、职业晋升、需求管理、商业模式、用户体验');

  const prompt = `你是"探知"产品的内容生成引擎。请为${roleName}群体生成 6 张认知卡片，覆盖不同话题领域。

覆盖领域：${topicsStr}

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

  console.log(`[管理] 开始为 ${roleName} 生成卡片...`);
  const content = await callDoubao([
    { role: 'system', content: '你是一个专业的内容生成引擎，只输出合法的 JSON，不要输出其他任何文字。' },
    { role: 'user', content: prompt }
  ], 0.9);

  const parsed = parseJsonResponse(content);
  return await insertCards(parsed, targetRole, 'ai_generated');
}

module.exports = { insertCards, generateCards };
