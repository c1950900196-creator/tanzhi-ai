const { Router } = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { streamChat } = require('../services/doubao');

const router = Router();

router.post('/', authMiddleware, chatLimiter, async (req, res) => {
  try {
    const { messages, cardContext } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: '消息格式错误' });

    const user = await db.get('SELECT role FROM users WHERE id = ?', req.user.id);
    const roleName = user?.role === 'developer' ? '程序员' : '产品经理';

    let systemPrompt = `你是"探知"AI 助手，一个面向${roleName}的认知探索伙伴。

你的特点：
- 回复专业深入但不枯燥，像一个资深同行在和用户聊天
- 善于用案例、数据和类比来解释复杂概念
- 回复长度控制在 200-400 字，避免过长
- 语气自然，可以用 emoji 点缀但不要过多

重要格式要求：
- 回复正文中不要包含任何延展性问题、反问或引导性提问
- 在正文结束后，换行用 [Q] 标记输出 3 个简短的后续选项，每个一行，15字以内
- 这些选项应混合以下类型：用户可能产生的疑问、用户可能持有的看法或观点、可以深入探讨的方向
- 用第一人称，像用户自己会说的话
- 格式示例：
[Q]这在小公司真的能落地吗？
[Q]我觉得传统方案更稳定
[Q]有没有具体的数据对比？`;

    if (cardContext) {
      systemPrompt += `\n\n当前对话基于以下认知卡片：
标题：${cardContext.title}
摘要：${cardContext.summary}
请围绕这个话题展开深度讨论。`;
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter(m => m.role !== 'card')
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const upstream = await streamChat(apiMessages, res);
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    req.on('close', () => { reader.cancel(); });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        } catch {}
      }
    }
    res.end();
  } catch (e) {
    console.error('聊天失败:', e.message);
    try {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch {}
  }
});

module.exports = router;
