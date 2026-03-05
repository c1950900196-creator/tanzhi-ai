function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function parseJsonResponse(content) {
  try {
    const jsonStr = content.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    console.error('JSON 解析失败，原始内容:', content.slice(0, 500));
    throw new Error('AI 返回的内容格式错误');
  }
}

module.exports = { cosineSimilarity, parseJsonResponse };
