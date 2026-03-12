const config = require('../config');

async function streamChatGemini(messages, abortSignal) {
  const res = await fetch(config.gemini.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.gemini.apiKey}`
    },
    body: JSON.stringify({
      model: config.gemini.model,
      messages,
      temperature: 0.7,
      stream: true
    }),
    signal: abortSignal
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API 错误: ${res.status} ${err}`);
  }

  return res;
}

module.exports = { streamChatGemini };
