import { useState } from 'react';
import { setAdminKey, api } from '../api';

export default function Login({ onLogin }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!key.trim()) return setError('请输入管理密钥');
    setLoading(true);
    setError('');
    setAdminKey(key);
    try {
      await api('/admin/cards-stats');
      onLogin();
    } catch {
      setError('密钥错误');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stat-card" style={{ maxWidth: 400, width: '90%', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>探知 Admin</h1>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 24 }}>管理后台</p>
        <input type="password" value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="输入管理密钥" style={{ width: '100%', marginBottom: 16 }} />
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? '验证中...' : '进入后台'}
        </button>
      </div>
    </div>
  );
}
