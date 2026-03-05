import { useState } from 'react';
import { api, setAdminKey } from '../api';

export default function Login({ onLogin }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setAdminKey(key);
    try {
      await api('/admin/cards-stats');
      onLogin();
    } catch {
      alert('密钥无效');
      setAdminKey('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 max-w-md w-[90%] text-center">
        <div className="text-2xl font-bold mb-1">探知 管理后台</div>
        <div className="text-[#64748b] mb-6 text-sm">请输入管理密钥</div>
        <input type="text" placeholder="Admin Key" value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full mb-4 bg-[#1e293b] text-[#e2e8f0] border border-[#334155] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500" />
        <button onClick={handleLogin} disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {loading ? '验证中...' : '登 录'}
        </button>
      </div>
    </div>
  );
}
