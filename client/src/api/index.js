const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getToken() {
  return localStorage.getItem('tanzhi_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
  async register(username, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/user/profile`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async updateProfile(role, tags) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ role, tags })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async getCards() {
    const res = await fetch(`${API_BASE}/cards`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async chatStream(messages, cardContext, onChunk, signal) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ messages, cardContext }),
      signal
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t || !t.startsWith('data: ')) continue;
        const payload = t.slice(6);
        if (payload === '[DONE]') return full;
        try {
          const j = JSON.parse(payload);
          if (j.error) throw new Error(j.error);
          if (j.content) { full += j.content; onChunk(full); }
        } catch (e) { if (e.message !== 'Unexpected end of JSON input') throw e; }
      }
    }
    return full;
  },

  async getRecommendedTags() {
    const res = await fetch(`${API_BASE}/tags/recommend`, { headers: authHeaders() });
    const data = await res.json();
    return data;
  },

  trackEvent(card_id, event_type, source, meta) {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ card_id, event_type, source: source || 'ai_generated', meta })
    }).catch(() => {});
  }
};
