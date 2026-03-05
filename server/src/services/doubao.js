const config = require('../config');
const { parseJsonResponse } = require('../utils/embedding');

async function callDoubao(messages, temperature = 0.8) {
  const res = await fetch(config.doubao.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.doubao.apiKey}`
    },
    body: JSON.stringify({ model: config.doubao.model, messages, temperature })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`豆包 API 错误: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function getEmbedding(text) {
  const res = await fetch(config.doubao.embeddingUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.doubao.apiKey}`
    },
    body: JSON.stringify({
      model: config.doubao.embeddingModel,
      input: [{ type: 'text', text }]
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API 错误: ${res.status} ${err}`);
  }
  const data = await res.json();
  return Array.isArray(data.data) ? data.data[0].embedding : data.data.embedding;
}

async function getEmbeddingsBatch(texts) {
  const results = [];
  for (const text of texts) {
    results.push(await getEmbedding(text));
  }
  return results;
}

async function streamChat(messages, res, abortSignal) {
  const upstream = await fetch(config.doubao.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.doubao.apiKey}`
    },
    body: JSON.stringify({
      model: config.doubao.chatModel,
      messages,
      temperature: 0.7,
      stream: true
    }),
    signal: abortSignal
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    throw new Error(`API 错误: ${upstream.status} ${err}`);
  }

  return upstream;
}

module.exports = { callDoubao, getEmbedding, getEmbeddingsBatch, streamChat, parseJsonResponse };
