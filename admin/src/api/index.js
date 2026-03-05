const API_BASE = import.meta.env.VITE_API_BASE || '/api';

let ADMIN_KEY = localStorage.getItem('tanzhi_admin_key') || '';

export function setAdminKey(key) {
  ADMIN_KEY = key;
  localStorage.setItem('tanzhi_admin_key', key);
}

export function clearAdminKey() {
  ADMIN_KEY = '';
  localStorage.removeItem('tanzhi_admin_key');
}

export function getAdminKey() {
  return ADMIN_KEY;
}

export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
      ...(opts.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
